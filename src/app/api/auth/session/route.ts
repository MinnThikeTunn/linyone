import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get the session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { user: null, isAuthenticated: false },
        { status: 200 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { user: null, isAuthenticated: false },
        { status: 200 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.email?.split('@')[0] || 'User',
        role: profile?.role || 'user',
        phone: profile?.phone,
        organizationId: profile?.organization_id,
        image: profile?.image,
      },
      isAuthenticated: true,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { user: null, isAuthenticated: false },
      { status: 200 }
    )
  }
}

