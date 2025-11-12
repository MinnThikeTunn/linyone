# Frontend Integration Testing Guide

## Pre-Testing Checklist

- [ ] Node modules installed (`npm install`)
- [ ] `.env.local` file exists
- [ ] `GOOGLE_MAPS_API_KEY` added to `.env.local`
- [ ] Supabase project configured
- [ ] Database tables created (pins, pin_items, items)
- [ ] No TypeScript errors (`npm run build`)

## Environment Setup

### 1. Add Google Maps API Key

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Get Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Maps API: Geocoding API
4. Create API key (Restricted to your domain)
5. Copy key to `.env.local`

### 2. Create Test Data

Run these SQL commands in Supabase:

```sql
-- Insert test items
INSERT INTO items (id, name, unit, category) VALUES
  ('item-001', 'Rice Bags', 'bags', 'Food'),
  ('item-002', 'Water Bottles', 'boxes', 'Water'),
  ('item-003', 'First Aid Kits', 'units', 'Medical');

-- Insert test pin (pending)
INSERT INTO pins (id, status, latitude, longitude, description, type, phone, created_by, created_at, user_id)
VALUES
  ('pin-001', 'confirmed', 40.7128, -74.0060, 'Family of 4 needs food and water', 'damage', '555-0001', 'Test User', NOW(), NULL);

-- Insert pin items for test pin
INSERT INTO pin_items (id, pin_id, item_id, requested_qty, remaining_qty)
VALUES
  ('pitem-001', 'pin-001', 'item-001', 50, 50),   -- All needed
  ('pitem-002', 'pin-001', 'item-002', 100, 100);  -- All needed

-- Insert test pin (partially accepted)
INSERT INTO pins (id, status, latitude, longitude, description, type, phone, created_by, created_at, user_id)
VALUES
  ('pin-002', 'confirmed', 34.0522, -118.2437, 'Emergency shelter needed for elderly', 'damage', '555-0002', 'Test User', NOW(), NULL);

-- Insert pin items for partially accepted pin
INSERT INTO pin_items (id, pin_id, item_id, requested_qty, remaining_qty)
VALUES
  ('pitem-003', 'pin-002', 'item-002', 200, 150),  -- 50 accepted, 150 remaining
  ('pitem-004', 'pin-002', 'item-003', 10, 10);    -- All needed
```

## Manual Testing

### Test 1: Dashboard Loads Data

**Steps:**
1. Navigate to Organization Dashboard (`/organization`)
2. Look at "Help Requests (Confirmed Pins)" section

**Expected Results:**
- [ ] 2 help request cards appear
- [ ] "Pending" status badge on both
- [ ] Addresses show as real street addresses (geocoded)
- [ ] Required items display in grid below each request
- [ ] No console errors

**What it tests:**
- ✅ Database connection working
- ✅ fetchConfirmedPinsForDashboard() returns data
- ✅ Geocoding API working
- ✅ Status calculation correct

---

### Test 2: View Details Modal

**Steps:**
1. Click "View Details" on first help request
2. Examine the modal that opens

**Expected Results:**
- [ ] Modal shows full request details
- [ ] "Required Items" table shows:
  - [ ] Category name (Rice Bags, Water Bottles)
  - [ ] Unit (bags, boxes)
  - [ ] Remaining quantity (50, 100)
  - [ ] No errors about missing fields

**What it tests:**
- ✅ Modal rendering
- ✅ RequiredItems structure correct
- ✅ Database fields displayed properly

---

### Test 3: Accept Request Workflow

**Steps:**
1. From View Details modal, click "Accept Request"
2. Accept Request dialog should open
3. In the "You Can Provide" column, enter a quantity:
   - [ ] For first item: Enter `30`
   - [ ] For second item: Leave blank or enter `0`
4. Click "Accept Request" button

**Expected Results:**
- [ ] Dialog closes
- [ ] Help requests reload
- [ ] First help request should update:
  - [ ] Status still "Pending" (not all fulfilled)
  - [ ] Items show updated counts
  - [ ] Required items grid updates

**Console Checks:**
- [ ] No errors
- [ ] Should see: "Item accepted successfully" or similar
- [ ] No 400/500 errors

**What it tests:**
- ✅ AcceptQuantities keyed by pinItemId
- ✅ acceptHelpRequestItems() updates database
- ✅ fetchConfirmedPinsForDashboard() refresh works
- ✅ Status recalculation happens

---

### Test 4: Partial Acceptance Displays Correctly

**Steps:**
1. Look at second help request (pin-002)
2. Click "View Details"

**Expected Results:**
- [ ] Modal shows items with remaining quantities
- [ ] First item shows: remaining = 150 (because 50 already accepted)
- [ ] Second item shows: remaining = 10 (all needed)
- [ ] Status badge shows "Partially Accepted"

**What it tests:**
- ✅ Database accepts previous acceptance
- ✅ Remaining quantities calculated correctly
- ✅ Status shows "Partially Accepted" when appropriate

---

### Test 5: Additional Accept Action

**Steps:**
1. Accept remaining items for second request:
   - [ ] Water Bottles: Enter `150` (accept all remaining)
   - [ ] First Aid Kits: Enter `10` (accept all)
2. Click "Accept Request"

**Expected Results:**
- [ ] Dialog closes
- [ ] Dashboard reloads
- [ ] Second help request should DISAPPEAR from list
  - (Because all items fulfilled, status = completed, filtered out)
- [ ] Only first request remains visible

**What it tests:**
- ✅ Completed pins filtered out automatically
- ✅ Status calculation: all items fulfilled = completed
- ✅ Dashboard refresh removes completed requests

---

### Test 6: Quantity Validation

**Steps:**
1. Open accept dialog for remaining request
2. Try to enter quantity larger than available:
   - [ ] Try to enter `100` for item with only `50` remaining
   - [ ] Try to enter `-5`

**Expected Results:**
- [ ] Input should cap at max available
- [ ] Negative numbers rejected
- [ ] Input field should show corrected value

**What it tests:**
- ✅ Input validation working
- ✅ Min/Max constraints respected

---

### Test 7: Error Handling

**Steps:**
1. Temporarily comment out GOOGLE_MAPS_API_KEY in .env.local
2. Refresh dashboard

**Expected Results:**
- [ ] Help requests still load and display
- [ ] Location field shows "Location unknown"
- [ ] No crash/blank page
- [ ] Console shows error but app continues

**Steps 2:**
1. Restore GOOGLE_MAPS_API_KEY
2. Disconnect from Supabase (turn off network)
3. Click "Accept Request" and submit

**Expected Results:**
- [ ] Error logged to console
- [ ] Dialog remains open
- [ ] No data corrupted

**What it tests:**
- ✅ Error handling graceful
- ✅ App doesn't crash on API failures
- ✅ User can retry

---

## Automated Testing (Optional)

### Test Accept Workflow Programmatically

```typescript
// Test that pinItemId is used correctly
describe('Accept Workflow', () => {
  test('should use pinItemId as key in acceptQuantities', async () => {
    const helpRequest = {
      requiredItems: [
        { 
          pinItemId: 'pin-item-001',
          category: 'Food',
          remainingQty: 50
        }
      ]
    }
    
    // Simulate user entering quantity
    const acceptQuantities = {
      'pin-item-001': 30  // Key is pinItemId, NOT category
    }
    
    const itemsToAccept = helpRequest.requiredItems
      .filter(item => acceptQuantities[item.pinItemId] > 0)
      .map(item => ({
        pinItemId: item.pinItemId,
        acceptedQuantity: acceptQuantities[item.pinItemId]
      }))
    
    expect(itemsToAccept[0].pinItemId).toBe('pin-item-001')
    expect(itemsToAccept[0].acceptedQuantity).toBe(30)
  })
})
```

---

## Performance Testing

### Check for Memory Leaks

**Steps:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Record a 10-second session of:
   - Dashboard load
   - Open/close View Details modal 5 times
   - Accept items 2 times
4. Stop recording
5. Check for memory continuously increasing

**Expected Results:**
- [ ] Memory stays relatively stable
- [ ] No garbage collection warnings
- [ ] Smooth animations

---

## Troubleshooting

### Issue: "Cannot read property 'pinItemId'"

**Cause:** Old code trying to use wrong key
**Solution:** Code already updated - just verify it:

```typescript
// CORRECT ✅
acceptQuantities[item.pinItemId]

// WRONG ❌
acceptQuantities[item.category]
```

---

### Issue: "Help requests don't load"

**Checklist:**
- [ ] GOOGLE_MAPS_API_KEY in .env.local
- [ ] Supabase connection working (try other pages)
- [ ] At least one 'confirmed' pin exists in database
- [ ] Console shows specific error - check that error message

**Debug:**
```typescript
// Add temporary logging
useEffect(() => {
  const loadHelpRequests = async () => {
    console.log('🔄 Loading help requests...')
    const result = await fetchConfirmedPinsForDashboard()
    console.log('📦 Result:', result)
    if (result.success && result.helpRequests) {
      console.log('✅ Loaded:', result.helpRequests.length, 'requests')
      setHelpRequests(result.helpRequests)
    } else {
      console.error('❌ Error:', result.error)
    }
  }
  loadHelpRequests()
}, [])
```

---

### Issue: "Addresses show as 'Location unknown'"

**Cause:** Google Maps API key invalid or Geocoding API not enabled
**Solution:**
1. Check API key in console
2. Go to [Google Cloud Console](https://console.cloud.google.com/)
3. Enable "Geocoding API" for your project
4. Wait 2-5 minutes for changes to propagate
5. Restart dev server: `npm run dev`

---

### Issue: "Accept button doesn't work"

**Debug Steps:**
1. Check console for errors
2. Verify you entered quantities > 0
3. Check acceptQuantities state before submit:

```typescript
// Add temp logging in handleAcceptRequest
console.log('Accept quantities:', acceptQuantities)
console.log('Selected items:', selectedRequest.requiredItems)

const itemsToAccept = selectedRequest.requiredItems
  .filter(item => {
    const qty = acceptQuantities[item.pinItemId] || 0
    console.log(`Item ${item.pinItemId}: qty=${qty}`)
    return qty > 0
  })
  .map(item => ({
    pinItemId: item.pinItemId,
    acceptedQuantity: acceptQuantities[item.pinItemId] || 0
  }))

console.log('Items to accept:', itemsToAccept)
```

---

## Success Criteria

✅ **All Tests Pass When:**

1. Dashboard loads help requests from database
2. Addresses geocoded correctly
3. Status calculated as pending/partially_accepted
4. Completed requests hidden
5. Accept workflow updates database
6. Quantities keyed by pinItemId (not category)
7. Remaining quantities update after acceptance
8. No TypeScript errors
9. No console errors
10. No memory leaks
11. Accept dialog validates inputs

---

## Deployment Checklist

Before deploying to production:

- [ ] All manual tests passed
- [ ] `npm run build` succeeds with 0 errors
- [ ] No console warnings or errors
- [ ] GOOGLE_MAPS_API_KEY configured in production
- [ ] Supabase connection string verified
- [ ] Database migrations applied
- [ ] Tested with real user data
- [ ] Performance acceptable (< 2s page load)
- [ ] Tested with slow network (DevTools throttle)
- [ ] Error boundaries in place

---

**Test Status:** Ready  
**Expected Duration:** 15-20 minutes  
**Success Rate Target:** 100%  
**Go/No-Go Decision:** Based on all tests passing
