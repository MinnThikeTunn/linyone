/**
 * Reverse Geocoding API Route
 * Converts coordinates (lat, lng) to human-readable addresses using Nominatim API
 * 
 * Nominatim is a free, open-source geocoding service
 * No API key required (but we respect rate limits: 1 request per second)
 * https://nominatim.org/release-docs/develop/
 */

import { NextRequest, NextResponse } from 'next/server'

// Rate limiting: track last request time
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds to be safe (respects 1 req/sec limit)

export async function POST(req: NextRequest) {
  try {
    const { lat, lng } = await req.json()

    // Validate input
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn('Invalid geocoding request (wrong types):', { lat, lng, latType: typeof lat, lngType: typeof lng })
      return NextResponse.json(
        { error: 'Invalid coordinates. lat and lng must be numbers.' },
        { status: 400 }
      )
    }

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid geocoding request (NaN values):', { lat, lng })
      return NextResponse.json(
        { error: 'Invalid coordinates. lat and lng cannot be NaN.' },
        { status: 400 }
      )
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn('Out of range coordinates:', { lat, lng })
      return NextResponse.json(
        { error: 'Coordinates out of valid range. Lat: -90 to 90, Lng: -180 to 180.' },
        { status: 400 }
      )
    }

    // Respect rate limits: 1 request per second
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    lastRequestTime = Date.now()

    // Call Nominatim Reverse Geocoding API (Free, no key required)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`

    console.log(`Nominatim geocoding request: lat=${lat}, lng=${lng}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LinnYone-App (Disaster Response) - https://github.com/2-lazyyyy/linyone',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      console.error('Nominatim HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        lat,
        lng,
      })
      return NextResponse.json(
        { error: `Geocoding failed: HTTP ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    console.log(`Nominatim response - Address: ${data.address?.city || data.address?.town || 'Unknown'}`)

    if (!data.address) {
      console.warn('No address components found for coordinates:', { lat, lng })
      return NextResponse.json(
        { error: 'No address found for these coordinates' },
        { status: 400 }
      )
    }

    // Extract address components
    const address = data.address

    // Build formatted address (always use buildAddressString for consistency)
    const displayName = buildAddressString(address)

    // Build formatted address similar to Google Maps for consistency
    const results = [
      {
        formatted_address: displayName,
        address_components: formatAddressComponents(address),
        place_id: data.osm_id,
        geometry: {
          location: {
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon),
          },
        },
      },
    ]

    return NextResponse.json({
      success: true,
      results,
      primary_address: displayName,
    })
  } catch (error) {
    console.error('Error in reverse-geocode route:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Geocoding request timeout' },
        { status: 408 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Build a formatted address string from Nominatim address components
 * Returns only city and state (last two meaningful components)
 */
function buildAddressString(address: Record<string, any>): string {
  // Try to find city-like field
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.suburb ||
    address.county ||
    address.municipality ||
    address.region ||
    null

  // Try to find state-like field
  const state =
    address.state ||
    address.province ||
    address.region ||
    address.state_district ||
    null

  if (!city && !state) {
    return 'Unknown location'
  }

  if (city && state) {
    return `${city}, ${state}`
  }

  return city || state || 'Unknown location'
}

/**
 * Format Nominatim address components to match Google Maps structure
 */
function formatAddressComponents(address: Record<string, any>): Array<{
  long_name: string
  short_name: string
  types: string[]
}> {
  const components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }> = []

  const componentMap: Record<string, string> = {
    house_number: 'street_number',
    road: 'route',
    street: 'route',
    residential: 'neighborhood',
    suburb: 'administrative_area_level_3',
    city: 'locality',
    town: 'locality',
    village: 'locality',
    county: 'administrative_area_level_2',
    state: 'administrative_area_level_1',
    postcode: 'postal_code',
    country: 'country',
  }

  Object.entries(componentMap).forEach(([key, type]) => {
    if (address[key]) {
      components.push({
        long_name: address[key],
        short_name: address[key],
        types: [type],
      })
    }
  })

  return components
}
