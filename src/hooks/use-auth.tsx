'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'user' | 'tracking_volunteer' | 'supply_volunteer' | 'organization' | 'admin'
  organizationId?: string
  image?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  role: 'user' | 'tracking_volunteer' | 'supply_volunteer'
  organizationId?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user profile from custom users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profile.name || session.user.email?.split('@')[0] || 'User',
              role: profile.role || 'user',
              phone: profile.phone,
              organizationId: profile.organization_id,
              image: profile.image,
            })
          } else {
            // If profile doesn't exist, create a basic one
            const { data: newProfile } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                name: session.user.email?.split('@')[0] || 'User',
                role: 'user',
              })
              .select()
              .single()

            if (newProfile) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: newProfile.name || session.user.email?.split('@')[0] || 'User',
                role: newProfile.role || 'user',
                phone: newProfile.phone,
                organizationId: newProfile.organization_id,
                image: newProfile.image,
              })
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile.name || session.user.email?.split('@')[0] || 'User',
            role: profile.role || 'user',
            phone: profile.phone,
            organizationId: profile.organization_id,
            image: profile.image,
          })
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' }
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // If profile doesn't exist, create a basic one
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split('@')[0] || 'User',
            role: 'user',
          })
          .select()
          .single()

        if (newProfile) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: newProfile.name || data.user.email?.split('@')[0] || 'User',
            role: newProfile.role || 'user',
            phone: newProfile.phone,
            organizationId: newProfile.organization_id,
            image: newProfile.image,
          })
        }
      } else {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: profile.name || data.user.email?.split('@')[0] || 'User',
          role: profile.role || 'user',
          phone: profile.phone,
          organizationId: profile.organization_id,
          image: profile.image,
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed' }
      }

      // Create user profile in custom users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: userData.name || authData.user.email?.split('@')[0] || 'User',
          phone: userData.phone || null,
          role: userData.role || 'user',
          organization_id: userData.organizationId || null,
        })
        .select()
        .single()

      if (profileError) {
        // Log the full error for debugging
        console.error('Error creating user profile:', {
          error: profileError,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        })
        
        // Check for common errors
        const errorMessage = profileError.message || ''
        const errorCode = profileError.code || ''
        
        // If the table doesn't exist
        if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
          return { 
            success: false, 
            error: 'Database table not found. Please run the Supabase migration SQL first. See SUPABASE_SETUP.md for instructions.' 
          }
        }
        
        // If RLS policy violation
        if (errorCode === '42501' || errorMessage.includes('permission denied') || errorMessage.includes('row-level security')) {
          return { 
            success: false, 
            error: 'Permission denied. Please check your Supabase Row Level Security policies.' 
          }
        }
        
        // For other errors, return a user-friendly message
        return { 
          success: false, 
          error: profileError.message || 'Failed to create user profile. Please try again or contact support.' 
        }
      }

      if (profile) {
        setUser({
          id: authData.user.id,
          email: authData.user.email || '',
          name: profile.name || userData.name || authData.user.email?.split('@')[0] || 'User',
          role: profile.role || userData.role || 'user',
          phone: profile.phone || userData.phone,
          organizationId: profile.organization_id || userData.organizationId,
          image: profile.image,
        })
      }

      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}