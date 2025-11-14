"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Heart, Plus, MessageCircle, MapPin, XCircle, Search, CheckCircle, AlertTriangle, HelpCircle, Clock, Loader2 } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { fetchFamilyMembers, sendMessage, sendFamilyRequest, findUsers, removeFamilyMemberById, sendSafetyCheck, getSentFamilyRequests, cancelFamilyRequest, fetchLastSeenForUsers } from '@/services/family'
import { subscribeToNotifications, NotificationRecord, getNotifications } from '@/services/notifications'
import { supabase } from '@/lib/supabase'
import { useEffect, useMemo } from 'react'
import { EventMapModal } from '@/components/alerts/event-map-modal'

interface Props {
  t: any
  user: any
  familyMembers: any[]
  setFamilyMembers: (v: any) => void
  showAddMember: boolean
  setShowAddMember: (v: boolean) => void
  searchIdentifier: string
  setSearchIdentifier: (v: string) => void
  searchResults: any[]
  setSearchResults: (v: any[]) => void
  selectedFound: any | null
  setSelectedFound: (v: any | null) => void
  searching: boolean
  setSearching: (v: boolean) => void
  searchTimeout: any
  setSearchTimeout: (v: any) => void
  memberRelation: string
  setMemberRelation: (v: string) => void
}

export default function FamilyTab(props: Props) {
  const {
    t,
    user,
    familyMembers,
    setFamilyMembers,
    showAddMember,
    setShowAddMember,
    searchIdentifier,
    setSearchIdentifier,
    searchResults,
    setSearchResults,
    selectedFound,
    setSelectedFound,
    searching,
    setSearching,
    searchTimeout,
    setSearchTimeout,
    memberRelation,
    setMemberRelation
  } = props

  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, any>>({})
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; lat: number; lng: number; address?: string } | null>(null)

  // Fetch sent requests and merge with family members
  useEffect(() => {
    const loadSentRequests = async () => {
      if (!user?.id) return
      try {
        const requests = await getSentFamilyRequests(user.id)
        setSentRequests(requests || [])
      } catch (err) {
        console.error('failed to load sent requests', err)
      }
    }
    loadSentRequests()

    // Subscribe to family_requests changes
    if (user?.id) {
      const channel = supabase
        .channel(`sent-family-requests-${user.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'family_requests', 
            filter: `from_user_id=eq.${user.id}` 
          }, 
          async () => {
            const requests = await getSentFamilyRequests(user.id)
            setSentRequests(requests || [])
          }
        )
        .subscribe()

      return () => {
        try { (channel as any)?.unsubscribe?.() } catch {}
      }
    }
  }, [user?.id])

  // Merge sent requests with family members to create a unified list
  const mergedMembers = useMemo(() => {
    if (!user?.id) return []
    
    const memberMap = new Map<string, any>()
    
    // First, add all actual family members (linked members)
    familyMembers.forEach((m: any) => {
      memberMap.set(m.id, { 
        ...m, 
        isLinked: true, 
        requestStatus: null, 
        requestId: null 
      })
    })
    
    // Then, add pending sent requests for members that are NOT yet linked
    sentRequests.forEach((req: any) => {
      const memberId = req.to_user_id
      const existing = memberMap.get(memberId)
      
      // Only process pending requests for members that are not yet linked
      if (req.status === 'pending' && !existing) {
        // Show pending request for member not yet in family
        memberMap.set(memberId, {
          id: memberId,
          name: req.receiver?.name || 'Unknown',
          phone: req.receiver?.phone || '',
          uniqueId: memberId,
          status: null,
          isLinked: false,
          requestStatus: 'pending',
          requestId: req.id,
          relation: req.relation
        })
      }
      // If status is rejected, the request is deleted, so it won't appear in sentRequests
      // If status is approved, the member should now be in familyMembers, so we don't need to handle it here
    })
    
    return Array.from(memberMap.values())
  }, [familyMembers, sentRequests, user?.id])

  // Load last seen info for all merged members
  useEffect(() => {
    const run = async () => {
      try {
        const ids = mergedMembers.map((m: any) => m.id).filter(Boolean)
        if (!ids || ids.length === 0) { setLastSeenMap({}); return }
        const map = await fetchLastSeenForUsers(ids)
        setLastSeenMap(map || {})
      } catch (e) {
        console.warn('failed to load last seen', e)
      }
    }
    run()
  }, [mergedMembers])

  const handleSendSafetyCheck = async (memberId: string) => {
    if (!user?.id) return
    try {
      // Send safety check notification
      const res = await sendSafetyCheck(user.id, memberId)
      if (!res?.success) throw new Error('send safety check failed')
      const secs = typeof (res as any).durationSeconds === 'number' ? (res as any).durationSeconds : 300
      const nowIso = new Date().toISOString()
      const optimisticExpiry = new Date(Date.now() + secs * 1000).toISOString()
      // Optimistic local state: unknown + client-side expiry + record local started time (active_check_started_at)
      setFamilyMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'unknown', safety_status: 'unknown', safety_check_started_at: nowIso, safety_check_expires_at: optimisticExpiry, active_check_started_at: nowIso } : m))
      alert(t('family.checkSent'))
    } catch (err) {
      console.error(err)
      alert(t('family.checkFailed'))
    }
  }

  const handleCancelRequest = async (requestId: string, memberId: string) => {
    if (!user?.id) return
    try {
      const res = await cancelFamilyRequest(requestId)
      if (res?.success) {
        // Remove from sent requests
        setSentRequests(prev => prev.filter(r => r.id !== requestId))
        // Reload sent requests to get updated state
        const requests = await getSentFamilyRequests(user.id)
        setSentRequests(requests || [])
      } else {
        alert(t('family.cancelFailed'))
      }
    } catch (err) {
      console.error(err)
      alert(t('family.cancelFailed'))
    }
  }

  // Removed mark-as-done functionality per request

  return (
    <>
      {/* Subscribe to safety-check responses and family request updates */}
      {user?.id && (
        <NotificationsBridge 
          userId={user.id} 
          onResponse={async (n: NotificationRecord) => {
            // Handle safety response notifications
            if (n.type === 'safety_check_ok' || n.type === 'safety_check_not_ok') {
              const payload: any = n.payload || {}
              const responderId = payload.responder_id
              if (!responderId) return
              setFamilyMembers(prev => prev.map(m => {
                if (m.id !== responderId) return m
                // Guard: ensure notification is for current active window
                const started = m.active_check_started_at || m.safety_check_started_at
                if (started) {
                  try {
                    const notifTs = new Date(n.created_at).getTime()
                    const startedTs = new Date(started).getTime()
                    if (notifTs < startedTs) {
                      // Old response from previous window; ignore
                      return m
                    }
                  } catch { /* ignore parse errors */ }
                }
                const mappedStatus = n.type === 'safety_check_not_ok' ? 'danger' : 'safe'
                return { ...m, status: mappedStatus, safety_status: mappedStatus }
              }))
            }
            // Handle family request accepted/rejected notifications
            else if (n.type === 'family_request_accepted' || n.type === 'family_request_rejected') {
              // Reload sent requests to update UI
              if (user?.id) {
                const requests = await getSentFamilyRequests(user.id)
                setSentRequests(requests || [])
              }
            }
          }} 
        />
      )}
      <TabsContent value="family" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  {t('family.title')}
                </CardTitle>
                <CardDescription>Track your family members' safety status</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {t('family.addMember')}
                    </Button>
                  </DialogTrigger>
                <DialogContent showCloseButton={false} className="max-w-lg md:max-w-2xl w-full p-[30px]">
                  <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                    <div className="relative bg-linear-to-r from-indigo-600 to-sky-500 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-amber-500">
                            <Users className="w-6 h-6 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <DialogHeader className="p-0">
                          <DialogTitle className="text-lg font-semibold">{t('family.addMember')}</DialogTitle>
                          <p className="text-sm opacity-90">Search for a registered user to send a family request</p>
                        </DialogHeader>
                      </div>
                      <DialogClose className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-white/20 focus:outline-none">
                        <XCircle className="w-5 h-5 text-white" />
                      </DialogClose>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <Label htmlFor="member-identifier" className="text-sm font-medium">Search</Label>
                        <div className="mt-2 relative">
                          <Input
                            id="member-identifier"
                            value={searchIdentifier}
                            onChange={(e) => {
                              const v = e.target.value
                              setSearchIdentifier(v)
                              if (searchTimeout) clearTimeout(searchTimeout)
                              const tmo = setTimeout(async () => {
                                if (!v) {
                                  setSearchResults([])
                                  setSelectedFound(null)
                                  return
                                }
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
                              setSearchTimeout(tmo)
                            }}
                            placeholder="phone, email or name"
                            disabled={user?.isAdmin}
                            className="pr-10"
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <Button size="sm" variant="ghost" disabled aria-hidden>
                              <Search className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="grid gap-2 max-h-48 overflow-auto grid-cols-1 md:grid-cols-2">
                          {searchResults.map((r) => (
                            <div key={r.id} className={`flex flex-col md:flex-row items-center justify-between p-3 rounded-lg border ${selectedFound?.id === r.id ? 'ring-2 ring-indigo-300 bg-indigo-50' : 'bg-white hover:shadow-sm'}`}>
                              <div className="flex items-center gap-3 w-full">
                                <Avatar className="w-10 h-10">
                                  <AvatarFallback>{(r.name || 'U').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{r.name}</div>
                                  <div className="text-xs text-gray-500">{r.email || r.phone}</div>
                                </div>
                              </div>
                              <div className="mt-3 md:mt-0 md:ml-4">
                                <Button size="sm" className="w-full md:w-auto" onClick={() => setSelectedFound(r)}>
                                  Select
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedFound && (
                        <div className="p-3 bg-linear-to-r from-white to-indigo-50 rounded-lg border">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full">
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback>{(selectedFound.name || 'U').charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{selectedFound.name}</div>
                                <div className="text-xs text-gray-600">{selectedFound.email || selectedFound.phone}</div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <Button size="sm" className="w-full sm:w-auto" onClick={async () => {
                                if (!user?.id || !selectedFound?.id || !memberRelation.trim()) {
                                  alert(t('family.specifyRelation'))
                                  return
                                }
                                try {
                                  const res = await sendFamilyRequest(user.id, selectedFound.id, memberRelation)
                                  if (res?.success) {
                                    // Reload sent requests to show pending status immediately
                                    if (user?.id) {
                                      const requests = await getSentFamilyRequests(user.id)
                                      setSentRequests(requests || [])
                                    }
                                    alert(t('family.requestSent'))
                                    setSearchIdentifier('')
                                    setSearchResults([])
                                    setSelectedFound(null)
                                    setMemberRelation('')
                                    setShowAddMember(false)
                                    return
                                  }
                                  if (res?.error === 'already_linked') {
                                    alert(t('family.alreadyInNetwork'))
                                  } else if (res?.error === 'request_already_sent') {
                                    alert(t('family.alreadyRequested'))
                                  } else {
                                    console.warn('request not successful', res?.error)
                                    alert(t('family.sendRequestFailed'))
                                  }
                                } catch (err) {
                                  console.error('send request failed', err)
                                  alert(t('family.errorOccurred'))
                                }
                              }}>{t('family.sendRequest')}</Button>
                              <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedFound(null)}>{t('common.cancel')}</Button>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <Label htmlFor="member-relation" className="text-sm font-medium">{t('family.relationLabel')} <span className="text-red-500">*</span></Label>
                            <Input
                              id="member-relation"
                              value={memberRelation}
                              onChange={(e) => setMemberRelation(e.target.value)}
                              placeholder={t('family.relationLabel')}
                              required
                            />
                            <div className="flex gap-2">
                              {['mother','father','brother','sister','wife','husband','son','daughter'].map((rel) => (
                                <Button key={rel} size="sm" className="w-full sm:w-auto" variant={memberRelation === t(`family.${rel}`) ? 'secondary' : 'ghost'} onClick={() => setMemberRelation(t(`family.${rel}`))}
                                >
                                  {t(`family.${rel}`)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mergedMembers.map((member) => (
                <div key={member.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg gap-4 md:gap-6">
                  <div className="flex items-start gap-4 w-full md:w-auto min-w-0">
                    <div className="w-12 h-12 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{member.name}</h3>
                        {member.requestStatus === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 wrap-break-word">{member.phone}</p>
                      <p className="text-xs text-gray-500 wrap-break-word">ID: {member.uniqueId}</p>
                      {member.relation && (
                        <p className="text-xs text-blue-600 mt-1 wrap-break-word">Relation: {member.relation}</p>
                      )}
                      {/* Last seen info */}
                      {(lastSeenMap[member.id]?.last_seen_at) && (
                        <p className="text-xs text-gray-600 mt-1 wrap-break-word">
                          <span className="font-medium">Last seen:</span> {new Date(lastSeenMap[member.id].last_seen_at).toLocaleString()}
                        </p>
                      )}
                      {(lastSeenMap[member.id]?.address || (lastSeenMap[member.id]?.lat && lastSeenMap[member.id]?.lng)) && (
                        <div className="text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center gap-1 mt-1">
                          <div className="flex items-start gap-1 min-w-0">
                            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="wrap-break-word whitespace-normal leading-snug min-w-0">
                              {lastSeenMap[member.id]?.address || `${Number(lastSeenMap[member.id]?.lat).toFixed(4)}, ${Number(lastSeenMap[member.id]?.lng).toFixed(4)}`}
                            </span>
                          </div>
                          {lastSeenMap[member.id]?.lat && lastSeenMap[member.id]?.lng && (
                            <button
                              className="sm:ml-2 underline text-indigo-600 hover:text-indigo-700 shrink-0 cursor-pointer"
                              onClick={() => {
                                setSelectedLocation({
                                  name: member.name || 'Unknown',
                                  lat: lastSeenMap[member.id].lat,
                                  lng: lastSeenMap[member.id].lng,
                                  address: lastSeenMap[member.id]?.address
                                })
                                setMapModalOpen(true)
                              }}
                            >
                              View on Map
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
                    {member.requestStatus === 'pending' ? (
                      // Show unlink button for pending requests (cancels the request)
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="w-full sm:w-auto" 
                        onClick={async () => {
                          if (!member.requestId) return
                          await handleCancelRequest(member.requestId, member.id)
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Unlink
                      </Button>
                    ) : member.isLinked ? (
                      // Show "Are you ok?" button for linked members
                      <>
                        {renderSafetyControl(member, t, handleSendSafetyCheck)}
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="w-full sm:w-auto" 
                          onClick={async () => {
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
                                  status: l.safety_status ?? null,
                                  safety_check_started_at: l.safety_check_started_at,
                                  safety_check_expires_at: l.safety_check_expires_at,
                                  lastSeen: new Date()
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
                                alert(t('family.unlinkFailed'))
                              }
                            } catch (err) {
                              console.error(err)
                              alert(t('family.unlinkFailed'))
                            }
                          }}
                        >
                          Unlink
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
              {mergedMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No family members yet. Add someone to get started!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map Modal for viewing member location */}
        <EventMapModal
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          title={selectedLocation ? `${selectedLocation.name}'s Last Seen Location` : 'Location'}
          latitude={selectedLocation?.lat ?? null}
          longitude={selectedLocation?.lng ?? null}
          subtitle={selectedLocation?.address}
        />
      </TabsContent>
    </>
  )
}

// Bridge component to subscribe and update status
// Keep NotificationsBridge external contract using original 'safe' | 'not_safe'
// Map internally to 'danger' before updating state/UI badges.
function NotificationsBridge({ userId, onResponse }: { userId: string, onResponse: (n: NotificationRecord) => void }) {
  useEffect(() => {
    const processed = new Set<string>()
    const handle = (n: NotificationRecord) => {
      if (processed.has(n.id)) return
      if (n.type === 'safety_check_ok' || n.type === 'safety_check_not_ok') {
        onResponse(n)
      }
      processed.add(n.id)
    }

    // Realtime subscription
    const channel = subscribeToNotifications(userId, (n: NotificationRecord) => {
      handle(n)
    }, { channelId: `notifications-bridge-${userId}` })

    // Polling fallback: fetch and process periodically
    const poll = async () => {
      try {
        const list = await getNotifications(userId)
        for (const n of list) handle(n)
      } catch (e) {
        // ignore
      }
    }
    // initial fetch
    poll()
    const interval = setInterval(poll, 10000)

    return () => {
      try { (channel as any)?.unsubscribe?.() } catch {}
      clearInterval(interval)
    }
  }, [userId, onResponse])
  return null
}

// Colored status badge that replaces the button during an active check window
function StatusBadge({ status }: { status: 'safe' | 'unknown' | 'danger' | string }) {
  const map: Record<string, { icon: any, classes: string, label: string }> = {
    safe: { icon: CheckCircle, classes: 'bg-green-100 text-green-700 border border-green-200', label: 'Safe' },
    danger: { icon: AlertTriangle, classes: 'bg-red-100 text-red-700 border border-red-200', label: 'Danger' },
    unknown: { icon: HelpCircle, classes: 'bg-gray-100 text-gray-700 border border-gray-200', label: 'Unknown' },
  }
  const def = map[status] || map['unknown']
  const Icon = def.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${def.classes}`}>
      <Icon className="w-3 h-3" />
      {def.label}
    </span>
  )
}

// Decide if server-persisted window still active
function serverWindowActive(member: any): boolean {
  if (!member.safety_check_expires_at) return false
  try {
    const expiry = new Date(member.safety_check_expires_at).getTime()
    return Date.now() < expiry
  } catch { return false }
}

// Countdown with timer icon showing mm:ss remaining until expiry
function Countdown({ expiresAt }: { expiresAt?: string | null }) {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  let remaining = 0
  if (expiresAt) {
    try {
      remaining = Math.max(0, new Date(expiresAt).getTime() - now)
    } catch {}
  }

  const totalSec = Math.floor(remaining / 1000)
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0')
  const ss = String(totalSec % 60).padStart(2, '0')

  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <Clock className="w-3 h-3" />
      {mm}:{ss}
    </span>
  )
}

function renderSafetyControl(member: any, t: any, sendFn: (id: string)=>Promise<any>) {
  const active = serverWindowActive(member)
  if (active && member.status) {
    return (
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <StatusBadge status={member.status} />
        <Countdown expiresAt={member.safety_check_expires_at} />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      <Button
        size="sm"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => sendFn(member.id)}
        disabled={active}
      >
        <MessageCircle className="w-3 h-3 mr-1" />
        {t('family.areYouOk')}
      </Button>
      <Countdown expiresAt={active ? member.safety_check_expires_at : undefined} />
    </div>
  )
}


