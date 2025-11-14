'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  Plus, 
  AlertTriangle, 
  Shield, 
  Users, 
  Building,
  Navigation,
  Upload,
  X,
  Check,
  Clock,
  Eye,
  Lock
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useAuth } from '@/hooks/use-auth'

// Add Mapbox GL JS
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiZWlteWF0bW9uIiwiYSI6ImNtaHM3c2JtODBxbHMycnI4dTljeTBhOGMifQ.hvR26kiNlnorTCJ1hdN5nQ'

interface Pin {
  id: string
  type: 'damaged' | 'safe'
  status: 'pending' | 'confirmed' | 'completed'
  title: string
  description: string
  lat: number
  lng: number
  createdBy: string
  createdAt: Date
  image?: string
  assignedTo?: string
}

// Define User interface to match useAuth hook
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'tracking_volunteer' | 'supply_volunteer' | 'user' // Add role property
}

// Mock data for demonstration
const mockPins: Pin[] = [
  {
    id: '1',
    type: 'damaged',
    status: 'confirmed',
    title: 'Building Collapse',
    description: 'Multi-story building collapsed, need immediate rescue',
    lat: 16.8409,
    lng: 96.1735,
    createdBy: 'Volunteer Team A',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assignedTo: 'Rescue Team B'
  },
  {
    id: '2',
    type: 'safe',
    status: 'confirmed',
    title: 'Emergency Shelter',
    description: 'School gym converted to emergency shelter',
    lat: 16.8509,
    lng: 96.1835,
    createdBy: 'City Authority',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: '3',
    type: 'damaged',
    status: 'pending',
    title: 'Road Damage',
    description: 'Major road blocked by fallen trees',
    lat: 16.8309,
    lng: 96.1635,
    createdBy: 'Anonymous User',
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  }
]

export default function HomePage() {
  const { t, language } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  const [pins, setPins] = useState<Pin[]>(mockPins)
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pinType, setPinType] = useState<'damaged' | 'safe'>('damaged')
  const [pinTitle, setPinTitle] = useState('')
  const [pinDescription, setPinDescription] = useState('')
  const [pinImage, setPinImage] = useState<File | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 16.8409, lng: 96.1735 })
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isSelectingLocation, setIsSelectingLocation] = useState(false)
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  // Mapbox map reference
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const tempMarker = useRef<mapboxgl.Marker | null>(null)

  // Type-safe user role check
  const userRole = (user as User)?.role

  // Move filteredPins declaration here, before the useEffect that uses it
  const filteredPins = pins.filter(pin => {
    if (userRole === 'supply_volunteer') {
      return pin.status === 'confirmed' && pin.type === 'damaged'
    }
    return true
  })

  useEffect(() => {
    // Initialize Mapbox map
    if (!map.current && mapContainer.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [mapCenter.lng, mapCenter.lat],
          zoom: 12
        })

        // Add navigation control
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
        
        // Handle map load
        map.current.on('load', () => {
          setMapLoading(false)
          
          // Get user's current location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const location = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                }
                setUserLocation(location)
                setMapCenter(location)
                
                // Update map center
                if (map.current) {
                  map.current.flyTo({
                    center: [location.lng, location.lat],
                    zoom: 14
                  })
                  
                  // Add user location marker
                  userMarker.current = new mapboxgl.Marker({
                    color: '#3B82F6'
                  })
                  .setLngLat([location.lng, location.lat])
                  .addTo(map.current!)
                }
              },
              (error) => {
                console.error('Error getting location:', error)
              }
            )
          }
        })
        
        // Handle map click for selecting new pin location
        map.current.on('click', (e) => {
          if (isSelectingLocation) {
            const { lng, lat } = e.lngLat
            setNewPinLocation({ lat, lng })
            
            // Remove previous temp marker
            if (tempMarker.current) {
              tempMarker.current.remove()
            }
            
            // Add temp marker
            tempMarker.current = new mapboxgl.Marker({
              color: '#9333EA'
            })
            .setLngLat([lng, lat])
            .addTo(map.current!)
          }
        })
        
        // Handle map error
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e)
          setMapError('Failed to load map. Please try again later.')
          setMapLoading(false)
        })
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          if (map.current) {
            map.current.resize()
          }
        })
        
        if (mapContainer.current) {
          resizeObserver.observe(mapContainer.current)
        }
        
        return () => {
          resizeObserver.disconnect()
        }
      } catch (error) {
        console.error('Error initializing map:', error)
        setMapError('Failed to initialize map. Please try again later.')
        setMapLoading(false)
      }
    }

    return () => {
      // Clean up map on unmount
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when pins change
  useEffect(() => {
    if (!map.current || mapLoading) return

    // Remove all existing markers
    Object.values(markers.current).forEach(marker => marker.remove())
    markers.current = {}

    // Add markers for each pin
    filteredPins.forEach(pin => {
      // Create marker element
      const el = document.createElement('div')
      el.className = 'cursor-pointer'
      
      // Create marker based on pin type
      const markerDiv = document.createElement('div')
      markerDiv.className = `w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
        pin.type === 'damaged' ? 'bg-red-500' : 'bg-green-500'
      }`
      
      // Add icon
      const icon = document.createElement('div')
      if (pin.type === 'damaged') {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
      } else {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
      }
      markerDiv.appendChild(icon)
      
      // Add status indicator
      const statusDiv = document.createElement('div')
      statusDiv.className = `absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${
        pin.status === 'pending' ? 'bg-yellow-400' :
        pin.status === 'confirmed' ? 'bg-green-400' : 'bg-blue-400'
      }`
      
      el.appendChild(markerDiv)
      el.appendChild(statusDiv)
      
      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div class="p-2">
          <div class="font-semibold">${pin.title}</div>
          <div class="text-sm text-gray-600">${pin.description}</div>
          <div class="mt-1">
            <span class="text-xs px-2 py-1 rounded-full ${
              pin.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              pin.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }">${pin.status}</span>
          </div>
        </div>
      `)
      
      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(map.current!)
      
      // Add click event
      el.addEventListener('click', () => {
        setSelectedPin(pin)
      })
      
      // Store marker reference
      markers.current[pin.id] = marker
    })
  }, [filteredPins, mapLoading])

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
          setMapCenter(location)
          
          // Update map center
          if (map.current) {
            map.current.flyTo({
              center: [location.lng, location.lat],
              zoom: 14
            })
            
            // Update user marker
            if (userMarker.current) {
              userMarker.current.setLngLat([location.lng, location.lat])
            } else {
              userMarker.current = new mapboxgl.Marker({
                color: '#3B82F6'
              })
              .setLngLat([location.lng, location.lat])
              .addTo(map.current!)
            }
          }
          
          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsGettingLocation(false)
        }
      )
    }
  }

  const handleCreatePin = () => {
    if (!pinTitle || !pinDescription) return

    // Use selected location or map center
    const location = newPinLocation || mapCenter

    const newPin: Pin = {
      id: Date.now().toString(),
      type: pinType,
      status: userRole === 'tracking_volunteer' ? 'confirmed' : 'pending',
      title: pinTitle,
      description: pinDescription,
      lat: location.lat,
      lng: location.lng,
      createdBy: user?.name || 'Anonymous User',
      createdAt: new Date(),
      image: pinImage ? URL.createObjectURL(pinImage) : undefined
    }

    setPins([newPin, ...pins])
    setPinTitle('')
    setPinDescription('')
    setPinImage(null)
    setShowPinDialog(false)
    setNewPinLocation(null)
    setIsSelectingLocation(false)
    
    // Remove temp marker
    if (tempMarker.current) {
      tempMarker.current.remove()
      tempMarker.current = null
    }
    
    // Fly to new pin location
    if (map.current) {
      map.current.flyTo({
        center: [newPin.lng, newPin.lat],
        zoom: 14
      })
    }
  }

  const handleConfirmPin = (pinId: string) => {
    setPins(pins.map(pin => 
      pin.id === pinId ? { ...pin, status: 'confirmed' } : pin
    ))
  }

  const handleDenyPin = (pinId: string) => {
    setPins(pins.filter(pin => pin.id !== pinId))
  }

  const handleMarkCompleted = (pinId: string) => {
    setPins(pins.map(pin => 
      pin.id === pinId ? { ...pin, status: 'completed' } : pin
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />
      case 'confirmed': return <Check className="w-3 h-3" />
      case 'completed': return <Shield className="w-3 h-3" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('map.title')}</h1>
              <p className="text-gray-600">{t('map.subtitle')}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                {t('map.currentLocation')}
              </Button>
              
              <Dialog open={showPinDialog} onOpenChange={(open) => {
                setShowPinDialog(open)
                if (!open) {
                  setNewPinLocation(null)
                  setIsSelectingLocation(false)
                  if (tempMarker.current) {
                    tempMarker.current.remove()
                    tempMarker.current = null
                  }
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t('map.addPin')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('map.addPin')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t('map.damagedLocation')} / {t('map.safeZone')}</Label>
                      <Select value={pinType} onValueChange={(value: 'damaged' | 'safe') => setPinType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="damaged">{t('map.damagedLocation')}</SelectItem>
                          <SelectItem value="safe">{t('map.safeZone')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="pin-title">Title</Label>
                      <Input
                        id="pin-title"
                        value={pinTitle}
                        onChange={(e) => setPinTitle(e.target.value)}
                        placeholder="Enter title..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pin-description">{t('map.description')}</Label>
                      <Textarea
                        id="pin-description"
                        value={pinDescription}
                        onChange={(e) => setPinDescription(e.target.value)}
                        placeholder="Describe the situation..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="pin-image">{t('map.uploadImage')}</Label>
                      <Input
                        id="pin-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPinImage(e.target.files?.[0] || null)}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsSelectingLocation(true)
                          setShowPinDialog(false)
                        }}
                        className="flex-1"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {newPinLocation ? 'Change Location' : 'Select on Map'}
                      </Button>
                    </div>
                    
                    {newPinLocation && (
                      <div className="text-sm text-gray-600">
                        Selected location: {newPinLocation.lat.toFixed(6)}, {newPinLocation.lng.toFixed(6)}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button onClick={handleCreatePin} className="flex-1">
                        {t('map.submit')}
                      </Button>
                      <Button variant="outline" onClick={() => setShowPinDialog(false)}>
                        {t('map.cancel')}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full relative">
                {/* Mapbox Map */}
                <div ref={mapContainer} className="h-full w-full rounded-lg overflow-hidden" />
                
                {/* Map Loading State */}
                {mapLoading && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
                
                {/* Map Error State */}
                {mapError && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center max-w-md p-4">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600">{mapError}</p>
                      <Button 
                        onClick={() => window.location.reload()} 
                        className="mt-4"
                      >
                        Reload Page
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Location Selection Indicator */}
                {isSelectingLocation && (
                  <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <p className="text-sm">Click on the map to select a location for your pin</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setIsSelectingLocation(false)
                        setShowPinDialog(true)
                      }}
                      className="mt-2 w-full"
                    >
                      {t('map.done')}
                    </Button>
                  </div>
                )}
                
                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
                  <h3 className="text-sm font-semibold mb-2">{t('map.legend')}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-red-500 rounded-full" />
                      <span>{t('map.damagedLocation')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 bg-green-500 rounded-full" />
                      <span>{t('map.safeZone')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      <span>{t('map.pending')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                      <span>{t('map.confirmed')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      <span>{t('map.completed')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('map.quickStats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {pins.filter(p => p.type === 'damaged').length}
                    </div>
                    <div className="text-sm text-gray-600">{t('map.damagedAreas')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {pins.filter(p => p.type === 'safe').length}
                    </div>
                    <div className="text-sm text-gray-600">{t('map.safeZones')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Pins */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('map.recentReports')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPins.slice(0, 5).map((pin) => (
                    <div
                      key={pin.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setSelectedPin(pin)
                        // Fly to pin location on map
                        if (map.current) {
                          map.current.flyTo({
                            center: [pin.lng, pin.lat],
                            zoom: 15
                          })
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {pin.type === 'damaged' ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <Shield className="w-4 h-4 text-green-500" />
                            )}
                            <span className="font-medium text-sm">{pin.title}</span>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{pin.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs ${getStatusColor(pin.status)}`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(pin.status)}
                                <span>{t(`map.${pin.status}`)}</span>
                              </div>
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {pin.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons for volunteers */}
                      {userRole === 'tracking_volunteer' && pin.status === 'pending' && (
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmPin(pin.id)
                          }} className="flex-1">
                            <Check className="w-3 h-3 mr-1" />
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => {
                            e.stopPropagation()
                            handleDenyPin(pin.id)
                          }} className="flex-1">
                            <X className="w-3 h-3 mr-1" />
                            Deny
                          </Button>
                        </div>
                      )}
                      
                      {userRole === 'supply_volunteer' && pin.status === 'confirmed' && pin.type === 'damaged' && (
                        <Button size="sm" onClick={(e) => {
                          e.stopPropagation()
                          handleMarkCompleted(pin.id)
                        }} className="w-full mt-2">
                          <Check className="w-3 h-3 mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Kit Reminder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Emergency Kit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Remember to check your emergency kit regularly. Ensure you have water, food, flashlight, and first aid supplies.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pin Detail Dialog */}
      {selectedPin && (
        <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedPin.type === 'damaged' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <Shield className="w-5 h-5 text-green-500" />
                )}
                {selectedPin.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Badge className={`${getStatusColor(selectedPin.status)}`}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedPin.status)}
                    <span>{t(`map.${selectedPin.status}`)}</span>
                  </div>
                </Badge>
              </div>
              
              <p className="text-gray-700">{selectedPin.description}</p>
              
              {selectedPin.image && (
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={selectedPin.image} 
                    alt={selectedPin.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="text-sm text-gray-500 space-y-1">
                <div>Reported by: {selectedPin.createdBy}</div>
                <div>Time: {selectedPin.createdAt.toLocaleString()}</div>
                {selectedPin.assignedTo && (
                  <div>Assigned to: {selectedPin.assignedTo}</div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                {userRole === 'tracking_volunteer' && selectedPin.status === 'pending' && (
                  <>
                    <Button onClick={() => handleConfirmPin(selectedPin.id)} className="flex-1">
                      <Check className="w-4 h-4 mr-2" />
                      Confirm
                    </Button>
                    <Button variant="outline" onClick={() => handleDenyPin(selectedPin.id)} className="flex-1">
                      <X className="w-4 h-4 mr-2" />
                      Deny
                    </Button>
                  </>
                )}
                
                {userRole === 'supply_volunteer' && selectedPin.status === 'confirmed' && selectedPin.type === 'damaged' && (
                  <Button onClick={() => handleMarkCompleted(selectedPin.id)} className="w-full">
                    <Check className="w-4 h-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}