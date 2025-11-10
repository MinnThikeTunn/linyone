import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile from custom user table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // If profile doesn't exist, create a basic one
    if (profileError && profileError.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.email?.split('@')[0] || 'User',
          role: 'user',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user profile:', createError)
      }

      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: newProfile?.name || data.user.email?.split('@')[0] || 'User',
          role: newProfile?.role || 'user',
          phone: newProfile?.phone,
          organizationId: newProfile?.organization_id,
          image: newProfile?.image,
        },
        session: data.session,
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.email?.split('@')[0] || 'User',
        role: profile?.role || 'user',
        phone: profile?.phone,
        organizationId: profile?.organization_id,
        image: profile?.image,
      },
      session: data.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

