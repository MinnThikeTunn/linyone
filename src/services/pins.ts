import { supabase } from '@/lib/supabase'

export interface Pin {
  id: string
  type: 'damaged' | 'safe'
  status: 'pending' | 'confirmed' | 'completed'
  phone: string
  description: string
  lat: number
  lng: number
  createdBy: string
  createdAt: Date
  image?: string
  assignedTo?: string
  user_id?: string
  image_url?: string
}

export interface Item {
  id: string
  name: string
  unit: string
  category: string
}

export interface PinItem {
  id: string
  pin_id: string
  item_id: string
  requested_qty: number
  remaining_qty: number
  item?: Item
}

export interface CreatePinInput {
  type: 'damaged' | 'safe'
  status: 'pending' | 'confirmed' | 'completed'
  phone: string
  description: string
  lat: number
  lng: number
  createdBy: string
  image?: string
  assignedTo?: string
  user_id: string | null
}

/**
 * Check if a user is an active tracker (from org-member table)
 */
export async function isUserActiveTracker(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('org-member')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error) {
      // No tracker record found - this is expected for regular users
      return false
    }

    return !!data
  } catch (err) {
    console.error('Error checking if user is tracker:', err)
    return false
  }
}

/**
 * Check if a user is an organization account
 */
export async function isUserOrganization(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', userId)
      .single()

    if (error) {
      // No organization record found
      return false
    }

    return !!data
  } catch (err) {
    console.error('Error checking if user is organization:', err)
    return false
  }
}

/**
 * Create a new pin in the database
 * 
 * Status determination logic:
 * - Unauthorized user → status: pending, createdBy: "Anonymous User"
 * - Tracker user (from org-member) → status: confirmed
 * - Organization user → status: confirmed
 * - Other authorized users → status: pending
 */
export async function createPin(
  pin: CreatePinInput,
  imageFile?: File,
  userRole?: string
): Promise<{ success: boolean; pin?: Pin; error?: string }> {
  try {
    let imageUrl: string | null = null

    // Upload image if provided (optional feature)
    if (imageFile) {
      try {
        const fileName = `pins/${Date.now()}_${imageFile.name}`
        console.log('🔍 Image upload starting:', {
          fileName,
          fileSize: imageFile.size,
          fileType: imageFile.type,
          bucket: 'pin-images'
        })
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pin-images')
          .upload(fileName, imageFile)

        console.log('📤 Upload response:', { uploadData, uploadError })

        if (uploadError) {
          console.error('❌ Image upload failed:', uploadError)
          // Continue without image - this is not a critical failure
        } else if (uploadData) {
          console.log('✅ File uploaded to:', uploadData.path)
          
          // Get public URL after successful upload
          const { data: urlData } = supabase.storage
            .from('pin-images')
            .getPublicUrl(fileName)
          
          console.log('🔗 Public URL response:', urlData)
          
          if (urlData && urlData.publicUrl) {
            imageUrl = urlData.publicUrl
            console.log('✨ Image URL ready:', imageUrl)
          }
        } else {
          console.warn('⚠️ Upload returned no data and no error')
        }
      } catch (imageError) {
        console.error('❌ Image upload exception:', imageError)
        // Continue without image - pins can be created without images
      }
    }

    // Determine status based on user role and account type
    let status: 'pending' | 'confirmed' = 'pending'
    if (!pin.user_id) {
      // Unauthorized user - always pending
      status = 'pending'
    } else {
      // Check if user is a tracker (from org-member table)
      const isTracker = await isUserActiveTracker(pin.user_id)
      if (isTracker) {
        status = 'confirmed'
        console.log('✅ User is a tracker - pin status: confirmed')
      } else if (userRole === 'organization') {
        // Organization users also get confirmed status
        status = 'confirmed'
        console.log('✅ User is an organization - pin status: confirmed')
      } else {
        // Regular authorized users get pending
        status = 'pending'
        console.log('📋 User is a regular user - pin status: pending')
      }
    }

    // Convert pin type for database (damaged -> damage, safe -> shelter)
    const dbType = pin.type === 'damaged' ? 'damage' : 'shelter'

    // Insert pin into database
    // Important: Only set user_id if it's actually provided (not null)
    // This prevents foreign key constraint violations
    const pinData: any = {
      latitude: pin.lat,
      longitude: pin.lng,
      type: dbType,
      phone: pin.phone,
      description: pin.description,
      status: status,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    }

    // Only include user_id if it exists
    if (pin.user_id) {
      pinData.user_id = pin.user_id
    }

    const { data, error } = await supabase
      .from('pins')
      .insert([pinData])
      .select()
      .single()

    if (error) {
      console.error('Error creating pin:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      return { success: false, error: error.message }
    }

    // Map response back to frontend Pin interface
    const createdPin: Pin = {
      id: data.id,
      type: data.type === 'damage' ? 'damaged' : 'safe',
      status: data.status,
      phone: data.phone,
      description: data.description,
      lat: parseFloat(data.latitude),
      lng: parseFloat(data.longitude),
      createdBy: pin.createdBy,
      createdAt: new Date(data.created_at),
      image: imageUrl || undefined,
      user_id: data.user_id,
      assignedTo: pin.assignedTo,
    }

    return { success: true, pin: createdPin }
  } catch (err) {
    console.error('Error in createPin:', err)
    return { success: false, error: 'Failed to create pin' }
  }
}

/**
 * Fetch all pins from the database with creator names
 */
export async function fetchPins(): Promise<{ success: boolean; pins?: Pin[]; error?: string }> {
  try {
    // First try to fetch pins with user details
    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pins from database:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      return { success: false, error: `Failed to fetch pins: ${error.message || 'Unknown error'}` }
    }

    // If no data, return empty array
    if (!data) {
      console.log('No pins found in database')
      return { success: true, pins: [] }
    }

    // Get user IDs from pins
    const userIds = [...new Set(data.map((pin: any) => pin.user_id).filter(Boolean))]
    
    // Fetch user details if needed
    let userMap: { [key: string]: { name: string } } = {}
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)

      if (usersError) {
        console.warn('Could not fetch user details:', usersError.message)
      } else if (users) {
        userMap = Object.fromEntries(users.map((u: any) => [u.id, { name: u.name }]))
      }
    }

    const pins: Pin[] = (data || []).map((row: any) => ({
      id: row.id,
      type: row.type === 'damage' ? 'damaged' : 'safe',
      status: row.status,
      phone: row.phone,
      description: row.description,
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude),
      createdBy: (row.user_id && userMap[row.user_id]?.name) || 'Anonymous User',
      createdAt: new Date(row.created_at),
      image: row.image_url || undefined,
      user_id: row.user_id,
    }))

    return { success: true, pins }
  } catch (err) {
    console.error('Error in fetchPins:', err)
    return { success: false, error: 'Failed to fetch pins' }
  }
}

/**
 * Update pin status from pending to confirmed
 * Only trackers can confirm pins (change status to 'confirmed')
 */
export async function updatePinStatus(
  pinId: string,
  newStatus: 'pending' | 'confirmed' | 'completed',
  confirmedByMemberId?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If attempting to confirm a pin, verify user is a tracker
    if (newStatus === 'confirmed') {
      if (!userId || !confirmedByMemberId) {
        console.error('Authorization check failed: Missing userId or confirmedByMemberId')
        return { success: false, error: 'Only trackers can confirm pins' }
      }

      // Verify the user is an active tracker
      const isTracker = await isUserActiveTracker(userId)
      if (!isTracker) {
        console.error('Authorization failed: User is not an active tracker')
        return { success: false, error: 'Only trackers can confirm pins' }
      }
    }

    const updateData: any = {
      status: newStatus,
    }

    if (newStatus === 'confirmed' && confirmedByMemberId) {
      updateData.confirmed_by = confirmedByMemberId
      updateData.confirmed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('pins')
      .update(updateData)
      .eq('id', pinId)

    if (error) {
      console.error('Error updating pin status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error in updatePinStatus:', err)
    return { success: false, error: 'Failed to update pin status' }
  }
}

/**
 * Get org-member record for a user (needed for confirmed_by reference)
 */
export async function getUserOrgMember(userId: string): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase
      .from('org-member')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error) {
      return null
    }

    return data
  } catch (err) {
    console.error('Error fetching org-member:', err)
    return null
  }
}

/**
 * Delete a pin from the database
 * Only organizations can delete confirmed pins
 */
export async function deletePin(
  pinId: string,
  userId?: string,
  userRole?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify authorization: only organizations can delete pins
    if (userRole !== 'organization') {
      console.error('Authorization failed: Only organizations can delete pins')
      return { success: false, error: 'Only organizations can delete pins' }
    }

    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', pinId)

    if (error) {
      console.error('Error deleting pin:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Pin deleted successfully:', pinId)
    return { success: true }
  } catch (err) {
    console.error('Error in deletePin:', err)
    return { success: false, error: 'Failed to delete pin' }
  }
}

/**
 * Fetch all items from the database
 */
export async function fetchItems(): Promise<{ success: boolean; items?: Item[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching items:', error)
      return { success: false, error: error.message }
    }

    return { success: true, items: data || [] }
  } catch (err) {
    console.error('Error in fetchItems:', err)
    return { success: false, error: 'Failed to fetch items' }
  }
}

/**
 * Create pin items for a confirmed pin
 * Called when a tracker confirms a pin with specific item requests
 */
export async function createPinItems(
  pinId: string,
  items: Array<{ item_id: string; requested_qty: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!items || items.length === 0) {
      return { success: true }
    }

    // Create pin items records
    const pinItemsData = items.map((item) => ({
      pin_id: pinId,
      item_id: item.item_id,
      requested_qty: item.requested_qty,
      remaining_qty: item.requested_qty,
      created_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('pin_items')
      .insert(pinItemsData)

    if (error) {
      console.error('Error creating pin items:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Pin items created successfully:', pinId)
    return { success: true }
  } catch (err) {
    console.error('Error in createPinItems:', err)
    return { success: false, error: 'Failed to create pin items' }
  }
}

/**
 * Fetch pins with their associated items
 */
export async function fetchPinsWithItems(): Promise<{
  success: boolean
  pins?: (Pin & { pin_items?: (PinItem & { item?: Item })[] })[]
  error?: string
}> {
  try {
    // Fetch pins
    const { data: pinsData, error: pinsError } = await supabase
      .from('pins')
      .select('*')
      .order('created_at', { ascending: false })

    if (pinsError) {
      console.error('Error fetching pins:', pinsError)
      return { success: false, error: pinsError.message }
    }

    if (!pinsData) {
      return { success: true, pins: [] }
    }

    // Fetch pin items with item details
    const { data: pinItemsData, error: pinItemsError } = await supabase
      .from('pin_items')
      .select('*, items(*)')

    if (pinItemsError) {
      console.warn('Could not fetch pin items:', pinItemsError.message)
    }

    // Build pin map with items
    const pinItemsMap: { [pinId: string]: (PinItem & { item?: Item })[] } = {}
    if (pinItemsData) {
      pinItemsData.forEach((pi: any) => {
        if (!pinItemsMap[pi.pin_id]) {
          pinItemsMap[pi.pin_id] = []
        }
        pinItemsMap[pi.pin_id].push({
          id: pi.id,
          pin_id: pi.pin_id,
          item_id: pi.item_id,
          requested_qty: pi.requested_qty,
          remaining_qty: pi.remaining_qty,
          item: pi.items,
        })
      })
    }

    // Get user details
    const userIds = [...new Set(pinsData.map((pin: any) => pin.user_id).filter(Boolean))]
    let userMap: { [key: string]: { name: string } } = {}
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)

      if (usersError) {
        console.warn('Could not fetch user details:', usersError.message)
      } else if (users) {
        userMap = Object.fromEntries(users.map((u: any) => [u.id, { name: u.name }]))
      }
    }

    const pins = pinsData.map((row: any) => ({
      id: row.id,
      type: (row.type === 'damage' ? 'damaged' : 'safe') as 'damaged' | 'safe',
      status: row.status as 'pending' | 'confirmed' | 'completed',
      phone: row.phone,
      description: row.description,
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude),
      createdBy: (row.user_id && userMap[row.user_id]?.name) || 'Anonymous User',
      createdAt: new Date(row.created_at),
      image: row.image_url || undefined,
      user_id: row.user_id,
      pin_items: pinItemsMap[row.id] || [],
    }))

    return { success: true, pins }
  } catch (err) {
    console.error('Error in fetchPinsWithItems:', err)
    return { success: false, error: 'Failed to fetch pins with items' }
  }
}

/**
 * Update pin item quantities after delivery/fulfillment
 */
export async function updatePinItemQuantity(
  pinItemId: string,
  newRemainingQty: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('pin_items')
      .update({ remaining_qty: newRemainingQty })
      .eq('id', pinItemId)

    if (error) {
      console.error('Error updating pin item quantity:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error in updatePinItemQuantity:', err)
    return { success: false, error: 'Failed to update pin item quantity' }
  }
}
