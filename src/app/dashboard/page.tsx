'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  Shield, 
  Users, 
  BookOpen, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  MessageCircle,
  Navigation,
  Lock,
  Play,
  Award,
  Settings
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'
import { fetchFamilyMembers, sendMessage, sendFamilyRequest, findUsers, removeFamilyMemberById } from '@/services/family'


interface FamilyMember {
  id: string
  name?: string
  phone?: string
  uniqueId?: string
  lastSeen?: Date
  status?: 'safe' | 'unknown' | 'in_danger'
  location?: { lat: number; lng: number; address: string }
}

interface SafetyModule {
  id: string
  title: string
  description: string
  category: string
  duration: string
  progress: number
  isLocked: boolean
  badge?: string
  icon: React.ReactNode
}

// Mock data
const mockFamilyMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Mother',
    phone: '+959123456789',
    uniqueId: 'FAM-001',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    status: 'safe',
    location: { lat: 16.8409, lng: 96.1735, address: 'Yangon, Myanmar' }
  },
  {
    id: '2',
    name: 'Brother',
    phone: '+959987654321',
    uniqueId: 'FAM-002',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'unknown'
  },
  {
    id: '3',
    name: 'Sister',
    phone: '+959456789123',
    uniqueId: 'FAM-003',
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
    status: 'safe',
    location: { lat: 16.8509, lng: 96.1835, address: 'Mandalay, Myanmar' }
  }
]

const mockSafetyModules: SafetyModule[] = [
  {
    id: '1',
    title: 'CPR Training',
    description: 'Learn life-saving cardiopulmonary resuscitation techniques',
    category: 'First Aid',
    duration: '15 min',
    progress: 100,
    isLocked: false,
    badge: 'CPR Certified',
    icon: <Heart className="w-6 h-6 text-red-500" />
  },
  {
    id: '2',
    title: 'First Aid Basics',
    description: 'Essential first aid skills for emergency situations',
    category: 'First Aid',
    duration: '20 min',
    progress: 60,
    isLocked: false,
    icon: <Shield className="w-6 h-6 text-blue-500" />
  },
  {
    id: '3',
    title: 'Earthquake Safety',
    description: 'What to do before, during, and after an earthquake',
    category: 'Emergency',
    duration: '10 min',
    progress: 30,
    isLocked: false,
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />
  },
  {
    id: '4',
    title: 'Emergency Preparedness',
    description: 'How to prepare your family and home for disasters',
    category: 'Preparedness',
    duration: '25 min',
    progress: 0,
    isLocked: false,
    icon: <Settings className="w-6 h-6 text-green-500" />
  },
  {
    id: '5',
    title: 'Advanced Rescue Techniques',
    description: 'Professional rescue methods for volunteers',
    category: 'Advanced',
    duration: '45 min',
    progress: 0,
    isLocked: true,
    icon: <Lock className="w-6 h-6 text-gray-500" />
  }
]

export default function DashboardPage() {
  const { t, language } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [safetyModules, setSafetyModules] = useState<SafetyModule[]>(mockSafetyModules)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchIdentifier, setSearchIdentifier] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedFound, setSelectedFound] = useState<any | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<any>(null)
  const [memberRelation, setMemberRelation] = useState('')
  const [emergencyKitStatus, setEmergencyKitStatus] = useState(75)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!isAuthenticated || !user?.id) return
      try {
        const links = await fetchFamilyMembers(user.id)
        if (!mounted) return
        const mapped = (links || []).map((l: any) => ({
          id: l.member?.id ?? l.id,
          name: l.member?.name ?? 'Unknown',
          phone: l.member?.phone ?? '',
          uniqueId: l.member?.id ?? l.id,
          status: 'unknown'
        }))
        // dedupe by member id to avoid duplicate keys in UI
        const seen = new Set<string>()
        const deduped = mapped.filter((m) => {
          const key = m.id
          if (!key) return false
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setFamilyMembers(deduped)
      } catch (err: any) {
        // Log informative details; JSON.stringify may hide Error fields so include message and raw
        console.error('failed to load family members', {
          message: err?.message ?? String(err),
          raw: err
        })
      }
    }
    load()
    return () => { mounted = false }
  }, [isAuthenticated, user?.id])

  const handleSendSafetyCheck = async (memberId: string) => {
    if (!user?.id) return
    try {
      // memberId here corresponds to the member.user id
      await sendMessage(user.id, memberId, 'Are you okay?')
      // optimistic UI / feedback
      alert('Safety check sent')
    } catch (err) {
      console.error(err)
      alert('Failed to send safety check')
    }
  }

  const handleMarkSafe = (memberId: string) => {
    setFamilyMembers(familyMembers.map(member => 
      member.id === memberId 
        ? { ...member, status: 'safe', lastSeen: new Date() }
        : member
    ))
  }

  const handleStartModule = (moduleId: string) => {
    setSafetyModules(modules => modules.map(module => 
      module.id === moduleId 
        ? { ...module, isLocked: false, progress: Math.min(module.progress + 25, 100) }
        : module
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800'
      case 'in_danger': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const completedModules = safetyModules.filter(m => m.progress === 100).length
  const safeFamilyMembers = familyMembers.filter(m => m.status === 'safe').length

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please login to access your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[90rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your family safety and learning progress</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Family Safe</p>
                  <p className="text-2xl font-bold text-green-600">{safeFamilyMembers}/{familyMembers.length}</p>
                </div>
                <Heart className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Modules Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{completedModules}/{safetyModules.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Emergency Kit</p>
                  <p className="text-2xl font-bold text-orange-600">{emergencyKitStatus}%</p>
                </div>
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                  <p className="text-2xl font-bold text-purple-600">{completedModules}</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="family" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('dashboard.familyMembers')}
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {t('dashboard.safetyModules')}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t('dashboard.recentAlerts')}
            </TabsTrigger>
          </TabsList>

          {/* Family Locator Tab */}
          <TabsContent value="family" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      {t('family.title')}
                    </CardTitle>
                    <CardDescription>
                      Track your family members' safety status
                    </CardDescription>
                  </div>
                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {t('family.addMember')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('family.addMember')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="member-identifier">Search by phone, email or name</Label>
                          <div className="flex gap-2">
                            <Input
                              id="member-identifier"
                              value={searchIdentifier}
                              onChange={(e) => {
                                const v = e.target.value
                                setSearchIdentifier(v)
                                // debounce search on keyup/typing
                                if (searchTimeout) clearTimeout(searchTimeout)
                                const t = setTimeout(async () => {
                                  if (!v) {
                                    setSearchResults([])
                                    setSelectedFound(null)
                                    return
                                  }
                                  // protect admin: do not allow searching
                                  if (user?.isAdmin) {
                                    setSearchResults([])
                                    setSelectedFound(null)
                                    return
                                  }
                                  setSearching(true)
                                  try {
                                    const results = await findUsers(v)
                                    setSearchResults(results || [])
                                    setSelectedFound(null)
                                  } catch (err) {
                                    console.error('search users failed', err)
                                    setSearchResults([])
                                  } finally {
                                    setSearching(false)
                                  }
                                }, 400)
                                setSearchTimeout(t)
                              }}
                              onKeyUp={() => {
                                /* keyup handled via debounce in onChange */
                              }}
                              placeholder="phone, email or name"
                              disabled={user?.isAdmin}
                            />
                          </div>
                        </div>

                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-auto">
                            {searchResults.map((r) => (
                              <div key={r.id} className={`p-2 border rounded flex items-center justify-between ${selectedFound?.id === r.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <div>
                                  <div className="font-medium">{r.name}</div>
                                  <div className="text-xs text-gray-500">{r.email || r.phone}</div>
                                </div>
                                <div>
                                  <Button size="sm" onClick={() => setSelectedFound(r)}>
                                    Select
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedFound && (
                          <div className="p-2 border rounded bg-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{selectedFound.name}</div>
                                <div className="text-xs text-gray-500">{selectedFound.email || selectedFound.phone}</div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={async () => {
                                  if (!user?.id || !selectedFound?.id || !memberRelation.trim()) {
                                    alert('Please specify the relation before sending request')
                                    return
                                  }
                                  try {
                                    const res = await sendFamilyRequest(user.id, selectedFound.id, memberRelation)
                                    if (res?.success) {
                                      alert('Family request sent! Waiting for approval.')
                                      setSearchIdentifier('')
                                      setSearchResults([])
                                      setSelectedFound(null)
                                      setMemberRelation('')
                                      setShowAddMember(false)
                                      return
                                    }
                                    if (res?.error === 'already_linked') {
                                      alert('This member is already in your family network.')
                                    } else if (res?.error === 'request_already_sent') {
                                      alert('You have already sent a request to this person.')
                                    } else {
                                      console.warn('request not successful', res?.error)
                                      alert('Failed to send request. Please try again.')
                                    }
                                  } catch (err) {
                                    console.error('send request failed', err)
                                    alert('An error occurred. Please try again.')
                                  }
                                }}>Send Request</Button>
                                <Button size="sm" variant="outline" onClick={() => setSelectedFound(null)}>Cancel</Button>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <Label htmlFor="member-relation">Relation (Required) <span className="text-red-500">*</span></Label>
                              <Input
                                id="member-relation"
                                value={memberRelation}
                                onChange={(e) => setMemberRelation(e.target.value)}
                                placeholder="e.g., Mother, Father, Brother, Sister"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">Specify your relationship to this person</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.phone}</p>
                          <p className="text-xs text-gray-500">ID: {member.uniqueId}</p>
                          {selectedFound && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {member.location?.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleSendSafetyCheck(member.id)}>
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {t('family.areYouOk')}
                          </Button>
                          {member.status !== 'safe' && (
                            <Button size="sm" onClick={() => handleMarkSafe(member.id)}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t('family.markDone')}
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (!user?.id) return
                            try {
                              const res = await removeFamilyMemberById(user.id, member.id)
                              if (res?.success) {
                                const links = await fetchFamilyMembers(user.id)
                                const mapped = (links || []).map((l: any) => ({
                                  id: l.member?.id ?? l.id,
                                  name: l.member?.name ?? 'Unknown',
                                  phone: l.member?.phone ?? '',
                                  uniqueId: l.member?.id ?? l.id,
                                  status: 'unknown'
                                }))
                                const seen3 = new Set<string>()
                                const deduped3 = mapped.filter((m) => {
                                  const key = m.id
                                  if (!key) return false
                                  if (seen3.has(key)) return false
                                  seen3.add(key)
                                  return true
                                })
                                setFamilyMembers(deduped3)
                              } else {
                                console.warn('unlink failed', res?.error)
                                alert('Failed to unlink member')
                              }
                            } catch (err) {
                              console.error(err)
                              alert('Failed to unlink member')
                            }
                          }}>
                            Unlink
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Modules Tab */}
          <TabsContent value="safety" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  {t('safety.title')}
                </CardTitle>
                <CardDescription>
                  Complete safety training modules to earn badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {safetyModules.map((module) => (
                    <Card key={module.id} className={`${module.isLocked ? 'opacity-75' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {module.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium flex items-center gap-2">
                              {module.title}
                              {module.isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                              {module.badge && <Badge variant="secondary">{module.badge}</Badge>}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{module.category}</span>
                              <span>•</span>
                              <span>{module.duration}</span>
                            </div>
                            
                            {module.progress > 0 && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{t('safety.progress')}</span>
                                  <span>{module.progress}%</span>
                                </div>
                                <Progress value={module.progress} className="h-2" />
                              </div>
                            )}
                            
                            <div className="mt-3">
                              {module.isLocked ? (
                                <Button size="sm" disabled className="w-full">
                                  <Lock className="w-3 h-3 mr-1" />
                                  {t('safety.locked')}
                                </Button>
                              ) : module.progress === 100 ? (
                                <Button size="sm" variant="outline" className="w-full">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t('safety.completed')}
                                </Button>
                              ) : module.progress > 0 ? (
                                <Button size="sm" onClick={() => handleStartModule(module.id)} className="w-full">
                                  <Play className="w-3 h-3 mr-1" />
                                  {t('safety.continue')}
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => handleStartModule(module.id)} className="w-full">
                                  <Play className="w-3 h-3 mr-1" />
                                  {t('safety.start')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  {t('dashboard.recentAlerts')}
                </CardTitle>
                <CardDescription>
                  Recent earthquake alerts and safety notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Earthquake Alert</strong> - Magnitude 4.5 detected near Yangon
                          <div className="text-sm mt-1">2 hours ago</div>
                        </div>
                        <Button size="sm" variant="outline">
                          <Navigation className="w-3 h-3 mr-1" />
                          View on Map
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Safety Reminder</strong> - Check your emergency kit supplies
                          <div className="text-sm mt-1">1 day ago</div>
                        </div>
                        <Button size="sm" variant="outline">
                          Check Kit
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Heart className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong>Family Update</strong> - Mother marked as safe
                          <div className="text-sm mt-1">2 days ago</div>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}