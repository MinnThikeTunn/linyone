# Database Integration Implementation Checklist

## 1. Environment Setup

- [ ] Add `GOOGLE_MAPS_API_KEY` to `.env.local`
  ```env
  GOOGLE_MAPS_API_KEY=your_api_key_here
  ```

## 2. Backend Services (✅ COMPLETED)

- [x] Created `src/app/api/reverse-geocode/route.ts`
  - Server-side Google Maps API wrapper
  - Protects API key from client exposure
  
- [x] Added 4 new functions to `src/services/pins.ts`
  - `getReverseGeocodedAddress(lat, lng)` - Get address from coordinates
  - `fetchConfirmedPinsForDashboard()` - Fetch confirmed pins with full details
  - `acceptHelpRequestItems(pinId, items)` - Accept items for a pin
  - `checkAndHandleCompletedPin(pinId)` - Handle completion logic

## 3. Organization Dashboard UI Updates

### 3.1 Help Requests List

- [ ] Update data loading in `useEffect`:
  ```typescript
  useEffect(() => {
    const loadHelpRequests = async () => {
      const result = await fetchConfirmedPinsForDashboard()
      if (result.success) {
        setHelpRequests(result.helpRequests || [])
      }
    }
    loadHelpRequests()
  }, [])
  ```

- [ ] Remove mock data setup
  - Remove `const mockHelpRequests = [...]`
  - Remove initial state from `useState`

- [ ] Update status filter if needed
  - Status values: 'pending' | 'partially_accepted'
  - No 'completed' status shown (pins deleted after completion)

### 3.2 Card Display (Each Help Request Card)

- [ ] Show ONE badge per card with status only:
  ```tsx
  <Badge className={getStatusColor(request.status)}>
    {request.status === 'partially_accepted' ? 'Partially Accepted' : 'Pending'}
  </Badge>
  ```

- [ ] Update `getStatusColor()` function:
  ```typescript
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

- [ ] Display location from geocoding:
  ```tsx
  <div className="flex items-center gap-1 text-gray-600">
    <MapPin className="w-4 h-4" />
    {request.location}  {/* Already geocoded */}
  </div>
  ```

### 3.3 View Details Modal

- [ ] Update `handleViewRequest()` to store selected request with geocoded location
  
- [ ] Display required items in table:
  ```tsx
  {request.requiredItems.map((item) => (
    <TableRow key={item.itemId}>
      <TableCell>{item.category}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell>{item.quantity} {item.unit}</TableCell>
      <TableCell>{item.remainingQty} {item.unit}</TableCell>
      {/* quantity vs remainingQty shows requested vs still needed */}
    </TableRow>
  ))}
  ```

- [ ] Display accepted items if `request.acceptedItems` exists:
  ```tsx
  {request.acceptedItems && request.acceptedItems.map((item) => (
    <TableRow key={item.category}>
      <TableCell>{item.category}</TableCell>
      <TableCell>{item.acceptedQuantity} of {item.originalQuantity}</TableCell>
      <TableCell>{item.remainingQuantity} {item.unit}</TableCell>
    </TableRow>
  ))}
  ```

### 3.4 Accept Request Dialog

- [ ] Update `handleAcceptRequest()`:
  ```typescript
  const handleAcceptRequest = async () => {
    if (!selectedRequest) return

    const acceptedItems = Object.entries(acceptQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([pinItemId, quantity]) => ({
        pinItemId,
        acceptedQuantity: quantity as number
      }))

    if (acceptedItems.length === 0) {
      toast({ title: 'Error', description: 'Enter quantities to accept' })
      return
    }

    const result = await acceptHelpRequestItems(selectedRequest.id, acceptedItems)
    if (result.success) {
      // Refresh help requests
      const refreshResult = await fetchConfirmedPinsForDashboard()
      setHelpRequests(refreshResult.helpRequests || [])
      setShowAcceptDialog(false)
      setAcceptQuantities({})
      setSelectedRequest(null)
      toast({ title: 'Success', description: 'Items accepted successfully' })
    } else {
      toast({ 
        title: 'Error', 
        description: result.error || 'Failed to accept items',
        variant: 'destructive'
      })
    }
  }
  ```

- [ ] Input fields for each required item:
  ```tsx
  {selectedRequest?.requiredItems.map((item) => (
    <div key={item.pinItemId} className="space-y-2">
      <Label>{item.category} ({item.remainingQty} still needed)</Label>
      <Input
        type="number"
        min="0"
        max={item.remainingQty}
        placeholder={`You can provide max ${item.remainingQty}`}
        value={acceptQuantities[item.pinItemId] || ''}
        onChange={(e) => setAcceptQuantities(prev => ({
          ...prev,
          [item.pinItemId]: parseInt(e.target.value) || 0
        }))}
      />
      <span className="text-sm text-gray-500">
        {item.remainingQty} / {item.quantity} {item.unit}
      </span>
    </div>
  ))}
  ```

### 3.5 View on Map Button

- [ ] Update `handleViewOnMap()`:
  ```typescript
  const handleViewOnMap = (request: HelpRequest) => {
    // Store location data for main page
    sessionStorage.setItem('mapCenter', JSON.stringify({
      lat: request.lat,
      lng: request.lng,
      location: request.location
    }))
    router.push('/')
  }
  ```

- [ ] In `src/app/page.tsx`, update `useEffect` to read stored location:
  ```typescript
  useEffect(() => {
    const stored = sessionStorage.getItem('mapCenter')
    if (stored) {
      const { lat, lng, location } = JSON.parse(stored)
      setMapCenter({ lat, lng })
      // Optionally: show toast with location name
      sessionStorage.removeItem('mapCenter')
    }
  }, [])
  ```

## 4. Status Calculation Logic (Automatic)

The status is calculated automatically in `fetchConfirmedPinsForDashboard()`:

```typescript
// Status Logic:
// ✓ If all items: remaining_qty === requested_qty → status = "pending"
// ✓ If any item: 0 < remaining_qty < requested_qty → status = "partially_accepted"
// ✓ If all items: remaining_qty === 0 → PIN IS DELETED (completed)

// Your UI just displays the status badge without custom logic
```

## 5. Badge Display (ONE per Card)

### Current (Remove)
```tsx
// OLD - Remove these badges
<Badge>urgent</Badge>  {/* urgency removed */}
<Badge>pending</Badge> {/* status shown with urgency */}
```

### New (Add)
```tsx
// NEW - One badge with status only
<Badge className={getStatusColor(request.status)}>
  {request.status === 'partially_accepted' ? 'Partially Accepted' : 'Pending'}
</Badge>
```

## 6. Data Structure Changes

### Before (Mock)
```typescript
interface HelpRequest {
  id: string
  title: string
  description: string
  location: string         // Hard-coded
  lat: number
  lng: number
  region?: string          // Hard-coded
  image?: string           // Hard-coded
  urgency: 'low' | 'medium' | 'high'  // ❌ REMOVED
  status: 'pending' | 'partially_accepted' | 'completed'
  requestedBy: string
  requestedAt: Date
  requiredItems: RequiredItem[]
  acceptedItems?: AcceptedItem[]
}
```

### After (Database)
```typescript
interface HelpRequest {
  id: string
  title: string           // Generated from pin.type
  description: string    // From pins.description
  location: string       // 🟢 NOW GEOCODED from lat/lng
  lat: number           // From pins.latitude
  lng: number           // From pins.longitude
  region?: string       // 🟢 Same as location (geocoded)
  image?: string        // From pins.image_url
  // ❌ urgency field removed
  status: 'pending' | 'partially_accepted'  // 🟢 Auto-calculated from pin_items
  requestedBy: string   // From users or pins.phone
  requestedAt: Date     // From pins.created_at
  requiredItems: Array<{
    category: string    // item.name
    unit: string       // item.unit
    quantity: number   // pin_item.requested_qty
    itemId: string
    pinItemId: string  // 🟢 NEW for accept logic
    remainingQty: number  // 🟢 NEW - pin_item.remaining_qty
  }>
  acceptedItems?: Array<{  // 🟢 Only shown if partially_accepted
    category: string
    unit: string
    originalQuantity: number      // requested_qty
    acceptedQuantity: number      // requested_qty - remaining_qty
    remainingQuantity: number     // remaining_qty
    acceptedBy: string
    acceptedAt: Date
  }>
}
```

## 7. Type Safety

- [ ] Update interface imports:
  ```typescript
  import { 
    fetchConfirmedPinsForDashboard, 
    acceptHelpRequestItems 
  } from '@/services/pins'
  ```

- [ ] Update type definitions to match new data structure
- [ ] Remove urgency-related types
- [ ] Add `pinItemId` to requiredItems

## 8. Error Handling

- [ ] Handle reverse geocoding API errors gracefully
  - Show "Location unknown" instead of failing
  
- [ ] Handle missing API key
  - Check server logs for configuration errors
  
- [ ] Handle database errors
  - Show user-friendly error messages
  
- [ ] Handle empty results
  - Show "No help requests" when dashboard loads with no confirmed pins

## 9. Testing

### Manual Tests

- [ ] [ ] Add test pins to database (status = 'confirmed')
- [ ] [ ] Add pin_items for test pins
- [ ] [ ] Verify reverse geocoding shows correct addresses
- [ ] [ ] Test "pending" status display
- [ ] [ ] Accept some items → verify "partially_accepted" status
- [ ] [ ] Accept all items → verify pin disappears from dashboard
- [ ] [ ] Test "View on Map" navigation
- [ ] [ ] Test error cases (network down, API key missing)

### Database Verification

```sql
-- Check confirmed pins
SELECT id, status, latitude, longitude FROM pins WHERE status = 'confirmed';

-- Check pin items
SELECT pi.*, i.name FROM pin_items pi
JOIN items i ON pi.item_id = i.id
WHERE pi.pin_id = 'your-pin-id';

-- Verify status calculation
SELECT pi.pin_id, pi.requested_qty, pi.remaining_qty,
  CASE 
    WHEN pi.remaining_qty = pi.requested_qty THEN 'pending'
    WHEN pi.remaining_qty = 0 THEN 'completed'
    ELSE 'partially_accepted'
  END as calculated_status
FROM pin_items pi;
```

## 10. Deployment Checklist

- [ ] Google Maps API key added to production environment
- [ ] Database migrations run (if any)
- [ ] All tests passing
- [ ] Error logging configured
- [ ] Performance tested with realistic data volume
- [ ] Security review completed (API key protection)
- [ ] Documentation updated
- [ ] Rollback plan prepared

---

## File Changes Summary

| File | Changes | Status |
|------|---------|--------|
| `src/app/api/reverse-geocode/route.ts` | Created | ✅ |
| `src/services/pins.ts` | Added 4 functions | ✅ |
| `src/app/organization/page.tsx` | Update UI logic | ⏳ |
| `.env.local` | Add API key | ⏳ |
| `ORGANIZATION_DASHBOARD_DB_INTEGRATION.md` | Created guide | ✅ |

---

## Quick Start Commands

```bash
# Add environment variable
echo "GOOGLE_MAPS_API_KEY=your_key_here" >> .env.local

# Test reverse geocoding API
curl -X POST http://localhost:3000/api/reverse-geocode \
  -H "Content-Type: application/json" \
  -d '{"lat": 16.8409, "lng": 96.1735}'

# Development server
npm run dev
```

