import { Server } from 'socket.io';

// Bounding box roughly covering Myanmar
const MYANMAR_BOUNDS = {
  minlatitude: 9.5,
  maxlatitude: 28.6,
  minlongitude: 92.2,
  maxlongitude: 101.2,
}

// Poll USGS for recent earthquakes in Myanmar and emit new events via Socket.IO
export const setupSocket = (io: Server) => {
  console.log('Socket.IO setup initialized')

  // Keep track of seen earthquake ids to avoid re-emitting
  const seen = new Set<string>()

  const fetchAndEmit = async () => {
    try {
      const params = new URLSearchParams({
        format: 'geojson',
        orderby: 'time',
        limit: '50',
        starttime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // last 24 hours
        endtime: new Date().toISOString(),
        minlatitude: String(MYANMAR_BOUNDS.minlatitude),
        maxlatitude: String(MYANMAR_BOUNDS.maxlatitude),
        minlongitude: String(MYANMAR_BOUNDS.minlongitude),
        maxlongitude: String(MYANMAR_BOUNDS.maxlongitude),
      })

      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`
      const res = await fetch(url)
      if (!res.ok) {
        console.warn('USGS fetch failed', res.status)
        return
      }
      const data = await res.json()
      if (!data || !Array.isArray(data.features)) return

      for (const feature of data.features) {
        const id = feature.id
        if (seen.has(id)) continue
        seen.add(id)

        const payload = {
          id,
          title: feature.properties.title,
          magnitude: feature.properties.mag,
          place: feature.properties.place,
          time: feature.properties.time,
          url: feature.properties.url,
          coordinates: feature.geometry?.coordinates || [],
        }

        // Emit to all connected clients
        io.emit('earthquake', payload)
      }
    } catch (err) {
      console.error('Error polling USGS:', err)
    }
  }

  // Initial fetch and then poll every 30 seconds
  fetchAndEmit()
  const interval = setInterval(fetchAndEmit, 30 * 1000)

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Optionally, send a short welcome
    socket.emit('message', { text: 'Connected to earthquake realtime feed', timestamp: new Date().toISOString() })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  // Cleanup when server shuts down (if ever)
  ;(io as any)._onClose = () => clearInterval(interval)
}