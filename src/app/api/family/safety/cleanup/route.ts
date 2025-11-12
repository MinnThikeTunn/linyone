import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/family/safety/cleanup
// Clears expired safety windows by setting safety_status=null and timestamps to null
export async function POST() {
  try {
    const nowIso = new Date().toISOString()
    // Update rows where expiry is in the past
    const { error } = await supabase
      .from('family_members')
      .update({ safety_status: null, safety_check_started_at: null, safety_check_expires_at: null })
      .lt('safety_check_expires_at', nowIso)

    if (error) {
      console.error('cleanup error', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('cleanup failed', e)
    return NextResponse.json({ success: false, error: e?.message || 'error' }, { status: 500 })
  }
}