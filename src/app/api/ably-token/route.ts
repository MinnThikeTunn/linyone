import { NextResponse } from 'next/server'
import Ably from 'ably'

// POST or GET to obtain an Ably token for browser clients via Token Auth.
// Requires ABLY_API_KEY in server env. If missing, returns 503.
export async function GET() {
  try {
    const apiKey = process.env.ABLY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Ably not configured' }, { status: 503 })
    }

    const client = new Ably.Rest({ key: apiKey })
    // Create a token request with a short TTL
    const tokenRequest = await new Promise<Ably.Types.TokenRequest>((resolve, reject) => {
      client.auth.createTokenRequest({ ttl: 60 * 60 * 1000 }, (err, req) => {
        if (err) return reject(err)
        resolve(req as Ably.Types.TokenRequest)
      })
    })

    return NextResponse.json(tokenRequest)
  } catch (err: any) {
    console.error('[ably-token] error', err)
    return NextResponse.json({ error: 'Token error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'