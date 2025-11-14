import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, lat, lng } = body || {}
    if (!userId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Missing userId/lat/lng' }, { status: 400 })
    }

    // Reverse geocode via Nominatim
    let address: string | null = null
    try {
      const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lng) })
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
        headers: {
          'User-Agent': 'linyonetech/1.0.0 (last-seen)'
        }
      })
      if (res.ok) {
        const j = await res.json()
        address = j?.display_name || null
      }
    } catch {}

    const supabase = createServerClient()
    // Upsert last seen
    const { error } = await supabase
      .from('user_last_seen')
      .upsert({ user_id: userId, lat, lng, address, last_seen_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) {
      console.error('[last-seen] upsert error', error)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, address })
  } catch (err: any) {
    console.error('[last-seen] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
