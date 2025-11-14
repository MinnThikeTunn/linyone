"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export interface EventMapModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  title?: string
  longitude?: number | null
  latitude?: number | null
  subtitle?: string
  externalUrl?: string
}

// Expect token via NEXT_PUBLIC_MAPBOX_TOKEN or MAPBOX_ACCESS_TOKEN (client-only)
const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_ACCESS_TOKEN

console.log('[Mapbox token]', envToken)

export function EventMapModal({ open, onOpenChange, title, longitude, latitude, subtitle, externalUrl }: EventMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const initialisedRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const retryTimerRef = useRef<number | null>(null)

  function initMapIfReady(lon: number, lat: number) {
    if (!mapContainerRef.current) return false
    if (!envToken) return false
    if (!initialisedRef.current) {
      // @ts-ignore
      mapboxgl.accessToken = envToken
      initialisedRef.current = true
      console.log('[EventMapModal] Mapbox token set, opening map modal.')
    }
    if (!mapRef.current) {
      setLoading(true)
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lon, lat],
        zoom: 14,
      })
      setTimeout(() => {
        mapRef.current?.resize()
      }, 50)
      mapRef.current.on('load', () => {
        setLoading(false)
      })
      mapRef.current.on('error', (e) => {
        console.error('[EventMapModal] Mapbox map error:', e?.error || e)
        setLoading(false)
      })
    } else {
      mapRef.current.setCenter([lon, lat])
      mapRef.current.resize()
    }
    if (markerRef.current) {
      markerRef.current.remove()
    }
    markerRef.current = new mapboxgl.Marker().setLngLat([lon, lat]).addTo(mapRef.current)
    return true
  }

  useEffect(() => {
    if (!open) return
    if (longitude == null || latitude == null) return
    if (!envToken) {
      console.warn('[EventMapModal] Missing Mapbox token (env).')
      return
    }

    let attempts = 0
    const tryInit = () => {
      attempts++
      const ok = initMapIfReady(longitude, latitude)
      if (!ok && attempts < 20) {
        retryTimerRef.current = window.setTimeout(tryInit, 50)
      } else if (!ok) {
        console.warn('[EventMapModal] Map container not ready after retries.')
      }
    }
    tryInit()

    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [open, longitude, latitude])

  useEffect(() => {
    if (open) return
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
  }, [open])

  const missingToken = !envToken
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{title || 'Location Map'}</DialogTitle>
        </DialogHeader>
        {subtitle && <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>}
        {missingToken ? (
          <div className="p-6 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            Mapbox token missing. Set environment variable NEXT_PUBLIC_MAPBOX_TOKEN.
          </div>
        ) : (
          <div className="relative">
            <div ref={mapContainerRef} className="w-full h-80 rounded-md border" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-md">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {(longitude == null || latitude == null) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md p-6 text-sm text-gray-600">
                No coordinates available.
              </div>
            )}
          </div>
        )}
        {externalUrl && (
          <div className="mt-3 text-right">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline text-blue-600 hover:text-blue-700"
            >
              Open original source ↗
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EventMapModal