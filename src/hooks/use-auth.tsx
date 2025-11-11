'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginOrganization, loginUser, registerOrganization, registerUser } from '@/services/auth'

interface User {
  id: string
  name: string
  email: string
  phone?: string
}
// Optional fields used by UI
interface UserWithMeta extends User {
  accountType?: 'user' | 'organization'
  role?: string
  image?: string
  // derived flags for convenience
  isOrg?: boolean
  isAdmin?: boolean
}


const LOCAL_USER_KEY = 'linyone_user'

interface AuthContextType {
  user: UserWithMeta | null
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
  const [user, setUser] = useState<UserWithMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Try to restore persisted user from localStorage on mount
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY)
      if (raw) {
          const parsed = JSON.parse(raw) as UserWithMeta
          // ensure derived flags exist when restoring
          parsed.isOrg = parsed.isOrg ?? (parsed.accountType === 'organization')
          parsed.isAdmin = parsed.isAdmin ?? (parsed.role === 'admin')
          setUser(parsed)
      }
    } catch (err) {
      console.error('Failed to restore auth from localStorage', err)
    } finally {
      setIsLoading(false)
    }
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

      const newUser: UserWithMeta = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        // mark the origin and a simple role so pages that check `role` continue to work
        accountType: accountType,
        // if backend provided is_admin, prefer that for admin role
        role: (result.user as any).is_admin ? 'admin' : (accountType === 'organization' ? 'organization' : 'user'),
        isOrg: accountType === 'organization',
        isAdmin: !!(result.user as any).is_admin,
      }
      setUser(newUser)
      try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser)) } catch {}

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

      const newUser: UserWithMeta = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        accountType: userData.accountType,
        role: userData.accountType === 'organization' ? 'organization' : 'user',
        isOrg: userData.accountType === 'organization',
        isAdmin: false,
      }
      setUser(newUser)
      try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser)) } catch {}

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
      try { localStorage.removeItem(LOCAL_USER_KEY) } catch {}
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