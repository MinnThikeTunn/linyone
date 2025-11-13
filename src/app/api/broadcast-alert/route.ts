import { NextRequest, NextResponse } from 'next/server'
import Ably from 'ably'

// Server route to publish disaster alerts (flood / earthquake) to Ably channel so all active users receive toast.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      id,
      type,
      title,
      description,
      magnitude,
      place,
      time,
      url,
      coordinates,
      severity,
      location,
      source,
    } = body || {}

    if (!type || !title || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.ABLY_API_KEY) {
      return NextResponse.json({ error: 'ABLY_API_KEY not configured' }, { status: 500 })
    }

    const rest = new Ably.Rest(process.env.ABLY_API_KEY)
    const channelName = process.env.NEXT_PUBLIC_ABLY_CHANNEL || 'earthquakes-myanmar'
    const channel = rest.channels.get(channelName)

    const payload = {
      id,
      type,
      title,
      description,
      magnitude,
      place,
      time,
      url,
      coordinates,
      severity,
      location,
      source: source || type,
    }

    await channel.publish(type, payload)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[broadcast-alert] error', err)
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 })
  }
}
