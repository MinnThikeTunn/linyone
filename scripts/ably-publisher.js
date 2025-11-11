// scripts/ably-publisher.js
// Server-side publisher: poll USGS and publish new earthquake events to Ably
// Usage: ABLY_API_KEY=<your_ably_rest_key> node scripts/ably-publisher.js

const { Rest } = require('ably')

if (!process.env.ABLY_API_KEY) {
  console.error('ABLY_API_KEY environment variable is required')
  process.exit(1)
}

const ABLY_KEY = process.env.ABLY_API_KEY
const CHANNEL_NAME = process.env.ABLY_CHANNEL || 'earthquakes-myanmar'
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 30_000)
const LOOKBACK_DAYS = Number(process.env.LOOKBACK_DAYS || 7) // initial fetch window

// Myanmar bounding box (approx)
const BOUNDS = {
  minlatitude: 9.5,
  maxlatitude: 28.6,
  minlongitude: 92.2,
  maxlongitude: 101.2,
}

const seen = new Set()
const ably = new Rest({ key: ABLY_KEY })
const channel = ably.channels.get(CHANNEL_NAME)

async function fetchUSGS() {
  try {
    const params = new URLSearchParams({
      format: 'geojson',
      orderby: 'time',
      limit: '200',
      starttime: new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      endtime: new Date().toISOString(),
      minlatitude: String(BOUNDS.minlatitude),
      maxlatitude: String(BOUNDS.maxlatitude),
      minlongitude: String(BOUNDS.minlongitude),
      maxlongitude: String(BOUNDS.maxlongitude),
    })

    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn('USGS fetch failed', res.status)
      return
    }
    const data = await res.json()
    if (!data.features || !Array.isArray(data.features)) return

    // Sort by time ascending so older ones are published first on initial run
    data.features.sort((a, b) => (a.properties.time || 0) - (b.properties.time || 0))

    for (const feature of data.features) {
      const id = feature.id
      if (!id) continue
      if (seen.has(id)) continue

      // Mark seen and publish
      seen.add(id)

      const mag = feature.properties?.mag ?? null
      const payload = {
        id,
        magnitude: mag,
        title: feature.properties?.title,
        place: feature.properties?.place,
        time: feature.properties?.time,
        url: feature.properties?.url,
        coordinates: feature.geometry?.coordinates || [],
      }

      try {
        await channel.publish('earthquake', payload)
        console.log(new Date().toISOString(), 'published', id, payload.title)
      } catch (err) {
        console.error('Failed to publish to Ably', err)
      }
    }
  } catch (err) {
    console.error('Error fetching USGS', err)
  }
}

async function start() {
  console.log('Starting Ably publisher')
  console.log('Channel:', CHANNEL_NAME)
  // Initial fetch
  await fetchUSGS()
  // Poll loop
  setInterval(fetchUSGS, POLL_INTERVAL_MS)
}

start().catch(err => {
  console.error('Publisher error', err)
  process.exit(1)
})
