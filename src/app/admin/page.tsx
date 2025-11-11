'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Building, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Shield, 
  MapPin,
  DollarSign,
  TrendingUp,
  Settings,
  Clock
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

interface Organization {
  id: string
  name: string
  username: string
  password: string
  region: string
  funding: string
  volunteerCount: number
  status: 'active' | 'inactive' | 'pending'
  createdAt: Date
  contactEmail: string
  contactPhone: string
}

// Mock data
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Rescue Team A',
    username: 'orgA',
    password: 'org123',
    region: 'Yangon',
    funding: '$50,000',
    volunteerCount: 45,
    status: 'active',
    createdAt: new Date('2024-01-15'),
    contactEmail: 'contact@rescueba.com',
    contactPhone: '+959123456789'
  },
  {
    id: '2',
    name: 'Medical Response B',
    username: 'orgB',
    password: 'orgB123',
    region: 'Mandalay',
    funding: '$75,000',
    volunteerCount: 32,
    status: 'active',
    createdAt: new Date('2024-02-20'),
    contactEmail: 'info@medicalb.org',
    contactPhone: '+959987654321'
  },
  {
    id: '3',
    name: 'Supply Chain C',
    username: 'orgC',
    password: 'orgC123',
    region: 'Naypyidaw',
    funding: '$100,000',
    volunteerCount: 28,
    status: 'pending',
    createdAt: new Date('2024-03-10'),
    contactEmail: 'admin@supplyc.org',
    contactPhone: '+959456789123'
  }
]

export default function AdminPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations)
  const [showRegisterOrg, setShowRegisterOrg] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [newOrg, setNewOrg] = useState({
    name: '',
    username: '',
    password: '',
    region: '',
    funding: '',
    contactEmail: '',
    contactPhone: ''
  })

  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.isAdmin) {
      window.location.href = '/'
    }
  }, [user])

  const handleRegisterOrganization = () => {
    if (!newOrg.name || !newOrg.username || !newOrg.password || !newOrg.region) {
      alert('Please fill all required fields')
      return
    }

    const organization: Organization = {
      id: Date.now().toString(),
      name: newOrg.name,
      username: newOrg.username,
      password: newOrg.password,
      region: newOrg.region,
      funding: newOrg.funding || '$0',
      volunteerCount: 0,
      status: 'pending',
      createdAt: new Date(),
      contactEmail: newOrg.contactEmail,
      contactPhone: newOrg.contactPhone
    }

    setOrganizations([...organizations, organization])
    setNewOrg({
      name: '',
      username: '',
      password: '',
      region: '',
      funding: '',
      contactEmail: '',
      contactPhone: ''
    })
    setShowRegisterOrg(false)
  }

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org)
    setNewOrg({
      name: org.name,
      username: org.username,
      password: org.password,
      region: org.region,
      funding: org.funding,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone
    })
    setShowRegisterOrg(true)
  }

  const handleUpdateOrganization = () => {
    if (!editingOrg) return

    setOrganizations(organizations.map(org => 
      org.id === editingOrg.id 
        ? { ...org, ...newOrg }
        : org
    ))

    setEditingOrg(null)
    setNewOrg({
      name: '',
      username: '',
      password: '',
      region: '',
      funding: '',
      contactEmail: '',
      contactPhone: ''
    })
    setShowRegisterOrg(false)
  }

  const handleDeleteOrganization = (orgId: string) => {
    if (confirm('Are you sure you want to delete this organization?')) {
      setOrganizations(organizations.filter(org => org.id !== orgId))
    }
  }

  const handleApproveOrganization = (orgId: string) => {
    setOrganizations(organizations.map(org => 
      org.id === orgId ? { ...org, status: 'active' } : org
    ))
  }

  const handleRejectOrganization = (orgId: string) => {
    setOrganizations(organizations.map(org => 
      org.id === orgId ? { ...org, status: 'inactive' } : org
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const activeOrganizations = organizations.filter(org => org.status === 'active').length
  const pendingOrganizations = organizations.filter(org => org.status === 'pending').length
  const totalVolunteers = organizations.reduce((sum, org) => sum + org.volunteerCount, 0)
  const totalFunding = organizations.reduce((sum, org) => {
    const amount = parseInt(org.funding.replace(/[^0-9]/g, ''))
    return sum + amount
  }, 0)

  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required.
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
            {t('admin.title')}
          </h1>
          <p className="text-gray-600">Manage organizations and monitor platform activity</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Organizations</p>
                  <p className="text-2xl font-bold text-green-600">{activeOrganizations}</p>
                </div>
                <Building className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingOrganizations}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volunteers</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Funding</p>
                  <p className="text-2xl font-bold text-purple-600">${totalFunding.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              {t('admin.manageOrgs')}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('admin.registerOrg')}
            </TabsTrigger>
          </TabsList>

          {/* Organizations Management */}
          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-500" />
                      {t('admin.manageOrgs')}
                    </CardTitle>
                    <CardDescription>
                      View and manage all registered organizations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Volunteers</TableHead>
                      <TableHead>Funding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-gray-500">@{org.username}</div>
                            <div className="text-xs text-gray-400">{org.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {org.region}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            {org.volunteerCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            {org.funding}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(org.status)}>
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {org.status === 'pending' && (
                              <>
                                <Button size="sm" onClick={() => handleApproveOrganization(org.id)}>
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectOrganization(org.id)}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleEditOrganization(org)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteOrganization(org.id)}>
                              <Trash2 className="w-3 h-3" />
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

          {/* Register Organization */}
          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-500" />
                  {t('admin.registerOrg')}
                </CardTitle>
                <CardDescription>
                  Add a new organization to the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="org-name">{t('admin.orgName')} *</Label>
                      <Input
                        id="org-name"
                        value={newOrg.name}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter organization name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-username">{t('admin.orgUsername')} *</Label>
                      <Input
                        id="org-username"
                        value={newOrg.username}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-password">{t('admin.orgPassword')} *</Label>
                      <Input
                        id="org-password"
                        type="password"
                        value={newOrg.password}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-region">{t('admin.orgRegion')} *</Label>
                      <Select value={newOrg.region} onValueChange={(value) => setNewOrg(prev => ({ ...prev, region: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yangon">Yangon</SelectItem>
                          <SelectItem value="Mandalay">Mandalay</SelectItem>
                          <SelectItem value="Naypyidaw">Naypyidaw</SelectItem>
                          <SelectItem value="Sagaing">Sagaing</SelectItem>
                          <SelectItem value="Bago">Bago</SelectItem>
                          <SelectItem value="Magway">Magway</SelectItem>
                          <SelectItem value="Tanintharyi">Tanintharyi</SelectItem>
                          <SelectItem value="Ayeyarwady">Ayeyarwady</SelectItem>
                          <SelectItem value="Kachin">Kachin</SelectItem>
                          <SelectItem value="Kayah">Kayah</SelectItem>
                          <SelectItem value="Kayin">Kayin</SelectItem>
                          <SelectItem value="Chin">Chin</SelectItem>
                          <SelectItem value="Mon">Mon</SelectItem>
                          <SelectItem value="Rakhine">Rakhine</SelectItem>
                          <SelectItem value="Shan">Shan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="org-funding">{t('admin.orgFunding')}</Label>
                      <Input
                        id="org-funding"
                        value={newOrg.funding}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, funding: e.target.value }))}
                        placeholder="Enter funding amount"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-email">Contact Email</Label>
                      <Input
                        id="org-email"
                        type="email"
                        value={newOrg.contactEmail}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="Enter contact email"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-phone">Contact Phone</Label>
                      <Input
                        id="org-phone"
                        value={newOrg.contactPhone}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="Enter contact phone"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  {editingOrg ? (
                    <>
                      <Button onClick={handleUpdateOrganization}>
                        <Edit className="w-4 h-4 mr-2" />
                        Update Organization
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setEditingOrg(null)
                        setNewOrg({
                          name: '',
                          username: '',
                          password: '',
                          region: '',
                          funding: '',
                          contactEmail: '',
                          contactPhone: ''
                        })
                      }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleRegisterOrganization}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('admin.registerOrg')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}