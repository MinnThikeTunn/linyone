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
  Image as ImageIcon,
  Plus,
  UserPlus,
  Edit,
  Trash2,
  Warehouse
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'
import { fetchConfirmedPinsForDashboard, acceptHelpRequestItems, checkAndHandleCompletedPin } from '@/services/pins'

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
  password?: string
  assignment?: string
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
  region?: string
  image?: string
  status: 'pending' | 'partially_accepted'
  requestedBy: string
  requestedAt: Date
  requiredItems: Array<{
    category: string
    unit: string
    quantity: number
    itemId: string
    pinItemId: string
    remainingQty: number
  }>
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
  phone: string
}

interface Supply {
  id: string
  category: 'medical' | 'food' | 'water' | 'shelter' | 'equipment' | 'other'
  name: string
  quantity: number
  unit: string
  location?: string
  expiryDate?: Date
  lastUpdated: Date
  notes?: string
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

// Mock data - will be replaced by database
const mockHelpRequests: HelpRequest[] = []

const mockPartnerOrgs: PartnerOrg[] = [
  {
    id: '1',
    name: 'Medical Response B',
    region: 'Mandalay',
    activeCollaborations: 3,
    status: 'active',
    phone: '+959123456789'
  },
  {
    id: '2',
    name: 'Supply Chain C',
    region: 'Naypyidaw',
    activeCollaborations: 2,
    status: 'active',
    phone: '+959987654321'
  }
]

// Mock supplies data
const mockSupplies: Supply[] = [
  {
    id: '1',
    category: 'medical',
    name: 'First Aid Kits',
    quantity: 50,
    unit: 'kits',
    location: 'Warehouse A',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    notes: 'Standard first aid supplies'
  },
  {
    id: '2',
    category: 'food',
    name: 'Emergency Food Packs',
    quantity: 200,
    unit: 'packs',
    location: 'Storage Room 1',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    category: 'water',
    name: 'Bottled Water',
    quantity: 500,
    unit: 'bottles',
    location: 'Warehouse B',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    category: 'shelter',
    name: 'Emergency Tents',
    quantity: 25,
    unit: 'tents',
    location: 'Storage Room 2',
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: '5',
    category: 'equipment',
    name: 'Flashlights',
    quantity: 100,
    unit: 'units',
    location: 'Warehouse A',
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
]

export default function OrganizationPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [volunteers, setVolunteers] = useState<Volunteer[]>(mockVolunteers)
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(mockHelpRequests)
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [partnerOrgs, setPartnerOrgs] = useState<PartnerOrg[]>(mockPartnerOrgs)
  const [supplies, setSupplies] = useState<Supply[]>(mockSupplies)
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null)
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [acceptQuantities, setAcceptQuantities] = useState<Record<string, number>>({})
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [showRegisterVolunteer, setShowRegisterVolunteer] = useState(false)
  const [newVolunteer, setNewVolunteer] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'tracking_volunteer' as 'tracking_volunteer' | 'supply_volunteer',
    location: '',
    assignment: '',
    status: 'pending' as 'pending' | 'active',
    password: ''
  })
  const [showAddSupply, setShowAddSupply] = useState(false)
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null)
  const [supplyForm, setSupplyForm] = useState({
    category: 'medical' as Supply['category'],
    name: '',
    quantity: 0,
    unit: '',
    location: '',
    expiryDate: '',
    notes: ''
  })

  // Redirect non-organization users
  useEffect(() => {
    if (user && user.role !== 'organization') {
      window.location.href = '/'
    }
  }, [user])

  // Load help requests from database
  useEffect(() => {
    const loadHelpRequests = async () => {
      const result = await fetchConfirmedPinsForDashboard()
      if (result.success && result.helpRequests) {
        setHelpRequests(result.helpRequests)
      } else {
        console.error('Failed to load help requests:', result.error)
      }
    }
    loadHelpRequests()
  }, [])

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

  const handleRegisterVolunteer = () => {
    if (!newVolunteer.name || !newVolunteer.phone || !newVolunteer.password || !newVolunteer.location) {
      alert('Please fill all required fields (Name, Phone, Password, Location)')
      return
    }

    const volunteer: Volunteer = {
      id: Date.now().toString(),
      name: newVolunteer.name,
      email: newVolunteer.email || `${newVolunteer.phone}@volunteer.local`,
      phone: newVolunteer.phone,
      role: newVolunteer.role,
      status: newVolunteer.status,
      location: newVolunteer.location,
      joinedAt: new Date(),
      assignmentsCompleted: 0,
      password: newVolunteer.password,
      assignment: newVolunteer.assignment || undefined
    }

    setVolunteers([...volunteers, volunteer])
    setNewVolunteer({
      name: '',
      phone: '',
      email: '',
      role: 'tracking_volunteer',
      location: '',
      assignment: '',
      status: 'pending',
      password: ''
    })
    setShowRegisterVolunteer(false)
  }

  const handleAddSupply = () => {
    if (!supplyForm.name || !supplyForm.quantity || !supplyForm.unit) {
      alert('Please fill all required fields (Name, Quantity, Unit)')
      return
    }

    const newSupply: Supply = {
      id: Date.now().toString(),
      category: supplyForm.category,
      name: supplyForm.name,
      quantity: supplyForm.quantity,
      unit: supplyForm.unit,
      location: supplyForm.location || undefined,
      expiryDate: supplyForm.expiryDate ? new Date(supplyForm.expiryDate) : undefined,
      lastUpdated: new Date(),
      notes: supplyForm.notes || undefined
    }

    setSupplies([...supplies, newSupply])
    setSupplyForm({
      category: 'medical',
      name: '',
      quantity: 0,
      unit: '',
      location: '',
      expiryDate: '',
      notes: ''
    })
    setShowAddSupply(false)
  }

  const handleEditSupply = (supply: Supply) => {
    setEditingSupply(supply)
    setSupplyForm({
      category: supply.category,
      name: supply.name,
      quantity: supply.quantity,
      unit: supply.unit,
      location: supply.location || '',
      expiryDate: supply.expiryDate ? supply.expiryDate.toISOString().split('T')[0] : '',
      notes: supply.notes || ''
    })
    setShowAddSupply(true)
  }

  const handleUpdateSupply = () => {
    if (!editingSupply || !supplyForm.name || !supplyForm.quantity || !supplyForm.unit) {
      alert('Please fill all required fields (Name, Quantity, Unit)')
      return
    }

    setSupplies(supplies.map(s =>
      s.id === editingSupply.id
        ? {
            ...s,
            category: supplyForm.category,
            name: supplyForm.name,
            quantity: supplyForm.quantity,
            unit: supplyForm.unit,
            location: supplyForm.location || undefined,
            expiryDate: supplyForm.expiryDate ? new Date(supplyForm.expiryDate) : undefined,
            lastUpdated: new Date(),
            notes: supplyForm.notes || undefined
          }
        : s
    ))

    setEditingSupply(null)
    setSupplyForm({
      category: 'medical',
      name: '',
      quantity: 0,
      unit: '',
      location: '',
      expiryDate: '',
      notes: ''
    })
    setShowAddSupply(false)
  }

  const handleDeleteSupply = (supplyId: string) => {
    if (confirm('Are you sure you want to delete this supply?')) {
      setSupplies(supplies.filter(s => s.id !== supplyId))
    }
  }

  const getCategoryColor = (category: Supply['category']) => {
    switch (category) {
      case 'medical':
        return 'bg-red-100 text-red-800'
      case 'food':
        return 'bg-orange-100 text-orange-800'
      case 'water':
        return 'bg-blue-100 text-blue-800'
      case 'shelter':
        return 'bg-green-100 text-green-800'
      case 'equipment':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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

  const handleAcceptRequest = async () => {
    if (!selectedRequest || !user) return

    // Build array of items to accept based on user input
    const itemsToAccept = selectedRequest.requiredItems
      .filter(item => {
        const acceptedQty = acceptQuantities[item.pinItemId] || 0
        return acceptedQty > 0
      })
      .map(item => ({
        pinItemId: item.pinItemId,
        acceptedQuantity: acceptQuantities[item.pinItemId] || 0
      }))

    if (itemsToAccept.length === 0) {
      console.warn('No items selected to accept')
      return
    }

    // Call backend to accept items
    const result = await acceptHelpRequestItems(selectedRequest.id, itemsToAccept)
    
    if (result.success) {
      // Check if this pin is now fully completed (all items have remaining_qty = 0)
      // If so, delete all pin_items (which triggers the database trigger to delete the pin)
      const completionCheck = await checkAndHandleCompletedPin(selectedRequest.id)
      
      if (completionCheck.success && completionCheck.isCompleted) {
        console.log(`✅ Pin ${selectedRequest.id} completed and marked for deletion`)
      }
      
      // Refresh help requests from database
      const refreshResult = await fetchConfirmedPinsForDashboard()
      if (refreshResult.success && refreshResult.helpRequests) {
        setHelpRequests(refreshResult.helpRequests)
      }
      
      setShowAcceptDialog(false)
      setSelectedRequest(null)
      setAcceptQuantities({})
    } else {
      console.error('Failed to accept items:', result.error)
    }
  }

  const handleMarkAsDone = async () => {
    if (!selectedRequest || !user) return

    // Update the pin status to completed in the database
    // The completed pins will automatically be hidden from the dashboard on next refresh
    
    setShowCompleteDialog(false)
    setSelectedRequest(null)
    setProofImage(null)
    
    // Refresh the help requests to remove completed pins
    const result = await fetchConfirmedPinsForDashboard()
    if (result.success && result.helpRequests) {
      setHelpRequests(result.helpRequests)
    }
  }

  const getRemainingQuantity = (item: HelpRequest['requiredItems'][0]): number => {
    return item.remainingQty
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
  
  // All help requests from database are already confirmed and not completed
  const confirmedHelpRequests = helpRequests

  if (!user || user.role !== 'organization') {
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmedHelpRequests.map((request) => (
                <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{request.title}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status === 'partially_accepted' ? 'Partially Accepted' : request.status}
                        </Badge>
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                      )}
                      
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
                            const remaining = getRemainingQuantity(item)
                            const accepted = item.quantity - remaining
                            return (
                              <div key={idx} className="text-xs">
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium">{item.category}:</span>
                                </div>
                                <div className="ml-4 text-gray-600">
                                  {remaining} {item.unit} {accepted > 0 && `(${accepted} accepted)`}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 items-center justify-center">
                      <Button 
                        size="default" 
                        variant="outline"
                        onClick={() => handleViewRequest(request)}
                        className="flex items-center gap-2 min-w-[140px]"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button 
                        size="default"
                        onClick={() => handleViewOnMap(request)}
                        className="flex items-center gap-2 min-w-[140px]"
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="volunteers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('org.volunteerManagement')}
            </TabsTrigger>
            <TabsTrigger value="supplies" className="flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
              Supply Management
            </TabsTrigger>
            <TabsTrigger value="supplies-needed" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Needed Supplies
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
                <div className="flex items-center justify-between">
                  <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  {t('org.volunteerManagement')}
                </CardTitle>
                <CardDescription>
                      Register, approve, and manage volunteers
                </CardDescription>
                  </div>
                  <Dialog open={showRegisterVolunteer} onOpenChange={setShowRegisterVolunteer}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register Volunteer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Register New Volunteer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="volunteer-name">Name *</Label>
                            <Input
                              id="volunteer-name"
                              value={newVolunteer.name}
                              onChange={(e) => setNewVolunteer(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter volunteer name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="volunteer-phone">Phone Number *</Label>
                            <Input
                              id="volunteer-phone"
                              value={newVolunteer.phone}
                              onChange={(e) => setNewVolunteer(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="+959123456789"
                            />
                          </div>
                          <div>
                            <Label htmlFor="volunteer-email">Email</Label>
                            <Input
                              id="volunteer-email"
                              type="email"
                              value={newVolunteer.email}
                              onChange={(e) => setNewVolunteer(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="volunteer@example.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="volunteer-password">Password *</Label>
                            <Input
                              id="volunteer-password"
                              type="password"
                              value={newVolunteer.password}
                              onChange={(e) => setNewVolunteer(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter password"
                            />
                          </div>
                          <div>
                            <Label htmlFor="volunteer-role">Role *</Label>
                            <Select 
                              value={newVolunteer.role} 
                              onValueChange={(value: 'tracking_volunteer' | 'supply_volunteer') => 
                                setNewVolunteer(prev => ({ ...prev, role: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tracking_volunteer">Tracking Volunteer</SelectItem>
                                <SelectItem value="supply_volunteer">Supply Volunteer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="volunteer-location">Location *</Label>
                            <Input
                              id="volunteer-location"
                              value={newVolunteer.location}
                              onChange={(e) => setNewVolunteer(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Enter location"
                            />
                          </div>
                          <div>
                            <Label htmlFor="volunteer-assignment">Assignment</Label>
                            <Input
                              id="volunteer-assignment"
                              value={newVolunteer.assignment}
                              onChange={(e) => setNewVolunteer(prev => ({ ...prev, assignment: e.target.value }))}
                              placeholder="Enter assignment details"
                            />
                          </div>
                          <div>
                            <Label htmlFor="volunteer-status">Status *</Label>
                            <Select 
                              value={newVolunteer.status} 
                              onValueChange={(value: 'pending' | 'active') => 
                                setNewVolunteer(prev => ({ ...prev, status: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={handleRegisterVolunteer} className="flex-1">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Register Volunteer
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setShowRegisterVolunteer(false)
                              setNewVolunteer({
                                name: '',
                                phone: '',
                                email: '',
                                role: 'tracking_volunteer',
                                location: '',
                                assignment: '',
                                status: 'pending',
                                password: ''
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assignment</TableHead>
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
                          <div className="text-sm text-gray-600">
                            {volunteer.assignment || 'No assignment'}
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

          {/* Supply Management */}
          <TabsContent value="supplies" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                <CardTitle className="flex items-center gap-2">
                      <Warehouse className="w-5 h-5 text-blue-500" />
                      Supply Management
                </CardTitle>
                <CardDescription>
                      Manage your organization's supply inventory
                </CardDescription>
                  </div>
                  <Dialog open={showAddSupply} onOpenChange={(open) => {
                    setShowAddSupply(open)
                    if (!open) {
                      setEditingSupply(null)
                      setSupplyForm({
                        category: 'medical',
                        name: '',
                        quantity: 0,
                        unit: '',
                        location: '',
                        expiryDate: '',
                        notes: ''
                      })
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Supply
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingSupply ? 'Edit Supply' : 'Add New Supply'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="supply-category">Category *</Label>
                            <Select 
                              value={supplyForm.category} 
                              onValueChange={(value: Supply['category']) => 
                                setSupplyForm(prev => ({ ...prev, category: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="medical">Medical</SelectItem>
                                <SelectItem value="food">Food</SelectItem>
                                <SelectItem value="water">Water</SelectItem>
                                <SelectItem value="shelter">Shelter</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="supply-name">Name *</Label>
                            <Input
                              id="supply-name"
                              value={supplyForm.name}
                              onChange={(e) => setSupplyForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter supply name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="supply-quantity">Quantity *</Label>
                            <Input
                              id="supply-quantity"
                              type="number"
                              min="0"
                              value={supplyForm.quantity}
                              onChange={(e) => setSupplyForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="supply-unit">Unit *</Label>
                            <Input
                              id="supply-unit"
                              value={supplyForm.unit}
                              onChange={(e) => setSupplyForm(prev => ({ ...prev, unit: e.target.value }))}
                              placeholder="e.g., packs, bottles, kits"
                            />
                          </div>
                          <div>
                            <Label htmlFor="supply-location">Location</Label>
                            <Input
                              id="supply-location"
                              value={supplyForm.location}
                              onChange={(e) => setSupplyForm(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Warehouse, Storage Room, etc."
                            />
                          </div>
                          <div>
                            <Label htmlFor="supply-expiry">Expiry Date</Label>
                            <Input
                              id="supply-expiry"
                              type="date"
                              value={supplyForm.expiryDate}
                              onChange={(e) => setSupplyForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="supply-notes">Notes</Label>
                          <Textarea
                            id="supply-notes"
                            value={supplyForm.notes}
                            onChange={(e) => setSupplyForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Additional notes about this supply"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2 pt-4 border-t">
                          <Button 
                            onClick={editingSupply ? handleUpdateSupply : handleAddSupply} 
                            className="flex-1"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            {editingSupply ? 'Update Supply' : 'Add Supply'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setShowAddSupply(false)
                              setEditingSupply(null)
                              setSupplyForm({
                                category: 'medical',
                                name: '',
                                quantity: 0,
                                unit: '',
                                location: '',
                                expiryDate: '',
                                notes: ''
                              })
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No supplies found. Add your first supply to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplies.map((supply) => (
                        <TableRow key={supply.id}>
                          <TableCell>
                            <Badge className={getCategoryColor(supply.category)}>
                              {supply.category.charAt(0).toUpperCase() + supply.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supply.name}</div>
                              {supply.notes && (
                                <div className="text-xs text-gray-500 mt-1">{supply.notes}</div>
                              )}
                          </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{supply.quantity}</span>
                              <span className="text-sm text-gray-500">{supply.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {supply.location ? (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">{supply.location}</span>
                            </div>
                            ) : (
                              <span className="text-sm text-gray-400">Not specified</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {supply.expiryDate ? (
                              <div className="text-sm">
                                {supply.expiryDate.toLocaleDateString()}
                                {supply.expiryDate < new Date() && (
                                  <Badge variant="destructive" className="ml-2">Expired</Badge>
                            )}
                          </div>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {supply.lastUpdated.toLocaleDateString()}
                        </div>
                          </TableCell>
                          <TableCell>
                        <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditSupply(supply)}
                              >
                                <Edit className="w-3 h-3" />
                                </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteSupply(supply.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Total Needed Supplies */}
          <TabsContent value="supplies-needed" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-500" />
                      Total Needed Supplies
                    </CardTitle>
                    <CardDescription>
                      Aggregated supply needs from all confirmed help requests by region
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="region-filter" className="text-sm">Filter by Region:</Label>
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger id="region-filter" className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="Yangon">Yangon</SelectItem>
                        <SelectItem value="Mandalay">Mandalay</SelectItem>
                        <SelectItem value="Sagaing">Sagaing</SelectItem>
                        <SelectItem value="NayPyiTaw">NayPyiTaw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Total Quantity Needed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Get all confirmed help requests (pending or partially_accepted - these are the active requests)
                      const confirmedRequests = helpRequests.filter(
                        r => (r.status === 'pending' || r.status === 'partially_accepted') && r.region
                      )

                      // Filter by region if filter is set
                      const filteredRequests = regionFilter === 'all' 
                        ? confirmedRequests 
                        : confirmedRequests.filter(r => r.region === regionFilter)

                      // Get unique regions
                      const regions = Array.from(new Set(filteredRequests.map(r => r.region).filter(Boolean))) as string[]
                      
                      // Standard supply categories
                      const standardCategories = ['Food Packs', 'Water Bottles', 'Medicine Box', 'Clothes Packs', 'Blankets']
                      const categoryMap: Record<string, string> = {
                        'Food pack': 'Food Packs',
                        'Food': 'Food Packs',
                        'Water': 'Water Bottles',
                        'Medicine': 'Medicine Box',
                        'Clothes': 'Clothes Packs',
                        'Clothing': 'Clothes Packs',
                        'Blanket': 'Blankets',
                        'Blankets': 'Blankets'
                      }

                      // Unit mapping for each category
                      const unitMap: Record<string, string> = {
                        'Food Packs': 'packs',
                        'Water Bottles': 'bottles',
                        'Medicine Box': 'boxes',
                        'Clothes Packs': 'packs',
                        'Blankets': 'pieces'
                      }

                      if (regions.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              No confirmed help requests with supply needs found.
                            </TableCell>
                          </TableRow>
                        )
                      }

                      // Build table rows: for each region, show all 5 categories
                      const rows: React.ReactElement[] = []
                      
                      regions.forEach(region => {
                        // Aggregate supplies for this region
                        const regionRequests = filteredRequests.filter(r => r.region === region)
                        const regionSupplies: Record<string, number> = {}
                        
                        regionRequests.forEach(request => {
                          request.requiredItems.forEach(item => {
                            const standardCategory = categoryMap[item.category] || item.category
                            if (standardCategories.includes(standardCategory)) {
                              const key = standardCategory
                              regionSupplies[key] = (regionSupplies[key] || 0) + item.quantity
                            }
                          })
                        })

                        // Create rows for all 5 categories for this region
                        standardCategories.forEach((category, idx) => {
                          const quantity = regionSupplies[category] || 0
                          const unit = unitMap[category]
                          
                          rows.push(
                            <TableRow key={`${region}-${category}`}>
                              {idx === 0 ? (
                                <TableCell rowSpan={standardCategories.length} className="font-medium align-top border-r">
                                  {region}
                                </TableCell>
                              ) : null}
                              <TableCell className="font-medium">{category}</TableCell>
                              <TableCell>{unit}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-500" />
                                  <span className="font-semibold text-lg">{quantity.toLocaleString()}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      })

                      return rows
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {org.phone}
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" className="w-full">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Send Message
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Help Request Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="flex flex-col space-y-4 overflow-y-auto flex-1 pr-2">
              {/* Location */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Location</span>
                </div>
                <p className="text-gray-700 text-sm pl-6">{selectedRequest.location}</p>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Description</h4>
                <p className="text-gray-700 text-sm">{selectedRequest.description}</p>
              </div>

              {/* Required Items Table */}
              <div>
                <h4 className="font-medium mb-3 text-sm">Required Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Unit</TableHead>
                        <TableHead className="text-xs">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.requiredItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm font-medium">{item.category}</TableCell>
                          <TableCell className="text-sm">{item.unit}</TableCell>
                          <TableCell className="text-sm">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Accept Request Button */}
              <div className="pt-2 border-t">
                <Button 
                  onClick={() => {
                    setShowAcceptDialog(true)
                  }}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                    Accept Request
                  </Button>
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
                      const remaining = item.remainingQty
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
                              value={acceptQuantities[item.pinItemId] || 0}
                              onChange={(e) => {
                                const value = Math.max(0, Math.min(maxQty, parseInt(e.target.value) || 0))
                                setAcceptQuantities(prev => ({
                                  ...prev,
                                  [item.pinItemId]: value
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