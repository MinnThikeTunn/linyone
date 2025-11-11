'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Shield, 
  Heart, 
  Navigation,
  MapPin,
  Clock,
  Bell
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import Link from 'next/link'

interface AlertItem {
  id: string
  type: 'earthquake' | 'safety' | 'family' | 'emergency'
  title: string
  description: string
  timestamp: Date
  severity: 'high' | 'medium' | 'low'
  location?: string
  actionUrl?: string
  actionLabel?: string
}

// No mock data: we'll fetch from USGS and subscribe to realtime socket events

export default function AlertsPage() {
  const { t } = useLanguage()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const socketRef = useRef<any>(null)

  // Myanmar bounding box for USGS queries
  const BOUNDS = {
    minlatitude: 9.5,
    maxlatitude: 28.6,
    minlongitude: 92.2,
    maxlongitude: 101.2,
  }

  // Map USGS feature -> AlertItem
  const mapFeatureToAlert = (feature: any): AlertItem => {
    const id = feature.id
    const mag = feature.properties?.mag
    const place = feature.properties?.place || 'Unknown location'
    const time = feature.properties?.time ? new Date(feature.properties.time) : new Date()
    const severity: AlertItem['severity'] = mag >= 5 ? 'high' : (mag >= 4 ? 'medium' : 'low')
    return {
      id,
      type: 'earthquake',
      title: `M ${mag} — ${place}`,
      description: feature.properties?.title || `${mag} earthquake at ${place}`,
      timestamp: time,
      severity,
      location: place,
      actionUrl: feature.properties?.url,
      actionLabel: 'More info'
    }
  }

  // Fetch initial latest 10 earthquakes from USGS for Myanmar
  useEffect(() => {
    let mounted = true
    const fetchInitial = async () => {
      try {
        const params = new URLSearchParams({
          format: 'geojson',
          orderby: 'time',
          limit: '10',
          starttime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // last 7 days
          endtime: new Date().toISOString(),
          minlatitude: String(BOUNDS.minlatitude),
          maxlatitude: String(BOUNDS.maxlatitude),
          minlongitude: String(BOUNDS.minlongitude),
          maxlongitude: String(BOUNDS.maxlongitude),
        })
        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        const items = (data.features || []).map(mapFeatureToAlert)
        setAlerts(items.slice(0, 10))
      } catch (err) {
        console.error('Failed to fetch USGS data', err)
      }
    }

    fetchInitial()

    return () => { mounted = false }
  }, [])

  // Subscribe to Ably realtime channel 'earthquakes-myanmar'
  useEffect(() => {
    let ablyClient: any = null
    let channel: any = null
    const key = process.env.NEXT_PUBLIC_ABLY_KEY
    if (!key) {
      console.warn('NEXT_PUBLIC_ABLY_KEY not set — realtime Ably subscription disabled')
      return
    }

    let mounted = true
    ;(async () => {
      try {
        const Ably = await import('ably')
        // @ts-ignore
        ablyClient = new Ably.Realtime({ key })
        channel = ablyClient.channels.get('earthquakes-myanmar')

        channel.subscribe((msg: any) => {
          if (!mounted) return
          const payload = msg.data
          try {
            const feat = {
              id: payload.id,
              properties: {
                mag: payload.magnitude ?? payload.mag,
                title: payload.title,
                place: payload.place,
                time: payload.time,
                url: payload.url
              },
              geometry: { coordinates: payload.coordinates }
            }
            const alert = mapFeatureToAlert(feat)
            setAlerts(prev => {
              if (prev.find(a => a.id === alert.id)) return prev
              return [alert, ...prev].slice(0, 10)
            })
          } catch (err) {
            console.error('Error handling Ably earthquake message', err)
          }
        })
      } catch (err) {
        console.error('Failed to initialize Ably realtime client', err)
      }
    })()

    return () => {
      mounted = false
      try {
        if (channel) channel.unsubscribe()
        if (ablyClient) ablyClient.close()
      } catch (_) {}
    }
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'earthquake':
        return <AlertTriangle className="h-4 w-4" />
      case 'safety':
        return <Shield className="h-4 w-4" />
      case 'family':
        return <Heart className="h-4 w-4" />
      case 'emergency':
        return <Bell className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
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
            Stay informed about earthquake alerts, safety updates, and emergency information
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

        {/* Alerts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              All Alerts
            </CardTitle>
            <CardDescription>
              Latest earthquake alerts and safety notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  className={`border-l-4 ${getSeverityColor(alert.severity).split(' ')[0]} ${getSeverityColor(alert.severity).split(' ')[1]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-base">{alert.title}</strong>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(alert.timestamp)}</span>
                            </div>
                            {alert.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{alert.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {alert.actionUrl && alert.actionLabel && (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={alert.actionUrl}>
                              <Navigation className="w-3 h-3 mr-1" />
                              {alert.actionLabel}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>

            {alerts.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No alerts at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

