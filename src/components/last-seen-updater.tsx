"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

export default function LastSeenUpdater() {
  const { user } = useAuth()
  const timerRef = useRef<any>(null)

  useEffect(() => {
    async function updateOnce() {
      try {
        if (!user?.id) return
        if (!('geolocation' in navigator)) return
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const lat = pos.coords.latitude
              const lng = pos.coords.longitude
              await fetch('/api/last-seen/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, lat, lng })
              })
            } catch {}
            resolve()
          }, () => resolve(), { enableHighAccuracy: false, timeout: 10000 })
        })
      } catch {}
    }

    // run on mount and every 10 minutes
    updateOnce()
    timerRef.current = setInterval(updateOnce, 10 * 60 * 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [user?.id])

  return null
}
