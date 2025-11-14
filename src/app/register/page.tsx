'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { 
  UserPlus, 
  AlertTriangle,
  Eye,
  EyeOff,
  Heart
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

type AccountType = 'user' | 'organization'

interface RegisterFormState {
  accountType: AccountType
  name: string
  email: string
  phone: string
  address: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

export default function RegisterPage() {
  const { t } = useLanguage()
  const { register, isLoading } = useAuth()
  const router = useRouter()
  
  const [registerForm, setRegisterForm] = useState<RegisterFormState>({
    accountType: 'user',
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!registerForm.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      return
    }
    
    const result = await register({
      accountType: registerForm.accountType,
      name: registerForm.name,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
      address: registerForm.accountType === 'organization' ? registerForm.address : undefined
    })
    
    if (result.success) {
      router.push('/')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAccountTypeChange = (value: AccountType | string) => {
    if (!value) {
      return
    }
    setRegisterForm(prev => ({
      ...prev,
      accountType: value as AccountType
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Lin Yone Tech</h1>
          <p className="text-gray-600">{t('auth.register')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('auth.createAccount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-col gap-2">
                <ToggleGroup
                  type="single"
                  value={registerForm.accountType}
                  onValueChange={handleAccountTypeChange}
                  className="w-full"
                >
                  <ToggleGroupItem value="user" className="flex-1">
                    <div className="flex items-center justify-center py-1">
                      <span className="text-sm font-medium">User</span>
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="organization" className="flex-1">
                    <div className="flex items-center justify-center py-1">
                      <span className="text-sm font-medium">Organization</span>
                    </div>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {registerForm.accountType === 'organization' ? t('register.orgName') : t('auth.name')}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={registerForm.name}
                    onChange={handleInputChange}
                    placeholder={t('register.enterFullName')}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={registerForm.email}
                    onChange={handleInputChange}
                    placeholder={t('register.enterEmail')}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {registerForm.accountType === 'organization' ? t('register.orgPhone') : t('auth.phone')}
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={registerForm.phone}
                    onChange={handleInputChange}
                    placeholder={
                      registerForm.accountType === 'organization'
                        ? t('register.enterOrgPhone')
                        : t('register.enterPhone')
                    }
                    required
                  />
                </div>
              </div>

              {registerForm.accountType === 'organization' && (
                <div className="space-y-2">
                  <Label htmlFor="address">{t('register.orgAddress')}</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={registerForm.address}
                    onChange={handleInputChange}
                    placeholder={t('register.enterOrgAddress')}
                    required
                  />
                </div>
              )}
              
              {/* Removed role-based organization selection */}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={handleInputChange}
                      placeholder={t('register.enterPassword')}
                      className="pr-10"
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
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm password"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={registerForm.agreeToTerms}
                  onCheckedChange={(checked) => setRegisterForm(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions and privacy policy
                </Label>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    {t('auth.createAccount')}
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Removed Role Information section */}
      </div>
    </div>
  )
}