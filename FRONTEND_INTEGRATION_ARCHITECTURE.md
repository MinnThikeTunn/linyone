# Frontend-Database Integration Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   ORGANIZATION DASHBOARD                         │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Organization    │
                    │  Page.tsx        │
                    │  (Component)     │
                    └──────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐      ┌──────────────┐      ┌────────────┐
    │ useEffect│      │  State:      │      │ Handlers:  │
    │ (Mount)  │      │  - helpReqs  │      │ - Accept   │
    │          │      │  - selected  │      │ - MarkDone │
    └─────────┘      │  - quantities│      │ - View     │
         │            └──────────────┘      └────────────┘
         │                   ▲                      │
         │                   │                      │
         └───────────────────┼──────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
    ┌──────────────────────┐    ┌─────────────────────────┐
    │ fetchConfirmed       │    │ acceptHelpRequest       │
    │ PinsForDashboard()   │    │ Items()                 │
    └──────────────────────┘    └─────────────────────────┘
              │                             │
              ▼                             ▼
    ┌──────────────────────┐    ┌─────────────────────────┐
    │  Supabase Query:     │    │  Supabase Update:       │
    │  SELECT * FROM pins  │    │  UPDATE pin_items SET   │
    │  WHERE status =      │    │  remaining_qty = ...    │
    │  'confirmed'         │    │                         │
    └──────────────────────┘    └─────────────────────────┘
              │                             │
              ▼                             ▼
    ┌──────────────────────┐    ┌─────────────────────────┐
    │ JOIN pin_items,      │    │ Return success/error    │
    │ items tables         │    └─────────────────────────┘
    └──────────────────────┘             │
              │                          │
              ▼                          │
    ┌──────────────────────┐            │
    │ Calculate Status:    │            │
    │ - pending (all req)  │            │
    │ - part_accepted      │            │
    │ - completed (hide)   │            │
    └──────────────────────┘            │
              │                          │
              ▼                          │
    ┌──────────────────────┐            │
    │ Geocode Addresses    │            │
    │ (getReverseGeo...)   │            │
    └──────────────────────┘            │
              │                          │
              ▼                          │
    ┌──────────────────────┐            │
    │ Return helpRequests  │            │
    │ array with:          │            │
    │ - location (geocoded)│            │
    │ - status (calculated)│            │
    │ - requiredItems      │            │
    │ - acceptedItems      │            │
    └──────────────────────┘            │
              │                          │
              ▼                          ▼
         ┌─────────────────────────────────┐
         │  setHelpRequests(data)          │
         │  Updates component state        │
         └─────────────────────────────────┘
              │
              ▼
         ┌─────────────────────────────────┐
         │  Component Re-renders           │
         │  Displays help requests cards   │
         └─────────────────────────────────┘
```

## Component State Management

```
┌─────────────────────────────────────────────────┐
│         React Component State                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  const [helpRequests, setHelpRequests]         │
│    → Array of HelpRequest from database         │
│    → Updated on mount via useEffect             │
│    → Updated after accept/markdone actions      │
│                                                 │
│  const [selectedRequest, setSelectedRequest]   │
│    → Current request in View Details modal      │
│    → Used in accept dialog                      │
│                                                 │
│  const [acceptQuantities, setAcceptQuantities] │
│    → Key: item.pinItemId                        │
│    → Value: quantity user will provide          │
│    → Cleared after successful accept            │
│                                                 │
│  const [showAcceptDialog, setShowAcceptDialog] │
│  const [showCompleteDialog, ...CompleteDialog] │
│  const [proofImage, setProofImage]             │
│    → Dialog/modal control states                │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Database Schema Used

```
┌──────────────────┐      ┌──────────────────┐
│   pins           │      │   pin_items      │
├──────────────────┤      ├──────────────────┤
│ id (PK)          │◄─────┤ id (PK)          │
│ status*          │      │ pin_id (FK)◄─┐   │
│ latitude         │      │ item_id (FK)├─┼─┐│
│ longitude        │      │ requested_qty││││
│ description      │      │ remaining_qty││││
│ created_at       │      │ created_at   │││
│ user_id          │      └──────────────┘││
│ type             │                      ││
└──────────────────┘                      ││
       ▲                                   ││
       │ *Status Values:                  ││
       │ - 'pending' (shown)              ││
       │ - 'confirmed' (shown)            ││
       │ - 'completed' (hidden)           ││
       │                                   ││
       └─── Only 'confirmed' + not fully  ││
           completed are fetched          ││
                                          ││
                        ┌──────────────────┘│
                        │                   │
                   ┌────▼─────────┐ ┌──────▼──┐
                   │   items      │ │  users  │
                   ├──────────────┤ ├─────────┤
                   │ id (PK)      │ │ id (PK) │
                   │ name         │ │ name    │
                   │ unit         │ │ role    │
                   │ category     │ └─────────┘
                   └──────────────┘
```

## Accept Items Workflow

```
User Views Help Request
         │
         ▼
Click "Accept Request" Button
         │
         ▼
┌─────────────────────────────────┐
│   Accept Dialog Opens           │
│  (Shows Required Items Table)   │
└─────────────────────────────────┘
         │
         ├─► For each item:
         │   - Display: category, unit, remainingQty
         │   - Input field keyed by: item.pinItemId ◄─── IMPORTANT!
         │   - Max value: item.remainingQty
         │   - User enters quantity they can provide
         │
         ▼
User Clicks "Accept Request"
         │
         ▼
┌─────────────────────────────────┐
│ handleAcceptRequest()           │
│ (Async function)                │
└─────────────────────────────────┘
         │
         ├─► Build itemsToAccept array:
         │   [
         │     {
         │       pinItemId: "pin-item-uuid-1",
         │       acceptedQuantity: 10
         │     },
         │     {
         │       pinItemId: "pin-item-uuid-2",
         │       acceptedQuantity: 20
         │     }
         │   ]
         │
         ▼
Call acceptHelpRequestItems(pinId, itemsToAccept)
         │
         ▼
┌─────────────────────────────────┐
│ Backend Updates Database:       │
│ UPDATE pin_items               │
│ SET remaining_qty =            │
│   remaining_qty - acceptedQty  │
│ WHERE id = pinItemId           │
└─────────────────────────────────┘
         │
         ▼
Return success/error
         │
         ├─► If error: Show console error, keep dialog open
         │
         ├─► If success:
         │   └─► Refresh data:
         │       Call fetchConfirmedPinsForDashboard()
         │           │
         │           ├─► Query database with updated remaining_qty
         │           ├─► Recalculate status:
         │           │   - If all remaining_qty = 0: filter out
         │           │   - If some remaining_qty < requested: partially_accepted
         │           │   - If all remaining_qty > 0: pending
         │           │
         │           └─► Update helpRequests state
         │
         ▼
Dashboard Updates
- Dialog closes
- Quantities cleared
- Help requests redisplayed
- Status badges updated
- Completed requests hidden
```

## Status Calculation Logic

```
For each pin with pin_items:

Check all pin_items for this pin:

    ┌─────────────────────────────────────┐
    │  Are all remaining_qty = 0?         │
    └─────────────────────────────────────┘
           │                  │
        YES│                  │NO
           │                  │
           ▼                  ▼
      STATUS:            ┌──────────────────────┐
      COMPLETED          │ Are some items       │
      (Hidden from       │ partially fulfilled? │
       dashboard)        │ (remaining_qty <     │
                         │  requested_qty)      │
                         └──────────────────────┘
                                │        │
                             YES│        │NO
                                │        │
                                ▼        ▼
                          PARTIALLY   PENDING
                          ACCEPTED    (All items
                          (Some       fully
                           accepted)  remaining)
                          [Shown]     [Shown]
```

## Data Transformation Pipeline

```
┌─────────────────────────────────────────────────┐
│  Raw Database Records                           │
├─────────────────────────────────────────────────┤
│ pin:                                            │
│ {                                               │
│   id: 'pin-uuid-1',                            │
│   status: 'confirmed',                         │
│   latitude: 40.7128,                           │
│   longitude: -74.0060,                         │
│   ...                                           │
│ }                                               │
│                                                 │
│ pin_items: [                                    │
│ {                                               │
│   id: 'pitem-uuid-1', ◄─ pinItemId            │
│   pin_id: 'pin-uuid-1',                        │
│   item_id: 'item-uuid-1', ◄─ itemId           │
│   requested_qty: 50,                           │
│   remaining_qty: 35 ◄─ What's still needed    │
│ },                                              │
│ { ... more pin_items ... }                     │
│ ]                                               │
│                                                 │
│ items: [{ id, name, unit, category }, ...]    │
└─────────────────────────────────────────────────┘
                      │
                      ▼ (Transformation)
┌─────────────────────────────────────────────────┐
│  HelpRequest Object (for UI)                   │
├─────────────────────────────────────────────────┤
│ {                                               │
│   id: 'pin-uuid-1',                            │
│   title: 'Emergency Response - Damage Report', │
│   description: '...',                          │
│   location: '123 Main St, NYC', ◄─ Geocoded  │
│   lat: 40.7128,                                │
│   lng: -74.0060,                               │
│   status: 'partially_accepted', ◄─ Calculated│
│   requestedBy: 'John Doe',                     │
│   requestedAt: Date,                           │
│   requiredItems: [                             │
│     {                                           │
│       category: 'Food',                        │
│       unit: 'packages',                        │
│       quantity: 50, ◄─ Original requested     │
│       itemId: 'item-uuid-1',                   │
│       pinItemId: 'pitem-uuid-1', ◄─ KEY!     │
│       remainingQty: 35 ◄─ Still needed        │
│     },                                          │
│     { ... more items ... }                     │
│   ],                                            │
│   acceptedItems: [                             │
│     {                                           │
│       category: 'Food',                        │
│       unit: 'packages',                        │
│       originalQuantity: 50,                    │
│       acceptedQuantity: 15,                    │
│       remainingQuantity: 35,                   │
│       acceptedBy: 'Organization',              │
│       acceptedAt: Date                         │
│     }                                           │
│   ]                                             │
│ }                                               │
└─────────────────────────────────────────────────┘
                      │
                      ▼ (Rendered)
             ┌──────────────────┐
             │ Help Request Card│
             │ + Dialogs        │
             │ + Badges         │
             │ + Buttons        │
             └──────────────────┘
```

## Error Handling Flow

```
User Action
    │
    ├─► Database Call (async)
    │   │
    │   ├─► Network error?
    │   │   │
    │   │   └─► Log to console
    │   │       Show error message
    │   │
    │   ├─► API error?
    │   │   │
    │   │   └─► Check result.error
    │   │       Handle gracefully
    │   │
    │   └─► Success?
    │       │
    │       └─► Update state
    │           Close dialogs
    │           Refresh if needed
    │
    └─► User sees feedback
        (Dialog closes, data updates,
         or error message displays)
```

---

**Integration Type:** Full Database-Driven  
**Data Flow:** Async/Await Pattern  
**State Management:** React Hooks  
**Database:** Supabase PostgreSQL  
**Real-time:** On-Demand (No Subscriptions)
