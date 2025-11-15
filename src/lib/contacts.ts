// src/lib/contacts.ts
export type EmergencyContact = {
  organization: string
  name?: string
  phones: string[]
  location: string     // township / city / town
  region?: string      // state/region
}

let cache: EmergencyContact[] | null = null

// Load once from /public/contacts.json (client-side)
export async function loadContacts(): Promise<EmergencyContact[]> {
  if (cache) return cache
  const res = await fetch('/contacts.json', { cache: 'force-cache' })
  if (!res.ok) return (cache = [])
  const data = (await res.json()) as EmergencyContact[]
  // Basic normalization
  cache = (data || []).map((c) => ({
    ...c,
    organization: (c.organization || '').trim(),
    name: (c.name || '').trim(),
    location: (c.location || '').trim(),
    region: (c.region || '').trim(),
    phones: (Array.isArray(c.phones) ? c.phones : [c.phones]).filter(Boolean),
  }))
  return cache
}

function norm(s: string) {
  return (s || '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim()
}

/**
 * Very lightweight fuzzy scorer for township/city; prefers exact + region overlap.
 * You can swap for Fuse.js later if needed.
 */
export async function findContactsNear(
  userPlace: string,
  limit = 6
): Promise<EmergencyContact[]> {
  const contacts = await loadContacts()
  const q = norm(userPlace)
  if (!q) return contacts.slice(0, limit)

  // split tokens to allow partial matches: "yangon hlaing"
  const toks = q.split(/\s+/)

  const scored = contacts.map((c) => {
    const loc = norm(`${c.location} ${c.region}`)
    let score = 0
    // exact location match
    if (loc === q) score += 100
    // token inclusion
    for (const t of toks) if (t && loc.includes(t)) score += 20
    // organization/name hints
    const org = norm(`${c.organization} ${c.name || ''}`)
    for (const t of toks) if (t && org.includes(t)) score += 5
    return { c, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.c)
}
