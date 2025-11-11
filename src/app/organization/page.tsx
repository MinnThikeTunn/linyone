'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  Check, 
  X, 
  MapPin, 
  AlertTriangle, 
  Shield, 
  Truck,
  Handshake,
  TrendingUp,
  Clock,
  Navigation,
  MessageCircle,
  Eye,
  Upload,
  Package,
  Image as ImageIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  role: 'tracking_volunteer' | 'supply_volunteer'
  status: 'active' | 'inactive' | 'pending'
  location: string
  joinedAt: Date
  assignmentsCompleted: number
}

interface RequiredItem {
  category: string
  unit: string
  quantity: number
}

interface AcceptedItem {
  category: string
  unit: string
  originalQuantity: number
  acceptedQuantity: number
  remainingQuantity: number
  acceptedBy: string
  acceptedAt: Date
}

interface HelpRequest {
  id: string
  title: string
  description: string
  location: string
  lat: number
  lng: number
  image?: string
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'partially_accepted' | 'completed'
  requestedBy: string
  requestedAt: Date
  requiredItems: RequiredItem[]
  acceptedItems?: AcceptedItem[]
  completedBy?: string
  completedAt?: Date
  proofImage?: string
}

interface PartnerOrg {
  id: string
  name: string
  region: string
  activeCollaborations: number
  status: 'active' | 'inactive'
}

// Mock data
const mockVolunteers: Volunteer[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+959123456789',
    role: 'tracking_volunteer',
    status: 'active',
    location: 'Yangon',
    joinedAt: new Date('2024-01-15'),
    assignmentsCompleted: 15
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+959987654321',
    role: 'supply_volunteer',
    status: 'active',
    location: 'Mandalay',
    joinedAt: new Date('2024-02-20'),
    assignmentsCompleted: 8
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    phone: '+959456789123',
    role: 'tracking_volunteer',
    status: 'pending',
    location: 'Naypyidaw',
    joinedAt: new Date('2024-03-10'),
    assignmentsCompleted: 0
  }
]

const mockHelpRequests: HelpRequest[] = [
  {
    id: '1',
    title: 'Medical Supplies Needed',
    description: 'Urgent need for medical supplies at evacuation center. Multiple injured people need immediate medical attention.',
    location: 'Yangon Downtown, Main Street',
    lat: 16.8409,
    lng: 96.1735,
    image: '/api/placeholder/400/300',
    urgency: 'high',
    status: 'pending',
    requestedBy: 'Hospital A',
    requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    requiredItems: [
      { category: 'Medicine', unit: 'boxes', quantity: 50 },
      { category: 'Water', unit: 'bottles', quantity: 200 },
      { category: 'Blanket', unit: 'pieces', quantity: 100 },
      { category: 'Food pack', unit: 'packs', quantity: 150 }
    ]
  },
  {
    id: '2',
    title: 'Food Distribution',
    description: 'Food supplies needed for 200+ displaced families at temporary shelter',
    location: 'Mandalay District, Central Park',
    lat: 21.9588,
    lng: 96.0891,
    image: '/api/placeholder/400/300',
    urgency: 'medium',
    status: 'partially_accepted',
    requestedBy: 'Shelter Manager',
    requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    requiredItems: [
      { category: 'Food pack', unit: 'packs', quantity: 200 },
      { category: 'Water', unit: 'bottles', quantity: 300 },
      { category: 'Blanket', unit: 'pieces', quantity: 150 }
    ],
    acceptedItems: [
      {
        category: 'Food pack',
        unit: 'packs',
        originalQuantity: 200,
        acceptedQuantity: 50,
        remainingQuantity: 150,
        acceptedBy: 'Organization A',
        acceptedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        category: 'Water',
        unit: 'bottles',
        originalQuantity: 300,
        acceptedQuantity: 80,
        remainingQuantity: 220,
        acceptedBy: 'Organization A',
        acceptedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ]
  },
  {
    id: '3',
    title: 'Rescue Equipment',
    description: 'Heavy lifting equipment required for building collapse rescue operation',
    location: 'Industrial Zone, Block 5',
    lat: 16.8509,
    lng: 96.1835,
    image: '/api/placeholder/400/300',
    urgency: 'high',
    status: 'completed',
    requestedBy: 'Fire Department',
    requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    requiredItems: [
      { category: 'Accessories', unit: 'sets', quantity: 10 },
      { category: 'Medicine', unit: 'boxes', quantity: 20 }
    ],
    completedBy: 'Rescue Team A',
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    proofImage: '/api/placeholder/400/300'
  }
]

const mockPartnerOrgs: PartnerOrg[] = [
  {
    id: '1',
    name: 'Medical Response B',
    region: 'Mandalay',
    activeCollaborations: 3,
    status: 'active'
  },
  {
    id: '2',
    name: 'Supply Chain C',
    region: 'Naypyidaw',
    activeCollaborations: 2,
    status: 'active'
  }
]

export default function OrganizationPage() {
  const { t } = useLanguage()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [volunteers, setVolunteers] = useState<Volunteer[]>(mockVolunteers)
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(mockHelpRequests)
  const [partnerOrgs, setPartnerOrgs] = useState<PartnerOrg[]>(mockPartnerOrgs)
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [acceptQuantities, setAcceptQuantities] = useState<Record<string, number>>({})
  const [proofImage, setProofImage] = useState<File | null>(null)

  // Redirect non-organization users after auth resolved
  useEffect(() => {
    if (!isLoading && user && !user.isOrg) {
      window.location.href = '/'
    }
  }, [user, isLoading])

  const handleApproveVolunteer = (volunteerId: string) => {
    setVolunteers(volunteers.map(v => 
      v.id === volunteerId ? { ...v, status: 'active' } : v
    ))
  }

  const handleRejectVolunteer = (volunteerId: string) => {
    setVolunteers(volunteers.map(v => 
      v.id === volunteerId ? { ...v, status: 'inactive' } : v
    ))
  }

  // Note: Organizations accept requests directly, they don't assign volunteers
  // This function is kept for potential future use but not currently used
  // const handleAssignVolunteer = (requestId: string, volunteerId: string) => {
  //   // Implementation removed - organizations accept requests directly
  // }

  const handleViewOnMap = (request: HelpRequest) => {
    // Store the selected request in sessionStorage to highlight it on the map
    sessionStorage.setItem('highlightedPin', JSON.stringify({
      id: request.id,
      lat: request.lat,
      lng: request.lng,
      status: request.status
    }))
    router.push('/')
  }

  const handleViewRequest = (request: HelpRequest) => {
    setSelectedRequest(request)
    // Initialize accept quantities with remaining quantities
    const quantities: Record<string, number> = {}
    request.requiredItems.forEach(item => {
      const accepted = request.acceptedItems?.find(ai => ai.category === item.category)
      quantities[item.category] = accepted ? accepted.remainingQuantity : item.quantity
    })
    setAcceptQuantities(quantities)
  }

  const handleAcceptRequest = () => {
    if (!selectedRequest || !user) return

    const newAcceptedItems: AcceptedItem[] = []
    const updatedRequiredItems: RequiredItem[] = []
    let hasNewAcceptance = false

    selectedRequest.requiredItems.forEach(item => {
      const acceptedQty = acceptQuantities[item.category] || 0
      const existingAccepted = selectedRequest.acceptedItems?.find(ai => ai.category === item.category)
      const originalQty = existingAccepted?.originalQuantity || item.quantity
      const previousAccepted = existingAccepted?.acceptedQuantity || 0
      const currentRemaining = existingAccepted?.remainingQuantity || item.quantity

      if (acceptedQty > 0 && acceptedQty <= currentRemaining) {
        hasNewAcceptance = true
        const newAcceptedQty = previousAccepted + acceptedQty
        const remainingQty = originalQty - newAcceptedQty

        newAcceptedItems.push({
          category: item.category,
          unit: item.unit,
          originalQuantity: originalQty,
          acceptedQuantity: newAcceptedQty,
          remainingQuantity: remainingQty,
          acceptedBy: user.name || 'Your Organization',
          acceptedAt: new Date()
        })

        updatedRequiredItems.push({
          category: item.category,
          unit: item.unit,
          quantity: remainingQty
        })
      } else {
        // Keep existing accepted items or original items
        if (existingAccepted) {
          newAcceptedItems.push(existingAccepted)
          updatedRequiredItems.push({
            category: item.category,
            unit: item.unit,
            quantity: existingAccepted.remainingQuantity
          })
        } else {
          updatedRequiredItems.push(item)
        }
      }
    })

    if (!hasNewAcceptance) {
      // No new items accepted, don't update
      return
    }

    const allCompleted = updatedRequiredItems.every(item => item.quantity === 0)
    const newStatus = allCompleted ? 'completed' : 'partially_accepted'

    setHelpRequests(requests => requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            status: newStatus,
            requiredItems: updatedRequiredItems,
            acceptedItems: newAcceptedItems
          }
        : req
    ))

    setShowAcceptDialog(false)
    setSelectedRequest(null)
    setAcceptQuantities({})
  }

  const handleMarkAsDone = () => {
    if (!selectedRequest || !user || !proofImage) return

    setHelpRequests(requests => requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            status: 'completed',
            completedBy: user.name || 'Your Organization',
            completedAt: new Date(),
            proofImage: URL.createObjectURL(proofImage)
          }
        : req
    ))

    setShowCompleteDialog(false)
    setSelectedRequest(null)
    setProofImage(null)
  }

  const getRemainingQuantity = (request: HelpRequest, category: string): number => {
    const item = request.requiredItems.find(ri => ri.category === category)
    if (!item) return 0
    const accepted = request.acceptedItems?.find(ai => ai.category === category)
    return accepted ? accepted.remainingQuantity : item.quantity
  }

  const hasAcceptedItems = (request: HelpRequest): boolean => {
    return (request.acceptedItems && request.acceptedItems.length > 0) || false
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'partially_accepted': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeVolunteers = volunteers.filter(v => v.status === 'active').length
  const pendingVolunteers = volunteers.filter(v => v.status === 'pending').length
  const pendingRequests = helpRequests.filter(r => r.status === 'pending' || r.status === 'partially_accepted').length
  const activeCollaborations = partnerOrgs.filter(o => o.status === 'active').length
  
  // Filter to show only confirmed pins (help requests) - show pending and partially_accepted, exclude completed
  const confirmedHelpRequests = helpRequests.filter(r => r.status !== 'completed')

  if (isLoading) {
    // while auth is restoring, don't render the page
    return null
  }

  if (!user || !user.isOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Organization privileges required.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('org.title')}
          </h1>
          <p className="text-gray-600">Manage volunteers and coordinate relief efforts</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Volunteers</p>
                  <p className="text-2xl font-bold text-green-600">{activeVolunteers}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingVolunteers}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Help Requests</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRequests}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Partnerships</p>
                  <p className="text-2xl font-bold text-purple-600">{activeCollaborations}</p>
                </div>
                <Handshake className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Requests - Main Feature */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              Help Requests (Confirmed Pins)
            </CardTitle>
            <CardDescription>
              View and accept help requests from confirmed location pins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmedHelpRequests.map((request) => (
                <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{request.title}</h3>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status === 'partially_accepted' ? 'Partially Accepted' : request.status}
                        </Badge>
                        {hasAcceptedItems(request) && (
                          <Badge className="bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {request.requestedAt.toLocaleString()}
                        </div>
                        <div>Requested by: {request.requestedBy}</div>
                      </div>

                      {/* Required Items Summary */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-medium text-gray-700 mb-2">Required Items:</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {request.requiredItems.map((item, idx) => {
                            const remaining = getRemainingQuantity(request, item.category)
                            return (
                              <div key={idx} className="text-xs">
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium">{item.category}:</span>
                                </div>
                                <div className="ml-4 text-gray-600">
                                  {remaining} {item.unit} {remaining < item.quantity && `(${item.quantity - remaining} accepted)`}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewRequest(request)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleViewOnMap(request)}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        View on Map
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {confirmedHelpRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No help requests available at the moment.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Secondary Features - Tabs */}
        <Tabs defaultValue="volunteers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="volunteers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('org.volunteerManagement')}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              {t('org.collaboration')}
            </TabsTrigger>
          </TabsList>

          {/* Volunteer Management */}
          <TabsContent value="volunteers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  {t('org.volunteerManagement')}
                </CardTitle>
                <CardDescription>
                  Approve, manage, and assign volunteers to tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {volunteers.map((volunteer) => (
                      <TableRow key={volunteer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{volunteer.name}</div>
                            <div className="text-sm text-gray-500">{volunteer.email}</div>
                            <div className="text-xs text-gray-400">{volunteer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={volunteer.role === 'tracking_volunteer' ? 'default' : 'secondary'}>
                            {volunteer.role === 'tracking_volunteer' ? 'Tracking' : 'Supply'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {volunteer.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            {volunteer.assignmentsCompleted}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(volunteer.status)}>
                            {volunteer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {volunteer.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => handleApproveVolunteer(volunteer.id)}>
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectVolunteer(volunteer.id)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Accepted Requests Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Accepted Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-green-600">
                      {helpRequests.filter(r => hasAcceptedItems(r)).length}
                    </div>
                    <p className="text-sm text-gray-600">
                      Total requests you have accepted
                    </p>
                    <div className="space-y-2">
                      {helpRequests
                        .filter(r => hasAcceptedItems(r))
                        .map((request) => (
                          <div key={request.id} className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">{request.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {request.acceptedItems?.map(ai => `${ai.acceptedQuantity} ${ai.unit} ${ai.category}`).join(', ')}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Requests Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Completed Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {helpRequests.filter(r => r.status === 'completed' && r.completedBy === user?.name).length}
                    </div>
                    <p className="text-sm text-gray-600">
                      Requests you have completed
                    </p>
                    <div className="space-y-2">
                      {helpRequests
                        .filter(r => r.status === 'completed' && r.completedBy === user?.name)
                        .map((request) => (
                          <div key={request.id} className="p-3 border rounded-lg">
                            <div className="font-medium text-sm">{request.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Completed on {request.completedAt?.toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supply Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-500" />
                    Supply Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {helpRequests
                      .filter(r => hasAcceptedItems(r))
                      .reduce((acc, request) => {
                        request.acceptedItems?.forEach(ai => {
                          const existing = acc.find(item => item.category === ai.category)
                          if (existing) {
                            existing.quantity += ai.acceptedQuantity
                          } else {
                            acc.push({
                              category: ai.category,
                              unit: ai.unit,
                              quantity: ai.acceptedQuantity
                            })
                          }
                        })
                        return acc
                      }, [] as { category: string; unit: string; quantity: number }[])
                      .map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{item.category}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    {helpRequests.filter(r => hasAcceptedItems(r)).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No supplies distributed yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {helpRequests
                      .filter(r => hasAcceptedItems(r) || r.status === 'completed')
                      .sort((a, b) => {
                        const aTime = a.acceptedItems?.[0]?.acceptedAt || a.completedAt || a.requestedAt
                        const bTime = b.acceptedItems?.[0]?.acceptedAt || b.completedAt || b.requestedAt
                        return bTime.getTime() - aTime.getTime()
                      })
                      .slice(0, 5)
                      .map((request) => (
                        <div key={request.id} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm">{request.title}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {request.status === 'completed' 
                              ? `Completed on ${request.completedAt?.toLocaleString()}`
                              : `Accepted on ${request.acceptedItems?.[0]?.acceptedAt.toLocaleString()}`
                            }
                          </div>
                        </div>
                      ))}
                    {helpRequests.filter(r => hasAcceptedItems(r) || r.status === 'completed').length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collaboration */}
          <TabsContent value="collaboration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-purple-500" />
                  {t('org.collaboration')}
                </CardTitle>
                <CardDescription>
                  Partner with other organizations for large-scale disasters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerOrgs.map((org) => (
                    <Card key={org.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{org.name}</h3>
                          <Badge className={getStatusColor(org.status)}>
                            {org.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {org.region}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {org.activeCollaborations} active collaborations
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Contact
                          </Button>
                          <Button size="sm">
                            <Handshake className="w-3 h-3 mr-1" />
                            Collaborate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Alert>
                    <Handshake className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Collaboration Mode Active</strong> - You can now share resources and coordinate with partner organizations for efficient disaster response.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detailed Request View Dialog */}
      <Dialog open={!!selectedRequest && !showAcceptDialog && !showCompleteDialog} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              {selectedRequest?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Image */}
              {selectedRequest.image && (
                <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedRequest.image} 
                    alt={selectedRequest.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Location */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Location</span>
                </div>
                <p className="text-gray-700">{selectedRequest.location}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => handleViewOnMap(selectedRequest)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  View on Map
                </Button>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-gray-700">{selectedRequest.description}</p>
              </div>

              {/* Required Items Table */}
              <div>
                <h4 className="font-medium mb-3">Required Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Original Quantity</TableHead>
                      <TableHead>Remaining Quantity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequest.requiredItems.map((item, idx) => {
                      const remaining = getRemainingQuantity(selectedRequest, item.category)
                      const accepted = selectedRequest.acceptedItems?.find(ai => ai.category === item.category)
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <span className={remaining > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {remaining}
                            </span>
                          </TableCell>
                          <TableCell>
                            {accepted ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Check className="w-3 h-3 mr-1" />
                                {accepted.acceptedQuantity} accepted by {accepted.acceptedBy}
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedRequest.status !== 'completed' && (
                  <>
                    <Button 
                      onClick={() => {
                        setShowAcceptDialog(true)
                      }}
                      className="flex-1"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept Request
                    </Button>
                    {hasAcceptedItems(selectedRequest) && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowCompleteDialog(true)
                        }}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Mark as Done
                      </Button>
                    )}
                  </>
                )}
                {selectedRequest.status === 'completed' && selectedRequest.proofImage && (
                  <div className="w-full">
                    <h4 className="font-medium mb-2">Proof of Delivery</h4>
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={selectedRequest.proofImage} 
                        alt="Proof of delivery"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Completed by {selectedRequest.completedBy} on {selectedRequest.completedAt?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Request Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accept Help Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Adjust the quantities you can provide. The remaining quantities will be updated automatically.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-medium mb-3">Required Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>You Can Provide</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRequest.requiredItems.map((item, idx) => {
                      const remaining = getRemainingQuantity(selectedRequest, item.category)
                      const maxQty = remaining
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{remaining}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={maxQty}
                              value={acceptQuantities[item.category] || 0}
                              onChange={(e) => {
                                const value = Math.max(0, Math.min(maxQty, parseInt(e.target.value) || 0))
                                setAcceptQuantities(prev => ({
                                  ...prev,
                                  [item.category]: value
                                }))
                              }}
                              className="w-24"
                            />
                            <span className="ml-2 text-sm text-gray-500">/ {maxQty}</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleAcceptRequest}
                  className="flex-1"
                  disabled={Object.values(acceptQuantities).every(qty => qty === 0)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Accept Request
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowAcceptDialog(false)
                    setAcceptQuantities({})
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Done Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Request as Done</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Upload proof of delivery or completion to mark this request as done.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="proof-image">Proof Image</Label>
                <Input
                  id="proof-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                  className="mt-2"
                />
                {proofImage && (
                  <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={URL.createObjectURL(proofImage)} 
                      alt="Proof preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={handleMarkAsDone}
                  className="flex-1"
                  disabled={!proofImage}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Done
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowCompleteDialog(false)
                    setProofImage(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}