import { supabase } from '@/lib/supabase'

// ... [keep all existing functions from before line 1214] ...

/**
 * Fetch aggregated supply needs grouped by region and item name
 * Returns: { region, itemName, unit, totalQuantityNeeded }
 */
export async function fetchAggregatedSuppliesByRegion(): Promise<{
  success: boolean
  supplies?: Array<{
    region: string
    itemName: string
    unit: string
    totalQuantityNeeded: number
    itemId: string
  }>
  error?: string
}> {
  try {
    console.log('🔍 fetchAggregatedSuppliesByRegion called')
    
    // Step 1: Fetch ALL confirmed pins
    const { data: confirmedPins, error: pinsError } = await supabase
      .from('pins')
      .select('id, status, latitude, longitude')
      .eq('status', 'confirmed')

    console.log(`📍 Found ${confirmedPins?.length || 0} confirmed pins`)
    if (pinsError) {
      console.error('Error fetching confirmed pins:', pinsError)
      return { success: false, error: pinsError.message }
    }

    if (!confirmedPins || confirmedPins.length === 0) {
      console.log('❌ No confirmed pins found')
      return { success: true, supplies: [] }
    }

    // Step 2: Fetch pin_items with item details for confirmed pins
    const confirmedPinIds = confirmedPins.map(p => p.id)
    const { data: pinItemsData, error: pinItemsError } = await supabase
      .from('pin_items')
      .select(`
        id,
        pin_id,
        item_id,
        remaining_qty,
        requested_qty,
        items (
          id,
          name,
          unit
        )
      `)
      .in('pin_id', confirmedPinIds)

    if (pinItemsError) {
      console.error('Error fetching pin items:', pinItemsError)
      return { success: false, error: pinItemsError.message }
    }

    console.log(`📍 Found ${pinItemsData?.length || 0} pin items`)
    if (!pinItemsData || pinItemsData.length === 0) {
      console.log('❌ No pin items found')
      return { success: true, supplies: [] }
    }

    // Step 3: Build pin coordinate map
    const pinCoordinatesMap: { [pinId: string]: { lat: number; lng: number } } = {}
    confirmedPins.forEach((pin: any) => {
      pinCoordinatesMap[pin.id] = {
        lat: parseFloat(pin.latitude),
        lng: parseFloat(pin.longitude),
      }
    })

    // Step 4: Geocode pins to regions
    const pinRegionMap: { [pinId: string]: string } = {}
    for (const pin of confirmedPins) {
      const coords = pinCoordinatesMap[pin.id]
      if (coords && !isNaN(coords.lat) && !isNaN(coords.lng) &&
          coords.lat >= -90 && coords.lat <= 90 &&
          coords.lng >= -180 && coords.lng <= 180) {
        const geoResult = await getReverseGeocodedAddress(coords.lat, coords.lng)
        pinRegionMap[pin.id] = geoResult.success && geoResult.address ? geoResult.address : 'Unknown Region'
      } else {
        pinRegionMap[pin.id] = 'Unknown Region'
      }
    }
    console.log(`📍 Geocoded ${Object.keys(pinRegionMap).length} pins`)

    // Step 5: Aggregate by (region, itemName)
    const aggregatedMap: { [key: string]: { region: string; itemName: string; unit: string; itemId: string; totalQuantityNeeded: number } } = {}

    pinItemsData.forEach((pinItem: any) => {
      const pinId = pinItem.pin_id
      const region = pinRegionMap[pinId]
      if (!region) return

      const itemInfo = pinItem.items
      if (!itemInfo) return

      const itemName = itemInfo.name || 'Unknown Item'
      const unit = itemInfo.unit || 'Unknown Unit'
      const remainingQty = pinItem.remaining_qty !== null && pinItem.remaining_qty !== undefined 
        ? pinItem.remaining_qty 
        : (pinItem.requested_qty || 0)

      const key = `${region}|${itemName}`

      if (!aggregatedMap[key]) {
        aggregatedMap[key] = {
          region,
          itemName,
          unit,
          itemId: pinItem.item_id,
          totalQuantityNeeded: 0,
        }
      }

      aggregatedMap[key].totalQuantityNeeded += remainingQty
    })

    const supplies = Object.values(aggregatedMap)
    console.log(`✅ Returning ${supplies.length} aggregated supplies`)
    
    return { success: true, supplies }
  } catch (err) {
    console.error('Error in fetchAggregatedSuppliesByRegion:', err)
    return { success: false, error: 'Failed to fetch aggregated supplies' }
  }
}
