"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Heart, Plus, MessageCircle, CheckCircle, MapPin, XCircle, Search } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { fetchFamilyMembers, sendMessage, sendFamilyRequest, findUsers, removeFamilyMemberById } from '@/services/family'

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

  const handleSendSafetyCheck = async (memberId: string) => {
    if (!user?.id) return
    try {
      await sendMessage(user.id, memberId, 'Are you okay?')
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

  return (
    <>
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
              <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t('family.addMember')}
                  </Button>
                </DialogTrigger>
                <DialogContent showCloseButton={false} className="max-w-lg md:max-w-2xl w-full px-4 sm:px-0">
                  <div className="rounded-lg overflow-hidden shadow-lg bg-white">
                    <div className="relative bg-gradient-to-r from-indigo-600 to-sky-500 p-4 text-white">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>F</AvatarFallback>
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
                        <div className="p-3 bg-gradient-to-r from-white to-indigo-50 rounded-lg border">
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
                              <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedFound(null)}>Cancel</Button>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <Label htmlFor="member-relation" className="text-sm font-medium">Relation <span className="text-red-500">*</span></Label>
                            <Input
                              id="member-relation"
                              value={memberRelation}
                              onChange={(e) => setMemberRelation(e.target.value)}
                              placeholder="e.g., Mother, Father, Brother, Sister"
                              required
                            />
                            <div className="flex gap-2">
                              {['Mother','Father','Brother','Sister','Wife','Husband','Son','Daughter'].map((rel) => (
                                <Button key={rel} size="sm" className="w-full sm:w-auto" variant={memberRelation === rel ? 'secondary' : 'ghost'} onClick={() => setMemberRelation(rel)}>
                                  {rel}
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.phone}</p>
                      <p className="text-xs text-gray-500">ID: {member.uniqueId}</p>
                      {member.location?.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {member.location?.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => handleSendSafetyCheck(member.id)}>
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {t('family.areYouOk')}
                    </Button>
                    {member.status !== 'safe' && (
                      <Button size="sm" className="w-full sm:w-auto" onClick={() => handleMarkSafe(member.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('family.markDone')}
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={async () => {
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
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </>
  )
}

