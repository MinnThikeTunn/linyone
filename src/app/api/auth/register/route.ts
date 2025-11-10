import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, role, organizationId } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Registration failed' },
        { status: 400 }
      )
    }

    // Create user profile in custom users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: name || authData.user.email?.split('@')[0] || 'User',
        phone: phone || null,
        role: role || 'user',
        organization_id: organizationId || null,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // User is created in auth but profile creation failed
      // We'll still return success but log the error
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.name || name || authData.user.email?.split('@')[0] || 'User',
        role: profile?.role || role || 'user',
        phone: profile?.phone || phone,
        organizationId: profile?.organization_id || organizationId,
        image: profile?.image,
      },
      session: authData.session,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}

