"use client"

import { useEffect, useRef, useState } from 'react'
import Ably from 'ably'
import { AlertTriangle, Droplets, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface IncomingAlert {
  id?: string
  type: string // 'earthquake' | 'flood'
  title?: string
  description?: string
  magnitude?: number // mag or discharge
  place?: string
  time?: number
  severity?: 'high' | 'medium' | 'low'
  coordinates?: number[]
}

function deriveSeverity(data: IncomingAlert): 'high' | 'medium' | 'low' {
  if (data.severity) return data.severity
  if (data.type === 'earthquake') {
    const m = data.magnitude ?? 0
    if (m >= 6) return 'high'
    if (m >= 4) return 'medium'
    return 'low'
  }
  if (data.type === 'flood') {
    const q = data.magnitude ?? 0
    if (q >= 5000) return 'high'
    if (q >= 2000) return 'medium'
    return 'low'
  }
  return 'low'
}

function formatTime(ts?: number) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleString() } catch { return '' }
}

export function DisasterToasts() {
  const ablyRef = useRef<Ably.Realtime | null>(null)
  const seenRef = useRef<Set<string>>(new Set())
  const [open, setOpen] = useState(false)
  const [curr, setCurr] = useState<IncomingAlert | null>(null)
  const STORAGE_KEY = 'ly_seen_alert_ids_v1'
  const MAX_ENTRIES = 500
  const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const obj = JSON.parse(raw) as Record<string, number>
      const now = Date.now()
      const entries = Object.entries(obj).filter(([, ts]) => now - ts < MAX_AGE_MS)
      entries.sort((a, b) => b[1] - a[1])
      const trimmed = entries.slice(0, MAX_ENTRIES)
      seenRef.current = new Set(trimmed.map(([id]) => id))
      if (trimmed.length !== entries.length) {
        const out: Record<string, number> = {}
        for (const [id, ts] of trimmed) out[id] = ts
        localStorage.setItem(STORAGE_KEY, JSON.stringify(out))
      }
    } catch {}
  }

  function persistAdd(id: string) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const now = Date.now()
      let obj: Record<string, number> = {}
      if (raw) obj = JSON.parse(raw)
      obj[id] = now
      const entries = Object.entries(obj)
      entries.sort((a, b) => b[1] - a[1])
      const trimmed = entries.slice(0, MAX_ENTRIES)
      const out: Record<string, number> = {}
      for (const [k, v] of trimmed) out[k] = v
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out))
    } catch {}
  }

  useEffect(() => {
    let cancelled = false
    loadPersisted()
    async function init() {
      try {
        await fetch('/api/ably-token')
        if (cancelled) return
        const ably = new Ably.Realtime({ authUrl: '/api/ably-token', authMethod: 'GET' })
        ablyRef.current = ably
        const channel = ably.channels.get(process.env.NEXT_PUBLIC_ABLY_CHANNEL || 'earthquakes-myanmar')
        const handler = (msg: Ably.Types.Message) => {
          const data: IncomingAlert = msg.data || {}
          const id = data.id || msg.id || Math.random().toString(36).slice(2)
          if (seenRef.current.has(id)) return
          seenRef.current.add(id)
          persistAdd(id)
          if (!data.type) return
          setCurr({ ...data, severity: deriveSeverity(data) })
          setOpen(true)
        }
        channel.subscribe('earthquake', handler)
        channel.subscribe('flood', handler)
      } catch (e) {
        console.error('[DisasterAlertModal] init error', e)
      }
    }
    init()
    return () => { cancelled = true; try { ablyRef.current?.close() } catch {} }
  }, [])

  const sev = curr?.severity || 'low'
  const isEq = curr?.type === 'earthquake'
  const icon = isEq ? <AlertTriangle className="w-16 h-16" /> : <Droplets className="w-16 h-16" />
  const iconColor = sev === 'high' ? 'text-red-600' : sev === 'medium' ? 'text-amber-500' : 'text-blue-600'
  const headerBg = sev === 'high' ? 'bg-red-50' : sev === 'medium' ? 'bg-amber-50' : 'bg-blue-50'
  const magnitudeFragment = curr?.magnitude != null
    ? isEq
      ? `M${curr.magnitude?.toFixed(1)}`
      : `Q${Math.round(curr.magnitude!)} m³/s`
    : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <div className={`-mt-4 -mx-6 px-6 pt-6 pb-4 ${headerBg} border-b`}> 
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${headerBg}`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            {isEq ? 'Earthquake Alert' : 'Flood Alert'} {magnitudeFragment && `• ${magnitudeFragment}`}
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-2">
          {curr?.title && <div className="font-medium">{curr.title}</div>}
          <div className="text-sm text-muted-foreground">
            {curr?.description || curr?.place}
          </div>
          {curr?.time && (
            <div className="text-xs text-gray-500 flex items-center gap-1 justify-center">
              <Clock className="w-3 h-3" /> {formatTime(curr.time)}
            </div>
          )}
        </div>
        <div className="flex justify-center pt-2">
          <button
            className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            Dismiss
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DisasterToasts

