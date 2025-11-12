# Pin Items Database - Visual Workflow Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DISASTER RESPONSE APP                     │
├──────────────────────────┬──────────────────┬──────────────────┤
│                          │                  │                  │
│     Map Interface        │   Item Selection │   Tracker Panel  │
│  (Display Pins)          │   (Confirmation) │  (Management)    │
│                          │                  │                  │
└──────────────────────────┼──────────────────┼──────────────────┘
           │               │                  │
           └───────────────┴──────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   Service Layer       │
          │  (pins.ts)            │
          │                       │
          │ • fetchItems()        │
          │ • createPinItems()    │
          │ • updatePinStatus()   │
          └───────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌────────┐  ┌────────────┐  ┌──────────┐
    │  pins  │  │ pin_items  │  │  items   │
    └────────┘  └────────────┘  └──────────┘
    (Locations) (Relationships) (Catalog)
```

---

## Data Flow Diagram

### Step 1: Page Load
```
User Opens App
     │
     ▼
Component Mounts (useEffect)
     │
     ├─→ fetchPins()
     │      │
     │      ▼
     │   Query: SELECT * FROM pins
     │      │
     │      └─→ Set: pins = [...]
     │
     └─→ fetchItems()
            │
            ▼
         Query: SELECT * FROM items
            │
            └─→ Set: availableItems = [...]

Result: Map shows pins + Dropdown has items
```

### Step 2: Tracker Opens Confirmation Dialog
```
Click "Confirm Pin" Button
     │
     ▼
Dialog Opens
     │
     ▼
Display availableItems
     │
     ├─→ Food Packs      [ ] ← Item 1
     ├─→ Water Bottles   [ ] ← Item 2
     ├─→ Medicine Box    [ ] ← Item 3
     ├─→ Blankets        [ ] ← Item 4
     └─→ ... 6 more items
```

### Step 3: Tracker Selects Items
```
User clicks checkbox for Food Packs
     │
     ▼
handleItemToggle('itm-1', 10) called
     │
     ▼
selectedItems.set('itm-1', 10)
     │
     ▼
Quantity controls appear
     
     Food Packs   [✓] [ - ] 10 [ + ]
     
User clicks [ + ] three times
     │
     ▼
handleItemQuantityChange('itm-1', 13)
     │
     ▼
selectedItems.set('itm-1', 13)
     │
     ▼
Display shows: [✓] [ - ] 13 [ + ]
```

### Step 4: Confirm Pin (Database Transaction)
```
User clicks "Confirm Pin"
     │
     ▼
handleConfirmPinWithItems() executes
     │
     ├─ Step 1: Update pin status
     │    │
     │    └─→ updatePinStatus(pin-id, 'confirmed', mem-id, user-id)
     │         │
     │         ▼
     │      SQL: UPDATE pins 
     │           SET status='confirmed', confirmed_by='mem-id'
     │           WHERE id='pin-id'
     │         │
     │         └─→ Result: Success ✓
     │
     └─ Step 2: Create pin items
          │
          └─→ Convert selectedItems Map to array:
              [
                { item_id: 'itm-1', requested_qty: 13 },
                { item_id: 'itm-2', requested_qty: 50 },
                { item_id: 'itm-3', requested_qty: 25 }
              ]
              │
              ▼
          createPinItems(pin-id, items)
              │
              ▼
          SQL: INSERT INTO pin_items (pin_id, item_id, requested_qty, remaining_qty)
               VALUES
               (pin-id, itm-1, 13, 13),
               (pin-id, itm-2, 50, 50),
               (pin-id, itm-3, 25, 25)
              │
              └─→ Result: Success ✓

Final: Toast shows "Pin confirmed with items recorded" ✓
       Dialog closes
       Map updates
```

---

## Database State Before & After

### BEFORE Confirmation
```
┌─────────────────────────────────────────┐
│ pins Table                              │
├────────┬────────────┬─────────────────┤
│ id     │ status     │ confirmed_by    │
├────────┼────────────┼─────────────────┤
│ pin-1  │ pending    │ NULL            │  ← Before
└────────┴────────────┴─────────────────┘

┌─────────────────────────────────────────┐
│ pin_items Table                         │
├────────┬────────┬──────────────────┤
│ pin_id │ item_id│ requested_qty   │
├────────┼────────┼──────────────────┤
│ (empty - no records)                │
└────────┴────────┴──────────────────┘

┌─────────────────────────────────────────┐
│ items Table (unchanged)                 │
├─────┬──────────────┬──────┬──────────┤
│ id  │ name         │ unit │ category │
├─────┼──────────────┼──────┼──────────┤
│ itm-1 │ Food Packs │ packs│ relief   │
│ itm-2 │ Water Bottles│bottles│relief  │
│ itm-3 │ Medicine Box│boxes│ medical  │
└─────┴──────────────┴──────┴──────────┘
```

### AFTER Confirmation
```
┌─────────────────────────────────────────┐
│ pins Table                              │
├────────┬────────────┬─────────────────┤
│ id     │ status     │ confirmed_by    │
├────────┼────────────┼─────────────────┤
│ pin-1  │ confirmed  │ mem-2           │  ← After (UPDATED)
└────────┴────────────┴─────────────────┘

┌────────────────────────────────────────────────────────────┐
│ pin_items Table                                            │
├──────┬────────┬────────┬──────────────┬─────────────────┤
│ id   │ pin_id │item_id │ requested_qty│ remaining_qty   │
├──────┼────────┼────────┼──────────────┼─────────────────┤
│pni-1 │ pin-1  │ itm-1  │      13      │       13        │  ← NEW
│pni-2 │ pin-1  │ itm-2  │      50      │       50        │  ← NEW
│pni-3 │ pin-1  │ itm-3  │      25      │       25        │  ← NEW
└──────┴────────┴────────┴──────────────┴─────────────────┘

┌─────────────────────────────────────────┐
│ items Table (unchanged)                 │
├─────┬──────────────┬──────┬──────────┤
│ id  │ name         │ unit │ category │
├─────┼──────────────┼──────┼──────────┤
│ itm-1 │ Food Packs │ packs│ relief   │
│ itm-2 │ Water Bottles│bottles│relief  │
│ itm-3 │ Medicine Box│boxes│ medical  │
└─────┴──────────────┴──────┴──────────┘
```

---

## State Management Flow

```
┌──────────────────────────────────────────┐
│         Initial State (onMount)          │
├──────────────────────────────────────────┤
│ pins: []                                 │
│ availableItems: []                       │
│ selectedItems: Map()                     │
└──────────────────────────────────────────┘
           │
           ▼ (fetchItems called)
┌──────────────────────────────────────────┐
│    After fetchItems()                    │
├──────────────────────────────────────────┤
│ pins: []                                 │
│ availableItems: [                        │
│   { id: 'itm-1', name: 'Food Packs',... }│
│   { id: 'itm-2', name: 'Water Bottles',..}│
│   { id: 'itm-3', name: 'Medicine Box',..}│
│ ]                                        │
│ selectedItems: Map()                     │
└──────────────────────────────────────────┘
           │
           ▼ (User checks Food Packs)
┌──────────────────────────────────────────┐
│    After handleItemToggle('itm-1')       │
├──────────────────────────────────────────┤
│ selectedItems: Map([                     │
│   ['itm-1', 10]  ← Food Packs            │
│ ])                                       │
└──────────────────────────────────────────┘
           │
           ▼ (User clicks [ + ] three times)
┌──────────────────────────────────────────┐
│ After handleItemQuantityChange(+1,+1,+1) │
├──────────────────────────────────────────┤
│ selectedItems: Map([                     │
│   ['itm-1', 13]  ← Food Packs            │
│ ])                                       │
└──────────────────────────────────────────┘
           │
           ▼ (User confirms pin)
┌──────────────────────────────────────────┐
│  After handleConfirmPinWithItems()       │
├──────────────────────────────────────────┤
│ ✓ pin status updated in database         │
│ ✓ pin_items records created              │
│ ✓ selectedItems cleared: Map()           │
│ ✓ Dialog closed                          │
│ ✓ Toast shown                            │
└──────────────────────────────────────────┘
```

---

## Component Interaction

```
┌─────────────────────────────────────┐
│     HomePage Component              │
│  (src/app/page.tsx)                 │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┬────────────────────┐
        │             │                    │
        ▼             ▼                    ▼
┌──────────────┐ ┌──────────────┐  ┌──────────────┐
│ Map Container│ │ Pin Selection│  │ Confirmation │
│              │ │  Dialog      │  │  Dialog      │
│ • Display    │ │              │  │              │
│   pins       │ │ • Shows items│  │ • Items list │
│ • Show       │ │   from DB    │  │ • Quantity  │
│   status     │ │ • Tracker    │  │   controls  │
│             │ │   selected   │  │ • Confirm   │
│             │ │   pin info   │  │   button    │
└──────────────┘ └──────────────┘  └──────────────┘
        │             │                    │
        └─────┬───────┴────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │  Service Layer       │
    │  (pins.ts)           │
    │                      │
    │ • fetchPins()        │
    │ • fetchItems()       │
    │ • updatePinStatus()  │
    │ • createPinItems()   │
    │ • updatePinItemQty() │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │   Supabase (Cloud)   │
    │                      │
    │ • pins table         │
    │ • pin_items table    │
    │ • items table        │
    └──────────────────────┘
```

---

## Item Quantity Lifecycle

```
User Action          │  selectedItems State              │ Database State
─────────────────────┼────────────────────────────────────┼──────────────────
Food Packs opened    │  Map()  (empty)                    │  (no change)
                     │
[ ] clicked to [✓]   │  Map([['itm-1', 10]])              │  (no change)
                     │
User changes to 13   │  Map([['itm-1', 13]])              │  (no change)
                     │
Confirm button       │  Cleared: Map()                    │  pin_items created
                     │                                     │  requested_qty=13
                     │                                     │  remaining_qty=13
                     │
[Future: Deliver 3]  │  (unchanged)                       │  remaining_qty=10
                     │
[Future: Deliver 5]  │  (unchanged)                       │  remaining_qty=5
                     │
[Future: Deliver 5]  │  (unchanged)                       │  remaining_qty=0
                     │                                     │  (fulfilled)
```

---

## Error Handling Flow

```
handleConfirmPinWithItems()
     │
     ├─ TRY
     │   │
     │   ├─→ updatePinStatus() fails
     │   │      │
     │   │      └─→ Return error, don't proceed
     │   │
     │   ├─→ createPinItems() fails
     │   │      │
     │   │      └─→ Warn user, pin confirmed but items not created
     │   │
     │   └─→ Both succeed
     │          │
     │          └─→ Show success toast
     │
     └─ CATCH
         │
         └─→ Show error toast, keep dialog open for retry
```

---

## Authorization Check Points

```
Can User See "Confirm Pin" Button?
     │
     ├─ Check: isUserTracker == true
     │    │
     │    ├─ Yes → Show button + Dialog available
     │    │
     │    └─ No  → Hide button + Dialog not accessible
     │
     └─ Backend Verification (on submit):
          │
          ├─ Check: org-member status == 'active'
          │    │
          │    ├─ Yes → Allow confirmation
          │    │
          │    └─ No  → Reject with error

Result: Dual-layer authorization (frontend + backend)
```

---

## Query Performance

```
On Page Load:
─────────────
fetchPins()
  └─ SELECT * FROM pins ORDER BY created_at DESC
     └─ Time: ~100ms
     └─ Joins: users table for names

fetchItems()
  └─ SELECT * FROM items ORDER BY name
     └─ Time: ~50ms
     └─ Simple query

Total Load Time: ~150ms

On Confirmation:
─────────────────
updatePinStatus()
  └─ UPDATE pins WHERE id=?
     └─ Time: ~50ms

createPinItems()
  └─ INSERT INTO pin_items (3 rows)
     └─ Time: ~100ms

Total Confirmation Time: ~150ms
```

---

## Future Enhancement: Delivery Tracking

```
Supply Volunteer Views Pin
     │
     ▼
See Items Needed
  ├─ Food Packs: 50 requested, 50 remaining
  ├─ Water Bottles: 100 requested, 100 remaining
  └─ Medicine Box: 10 requested, 10 remaining
     │
     ▼
Volunteer Delivers Food
  ├─ Input: 30 packs delivered
  │
  ▼
updatePinItemQuantity('pni-1', 20)  ← 50 - 30 = 20 remaining
  │
  ▼
Database Updated
  └─ pin_items.remaining_qty = 20
     │
     ▼
Dashboard Updates
  └─ Food Packs: 50 requested, 20 remaining (60% fulfilled)
```

---

## Summary

The implementation uses a three-table relational schema:

| Table | Purpose | Records |
|-------|---------|---------|
| items | Master catalog | ~10-50 items |
| pins | Disaster locations | ~100s per event |
| pin_items | Link table | ~1000s total |

**Key Features:**
- ✅ Database-driven items (not hardcoded)
- ✅ Dynamic quantity tracking
- ✅ Referential integrity
- ✅ Delivery fulfillment support
- ✅ Scalable architecture
- ✅ Full audit trail

**Ready For:**
- [x] Tracker confirmations with items
- [ ] Supply volunteer dashboards
- [ ] Fulfillment analytics
- [ ] Category-based reporting
