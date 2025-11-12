# Testing Pin Items & Items Database Integration

## Prerequisites

Before testing, ensure you have seeded the `items` table in Supabase with sample data:

### Sample Items (Insert into Supabase)

```sql
-- Execute in Supabase SQL Editor

INSERT INTO public.items (name, unit, category) VALUES
('Food Packs', 'packs', 'relief'),
('Water Bottles', 'bottles', 'relief'),
('Medicine Box', 'boxes', 'medical'),
('Blankets', 'pieces', 'comfort'),
('Clothes Packs', 'packs', 'clothing'),
('First Aid Kit', 'kits', 'medical'),
('Sleeping Bags', 'pieces', 'comfort'),
('Canned Goods', 'cans', 'relief'),
('Emergency Supplies', 'kits', 'relief'),
('Hygiene Kits', 'kits', 'hygiene');
```

---

## Test Scenario 1: Load Items on Page Startup

### Steps:
1. Start dev server: `npm run dev`
2. Navigate to home page
3. Open browser console (F12)

### Expected Results:
✅ Console should show: `Loaded 10 items from database`
✅ No errors in console
✅ Items loaded from `items` table

### Verification:
```typescript
// Check if items were loaded
console.log('Available items:', availableItems)
```

---

## Test Scenario 2: Tracker Views Confirmation Dialog

### Prerequisites:
- Logged in as tracker user
- Pin exists in "pending" status

### Steps:
1. Click on a pending pin on map
2. Click "Confirm Pin" button (if tracker)
3. "Select Items Needed" dialog should appear

### Expected Results:
✅ Dialog displays all 10 items from database
✅ Each item shows:
   - Checkbox (unchecked)
   - Item name
   - Unit in parentheses (e.g., "Food Packs (packs)")
✅ No quantity controls visible initially

---

## Test Scenario 3: Select Item and Set Quantity

### Steps:
1. In confirmation dialog, check "Food Packs"
2. Quantity controls should appear
3. Click "+" to increase quantity to 5
4. Verify quantity shows "5"
5. Check "Water Bottles"
6. Verify two items now have quantity controls

### Expected Results:
✅ Checkbox toggles quantity controls
✅ "-" button disabled when qty = 0
✅ "+" button always available
✅ Quantity displayed correctly
✅ Multiple items can be selected
✅ Uncheck removes quantity controls

---

## Test Scenario 4: Confirm Pin with Items

### Prerequisites:
- Multiple items selected with quantities
- Example:
  - Food Packs: 50
  - Water Bottles: 100
  - Medicine Box: 10

### Steps:
1. Click "Confirm Pin" button
2. Wait for operation to complete

### Expected Results:
✅ Toast notification: "Pin confirmed with items recorded"
✅ Dialog closes
✅ Pin status changed to "confirmed" on map
✅ Map marker status indicator changes color

### Database Verification:
Check Supabase SQL Editor:

```sql
-- Verify pin status updated
SELECT id, status, confirmed_by FROM pins WHERE id = 'pin-id' LIMIT 1;
-- Should show: status='confirmed', confirmed_by='mem-id'

-- Verify pin_items created
SELECT pi.id, i.name, pi.requested_qty, pi.remaining_qty
FROM pin_items pi
JOIN items i ON pi.item_id = i.id
WHERE pi.pin_id = 'pin-id'
ORDER BY i.name;

-- Should show:
-- | id    | name            | requested_qty | remaining_qty |
-- |-------|-----------------|---------------|---------------|
-- | pni-1 | Food Packs      | 50            | 50            |
-- | pni-2 | Medicine Box    | 10            | 10            |
-- | pni-3 | Water Bottles   | 100           | 100           |
```

---

## Test Scenario 5: Confirm Pin with NO Items

### Steps:
1. Click on pending pin
2. Don't select any items
3. Click "Confirm Pin"

### Expected Results:
✅ Pin status changed to "confirmed"
✅ Toast notification shown
✅ No pin_items created (empty table)
✅ Dialog closes gracefully

### Database Verification:
```sql
-- Should show no records for this pin
SELECT COUNT(*) FROM pin_items WHERE pin_id = 'pin-id';
-- Should return: 0
```

---

## Test Scenario 6: Error Handling - Network Failure

### Prerequisites:
- Network dev tools open (throttle to slow 3G)

### Steps:
1. Select items and confirm pin
2. Simulate network error
3. Observe error handling

### Expected Results:
✅ Error toast shown
✅ Dialog remains open
✅ User can retry
✅ Database shows correct transaction state

---

## Test Scenario 7: Multiple Pins with Different Items

### Steps:
1. Confirm pin #1 with items: Food, Water
2. Confirm pin #2 with items: Medicine, Blankets
3. Confirm pin #3 with items: All 10 items
4. View each pin details

### Expected Results:
✅ Each pin shows its specific items only
✅ Quantities preserved for each pin
✅ No cross-contamination between pins

### Database Verification:
```sql
-- Count total pin_items
SELECT pin_id, COUNT(*) as item_count
FROM pin_items
GROUP BY pin_id
ORDER BY pin_id;

-- Should show:
-- pin-1: 2 items
-- pin-2: 2 items
-- pin-3: 10 items
```

---

## Test Scenario 8: Update Remaining Quantity (Future)

### Setup:
```typescript
// When supply volunteer delivers items
const result = await updatePinItemQuantity(
  'pni-1',  // pin_item id
  35        // new remaining_qty (50 - 15 delivered)
)
```

### Expected Results:
✅ remaining_qty updated in database
✅ Dashboard shows updated quantities
✅ Fulfillment percentage recalculated

---

## Test Scenario 9: Page Reload - Data Persistence

### Steps:
1. Confirm pin with items
2. Refresh page (Ctrl+R)
3. Check if data persists

### Expected Results:
✅ Pin status still "confirmed"
✅ Items still visible in dialog
✅ Quantities preserved
✅ No re-creation of pin_items

---

## Test Scenario 10: Non-Tracker User Views Items

### Steps:
1. Log in as regular (non-tracker) user
2. Navigate to home page
3. Try to open pin confirmation dialog

### Expected Results:
✅ "Confirm Pin" button not visible
✅ "Select Items Needed" dialog not accessible
✅ Frontend authorization working

---

## Browser Console Checks

Monitor these console messages:

```typescript
// On page load:
✅ "Loaded X pins from database"
✅ "Loaded 10 items from database"
✅ "User tracker status: true/false"

// During confirmation:
✅ "Pin confirmed with items recorded" (toast)

// Errors to watch for:
❌ "Cannot find name 'item'" 
❌ "Cannot read property 'id' of undefined"
❌ "Error loading pins and user role"
❌ Network errors (check Network tab)
```

---

## Database Integrity Checks

### Referential Integrity
```sql
-- Check for orphaned pin_items (should be 0)
SELECT COUNT(*) FROM pin_items pi
LEFT JOIN pins p ON pi.pin_id = p.id
WHERE p.id IS NULL;
-- Result: 0

-- Check for invalid item_ids (should be 0)
SELECT COUNT(*) FROM pin_items pi
LEFT JOIN items i ON pi.item_id = i.id
WHERE i.id IS NULL;
-- Result: 0
```

### Quantity Constraints
```sql
-- Check invalid quantities (should be 0)
SELECT COUNT(*) FROM pin_items
WHERE requested_qty <= 0 OR remaining_qty < 0;
-- Result: 0
```

### Data Consistency
```sql
-- Verify remaining_qty never exceeds requested_qty
SELECT COUNT(*) FROM pin_items
WHERE remaining_qty > requested_qty;
-- Result: 0
```

---

## Performance Checks

### Query Performance
- Items load in < 500ms
- Confirm pin operation completes in < 2s
- No N+1 queries in database

### Monitor Network Tab:
- `fetchItems()` → 1 request
- `updatePinStatus()` → 1 request
- `createPinItems()` → 1 request
- Total: 3 requests for confirmation

---

## Rollback Test

If something goes wrong:

```bash
# Revert to last stable version
git checkout HEAD~1 src/services/pins.ts src/app/page.tsx

# Or delete problematic pin_items:
# In Supabase SQL Editor:
DELETE FROM pin_items WHERE pin_id = 'problem-pin-id';
```

---

## Success Criteria Checklist

- [ ] Items fetch from database on startup
- [ ] Confirmation dialog displays all items
- [ ] Item selection toggles quantity controls
- [ ] Quantities can be incremented/decremented
- [ ] Confirm button creates pin and pin_items records
- [ ] Database shows correct relationships
- [ ] Multiple pins have independent items
- [ ] Tracker authorization enforced
- [ ] No console errors
- [ ] Page reload preserves data

---

## Common Issues & Solutions

### Issue: "Cannot find name 'itemQuantities'"
**Solution:** Check that `setSelectedItems` (Map) is used instead of `itemQuantities` (old state)

### Issue: Items dialog shows empty
**Solution:** 
1. Check that items table has data: `SELECT COUNT(*) FROM items;`
2. Verify `fetchItems()` called on page load
3. Check browser console for network errors

### Issue: Pin not confirming
**Solution:**
1. Verify user is logged in as tracker
2. Check `isUserActiveTracker()` returns true
3. Verify `org-member` record exists for user

### Issue: pin_items not created
**Solution:**
1. Verify `selectedItems.size > 0`
2. Check item_ids are valid UUIDs
3. Verify items exist in database

---

## Next Steps

After successful testing:
1. Add supply volunteer delivery tracking
2. Create fulfillment analytics dashboard
3. Add category-based filtering
4. Implement bulk item requests
5. Add historical item analytics
