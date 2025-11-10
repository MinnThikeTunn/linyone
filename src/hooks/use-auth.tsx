'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginOrganization, loginUser, registerOrganization, registerUser } from '@/services/auth'

interface User {
  id: string
  name: string
  email: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, accountType: AccountType) => Promise<{ success: boolean; error?: string }>
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

type AccountType = 'user' | 'organization'

interface RegisterData {
  accountType: AccountType
  name: string
  email: string
  phone: string
  password: string
  address?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // No Supabase Auth session; simply mark as not loading
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, accountType: AccountType): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    
    try {
      const result = accountType === 'organization'
        ? await loginOrganization(email, password)
        : await loginUser(email, password)
      if (!result.success || !result.user) {
        return { success: false, error: result.error || 'Invalid credentials' }
      }

      setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
      })

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
      const result =
        userData.accountType === 'organization'
          ? await registerOrganization({
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              password: userData.password,
              address: userData.address,
            })
          : await registerUser({
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              password: userData.password,
            })

      if (!result.success || !result.user) {
        return { success: false, error: result.error || 'Registration failed' }
      }

      setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
      })

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