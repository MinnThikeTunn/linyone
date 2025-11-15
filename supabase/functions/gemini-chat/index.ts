// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Msg = { role: "system" | "user" | "assistant"; content: string };

function buildGeminiBody(messages: Msg[], temperature = 0.7, maxTokens = 512) {
  // Pull out the first system message (if any)
  const systemMsg = messages.find((m) => m.role === "system");
  const userAndAssistant = messages.filter((m) => m.role !== "system");

  // Map to Gemini roles
  const contents = userAndAssistant.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // v1 NOTE: do NOT use systemInstruction; prepend system text instead
  if (systemMsg) {
    contents.unshift({
      role: "user",
      parts: [{ text: systemMsg.content }],
    });
  }

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  return body;
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "*";

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const {
      messages,
      temperature = 0.7,
      max_tokens = 512,
      model = "gemini-1.5-flash", // or "gemini-1.5-pro"
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages[] required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const API_KEY = Deno.env.get("GCP_GEMINI_API_KEY");
    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "GCP_GEMINI_API_KEY not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // Use v1beta for latest models
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const body = buildGeminiBody(messages as Msg[], temperature, max_tokens);

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      return new Response(
        JSON.stringify({ error: "gemini_error", status: r.status, detail: errText }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
      );
    }

    const j = await r.json();
    const text =
      j?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? "").join("") ?? "";

    return new Response(JSON.stringify({ content: text, model }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
});
