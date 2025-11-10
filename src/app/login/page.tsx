'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { 
  LogIn, 
  UserPlus, 
  Shield, 
  Users, 
  Building, 
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const { t } = useLanguage()
  const { login, isLoading } = useAuth()
  const router = useRouter()
  
  type AccountType = 'user' | 'organization'
  const [loginForm, setLoginForm] = useState({
    accountType: 'user' as AccountType,
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const result = await login(loginForm.email, loginForm.password, loginForm.accountType)
    
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }
  const handleAccountTypeChange = (value: AccountType | string) => {
    if (!value) return
    setLoginForm(prev => ({ ...prev, accountType: value as AccountType }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lin Yone Tech</h1>
          <p className="text-gray-600">{t('auth.login')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('auth.login')}</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col gap-2">
                <Label>{t('auth.accountType') ?? 'Account Type'}</Label>
                <ToggleGroup
                  type="single"
                  value={loginForm.accountType}
                  onValueChange={handleAccountTypeChange}
                  className="w-full"
                >
                  <ToggleGroupItem value="user" className="flex-1">
                    <div className="flex flex-col items-center gap-1 py-1">
                      <span className="text-sm font-medium">User</span>
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="organization" className="flex-1">
                    <div className="flex flex-col items-center gap-1 py-1">
                      <span className="text-sm font-medium">Organization</span>
                    </div>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('auth.email')}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  value={loginForm.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t('auth.login')}
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.dontHaveAccount')}{' '}
                <Link href="/register" className="text-blue-600 hover:underline">
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Admin</div>
                <div className="text-gray-600">Username: admin</div>
                <div className="text-gray-600">Password: admin123</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">Organization</div>
                <div className="text-gray-600">Username: orgA</div>
                <div className="text-gray-600">Password: org123</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="font-medium">Test User</div>
                <div className="text-gray-600">Use any email and password</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}