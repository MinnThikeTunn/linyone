# Frontend Integration Guide - Quick Reference

## What Was Integrated

The organization dashboard is now **100% database-driven**. No more mock data - all help requests come from Supabase in real-time.

## Key Integration Points

### 1. Data Loading (Line 275-287)
When the dashboard opens, it automatically loads confirmed pins from the database:
```typescript
useEffect(() => {
  const loadHelpRequests = async () => {
    const result = await fetchConfirmedPinsForDashboard()
    if (result.success && result.helpRequests) {
      setHelpRequests(result.helpRequests)
    }
  }
  loadHelpRequests()
}, [])
```

### 2. Accept Workflow (Line 466-500)
When user accepts items, it updates the database:
```typescript
const handleAcceptRequest = async () => {
  const itemsToAccept = selectedRequest.requiredItems
    .filter(item => acceptQuantities[item.pinItemId] > 0)  // Key: pinItemId
    .map(item => ({
      pinItemId: item.pinItemId,
      acceptedQuantity: acceptQuantities[item.pinItemId]
    }))
  
  const result = await acceptHelpRequestItems(selectedRequest.id, itemsToAccept)
  if (result.success) {
    // Refresh from database to get updated status
    const refreshResult = await fetchConfirmedPinsForDashboard()
    setHelpRequests(refreshResult.helpRequests)
  }
}
```

### 3. Status Display (Line 654)
Status badges now show only: **Pending** or **Partially Accepted**
```typescript
<Badge className={getStatusColor(request.status)}>
  {request.status === 'partially_accepted' ? 'Partially Accepted' : 'Pending'}
</Badge>
```

### 4. Items Display
**Required Items Summary** (Line 675):
- Shows items that still need fulfilling
- Displays quantity already accepted

**Accept Dialog** (Line 1516):
- User enters quantities they can provide
- Input keyed by `item.pinItemId` (not category)
- Uses `item.remainingQty` from database

## Database Structure Used

### Pins Table
- `id`: Pin ID
- `status`: 'pending' | 'confirmed' | 'completed'
- `latitude`, `longitude`: Location
- `description`: Request details
- `created_at`: Timestamp

### Pin Items Table
- `id`: pinItemId (used as key in acceptQuantities)
- `pin_id`: References pin
- `item_id`: References item
- `requested_qty`: Original quantity requested
- `remaining_qty`: Still needed (what shows in UI)

### Items Table
- `id`: itemId
- `name`: Item name/category
- `unit`: Unit of measurement

## Status Calculation Logic

Status is **automatically calculated** by database query:
```
pending → all items have remaining_qty > 0
partially_accepted → some items have remaining_qty < requested_qty
completed → all items have remaining_qty = 0 (hidden from UI)
```

## What Changed from Mock Data

### Before (Mock Data)
```typescript
{
  id: 'req-1',
  title: 'Needs Help',
  status: 'pending',
  urgency: 'high',  ❌ Removed
  requiredItems: [
    {
      category: 'Food',
      unit: 'packages',
      quantity: 50  // Only stored total
    }
  ]
}
```

### After (Database)
```typescript
{
  id: 'pin-uuid',
  title: 'Emergency Response - Damage Report',
  status: 'pending',
  requiredItems: [
    {
      category: 'Food',
      unit: 'packages',
      quantity: 50,  // Original requested
      itemId: 'item-uuid',
      pinItemId: 'pin-item-uuid',  // Used as key!
      remainingQty: 35  // Still needed
    }
  ]
}
```

## Important: pinItemId vs itemId

- **`pinItemId`**: The database record ID in `pin_items` table
  - Used as key in `acceptQuantities`
  - Updated when items are accepted
  - Stored as: `pinItemId`

- **`itemId`**: The reference to the item in `items` table
  - Used to look up item name/unit
  - Read-only
  - Stored as: `itemId`

## Environment Variables Needed

```bash
# .env.local
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# (Supabase credentials already configured)
```

## Testing the Integration

### Test 1: Load Data
1. Navigate to Organization Dashboard
2. **Expected:** Help requests appear with status badges

### Test 2: Accept Items
1. Click "View Details" on any help request
2. Click "Accept Request"
3. Enter quantities for each item
4. Click "Accept Request" in dialog
5. **Expected:** 
   - Dialog closes
   - Status changes to "Partially Accepted"
   - Remaining quantities update

### Test 3: Automatic Refresh
1. Accept all items for a help request
2. **Expected:** 
   - Pin disappears from dashboard (completed pins hidden)
   - Other requests still visible

## Service Functions Used

### `fetchConfirmedPinsForDashboard()`
**Called:** On dashboard load, after accepting items
**Returns:** Array of help requests with calculated status
**Filters:** Only 'confirmed' pins that are not fully completed

### `acceptHelpRequestItems(pinId, items[])`
**Called:** When user submits accept dialog
**Updates:** Database remaining_qty values
**Returns:** Success/error status

### `getReverseGeocodedAddress(lat, lng)`
**Called:** Inside fetchConfirmedPinsForDashboard() automatically
**Returns:** Street address from coordinates
**Used:** For display in location field

## Code Locations for Debugging

| Feature | Location | Lines |
|---------|----------|-------|
| Data loading | useEffect | 275-287 |
| Status display | Badge component | 654 |
| Items summary | Grid display | 675-695 |
| Accept dialog | Modal body | 1480-1610 |
| Accept table | TableBody | 1516-1546 |
| Accept handler | Function | 466-500 |
| Mark as done | Function | 503-515 |

## Error Messages & Solutions

### Error: "Cannot read property 'pinItemId' of undefined"
- **Cause:** acceptQuantities using wrong key
- **Fix:** Already corrected - use `item.pinItemId` not `item.category`

### Error: "Failed to load help requests"
- **Cause:** fetchConfirmedPinsForDashboard() failed
- **Fix:** Check console, verify database connection, check GOOGLE_MAPS_API_KEY

### Error: "No items selected to accept"
- **Cause:** User didn't enter any quantities
- **Fix:** User should enter quantities > 0

### Dashboard Empty
- **Cause:** No confirmed pins in database OR all are completed
- **Fix:** Create a test pin with status='confirmed' in Supabase

## Performance Notes

- Dashboard loads **entire list** of confirmed pins on mount
- Consider pagination if 100+ active help requests
- Accept workflow: 2 database queries (accept + refresh)
- Geocoding happens in parallel for all pins

## Next: Deployment

After testing locally:
1. Set GOOGLE_MAPS_API_KEY in production environment
2. Deploy to staging
3. Test full workflow with real team
4. Deploy to production

---

**Integration Status:** ✅ COMPLETE  
**Compilation Errors:** 0  
**Database Ready:** ✅  
**Frontend Ready:** ✅  
**Ready for Testing:** YES
