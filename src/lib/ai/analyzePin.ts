import type { AnalyzePinInput, AISuggestion } from "./types";

export async function analyzePin(input: AnalyzePinInput): Promise<AISuggestion | null> {
  try {
    const res = await fetch("/api/ai/analyze-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { suggestion: AISuggestion };
    return data.suggestion;
  } catch {
    return null;
  }
}
