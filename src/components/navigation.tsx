'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  Menu, 
  X, 
  Globe, 
  MapPin, 
  Users, 
  Shield, 
  Settings,
  LogIn,
  UserPlus,
  Heart,
  AlertTriangle,
  MessageCircle,
  Bell,
  LayoutDashboard
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

const userNavigation = [
  { name: 'profile', href: '/profile', icon: Users, labelKey: 'nav.profile' },
]

const adminNavigation = [
  { name: 'admin', href: '/admin', icon: Settings, labelKey: 'nav.admin' },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  const userLabel = user?.role ?? (user?.isAdmin ? 'admin' : user?.accountType)

  // Dynamic navigation based on authentication status
  const getNavigationItems = () => {
    if (isAuthenticated) {
      // Logged in: Map and Dashboard (dashboard route depends on account type/admin)
      const dashboardHref = user?.isAdmin ? '/admin' : (user?.isOrg ? '/organization' : '/dashboard')
      return [
        { name: 'map', href: '/', icon: MapPin, labelKey: 'nav.map' },
        { name: 'dashboard', href: dashboardHref, icon: LayoutDashboard, labelKey: 'nav.dashboard' },
      ]
    } else {
      // Not logged in: Map and Recent Alerts
      return [
        { name: 'map', href: '/', icon: MapPin, labelKey: 'nav.map' },
        { name: 'alerts', href: '/alerts', icon: Bell, labelKey: 'nav.recentAlerts' },
      ]
    }
  }

  const navigation = getNavigationItems()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'my' : 'en')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }


  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Lin Yone Tech</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLanguageToggle}
              className="flex items-center space-x-1"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs">{language === 'en' ? 'EN' : 'မြန်'}</span>
            </Button>

            {/* AI Chat Assistant */}
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link href="/chat">
                <MessageCircle className="w-4 h-4" />
                <span className="ml-1 text-xs">{t('nav.aiChat')}</span>
                <Badge variant="destructive" className="absolute -top-1 -right-1 w-2 h-2 p-0" />
              </Link>
            </Button>

            {/* Show login/register when not authenticated, or show user menu when authenticated */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.name && (
                        <p className="font-medium">{user.name}</p>
                      )}
                      {userLabel && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground capitalize">
                          {userLabel}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {userNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  
                  {(user?.isAdmin || user?.role === 'admin') && adminNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{t(item.labelKey)}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <LogIn className="w-4 h-4 mr-1" />
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">
                    <UserPlus className="w-4 h-4 mr-1" />
                    {t('nav.register')}
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
              
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-gray-200 mt-2 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLanguageToggle}
                  className="flex items-center space-x-1"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-xs">{language === 'en' ? 'EN' : 'မြန်'}</span>
                </Button>
                
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/chat">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{t('nav.aiChat')}</span>
                  </Link>
                </Button>

                {/* Show login/register when not authenticated */}
                {!isAuthenticated && (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">
                        <LogIn className="w-4 h-4 mr-1" />
                        <span className="text-xs">{t('nav.login')}</span>
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/register">
                        <UserPlus className="w-4 h-4 mr-1" />
                        <span className="text-xs">{t('nav.register')}</span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Show user menu when authenticated */}
              {isAuthenticated && (
                <div className="px-3 py-2 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{userLabel}</p>
                    </div>
                  </div>
                  
                  {userNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    )
                  })}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start mt-2"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  )
}