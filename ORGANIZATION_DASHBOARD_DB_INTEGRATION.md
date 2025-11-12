# Organization Dashboard - Database Backend Implementation Guide

## Overview

This document describes how to integrate the pins, pin_items, and items database tables with the organization dashboard UI. The implementation replaces mock data with real database queries while maintaining the existing UI structure.

---

## Database Schema Reference

### Tables

**pins** - Main table for disaster/emergency locations
```
id (uuid) | latitude | longitude | type | status | user_id | description | image_url | created_at | confirmed_by | confirmed_at
```

**pin_items** - Relationship between pins and items with quantities
```
id (uuid) | pin_id | item_id | requested_qty | remaining_qty | created_at
```

**items** - Master catalog of available items
```
id (uuid) | name | unit | category | created_at
```

### Status Logic

The pin status in the organization dashboard is determined by comparing `requested_qty` vs `remaining_qty` in pin_items:

```
IF (requested_qty === remaining_qty for ALL items):
    status = "pending"  // No items fulfilled yet

ELSE IF (remaining_qty > 0 AND remaining_qty < requested_qty for ANY item):
    status = "partially_accepted"  // Some but not all items fulfilled

ELSE IF (remaining_qty === 0 for ALL items):
    Pin is COMPLETED - should be hidden/deleted from dashboard
    All related pin_items rows are deleted
    Pin status updated to "completed"
```

---

## New Service Functions

Added 5 new functions to `src/services/pins.ts`:

### 1. `getReverseGeocodedAddress(lat: number, lng: number)`

**Purpose:** Convert coordinates to human-readable address using Google Maps API

**Returns:**
```typescript
{
  success: boolean
  address?: string  // e.g., "Yangon Downtown, Main Street"
  error?: string
}
```

**Usage:**
```typescript
const result = await getReverseGeocodedAddress(16.8409, 96.1735)
if (result.success) {
  console.log(result.address) // "Yangon Downtown, Myanmar"
}
```

**API Endpoint:**
- Server-side: `POST /api/reverse-geocode`
- Request: `{ lat: number, lng: number }`
- Response: `{ success: boolean, primary_address: string, results: [...] }`

---

### 2. `fetchConfirmedPinsForDashboard()`

**Purpose:** Fetch all confirmed pins with full details for the dashboard

**Returns:**
```typescript
{
  success: boolean
  helpRequests?: Array<{
    id: string
    title: string                          // Auto-generated from pin type
    description: string
    location: string                       // Geocoded address
    lat: number
    lng: number
    region?: string                        // Same as location (geocoded)
    status: 'pending' | 'partially_accepted'
    requestedBy: string                    // User name or phone
    requestedAt: Date
    requiredItems: Array<{
      category: string                     // Item name
      unit: string
      quantity: number                     // requested_qty
      itemId: string
      pinItemId: string                    // For reference in accept logic
      remainingQty: number                 // Unfulfilled quantity
    }>
    acceptedItems?: Array<{                // Only if partially_accepted
      category: string
      unit: string
      originalQuantity: number             // requested_qty
      acceptedQuantity: number             // requested_qty - remaining_qty
      remainingQuantity: number            // remaining_qty
      acceptedBy: string
      acceptedAt: Date
    }>
  }>
  error?: string
}
```

**Usage:**
```typescript
const result = await fetchConfirmedPinsForDashboard()
if (result.success) {
  setHelpRequests(result.helpRequests || [])
}
```

**Internally:**
1. Queries pins table with `status === 'confirmed'`
2. Joins with pin_items → items
3. Calculates status based on requested_qty vs remaining_qty
4. Calls `getReverseGeocodedAddress()` for each pin
5. Filters out completed pins (all remaining_qty === 0)
6. Returns data in HelpRequest format

---

### 3. `acceptHelpRequestItems(pinId: string, acceptedItems: Array<...>)`

**Purpose:** Accept (fulfill) items for a help request

**Parameters:**
```typescript
pinId: string
acceptedItems: Array<{
  pinItemId: string        // ID of the pin_item record
  acceptedQuantity: number // How many units the org can provide
}>
```

**Returns:**
```typescript
{
  success: boolean
  error?: string
}
```

**Usage:**
```typescript
const result = await acceptHelpRequestItems(pinId, [
  { pinItemId: "pni-1", acceptedQuantity: 20 },
  { pinItemId: "pni-2", acceptedQuantity: 50 }
])
```

**Logic:**
1. For each item to accept:
   - Fetch current `requested_qty` from pin_items
   - Calculate: `newRemainingQty = requested_qty - acceptedQuantity`
   - Update `remaining_qty` in database
2. Returns error if any update fails

**Example:**
- If requested_qty = 100 and acceptedQuantity = 30
- New remaining_qty = 70 (still 70 units needed)

---

### 4. `checkAndHandleCompletedPin(pinId: string)`

**Purpose:** Check if all items are fulfilled and handle completion

**Returns:**
```typescript
{
  success: boolean
  isCompleted?: boolean  // true if all remaining_qty === 0
  error?: string
}
```

**Usage:**
```typescript
const result = await checkAndHandleCompletedPin(pinId)
if (result.isCompleted) {
  // Pin is now complete, update UI accordingly
  setHelpRequests(requests => requests.filter(r => r.id !== pinId))
}
```

**Logic:**
1. Fetch all pin_items for this pin
2. Check if ALL have `remaining_qty === 0`
3. If completed:
   - Delete all related pin_items records
   - Update pin status to "completed"
4. Return success/error

---

## API Route: Reverse Geocoding

**File:** `src/app/api/reverse-geocode/route.ts`

**Endpoint:** `POST /api/reverse-geocode`

**Environment Variable Required:**
```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Request:**
```json
{
  "lat": 16.8409,
  "lng": 96.1735
}
```

**Response (Success):**
```json
{
  "success": true,
  "primary_address": "Yangon, Myanmar",
  "results": [
    {
      "formatted_address": "Yangon, Myanmar",
      "address_components": [...],
      "place_id": "...",
      "geometry": {...}
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Invalid coordinates. lat and lng must be numbers."
}
```

---

## Implementation Steps

### Step 1: Add Environment Variable

Add to `.env.local`:
```env
GOOGLE_MAPS_API_KEY=AIzaSyDjH3jc7pkdhPjdXKx2j-QJANMd6Z92SF4
```

### Step 2: Update Organization Dashboard

In `src/app/organization/page.tsx`:

```typescript
import { fetchConfirmedPinsForDashboard, acceptHelpRequestItems } from '@/services/pins'

// In useEffect on mount:
useEffect(() => {
  const loadData = async () => {
    const result = await fetchConfirmedPinsForDashboard()
    if (result.success) {
      setHelpRequests(result.helpRequests || [])
    }
  }
  loadData()
}, [])

// In handleAcceptRequest function:
const handleAcceptRequest = async () => {
  if (!selectedRequest) return

  const acceptedItems = Object.entries(acceptQuantities).map(([pinItemId, quantity]) => ({
    pinItemId,
    acceptedQuantity: quantity as number
  }))

  const result = await acceptHelpRequestItems(selectedRequest.id, acceptedItems)
  if (result.success) {
    // Refresh help requests to show updated status
    const refreshResult = await fetchConfirmedPinsForDashboard()
    setHelpRequests(refreshResult.helpRequests || [])
    setShowAcceptDialog(false)
  }
}
```

### Step 3: Update "View on Map" Navigation

In `src/app/organization/page.tsx`:

```typescript
const handleViewOnMap = async (request: HelpRequest) => {
  // Store location in session/state
  sessionStorage.setItem('mapCenter', JSON.stringify({
    lat: request.lat,
    lng: request.lng,
    location: request.location
  }))
  
  // Navigate to home page
  router.push('/')
}
```

In `src/app/page.tsx`:

```typescript
useEffect(() => {
  // Check for map center from organization dashboard
  const stored = sessionStorage.getItem('mapCenter')
  if (stored) {
    const { lat, lng, location } = JSON.parse(stored)
    setMapCenter({ lat, lng })
    sessionStorage.removeItem('mapCenter')
  }
}, [])
```

---

## UI Component Changes

### HelpRequest Cards (Main List)

**Old (Mock Data):**
```tsx
const mockHelpRequests: HelpRequest[] = [
  {
    id: '1',
    title: 'Medical Supplies Needed',
    urgency: 'high',
    status: 'pending',
    // ...
  }
]
```

**New (Database):**
```tsx
// Load from database instead
const result = await fetchConfirmedPinsForDashboard()
setHelpRequests(result.helpRequests || [])

// Each card now uses:
// - request.status (auto-calculated from pin_items)
// - request.location (geocoded from lat/lng)
// - request.requiredItems (from pin_items joined with items)
```

**Badge Logic:**
- Show ONE badge per card with status only (pending or partially_accepted)
- Badge types: `pending` (yellow), `partially_accepted` (blue)

```tsx
<Badge className={getStatusColor(request.status)}>
  {request.status === 'partially_accepted' ? 'Partially Accepted' : 'Pending'}
</Badge>

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'partially_accepted':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
```

### View Details Modal

**Required Items Table:**
```tsx
// From request.requiredItems
requiredItems: Array<{
  category: string          // Item name (e.g., "Medicine")
  unit: string             // e.g., "boxes"
  quantity: number         // requested_qty
  remainingQty: number     // Still needed
}>

// Display: "50 boxes" (remaining) out of "100 boxes" (requested)
```

**Accepted Items Table** (if `request.acceptedItems` exists):
```tsx
// From request.acceptedItems
acceptedItems: Array<{
  category: string          // Item name
  unit: string
  originalQuantity: number  // requested_qty
  acceptedQuantity: number  // Fulfilled amount
  remainingQuantity: number // Still needed
}>
```

---

## Status Transitions

```
Database Event                          UI Behavior
─────────────────────────────────────────────────
Pin created (pending)                   NOT shown in org dashboard

Pin confirmed by tracker                Shown as "pending" 
                                        (if all remaining_qty === requested_qty)

Org accepts some items                  Status changes to "partially_accepted"
                                        Shows breakdown in acceptedItems

All items accepted                      Pin is completed
(remaining_qty === 0 for all)          - All pin_items deleted
                                        - Pin status = "completed"
                                        - Removed from dashboard
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Organization Dashboard Load                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
        fetchConfirmedPinsForDashboard()
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
      pins   pin_items  items
      table    table    table
        │        │        │
        └────────┼────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 Status Logic  Geocoding  Data Transform
 (pending vs   (lat/lng → (pins → help-
 partially)    address)   requests)
    │            │            │
    └────────────┼────────────┘
                 │
                 ▼
         Display on Dashboard
                 │
                 ▼
        User clicks "Accept"
                 │
                 ▼
    acceptHelpRequestItems()
                 │
                 ▼
    Update pin_items.remaining_qty
                 │
                 ▼
    Refresh dashboard
```

---

## Error Handling

### Reverse Geocoding Failures

If Google Maps API is unavailable:
- Show "Location unknown" as fallback
- Still display other pin information
- Don't block the entire dashboard

### Database Errors

- Log errors to console
- Show toast notification to user
- Maintain current state (don't lose data)
- Allow retry action

### API Key Issues

If `GOOGLE_MAPS_API_KEY` is missing:
- Backend returns 500 error
- Frontend shows fallback with coordinates
- Check server logs for configuration

---

## Testing Checklist

- [ ] Reverse geocoding API returns correct addresses
- [ ] Dashboard loads confirmed pins with correct status
- [ ] Status badges display correctly (pending vs partially_accepted)
- [ ] View Details modal shows all required items
- [ ] Accept logic updates remaining_qty correctly
- [ ] Completed pins are removed from dashboard
- [ ] "View on Map" navigates to home with correct coordinates
- [ ] Error handling works (API down, missing keys, etc.)
- [ ] No SQL injection vulnerabilities
- [ ] API key not exposed in client code

---

## Database Query Examples

### Get all confirmed pins for org dashboard

```sql
SELECT p.* FROM pins p
WHERE p.status = 'confirmed'
ORDER BY p.created_at DESC;
```

### Get items for a pin with quantities

```sql
SELECT pi.id, pi.pin_id, pi.item_id, pi.requested_qty, pi.remaining_qty,
       i.name, i.unit, i.category
FROM pin_items pi
JOIN items i ON pi.item_id = i.id
WHERE pi.pin_id = 'pin-1';
```

### Check if pin is completed (all items fulfilled)

```sql
SELECT * FROM pin_items
WHERE pin_id = 'pin-1' AND remaining_qty > 0;
-- If returns 0 rows → pin is completed
```

### Update item fulfillment

```sql
UPDATE pin_items
SET remaining_qty = requested_qty - :accepted_qty
WHERE id = 'pni-1';
```

---

## Next Steps

1. Set up Google Maps API key in environment variables
2. Migrate organization dashboard to use new service functions
3. Test reverse geocoding with sample coordinates
4. Verify status calculation logic with database records
5. Update "View on Map" to work with new data structure
6. Test complete workflow: confirm pin → accept items → completion

