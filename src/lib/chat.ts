// src/lib/chat.ts
export type ChatCategory = 'safety'|'location'|'medical'|'emergency'|'mental'|'general'
export type AssistantKind = 'emergency'|'mental'

export interface ChatResult {
  response: string
  category: ChatCategory
  timestamp: string
  model?: string
  online?: boolean
  error?: boolean
  dataset_refs?: Array<{ id: number; rank: number; score: number; label: string }>
}

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://127.0.0.1:8000'

export async function askChat(
  message: string,
  language: 'en'|'my',
  assistant: AssistantKind = 'emergency',
  files?: File[]
): Promise<ChatResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60_000)

    let res: Response

    if (files && files.length > 0) {
      const form = new FormData()
      form.append('message', message)
      form.append('language', language)
      form.append('assistant', assistant)
      for (const f of files) form.append('files', f) // <-- multiple

      res = await fetch(`${API_BASE}/chat`, { method: 'POST', body: form, signal: controller.signal })
    } else {
      // still supports JSON-only (if you want)
      const form = new FormData()
      form.append('message', message)
      form.append('language', language)
      form.append('assistant', assistant)
      res = await fetch(`${API_BASE}/chat`, { method: 'POST', body: form, signal: controller.signal })
    }

    clearTimeout(timeout)
    const raw = await res.text()
    const json: any = raw ? safeJSON(raw) : {}

    if (!res.ok) {
      console.error('[chat.ts] backend error', res.status, json)
      return localFallback(language, assistant)
    }

    return {
      response: json.response,
      category: json.category,
      timestamp: json.timestamp,
      model: json.model,
      error: false,
      dataset_refs: Array.isArray(json.dataset_refs) ? json.dataset_refs : undefined,
    }
  } catch (e) {
    console.error('[chat.ts] failed, local fallback', e)
    return localFallback(language, assistant)
  }
}

function safeJSON(s: string){ try{ return JSON.parse(s) } catch { return {} } }

function localFallback(language:'en'|'my', assistant:AssistantKind): ChatResult {
  if (assistant === 'mental') {
    return {
      response: language==='en'
        ? "Let's try box breathing: inhale 4, hold 4, exhale 4, hold 4 (x4). You’re not alone. If you're in immediate danger, call 199 now."
        : 'အကွက်အသက်ရှူ ၄-၄-၄-၄ (၄ ကြိမ်) လေ့ကျင့်ပါ။ သင်တစ်ယောက်တည်း မဟုတ်ပါ။ အရေးပေါ် ဖြစ်ပါက 199 ကို ခေါ်ပါ။',
      category: 'mental',
      timestamp: new Date().toISOString(),
      model: 'local:fallback',
      error: true,
    }
  }
  return {
    response: language==='en'
      ? 'Stay safe: Drop, Cover, Hold On. Move away from windows. Call 199 for real emergencies.'
      : 'လုံခြုံရေးကို ဦးစားပေးပါ — ခေါင်းပု၊ ဖုံး၊ ကိုင် လေ့ကျင့်ပါ။ အရေးပေါ်ဖြစ်ပါက 199 ကို ခေါ်ပါ။',
    category: 'general',
    timestamp: new Date().toISOString(),
    model: 'local:fallback',
    error: true,
  }
}
