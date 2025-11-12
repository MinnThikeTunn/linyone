import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createNotification } from '@/services/notifications'

// POST /api/family/safety/check
// Body: { fromUserId: string, toUserId: string }
// Creates a safety check window (unknown status) and notification.
export async function POST(request: Request) {
  try {
    const { fromUserId, toUserId } = await request.json()
    if (!fromUserId || !toUserId) {
      return NextResponse.json({ success: false, error: 'missing_params' }, { status: 400 })
    }

    // Fetch relation
    const { data: link } = await supabase
      .from('family_members')
      .select('id,relation')
      .eq('user_id', fromUserId)
      .eq('member_id', toUserId)
      .maybeSingle()

    const relation = (link as any)?.relation || 'family'

    // Duration server-only env: prefer seconds, fallback to minutes
    const envSeconds = process.env.SAFETY_WINDOW_SECONDS
    const envMinutes = process.env.SAFETY_WINDOW_MINUTES
    const durationSeconds = envSeconds
      ? Math.max(0, parseInt(envSeconds, 10) || 0)
      : Math.max(0, parseInt(envMinutes || '5', 10) * 60)

    const startedAt = new Date()
    const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000)

    // Clear any previous status and set new unknown window only for sender perspective
    if (link?.id) {
      await supabase
        .from('family_members')
        .update({
          safety_status: 'unknown',
          safety_check_started_at: startedAt.toISOString(),
          safety_check_expires_at: expiresAt.toISOString(),
        })
        .eq('id', link.id)
    } else {
      // If link not found, nothing to update (silently continue)
    }

    // Sender name for notification body
    const { data: sender } = await supabase
      .from('users')
      .select('id,name')
      .eq('id', fromUserId)
      .single()

    await createNotification({
      userId: toUserId,
      type: 'safety_check',
      title: 'Are you okay?',
      body: `${sender?.name || 'Someone'} (${relation}) is checking on you`,
      payload: { from_user_id: fromUserId, to_user_id: toUserId, relation, sender_name: sender?.name, buttonType: 'safety' }
    })

  return NextResponse.json({ success: true, durationSeconds })
  } catch (e: any) {
    console.error('safety check POST failed', e)
    return NextResponse.json({ success: false, error: e?.message || 'error' }, { status: 500 })
  }
}

// GET can return the configured duration (optional exposure to client when needed)
export async function GET() {
  const envSeconds = process.env.SAFETY_WINDOW_SECONDS
  const envMinutes = process.env.SAFETY_WINDOW_MINUTES
  const durationSeconds = envSeconds
    ? Math.max(0, parseInt(envSeconds, 10) || 0)
    : Math.max(0, parseInt(envMinutes || '5', 10) * 60)
  return NextResponse.json({ durationSeconds })
}