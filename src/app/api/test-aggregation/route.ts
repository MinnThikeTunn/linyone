import { fetchAggregatedSuppliesByRegion } from '@/services/pins'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔥 API: test-aggregation called')
    const result = await fetchAggregatedSuppliesByRegion()
    console.log('🔥 API: result received:', result)
    return NextResponse.json(result)
  } catch (err) {
    console.error('🔥 API: Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
