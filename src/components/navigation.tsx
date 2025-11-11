 'use client'

import { useState, useEffect } from 'react'
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
import { fetchUnreadCount, subscribeToIncomingMessages, markAllAsRead, getPendingFamilyRequests, approveFamilyRequest, rejectFamilyRequest } from '@/services/family'
import { supabase } from '@/lib/supabase'

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
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [channel, setChannel] = useState<any | null>(null)

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

  useEffect(() => {
    let sub: any
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0)
      setPendingRequests([])
      return
    }

    const init = async () => {
      try {
        const count = await fetchUnreadCount(user.id)
        setUnreadCount(count ?? 0)
        
        // Load pending family requests (may fail if table doesn't exist yet)
        try {
          const requests = await getPendingFamilyRequests(user.id)
          setPendingRequests(requests || [])
        } catch (reqErr) {
          console.warn('Could not load family requests - table may not exist yet:', reqErr)
          setPendingRequests([])
        }
        
        // Subscribe to new messages
        sub = subscribeToIncomingMessages(user.id, (msg: any) => {
          setUnreadCount((c) => c + 1)
        })
        
        // Subscribe to new family requests (may fail if table doesn't exist)
        try {
          const requestChannel = supabase
            .channel(`family_requests:${user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'family_requests',
                filter: `to_user_id=eq.${user.id}`,
              },
              async (payload) => {
                console.log('New family request received', payload)
                const requests = await getPendingFamilyRequests(user.id)
                setPendingRequests(requests || [])
              }
            )
            .subscribe()
        } catch (channelErr) {
          console.warn('Could not subscribe to family_requests channel:', channelErr)
        }
        
        setChannel(sub)
      } catch (err: any) {
        // Improve logging for Supabase errors which can be plain objects
        console.error('failed to init message subscription', {
          message: err?.message ?? String(err),
          details: err?.details ?? (err as any)?.hint ?? null,
          raw: err
        })
      }
    }

    init()

    return () => {
      try {
        if (sub && sub.unsubscribe) sub.unsubscribe()
      } catch (e) {
        // ignore
      }
    }
  }, [isAuthenticated, user?.id])


  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
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

            {/* Notifications (family requests + messages) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="ml-1 text-xs">{t('nav.notifications')}</span>
                  {(pendingRequests.length + unreadCount) > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1">
                      {(pendingRequests.length + unreadCount) > 99 ? '99+' : (pendingRequests.length + unreadCount)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-2">Family Requests</h3>
                  {pendingRequests.length === 0 ? (
                    <p className="text-xs text-gray-500 py-2">No pending requests</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingRequests.map((req: any) => (
                        <div key={req.id} className="p-2 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{req.sender?.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-600">wants to add you as <span className="font-semibold">{req.relation}</span></p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={async () => {
                                const res = await approveFamilyRequest(req.id)
                                if (res?.success) {
                                  const requests = await getPendingFamilyRequests(user!.id)
                                  setPendingRequests(requests || [])
                                }
                              }}
                            >
                              Yes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={async () => {
                                const res = await rejectFamilyRequest(req.id)
                                if (res?.success) {
                                  const requests = await getPendingFamilyRequests(user!.id)
                                  setPendingRequests(requests || [])
                                }
                              }}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <DropdownMenuSeparator className="my-2" />
                  
                  <h3 className="font-semibold text-sm mb-2">Messages</h3>
                  {unreadCount === 0 ? (
                    <p className="text-xs text-gray-500 py-2">No unread messages</p>
                  ) : (
                    <div className="p-2 border rounded-lg bg-blue-50">
                      <p className="text-sm">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</p>
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="p-0 h-auto mt-1"
                        onClick={() => router.push('/messages')}
                      >
                        View messages →
                      </Button>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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