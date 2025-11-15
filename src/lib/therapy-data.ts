import fs from 'node:fs'
import path from 'node:path'

export type TherapySession = {
  subject_id: string
  phase_code: string
  phase_name: string
  trauma_type?: string
  session_topic?: string
  client_profile?: Record<string, any>
  therapist_profile?: Record<string, any>
  full_conversation: string[]
  three_turn_sequences?: string[][]
}

let cache: { lastMtimeMs: number; sessions: TherapySession[] } | null = null

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z\u1000-\u109f0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim()
}

export async function loadTherapyData(): Promise<TherapySession[]> {
  const fp = path.join(process.cwd(), 'public', 'therapy_sessions.json')
  const stat = fs.statSync(fp)
  if (cache && cache.lastMtimeMs === stat.mtimeMs) return cache.sessions
  const raw = fs.readFileSync(fp, 'utf8')
  const sessions: TherapySession[] = JSON.parse(raw)
  cache = { lastMtimeMs: stat.mtimeMs, sessions }
  return sessions
}

// Simple keyword similarity scoring
export async function searchTherapyContext(query: string, topK = 3): Promise<TherapySession[]> {
  const sessions = await loadTherapyData()
  const q = normalize(query)
  const tokens = new Set(q.split(' '))
  const scored = sessions.map(s => {
    const text = normalize(
      [
        s.phase_name,
        s.trauma_type,
        s.session_topic,
        s.full_conversation.join(' '),
        JSON.stringify(s.client_profile || {}),
      ].join(' ')
    )
    let overlap = 0
    for (const t of tokens) if (text.includes(t)) overlap++
    return { s, score: overlap }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK).map(e => e.s)
}

export function buildTherapyContext(matches: TherapySession[]): string {
  if (!matches.length) return ''
  const parts = matches.map(
    m => `
PHASE: ${m.phase_name} (${m.phase_code})
TOPIC: ${m.session_topic}
TRAUMA TYPE: ${m.trauma_type}
CLIENT PROFILE: ${JSON.stringify(m.client_profile ?? {}, null, 2)}

EXCERPT:
${m.three_turn_sequences?.slice(0, 3).map(seq => seq.join('\n')).join('\n\n')}
`
  )
  return `THERAPY_REFERENCE DATA:\n${parts.join('\n---\n')}`
}
