"use client"

import { useEffect, useRef, useState } from 'react'
import Ably from 'ably'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Droplets, Wind, MapPin, Clock, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EventMapModal from './event-map-modal'

// Unified disaster event type
export interface DisasterEvent {
  id: string
  source: 'usgs' | 'flood' | 'cyclone'
  type: 'earthquake' | 'flood' | 'cyclone'
  title: string
  description?: string
  magnitude?: number | null
  place?: string
  time: number // epoch ms
  url?: string
  coordinates?: number[] // [lon, lat, depth?]
  severity: 'high' | 'medium' | 'low'
  location?: string
}

function severityFromMagnitude(mag: number | null | undefined): 'high' | 'medium' | 'low' {
  if (mag == null) return 'low'
  if (mag >= 6) return 'high'
  if (mag >= 4) return 'medium'
  return 'low'
}

function formatTimeAgo(time: number) {
  const diffMs = Date.now() - time
  if (diffMs < 1000) return 'just now'
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (seconds && parts.length === 0) parts.push(`${seconds}s`) // show seconds only when <1m
  return `${parts.join(' ')} ago`
}

function getSeverityBadge(sev: string) {
  switch (sev) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function IconFor(type: string) {
  switch (type) {
    case 'earthquake': return <AlertTriangle className="w-5 h-5 text-orange-500" />
    case 'flood': return <Droplets className="w-5 h-5 text-blue-500" />
    case 'cyclone': return <Wind className="w-5 h-5 text-purple-500" />
    default: return <AlertTriangle className="w-5 h-5" />
  }
}

/**
 * LiveAlerts component subscribes to Ably channel (earthquakes) and also
 * performs a periodic USGS fetch as a fallback / completeness enrichment.
 */
export function LiveAlerts({ className }: { className?: string }) {
  const [events, setEvents] = useState<DisasterEvent[]>([])
  const ablyRef = useRef<Ably.Realtime | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle')
  const [selectedForMap, setSelectedForMap] = useState<DisasterEvent | null>(null)

  async function sendTestEqAlert() {
    try {
      const mag = Number((Math.random() * 2 + 4).toFixed(1)) // 4.0 - 6.0
      const now = Date.now()
      const unique = Math.random().toString(36).slice(2, 8)
      const ev: DisasterEvent = {
        id: `test-eq-${now}-${unique}`,
        source: 'usgs',
        type: 'earthquake',
        title: `M${mag} Test Earthquake`,
        description: 'Simulated test event for broadcast',
        magnitude: mag,
        place: 'Yangon, Myanmar (Test)',
        time: now,
        url: 'https://earthquake.usgs.gov/',
        coordinates: [96.1421, 16.7875],
        severity: severityFromMagnitude(mag),
        location: 'Yangon, MM (Test)',
      }
      // Mark as seen locally to prevent Ably duplication race
      seenIdsRef.current.add(ev.id)
      // Broadcast to all connected users via server -> Ably
      fetch('/api/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ev.id,
          type: ev.type,
          title: ev.title,
          description: ev.description,
          magnitude: ev.magnitude,
          place: ev.place,
          time: ev.time,
          url: ev.url,
          coordinates: ev.coordinates,
          severity: ev.severity,
          location: ev.location,
          source: 'test'
        })
      }).catch(()=>{})
      // Also insert locally for immediate visibility
      setEvents((prev) => [ev, ...prev].sort((a, b) => b.time - a.time).slice(0, 200))
    } catch {}
  }

  // Subscribe to Ably earthquakes
  useEffect(() => {
    let cancelled = false
    async function initAbly() {
      try {
        setStatus('connecting')
        // Obtain token request from API route
        const tokenRes = await fetch('/api/ably-token')
        if (!tokenRes.ok) throw new Error('Token request failed')
        const tokenRequest = await tokenRes.json()
        if (cancelled) return
        const ably = new Ably.Realtime({ authUrl: '/api/ably-token', authMethod: 'GET' })
        ablyRef.current = ably
        ably.connection.on('connected', () => setStatus('live'))
        ably.connection.on('failed', () => setStatus('error'))
        const channel = ably.channels.get(process.env.NEXT_PUBLIC_ABLY_CHANNEL || 'earthquakes-myanmar')
        channel.subscribe('earthquake', (msg) => {
          try {
            const payload: any = msg.data || {}
            const id: string = payload.id || msg.id || Math.random().toString(36).slice(2)
            if (seenIdsRef.current.has(id)) return
            seenIdsRef.current.add(id)
            const ev: DisasterEvent = {
              id,
              source: 'usgs',
              type: 'earthquake',
              title: payload.title || `M${payload.magnitude} Earthquake`,
              description: payload.place,
              magnitude: payload.magnitude,
              place: payload.place,
              time: payload.time || Date.now(),
              url: payload.url,
              coordinates: payload.coordinates,
              severity: severityFromMagnitude(payload.magnitude),
              location: payload.place,
            }
            setEvents((prev) => [ev, ...prev].sort((a, b) => b.time - a.time).slice(0, 200))
          } catch (err) {
            // swallow parse errors
          }
        })
      } catch (err) {
        console.error('[LiveAlerts] Ably init error', err)
        setStatus('error')
      }
    }
    initAbly()
    return () => { cancelled = true; try { ablyRef.current?.close() } catch {} }
  }, [])

  // Periodic enrichment via direct USGS fetch (covers missed events)
  useEffect(() => {
    const controller = new AbortController()
    async function pollUSGS() {
      try {
        // Global (no lat/lon bounding box). Limit window & number to keep payload reasonable.
        const params = new URLSearchParams({
          format: 'geojson',
          orderby: 'time',
          limit: '200', // global feed can be larger; cap at 200 recent events
          starttime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // last 6 hours
          endtime: new Date().toISOString(),
        })
        const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data.features)) return
        for (const feature of data.features) {
          const id = feature.id
          if (!id || seenIdsRef.current.has(id)) continue
          seenIdsRef.current.add(id)
          const mag = feature.properties?.mag ?? null
          const ev: DisasterEvent = {
            id,
            source: 'usgs',
            type: 'earthquake',
            title: feature.properties?.title || `M${mag} Earthquake`,
            description: feature.properties?.place,
            magnitude: mag,
            place: feature.properties?.place,
            time: feature.properties?.time || Date.now(),
            url: feature.properties?.url,
            coordinates: feature.geometry?.coordinates || [],
            severity: severityFromMagnitude(mag),
            location: feature.properties?.place,
          }
          // Broadcast to all connected clients via server -> Ably
          try {
            fetch('/api/broadcast-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: ev.id,
                type: ev.type,
                title: ev.title,
                description: ev.description,
                magnitude: ev.magnitude,
                place: ev.place,
                time: ev.time,
                url: ev.url,
                coordinates: ev.coordinates,
                severity: ev.severity,
                location: ev.location,
                source: 'usgs'
              })
            }).catch(()=>{})
          } catch {}
          setEvents((prev) => [ev, ...prev].sort((a, b) => b.time - a.time).slice(0, 200))
        }
      } catch (err) {
        // ignore fetch errors
      }
    }
    pollUSGS()
    const interval = setInterval(pollUSGS, 60_000) // every minute
    return () => { controller.abort(); clearInterval(interval) }
  }, [])

  // Flood polling via Open-Meteo Flood API (river discharge). Creates flood events
  useEffect(() => {
    const controller = new AbortController()
    const sites = [
      // Myanmar-focused sites first
      { key: 'yangon', name: 'Myanmar — Yangon', lat: 16.7875, lon: 96.1421 },
      { key: 'mandalay', name: 'Myanmar — Mandalay (Ayeyarwady)', lat: 21.9588, lon: 96.0891 },
      { key: 'naypyidaw', name: 'Myanmar — Nay Pyi Taw (Sittoung basin)', lat: 19.7633, lon: 96.0785 },
      { key: 'bago', name: 'Myanmar — Bago', lat: 17.3367, lon: 96.4797 },
      // Global rivers (keep a few representative)
      { key: 'amazon-manaus', name: 'Amazon — Manaus, BR', lat: -3.119, lon: -60.0217 },
      { key: 'ganges-kolkata', name: 'Ganges — Kolkata, IN', lat: 22.5726, lon: 88.3639 },
      { key: 'yangtze-wuhan', name: 'Yangtze — Wuhan, CN', lat: 30.5928, lon: 114.3055 },
      { key: 'mekong-phnompenh', name: 'Mekong — Phnom Penh, KH', lat: 11.5564, lon: 104.9282 },
      { key: 'mississippi-neworleans', name: 'Mississippi — New Orleans, US', lat: 29.9511, lon: -90.0715 },
      { key: 'nile-cairo', name: 'Nile — Cairo, EG', lat: 30.0444, lon: 31.2357 },
    ]

    function severityFromDischarge(q: number | null | undefined): 'high' | 'medium' | 'low' {
      if (q == null) return 'low'
      if (q >= 5000) return 'high'
      if (q >= 2000) return 'medium'
      return 'low'
    }

    async function pollFloods() {
      try {
        const requests = sites.map(async (s) => {
          const url = new URL('https://flood-api.open-meteo.com/v1/flood')
          url.searchParams.set('latitude', String(s.lat))
          url.searchParams.set('longitude', String(s.lon))
          // Flood API is daily-only. Minimal working parameters.
          url.searchParams.set('daily', 'river_discharge')
          const reqUrl = url.toString()
          const res = await fetch(reqUrl, { signal: controller.signal })
          if (!res.ok) {
            console.warn(
              '[LiveAlerts] Flood API non-OK',
              res.status,
              await res.text().catch(() => '')
            )
            return null
          }
          const data = await res.json()
          const times: string[] | undefined = data?.daily?.time
          const discharge: number[] | undefined = data?.daily?.river_discharge
          if (!times || !discharge || times.length === 0) return null
          // Use the latest timestamp
          const idx = times.length - 1
          const tISO = times[idx]
          const t = Date.parse(tISO)
          const q = discharge[idx] as number
          const sev = severityFromDischarge(q)
          if (sev === 'low') return null // only surface medium/high for alerts
          const id = `flood-${s.key}-${t}`
          if (seenIdsRef.current.has(id)) return null
          seenIdsRef.current.add(id)
          const ev: DisasterEvent = {
            id,
            source: 'flood',
            type: 'flood',
            title: `Flood risk — ${s.name}`,
            description: `River discharge ${q.toFixed(0)} m³/s at ${new Date(t).toUTCString()}`,
            magnitude: q,
            place: s.name,
            time: t,
            url: undefined,
            coordinates: [s.lon, s.lat],
            severity: sev,
            location: s.name,
          }
          try {
            // Broadcast to server so ALL users get a toast via Ably
            fetch('/api/broadcast-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: ev.id,
                type: ev.type,
                title: ev.title,
                description: ev.description,
                magnitude: ev.magnitude,
                place: ev.place,
                time: ev.time,
                url: ev.url,
                coordinates: ev.coordinates,
                severity: ev.severity,
                location: ev.location,
                source: 'flood'
              })
            }).catch(()=>{})
          } catch {}
          return ev
        })
        const results = await Promise.all(requests)
        const newEvents = results.filter((e): e is DisasterEvent => !!e)
        if (newEvents.length) {
          setEvents((prev) => [...newEvents, ...prev].sort((a, b) => b.time - a.time).slice(0, 200))
        }
      } catch (err) {
        // ignore errors
      }
    }

    pollFloods()
    const interval = setInterval(pollFloods, 30 * 60 * 1000) // every 30 minutes
    return () => { controller.abort(); clearInterval(interval) }
  }, [])

  const earthquakes = events.filter(e => e.type === 'earthquake').sort((a,b)=> b.time - a.time)
  const lastTen = earthquakes.slice(0,10)
  const floods = events.filter(e => e.type === 'flood').sort((a,b)=> b.time - a.time)
  const floodsLastTen = floods.slice(0,10)

  const eqHigh = lastTen.filter(e => e.severity === 'high').length
  const eqMedium = lastTen.filter(e => e.severity === 'medium').length
  const eqLow = lastTen.filter(e => e.severity === 'low').length
  const floodHigh = floodsLastTen.filter(e => e.severity === 'high').length
  const floodMedium = floodsLastTen.filter(e => e.severity === 'medium').length
  const floodLow = floodsLastTen.filter(e => e.severity === 'low').length

  const highCount = eqHigh + floodHigh
  const mediumCount = eqMedium + floodMedium
  const lowCount = eqLow + floodLow

  return (
    <div className={className}>
      <div className="flex items-center justify-end mb-3">
        <Button size="sm" variant="outline" onClick={sendTestEqAlert} title="Broadcast a test earthquake alert">
          Send Test EQ Alert
        </Button>
      </div>
      {/* Risk summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-t-4 border-t-red-600">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold"><AlertTriangle className="w-5 h-5 text-red-600" /> High</CardTitle>
            <CardDescription>Combined EQ + Flood (last 10 each)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-700">{highCount}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold"><AlertTriangle className="w-5 h-5 text-yellow-500" /> Medium</CardTitle>
            <CardDescription>Combined EQ + Flood (last 10 each)</CardDescription>
          </CardHeader>
            <CardContent className="pt-0">
            <div className="text-3xl font-bold text-yellow-600">{mediumCount}</div>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold"><AlertTriangle className="w-5 h-5 text-blue-600" /> Low</CardTitle>
            <CardDescription>Combined EQ + Flood (last 10 each)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-blue-700">{lowCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Last 10 earthquakes list and floods in responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earthquakes */}
        <Card className="border-t-4 border-t-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> Last 10 Earthquakes
            </CardTitle>
            <CardDescription>{lastTen.length === 0 ? 'No recent earthquakes' : `Showing ${lastTen.length} most recent`}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-112 overflow-y-auto pr-1 space-y-3">
              {lastTen.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500 text-sm">No earthquakes detected</div>
              ) : (
                lastTen.map(ev => (
                  <Card key={ev.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm truncate" title={ev.title}>{ev.title}</h4>
                            <Badge className={`${getSeverityBadge(ev.severity)} text-xs capitalize`}>{ev.severity}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ev.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{formatTimeAgo(ev.time)}</span></div>
                            {ev.magnitude != null && <div className="flex items-center gap-1"><span>M{(ev.magnitude as number).toFixed(1)}</span></div>}
                            {ev.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate max-w-[140px]" title={ev.location}>{ev.location}</span></div>}
                          </div>
                        </div>
                        {(ev.coordinates && ev.coordinates.length >= 2) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => setSelectedForMap(ev)}
                            title="View location map"
                          >
                            <Navigation className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Floods */}
        <Card className="border-t-4 border-t-blue-600">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="w-5 h-5 text-blue-600" /> Last 10 Flood Alerts
            </CardTitle>
            <CardDescription>{floodsLastTen.length === 0 ? 'No flood alerts detected' : `Showing ${floodsLastTen.length} most recent`}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-112 overflow-y-auto pr-1 space-y-3">
              {floodsLastTen.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500 text-sm">No floods detected</div>
              ) : (
                floodsLastTen.map(ev => (
                  <Card key={ev.id} className="border-l-4 border-l-blue-600">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm truncate" title={ev.title}>{ev.title}</h4>
                            <Badge className={`${getSeverityBadge(ev.severity)} text-xs capitalize`}>{ev.severity}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ev.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{formatTimeAgo(ev.time)}</span></div>
                            {ev.magnitude != null && <div className="flex items-center gap-1"><span>Q{Math.round(ev.magnitude)} m³/s</span></div>}
                            {ev.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate max-w-[140px]" title={ev.location}>{ev.location}</span></div>}
                          </div>
                        </div>
                        {(ev.coordinates && ev.coordinates.length >= 2) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => setSelectedForMap(ev)}
                            title="View location map"
                          >
                            <Navigation className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <EventMapModal
        open={!!selectedForMap}
        onOpenChange={(o) => { if (!o) setSelectedForMap(null) }}
        title={selectedForMap?.title}
        subtitle={selectedForMap?.location}
        longitude={selectedForMap?.coordinates?.[0] ?? null}
        latitude={selectedForMap?.coordinates?.[1] ?? null}
        externalUrl={selectedForMap?.url}
      />
    </div>
  )
}
