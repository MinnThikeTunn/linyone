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
  LayoutDashboard,
  Check,
  X as XIcon,
  UserCheck,
  Calendar,
  Users as UsersIcon,
  Activity,
  ShieldCheck,
  Briefcase,
  User
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

// Updated mock notification data based on your requirements
const mockNotifications = [
  {
    id: '1',
    type: 'safety_check',
    user: 'System Alert',
    action: 'Are you ok?',
    time: '2min',
    read: false,
    icon: ShieldCheck,
    color: 'text-red-500',
    hasActions: true,
    buttonType: 'safety' // Safe/Not Safe buttons
  },
  {
    id: '2',
    type: 'job_offer',
    user: 'Job Center',
    action: 'There is job near by you are you accept it or not?',
    time: '1h',
    read: false,
    icon: Briefcase,
    color: 'text-blue-500',
    hasActions: true,
    buttonType: 'job' // Accept/Decline buttons
  },
  {
    id: '3',
    type: 'family_verification',
    user: 'Family System',
    action: 'Are you mother of Mg Mg?',
    time: '5min',
    read: false,
    icon: User,
    color: 'text-green-500',
    hasActions: true,
    buttonType: 'family' // Accept/Decline buttons
  },
  {
    id: '4',
    type: 'friend_request_accepted',
    user: 'Jose Bradley',
    action: 'accepted your friend request',
    time: '28min',
    read: false,
    icon: UserCheck,
    color: 'text-green-500'
  },
  {
    id: '5',
    type: 'activity_hosting',
    user: 'Eliza Briggs',
    action: 'is hosting a Crossfit Activity',
    time: '1h',
    read: false,
    icon: Activity,
    color: 'text-blue-500'
  }
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
  const [notifications, setNotifications] = useState(mockNotifications)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  const userLabel = user?.role ?? (user?.isAdmin ? 'admin' : user?.accountType)

  // Dynamic navigation based on authentication status
  const getNavigationItems = () => {
    if (isAuthenticated) {
      const dashboardHref = user?.isAdmin ? '/admin' : (user?.isOrg ? '/organization' : '/dashboard')
      return [
        { name: 'map', href: '/', icon: MapPin, labelKey: 'nav.map' },
        { name: 'dashboard', href: dashboardHref, icon: LayoutDashboard, labelKey: 'nav.dashboard' },
      ]
    } else {
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

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      const res = await approveFamilyRequest(requestId)
      if (res?.success) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
      }
    } catch (error) {
      console.error('Failed to approve request:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    try {
      const res = await rejectFamilyRequest(requestId)
      if (res?.success) {
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(req => req.id !== requestId))
      }
    } catch (error) {
      console.error('Failed to reject request:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleApproveMockRequest = async (notificationId: string) => {
    setProcessingRequest(notificationId)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Remove the notification from the list
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
    } catch (error) {
      console.error('Failed to approve request:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectMockRequest = async (notificationId: string) => {
    setProcessingRequest(notificationId)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Remove the notification from the list
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
    } catch (error) {
      console.error('Failed to reject request:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleSafeResponse = async (notificationId: string) => {
    setProcessingRequest(notificationId)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Remove the notification from the list
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
      // Here you can add additional logic for safe response
      console.log('User marked as safe')
    } catch (error) {
      console.error('Failed to process safe response:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleNotSafeResponse = async (notificationId: string) => {
    setProcessingRequest(notificationId)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Remove the notification from the list
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
      // Here you can add additional logic for not safe response
      console.log('User marked as not safe - emergency protocol activated')
    } catch (error) {
      console.error('Failed to process not safe response:', error)
    } finally {
      setProcessingRequest(null)
    }
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length + pendingRequests.length

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
        
        try {
          const requests = await getPendingFamilyRequests(user.id)
          setPendingRequests(requests || [])
        } catch (reqErr) {
          console.warn('Could not load family requests - table may not exist yet:', reqErr)
          setPendingRequests([])
        }
        
        sub = subscribeToIncomingMessages(user.id, (msg: any) => {
          setUnreadCount((c) => c + 1)
        })
        
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

  const renderActionButtons = (notification: any) => {
    if (!notification.hasActions) return null

    switch (notification.buttonType) {
      case 'safety':
        return (
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              onClick={() => handleSafeResponse(notification.id)}
              disabled={processingRequest === notification.id}
            >
              {processingRequest === notification.id ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Safe
                </div>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
              onClick={() => handleNotSafeResponse(notification.id)}
              disabled={processingRequest === notification.id}
            >
              {processingRequest === notification.id ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center">
                  <XIcon className="w-3 h-3 mr-1" />
                  Not Safe
                </div>
              )}
            </Button>
          </div>
        )
      
      case 'job':
        return (
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              onClick={() => handleApproveMockRequest(notification.id)}
              disabled={processingRequest === notification.id}
            >
              {processingRequest === notification.id ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Accepting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </div>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
              onClick={() => handleRejectMockRequest(notification.id)}
              disabled={processingRequest === notification.id}
            >
              {processingRequest === notification.id ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                  Declining...
                </div>
              ) : (
                <div className="flex items-center">
                  <XIcon className="w-3 h-3 mr-1" />
                  Decline
                </div>
              )}
            </Button>
          </div>
        )
      
      case 'family':
        return (
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              onClick={() => handleApproveMockRequest(notification.id)}
              disabled={processingRequest === notification.id}
            >
              {processingRequest === notification.id ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                  Accepting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </div>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
              onClick={() => handleRejectMockRequest(notification.id)}
              disabled={processingRequest === notification.id}
            >
              {processingRequest === notification.id ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                  Declining...
                </div>
              ) : (
                <div className="flex items-center">
                  <XIcon className="w-3 h-3 mr-1" />
                  Decline
                </div>
              )}
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

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

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-4 h-4" />
                    <span className="ml-1 text-xs">{t('notifications')}</span>
                    {unreadNotificationsCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs">
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-96 max-h-[480px] overflow-y-auto" align="end">
                  <div className="p-0">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-gray-900">Notification Center</h3>
                        {unreadNotificationsCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {unreadNotificationsCount} unread
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => {
                        const IconComponent = notification.icon
                        return (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                              !notification.read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.user}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {notification.action}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {notification.time}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                  )}
                                </div>
                                
                                {/* Render appropriate action buttons based on notification type */}
                                {renderActionButtons(notification)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Family Requests Section */}
                      {pendingRequests.length > 0 && (
                        <>
                          <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <h4 className="font-medium text-sm text-gray-700">Family Requests</h4>
                          </div>
                          {pendingRequests.map((req: any) => (
                            <div
                              key={req.id}
                              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors bg-blue-50"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                  <UserCheck className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {req.sender?.name || 'Unknown User'}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Wants to add you as <span className="font-semibold text-blue-700">{req.relation}</span>
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recently'}
                                      </p>
                                    </div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                  </div>
                                  
                                  <div className="flex gap-2 mt-3">
                                    <Button 
                                      size="sm" 
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                      onClick={() => handleApproveRequest(req.id)}
                                      disabled={processingRequest === req.id}
                                    >
                                      {processingRequest === req.id ? (
                                        <div className="flex items-center">
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                          Accepting...
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <Check className="w-3 h-3 mr-1" />
                                          Accept
                                        </div>
                                      )}
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
                                      onClick={() => handleRejectRequest(req.id)}
                                      disabled={processingRequest === req.id}
                                    >
                                      {processingRequest === req.id ? (
                                        <div className="flex items-center">
                                          <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-1" />
                                          Declining...
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <XIcon className="w-3 h-3 mr-1" />
                                          Decline
                                        </div>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      {notifications.length === 0 && pendingRequests.length === 0 && (
                        <div className="text-center py-8">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 font-medium">No notifications</p>
                          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                        onClick={() => router.push('/notifications')}
                      >
                        View all notifications
                      </Button>
                    </div>
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
                    <Link href="/chat" onClick={() => setMobileMenuOpen(false)}>
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">{t('nav.aiChat')}</span>
                    </Link>
                  </Button>

                  {/* Show login/register when not authenticated */}
                  {!isAuthenticated && (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <LogIn className="w-4 h-4 mr-1" />
                          <span className="text-xs">{t('nav.login')}</span>
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
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