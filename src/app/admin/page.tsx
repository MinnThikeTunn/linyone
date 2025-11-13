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
import { supabase } from '@/lib/supabase'

interface Organization {
  id: string
  name: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending'
  is_verified: boolean
  password: string
  role: string
  funding: string
  region: string
  created_at: string
  volunteer_count: number
}

export default function AdminPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showRegisterOrg, setShowRegisterOrg] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [newOrg, setNewOrg] = useState({
    name: '',
    email: '',
    password: '',
    region: '',
    funding: '',
    phone: '',
    address: ''
  })

  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.isAdmin) {
      window.location.href = '/'
    }
  }, [user])

  // Fetch organizations from Supabase
  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching organizations:', error)
        return
      }

      // Get volunteer counts from org_member table
      const organizationsWithVolunteers = await Promise.all(
        (data || []).map(async (org) => {
          const { count, error: countError } = await supabase
            .from('org_member')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
            .eq('status', 'active')

          if (countError) {
            console.error('Error fetching volunteer count:', countError)
            return { ...org, volunteer_count: 0 }
          }

          return { ...org, volunteer_count: count || 0 }
        })
      )

      setOrganizations(organizationsWithVolunteers)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterOrganization = async () => {
    if (!newOrg.name || !newOrg.email || !newOrg.password || !newOrg.region) {
      alert('Please fill all required fields')
      return
    }

    try {
      const organizationData = {
        name: newOrg.name,
        email: newOrg.email,
        phone: newOrg.phone || null,
        address: newOrg.address || null,
        password: newOrg.password,
        funding: newOrg.funding || '0',
        region: newOrg.region,
        status: 'pending',
        is_verified: false,
        role: 'organization'
      }

      const { data, error } = await supabase
        .from('organizations')
        .insert([organizationData])
        .select()

      if (error) {
        console.error('Error creating organization:', error)
        alert('Error creating organization: ' + error.message)
        return
      }

      if (data && data[0]) {
        setOrganizations(prev => [data[0], ...prev])
        setNewOrg({
          name: '',
          email: '',
          password: '',
          region: '',
          funding: '',
          phone: '',
          address: ''
        })
        setShowRegisterOrg(false)
        alert('Organization registered successfully!')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Error creating organization')
    }
  }

  const handleEditOrganization = (org: Organization) => {
    setEditingOrg(org)
    setNewOrg({
      name: org.name,
      email: org.email,
      password: '', // Don't show password for security
      region: org.region,
      funding: org.funding,
      phone: org.phone || '',
      address: org.address || ''
    })
    setShowRegisterOrg(true)
  }

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return

    try {
      const updateData: any = {
        name: newOrg.name,
        email: newOrg.email,
        phone: newOrg.phone || null,
        address: newOrg.address || null,
        funding: newOrg.funding,
        region: newOrg.region
      }

      // Only update password if provided
      if (newOrg.password) {
        updateData.password = newOrg.password
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', editingOrg.id)
        .select()

      if (error) {
        console.error('Error updating organization:', error)
        alert('Error updating organization: ' + error.message)
        return
      }

      if (data && data[0]) {
        setOrganizations(prev => 
          prev.map(org => org.id === editingOrg.id ? data[0] : org)
        )
        setEditingOrg(null)
        setNewOrg({
          name: '',
          email: '',
          password: '',
          region: '',
          funding: '',
          phone: '',
          address: ''
        })
        setShowRegisterOrg(false)
        alert('Organization updated successfully!')
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      alert('Error updating organization')
    }
  }

  const handleDeleteOrganization = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)

      if (error) {
        console.error('Error deleting organization:', error)
        alert('Error deleting organization: ' + error.message)
        return
      }

      setOrganizations(prev => prev.filter(org => org.id !== orgId))
      alert('Organization deleted successfully!')
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('Error deleting organization')
    }
  }

  const handleApproveOrganization = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({ 
          status: 'active',
          is_verified: true 
        })
        .eq('id', orgId)
        .select()

      if (error) {
        console.error('Error approving organization:', error)
        alert('Error approving organization: ' + error.message)
        return
      }

      if (data && data[0]) {
        setOrganizations(prev => 
          prev.map(org => org.id === orgId ? data[0] : org)
        )
        alert('Organization approved successfully!')
      }
    } catch (error) {
      console.error('Error approving organization:', error)
      alert('Error approving organization')
    }
  }

  const handleRejectOrganization = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({ status: 'inactive' })
        .eq('id', orgId)
        .select()

      if (error) {
        console.error('Error rejecting organization:', error)
        alert('Error rejecting organization: ' + error.message)
        return
      }

      if (data && data[0]) {
        setOrganizations(prev => 
          prev.map(org => org.id === orgId ? data[0] : org)
        )
        alert('Organization rejected successfully!')
      }
    } catch (error) {
      console.error('Error rejecting organization:', error)
      alert('Error rejecting organization')
    }
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
  const totalVolunteers = organizations.reduce((sum, org) => sum + org.volunteer_count, 0)
  const totalFunding = organizations.reduce((sum, org) => {
    const amount = parseInt(org.funding) || 0
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
                {loading ? (
                  <div className="text-center py-8">Loading organizations...</div>
                ) : (
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
                              <div className="text-sm text-gray-500">{org.email}</div>
                              {org.phone && (
                                <div className="text-xs text-gray-400">{org.phone}</div>
                              )}
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
                              {org.volunteer_count}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              ${parseInt(org.funding || '0').toLocaleString()}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Register Organization */}
          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-500" />
                  {editingOrg ? 'Edit Organization' : t('admin.registerOrg')}
                </CardTitle>
                <CardDescription>
                  {editingOrg ? 'Update organization details' : 'Add a new organization to the platform'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="org-name">Organization Name *</Label>
                      <Input
                        id="org-name"
                        value={newOrg.name}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter organization name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-email">Email *</Label>
                      <Input
                        id="org-email"
                        type="email"
                        value={newOrg.email}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-password">
                        {editingOrg ? 'New Password (leave blank to keep current)' : 'Password *'}
                      </Label>
                      <Input
                        id="org-password"
                        type="password"
                        value={newOrg.password}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, password: e.target.value }))}
                        placeholder={editingOrg ? "Enter new password" : "Enter password"}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-region">Region *</Label>
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
                      <Label htmlFor="org-funding">Funding</Label>
                      <Input
                        id="org-funding"
                        value={newOrg.funding}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, funding: e.target.value }))}
                        placeholder="Enter funding amount"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-phone">Phone</Label>
                      <Input
                        id="org-phone"
                        value={newOrg.phone}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="org-address">Address</Label>
                      <Input
                        id="org-address"
                        value={newOrg.address}
                        onChange={(e) => setNewOrg(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter address"
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
                          email: '',
                          password: '',
                          region: '',
                          funding: '',
                          phone: '',
                          address: ''
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