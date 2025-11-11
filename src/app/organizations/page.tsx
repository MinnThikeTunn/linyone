'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Building, 
  Users, 
  MapPin, 
  TrendingUp, 
  Handshake, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Globe,
  Phone,
  Mail
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

interface Organization {
  id: string
  name: string
  type: 'rescue' | 'medical' | 'supply' | 'government' | 'ngo'
  status: 'active' | 'inactive' | 'pending'
  region: string
  city: string
  contactEmail: string
  contactPhone: string
  website?: string
  volunteerCount: number
  activeMissions: number
  completedMissions: number
  rating: number
  establishedYear: number
  description: string
  services: string[]
  partnerships: string[]
}

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Rescue Team A',
    type: 'rescue',
    status: 'active',
    region: 'Yangon',
    city: 'Yangon',
    contactEmail: 'contact@rescue-team-a.org',
    contactPhone: '+959123456789',
    website: 'https://rescue-team-a.org',
    volunteerCount: 45,
    activeMissions: 3,
    completedMissions: 127,
    rating: 4.8,
    establishedYear: 2018,
    description: 'Specialized in search and rescue operations during natural disasters',
    services: ['Search & Rescue', 'Emergency Response', 'Training', 'Equipment Support'],
    partnerships: ['Medical Response B', 'Fire Department', 'Local Government']
  },
  {
    id: '2',
    name: 'Medical Response B',
    type: 'medical',
    status: 'active',
    region: 'Mandalay',
    city: 'Mandalay',
    contactEmail: 'info@medical-response-b.org',
    contactPhone: '+959987654321',
    website: 'https://medical-response-b.org',
    volunteerCount: 32,
    activeMissions: 2,
    completedMissions: 89,
    rating: 4.9,
    establishedYear: 2019,
    description: 'Providing medical assistance and emergency healthcare services',
    services: ['Emergency Medical Care', 'First Aid', 'Mobile Clinics', 'Health Training'],
    partnerships: ['Rescue Team A', 'Hospitals', 'NGO Network']
  },
  {
    id: '3',
    name: 'Supply Chain C',
    type: 'supply',
    status: 'active',
    region: 'Naypyidaw',
    city: 'Naypyidaw',
    contactEmail: 'admin@supply-chain-c.org',
    contactPhone: '+959456789123',
    website: 'https://supply-chain-c.org',
    volunteerCount: 28,
    activeMissions: 4,
    completedMissions: 156,
    rating: 4.7,
    establishedYear: 2020,
    description: 'Logistics and supply chain management for disaster relief',
    services: ['Supply Distribution', 'Logistics', 'Warehouse Management', 'Transport'],
    partnerships: ['Government Agencies', 'Private Companies', 'International NGOs']
  },
  {
    id: '4',
    name: 'Disaster Relief Foundation',
    type: 'ngo',
    status: 'pending',
    region: 'Yangon',
    city: 'Yangon',
    contactEmail: 'contact@drf.org',
    contactPhone: '+959789123456',
    volunteerCount: 15,
    activeMissions: 0,
    completedMissions: 23,
    rating: 4.5,
    establishedYear: 2021,
    description: 'Non-profit organization focused on disaster relief and community support',
    services: ['Community Support', 'Shelter Management', 'Food Distribution', 'Counseling'],
    partnerships: ['Local Communities', 'International Donors']
  },
  {
    id: '5',
    name: 'Emergency Services Department',
    type: 'government',
    status: 'active',
    region: 'Sagaing',
    city: 'Monywa',
    contactEmail: 'emergency@gov.mm',
    contactPhone: '+959321654987',
    volunteerCount: 67,
    activeMissions: 5,
    completedMissions: 234,
    rating: 4.6,
    establishedYear: 2015,
    description: 'Government agency coordinating emergency response services',
    services: ['Emergency Coordination', 'Public Safety', 'Disaster Management', 'Evacuation'],
    partnerships: ['All Response Teams', 'Military', 'Police Department']
  }
]

export default function OrganizationsPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'rescue' | 'medical' | 'supply' | 'government' | 'ngo'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.region.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || org.type === filterType
    const matchesStatus = filterStatus === 'all' || org.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'rescue': 
        return <Badge variant="default" className="bg-red-100 text-red-800">Rescue</Badge>
      case 'medical': 
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Medical</Badge>
      case 'supply': 
        return <Badge variant="default" className="bg-green-100 text-green-800">Supply</Badge>
      case 'government': 
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Government</Badge>
      case 'ngo': 
        return <Badge variant="default" className="bg-orange-100 text-orange-800">NGO</Badge>
      default: 
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const totalOrganizations = organizations.length
  const activeOrganizations = organizations.filter(o => o.status === 'active').length
  const totalVolunteers = organizations.reduce((sum, o) => sum + o.volunteerCount, 0)
  const totalMissions = organizations.reduce((sum, o) => sum + o.completedMissions, 0)
  const averageRating = (organizations.reduce((sum, o) => sum + o.rating, 0) / organizations.length).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[90rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Response Organizations
          </h1>
          <p className="text-gray-600">
            Connect with organizations providing earthquake response and relief services
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{totalOrganizations}</p>
                </div>
                <Building className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeOrganizations}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Volunteers</p>
                  <p className="text-2xl font-bold text-purple-600">{totalVolunteers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Missions</p>
                  <p className="text-2xl font-bold text-orange-600">{totalMissions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{averageRating}</p>
                </div>
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search organizations by name, description, or region..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="rescue">Rescue</option>
                  <option value="medical">Medical</option>
                  <option value="supply">Supply</option>
                  <option value="government">Government</option>
                  <option value="ngo">NGO</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization List */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="rescue">Rescue Teams</TabsTrigger>
            <TabsTrigger value="medical">Medical Teams</TabsTrigger>
            <TabsTrigger value="supply">Supply Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrganizations.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {org.description}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2">
                        {getTypeBadge(org.type)}
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{org.city}, {org.region}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{org.volunteerCount} volunteers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span>{org.completedMissions} missions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-yellow-500" />
                          <span>Rating: {org.rating}/5.0</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Services:</div>
                        <div className="flex flex-wrap gap-1">
                          {org.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Contact:</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-500" />
                            <span>{org.contactEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span>{org.contactPhone}</span>
                          </div>
                          {org.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="w-3 h-3 text-gray-500" />
                              <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Handshake className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rescue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrganizations
                .filter(o => o.type === 'rescue')
                .map((org) => (
                  <Card key={org.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{org.name}</h3>
                          <p className="text-sm text-gray-600">{org.description}</p>
                        </div>
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{org.city}, {org.region}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{org.volunteerCount} volunteers</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span>{org.completedMissions} missions completed</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-yellow-500" />
                          <span>Rating: {org.rating}/5.0</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {org.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="medical" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrganizations
                .filter(o => o.type === 'medical')
                .map((org) => (
                  <Card key={org.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{org.name}</h3>
                          <p className="text-sm text-gray-600">{org.description}</p>
                        </div>
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{org.city}, {org.region}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{org.volunteerCount} medical staff</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span>{org.completedMissions} medical missions</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-yellow-500" />
                          <span>Rating: {org.rating}/5.0</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {org.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="supply" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrganizations
                .filter(o => o.type === 'supply')
                .map((org) => (
                  <Card key={org.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{org.name}</h3>
                          <p className="text-sm text-gray-600">{org.description}</p>
                        </div>
                        <Badge className={getStatusColor(org.status)}>
                          {org.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{org.city}, {org.region}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{org.volunteerCount} logistics staff</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span>{org.completedMissions} deliveries</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-yellow-500" />
                          <span>Rating: {org.rating}/5.0</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {org.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}