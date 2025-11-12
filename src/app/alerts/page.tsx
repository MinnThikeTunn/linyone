'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Shield, 
  Navigation,
  MapPin,
  Clock,
  Bell,
  Droplets,
  Wind
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import Link from 'next/link'

interface AlertItem {
  id: string
  type: 'earthquake' | 'flood' | 'cyclone'
  title: string
  description: string
  timestamp: Date
  severity: 'high' | 'medium' | 'low'
  location?: string
  actionUrl?: string
  actionLabel?: string
}

const mockAlerts: AlertItem[] = [
  {
    id: '1',
    type: 'earthquake',
    title: 'Earthquake Alert',
    description: 'Magnitude 4.5 detected near Yangon. Please stay alert and follow safety protocols.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    severity: 'high',
    location: 'Yangon, Myanmar',
    actionUrl: '/',
    actionLabel: 'View on Map'
  },
  {
    id: '2',
    type: 'earthquake',
    title: 'Earthquake Warning',
    description: 'Magnitude 3.2 detected in Mandalay region. Minor shaking expected.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    severity: 'medium',
    location: 'Mandalay, Myanmar',
    actionUrl: '/',
    actionLabel: 'View on Map'
  },
  {
    id: '3',
    type: 'flood',
    title: 'Flood Warning',
    description: 'Heavy rainfall causing rising water levels in low-lying areas. Evacuation recommended.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    severity: 'high',
    location: 'Sagaing Region, Myanmar',
    actionUrl: '/',
    actionLabel: 'View on Map'
  },
  {
    id: '4',
    type: 'flood',
    title: 'Flood Alert',
    description: 'River levels rising. Residents near riverbanks should prepare for potential flooding.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    severity: 'medium',
    location: 'Ayeyarwady Region, Myanmar',
    actionUrl: '/',
    actionLabel: 'View on Map'
  },
  {
    id: '5',
    type: 'cyclone',
    title: 'Cyclone Warning',
    description: 'Tropical cyclone approaching coastal areas. Strong winds and heavy rain expected.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    severity: 'high',
    location: 'Rakhine Coast, Myanmar',
    actionUrl: '/',
    actionLabel: 'View on Map'
  },
  {
    id: '6',
    type: 'cyclone',
    title: 'Cyclone Alert',
    description: 'Cyclone system developing in Bay of Bengal. Monitor weather updates closely.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    severity: 'medium',
    location: 'Coastal Areas, Myanmar',
    actionUrl: '/',
    actionLabel: 'View on Map'
  }
]

export default function AlertsPage() {
  const { t } = useLanguage()
  const [alerts] = useState<AlertItem[]>(mockAlerts)

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'earthquake':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'flood':
        return <Droplets className="h-5 w-5 text-blue-500" />
      case 'cyclone':
        return <Wind className="h-5 w-5 text-purple-500" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getDisasterTypeColor = (type: string) => {
    switch (type) {
      case 'earthquake':
        return 'border-orange-500 bg-orange-50'
      case 'flood':
        return 'border-blue-500 bg-blue-50'
      case 'cyclone':
        return 'border-purple-500 bg-purple-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    } else {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    }
  }

  const highSeverityAlerts = alerts.filter(a => a.severity === 'high')
  const mediumSeverityAlerts = alerts.filter(a => a.severity === 'medium')
  const lowSeverityAlerts = alerts.filter(a => a.severity === 'low')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recent Alerts
          </h1>
          <p className="text-gray-600">
            Stay informed about earthquake, flood, and cyclone alerts and emergency information
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{highSeverityAlerts.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Medium Priority</p>
                  <p className="text-2xl font-bold text-yellow-600">{mediumSeverityAlerts.length}</p>
                </div>
                <Shield className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                  <p className="text-2xl font-bold text-blue-600">{alerts.length}</p>
                </div>
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Three Column Alerts Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Earthquake Column */}
          <div className="space-y-4">
            <Card className="border-t-4 border-t-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Earthquake
                </CardTitle>
                <CardDescription>
                  {alerts.filter(a => a.type === 'earthquake').length} active alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter(a => a.type === 'earthquake').length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No earthquake alerts
                  </div>
                ) : (
                  alerts.filter(a => a.type === 'earthquake').map((alert) => (
                    <Card key={alert.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-sm">{alert.title}</h4>
                              <Badge className={`${getSeverityColor(alert.severity)} text-xs`}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(alert.timestamp)}</span>
                              </div>
                              {alert.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{alert.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {alert.actionUrl && alert.actionLabel && (
                            <Button size="sm" variant="outline" className="shrink-0" asChild>
                              <Link href={alert.actionUrl}>
                                <Navigation className="w-3 h-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Flood Column */}
          <div className="space-y-4">
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Flood
                </CardTitle>
                <CardDescription>
                  {alerts.filter(a => a.type === 'flood').length} active alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter(a => a.type === 'flood').length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No flood alerts
                  </div>
                ) : (
                  alerts.filter(a => a.type === 'flood').map((alert) => (
                    <Card key={alert.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-sm">{alert.title}</h4>
                              <Badge className={`${getSeverityColor(alert.severity)} text-xs`}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(alert.timestamp)}</span>
                              </div>
                              {alert.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{alert.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {alert.actionUrl && alert.actionLabel && (
                            <Button size="sm" variant="outline" className="shrink-0" asChild>
                              <Link href={alert.actionUrl}>
                                <Navigation className="w-3 h-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cyclone Column */}
          <div className="space-y-4">
            <Card className="border-t-4 border-t-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wind className="w-5 h-5 text-purple-500" />
                  Cyclone
                </CardTitle>
                <CardDescription>
                  {alerts.filter(a => a.type === 'cyclone').length} active alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter(a => a.type === 'cyclone').length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No cyclone alerts
                  </div>
                ) : (
                  alerts.filter(a => a.type === 'cyclone').map((alert) => (
                    <Card key={alert.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-sm">{alert.title}</h4>
                              <Badge className={`${getSeverityColor(alert.severity)} text-xs`}>
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{alert.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(alert.timestamp)}</span>
                              </div>
                              {alert.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{alert.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {alert.actionUrl && alert.actionLabel && (
                            <Button size="sm" variant="outline" className="shrink-0" asChild>
                              <Link href={alert.actionUrl}>
                                <Navigation className="w-3 h-3" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

