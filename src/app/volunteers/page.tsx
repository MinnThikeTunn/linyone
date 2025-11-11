'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users, 
  Shield, 
  MapPin, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

interface Volunteer {
  id: string
  name: string
  email: string
  phone: string
  role: 'tracking_volunteer' | 'supply_volunteer'
  status: 'active' | 'inactive' | 'on_mission'
  location: string
  joinedAt: Date
  missionsCompleted: number
  hoursContributed: number
  rating: number
  skills: string[]
  organization?: string
}

const mockVolunteers: Volunteer[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+959123456789',
    role: 'tracking_volunteer',
    status: 'active',
    location: 'Yangon',
    joinedAt: new Date('2024-01-15'),
    missionsCompleted: 15,
    hoursContributed: 120,
    rating: 4.8,
    skills: ['First Aid', 'Navigation', 'Communication'],
    organization: 'Rescue Team A'
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+959987654321',
    role: 'supply_volunteer',
    status: 'on_mission',
    location: 'Mandalay',
    joinedAt: new Date('2024-02-20'),
    missionsCompleted: 8,
    hoursContributed: 85,
    rating: 4.9,
    skills: ['Logistics', 'Driving', 'Heavy Equipment'],
    organization: 'Supply Chain C'
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    phone: '+959456789123',
    role: 'tracking_volunteer',
    status: 'active',
    location: 'Naypyidaw',
    joinedAt: new Date('2024-03-10'),
    missionsCompleted: 3,
    hoursContributed: 25,
    rating: 4.5,
    skills: ['Search & Rescue', 'Medical Training'],
    organization: 'Medical Response B'
  },
  {
    id: '4',
    name: 'Alice Chen',
    email: 'alice.chen@example.com',
    phone: '+959789123456',
    role: 'supply_volunteer',
    status: 'active',
    location: 'Yangon',
    joinedAt: new Date('2024-01-25'),
    missionsCompleted: 12,
    hoursContributed: 95,
    rating: 4.7,
    skills: ['Supply Management', 'Coordination', 'Language Support'],
    organization: 'Rescue Team A'
  },
  {
    id: '5',
    name: 'David Kumar',
    email: 'david.kumar@example.com',
    phone: '+959321654987',
    role: 'tracking_volunteer',
    status: 'inactive',
    location: 'Mandalay',
    joinedAt: new Date('2023-12-10'),
    missionsCompleted: 20,
    hoursContributed: 150,
    rating: 4.9,
    skills: ['Leadership', 'Emergency Response', 'Training'],
    organization: 'Medical Response B'
  }
]

export default function VolunteersPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [volunteers, setVolunteers] = useState<Volunteer[]>(mockVolunteers)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'tracking_volunteer' | 'supply_volunteer'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'on_mission'>('all')

  const filteredVolunteers = volunteers.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         volunteer.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || volunteer.role === filterRole
    const matchesStatus = filterStatus === 'all' || volunteer.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'on_mission': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />
      case 'on_mission': return <Clock className="w-3 h-3" />
      case 'inactive': return <AlertTriangle className="w-3 h-3" />
      default: return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tracking_volunteer': 
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Tracking</Badge>
      case 'supply_volunteer': 
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Supply</Badge>
      default: 
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const totalVolunteers = volunteers.length
  const activeVolunteers = volunteers.filter(v => v.status === 'active').length
  const onMissionVolunteers = volunteers.filter(v => v.status === 'on_mission').length
  const totalMissions = volunteers.reduce((sum, v) => sum + v.missionsCompleted, 0)
  const totalHours = volunteers.reduce((sum, v) => sum + v.hoursContributed, 0)
  const averageRating = (volunteers.reduce((sum, v) => sum + v.rating, 0) / volunteers.length).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[90rem] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Volunteer Network
          </h1>
          <p className="text-gray-600">
            View and connect with volunteers across the earthquake response network
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{totalVolunteers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeVolunteers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Mission</p>
                  <p className="text-2xl font-bold text-blue-600">{onMissionVolunteers}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Missions</p>
                  <p className="text-2xl font-bold text-purple-600">{totalMissions}</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
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
                <TrendingUp className="w-8 h-8 text-yellow-600" />
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
                    placeholder="Search volunteers by name, email, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="tracking_volunteer">Tracking Volunteers</option>
                  <option value="supply_volunteer">Supply Volunteers</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_mission">On Mission</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volunteer List */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="tracking">Tracking Volunteers</TabsTrigger>
            <TabsTrigger value="supply">Supply Volunteers</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  All Volunteers ({filteredVolunteers.length})
                </CardTitle>
                <CardDescription>
                  Comprehensive view of all volunteers in the network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Missions</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.map((volunteer) => (
                      <TableRow key={volunteer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{volunteer.name}</div>
                            <div className="text-sm text-gray-500">{volunteer.email}</div>
                            <div className="text-xs text-gray-400">{volunteer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(volunteer.role)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {volunteer.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{volunteer.organization}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-gray-500" />
                            {volunteer.missionsCompleted}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            {volunteer.hoursContributed}h
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">{volunteer.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(volunteer.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(volunteer.status)}
                              <span className="capitalize">{volunteer.status.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVolunteers
                .filter(v => v.role === 'tracking_volunteer')
                .map((volunteer) => (
                  <Card key={volunteer.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{volunteer.name}</h3>
                          <p className="text-sm text-gray-600">{volunteer.email}</p>
                        </div>
                        <Badge className={getStatusColor(volunteer.status)}>
                          {volunteer.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{volunteer.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-gray-500" />
                          <span>{volunteer.missionsCompleted} missions</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{volunteer.hoursContributed} hours</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-yellow-500" />
                          <span>Rating: {volunteer.rating}/5.0</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {volunteer.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
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
              {filteredVolunteers
                .filter(v => v.role === 'supply_volunteer')
                .map((volunteer) => (
                  <Card key={volunteer.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{volunteer.name}</h3>
                          <p className="text-sm text-gray-600">{volunteer.email}</p>
                        </div>
                        <Badge className={getStatusColor(volunteer.status)}>
                          {volunteer.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{volunteer.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-gray-500" />
                          <span>{volunteer.missionsCompleted} deliveries</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{volunteer.hoursContributed} hours</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-yellow-500" />
                          <span>Rating: {volunteer.rating}/5.0</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-3">
                          {volunteer.skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
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