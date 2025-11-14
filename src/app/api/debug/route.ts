import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Check confirmed pins
    const { data: pins, error: pinsError } = await supabase
      .from('pins')
      .select('*')
      .eq('status', 'confirmed')

    console.log('✅ Confirmed pins:', pins?.length || 0, pins)
    if (pinsError) console.error('Pins error:', pinsError)

    // Check pin_items
    const { data: pinItems, error: itemsError } = await supabase
      .from('pin_items')
      .select('*')

    console.log('✅ All pin_items:', pinItems?.length || 0)
    if (pinItems && pinItems.length > 0) {
      console.log('Sample pin_items:', pinItems.slice(0, 3))
    }
    if (itemsError) console.error('Pin items error:', itemsError)

    // Check items table
    const { data: items, error: catError } = await supabase
      .from('items')
      .select('*')

    console.log('✅ All items:', items?.length || 0)
    if (items && items.length > 0) {
      console.log('Sample items:', items.slice(0, 5))
    }
    if (catError) console.error('Items error:', catError)

    return NextResponse.json({
      confirmedPins: pins?.length || 0,
      pinItems: pinItems?.length || 0,
      items: items?.length || 0,
      sample: {
        pins: pins?.slice(0, 2),
        pinItems: pinItems?.slice(0, 2),
        items: items?.slice(0, 3)
      }
    })
  } catch (err) {
    console.error('Debug error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
