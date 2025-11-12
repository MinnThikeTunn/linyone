# Database Integration Architecture

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    DISASTER RESPONSE APPLICATION                          │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js Client)                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Home Page (page.tsx)              Organization Dashboard (org/page.tsx)│
│  ┌──────────────────────┐          ┌───────────────────────────────────┐
│  │ - Mapbox GL JS       │          │ Help Requests List                │
│  │ - Pin Creation       │          │ ┌─────────────────────────────────┤
│  │ - Confirmation Flow  │          │ │ Card 1: Medical Supplies        │
│  │ - Map Viewing        │◄─────┐   │ │ Status: Pending   [badge]       │
│  │                      │      │   │ │ Location: (geocoded)            │
│  └──────────────────────┘      │   │ │ View Details | View on Map      │
│                                │   │ └─────────────────────────────────┤
│  Session Storage:              │   │ │ Card 2: Food Distribution       │
│  { lat, lng, location }        │   │ │ Status: Partially Accepted      │
│                                │   │ │ Accepted Items: [shown]         │
│                                │   │ └─────────────────────────────────┤
│                                │   │ View Details Modal:               │
│                                │   │ ┌─────────────────────────────────┤
│                                │   │ │ Required Items Table:           │
│                                │   │ │ ┌────────────────────────────────┤
│                                │   │ │ │ Medicine: 50 boxes (0 remain)  │
│                                │   │ │ │ Water: 100 bottles (30 remain) │
│                                │   │ │ │ Food: 150 packs (all remain)   │
│                                │   │ │ └────────────────────────────────┤
│                                │   │ │ Accept Dialog:                  │
│                                │   │ │ ┌────────────────────────────────┤
│                                │   │ │ │ Medicine: [________] / 50      │
│                                │   │ │ │ Water: [________] / 100        │
│                                │   │ │ │ Food: [________] / 150         │
│                                │   │ │ │ [Accept Request] [Cancel]      │
│                                │   │ │ └────────────────────────────────┤
│                                └──►│ └─────────────────────────────────┘
│                                    └───────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS API LAYER (Server-side)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  POST /api/reverse-geocode                                               │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ Input: { lat: 16.8409, lng: 96.1735 }                       │      │
│  │                                                               │      │
│  │ Process:                                                      │      │
│  │  1. Validate coordinates                                      │      │
│  │  2. Get GOOGLE_MAPS_API_KEY from env (secure)               │      │
│  │  3. Call Google Maps Reverse Geocoding API                   │      │
│  │  4. Parse response                                            │      │
│  │                                                               │      │
│  │ Output: {                                                     │      │
│  │   success: true,                                              │      │
│  │   primary_address: "Yangon Downtown, Myanmar",               │      │
│  │   results: [...]                                              │      │
│  │ }                                                             │      │
│  └──────────────────────────────────────────────────────────────┘      │
│         │                                                                │
│         ▼                                                                │
│  SERVICES LAYER (pins.ts)                                              │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                                                               │      │
│  │  getReverseGeocodedAddress(lat, lng)                         │      │
│  │  ├─► Calls /api/reverse-geocode                              │      │
│  │  └─► Returns: { success, address }                           │      │
│  │                                                               │      │
│  │  fetchConfirmedPinsForDashboard()                            │      │
│  │  ├─► Query pins (status='confirmed')                         │      │
│  │  ├─► Join pin_items, items                                   │      │
│  │  ├─► Calculate status (pending vs partially_accepted)        │      │
│  │  ├─► Geocode each pin's coordinates                          │      │
│  │  ├─► Filter out completed pins                               │      │
│  │  └─► Return: { success, helpRequests[] }                     │      │
│  │                                                               │      │
│  │  acceptHelpRequestItems(pinId, acceptedItems[])             │      │
│  │  ├─► For each item:                                          │      │
│  │  │   ├─► Get requested_qty from pin_items                    │      │
│  │  │   ├─► Calculate new remaining_qty                         │      │
│  │  │   └─► Update database                                      │      │
│  │  └─► Return: { success, error? }                             │      │
│  │                                                               │      │
│  │  checkAndHandleCompletedPin(pinId)                           │      │
│  │  ├─► Check if all remaining_qty === 0                        │      │
│  │  ├─► If complete:                                             │      │
│  │  │   ├─► Delete all pin_items                                │      │
│  │  │   └─► Update pin.status = 'completed'                     │      │
│  │  └─► Return: { success, isCompleted? }                       │      │
│  │                                                               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  SUPABASE POSTGRESQL DATABASE                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  TABLE: pins                                                             │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ id (PK)│lat│lng│type│status │user_id│desc│confirm_by│... │        │
│  ├────────────────────────────────────────────────────────────┤        │
│  │pin-1   │16│96 │dmg │confirmed│usr-1│...│mem-2      │    │        │
│  │pin-2   │17│97 │saf │pending  │usr-2│...│NULL       │    │        │
│  │pin-3   │18│98 │dmg │confirmed│usr-1│...│mem-2      │    │        │
│  └────────────────────────────────────────────────────────────┘        │
│           ▲                          ▲                    ▲             │
│           │                          │                    │             │
│           │ 1:∞ relationship        │                    │             │
│           │                          │                    │             │
│  TABLE: pin_items             TABLE: org-member    TABLE: users       │
│  ┌──────────────────────┐      ┌────────────┐       ┌────────────┐   │
│  │id│pin_id│item_id│req│rem│   │id│org_id│usr_id│  │id│name│email  │
│  ├──────────────────────┤      ├────────────┤       ├────────────┤   │
│  │p1│pin-1 │itm-1 │50 │20 │   │m1│org-1│usr-1 │   │u1│Alice│a@h.org│
│  │p2│pin-1 │itm-2 │100│70 │   │m2│org-1│usr-2 │   │u2│Bob  │b@h.org│
│  │p3│pin-1 │itm-3 │10 │10 │   └────────────┘       └────────────┘   │
│  │p4│pin-3 │itm-1 │30 │30 │                                         │
│  └──────────────────────┘                                            │
│           │                                                           │
│           │ ∞:1 relationship                                         │
│           ▼                                                           │
│  TABLE: items                                                        │
│  ┌─────────────────────────────┐                                    │
│  │id     │name          │unit    │category  │                       │
│  ├─────────────────────────────┤                                    │
│  │itm-1  │Food Packs    │packs   │relief   │                       │
│  │itm-2  │Water Bottles │bottles │relief   │                       │
│  │itm-3  │Medicine Box  │boxes   │medical  │                       │
│  └─────────────────────────────┘                                    │
│                                                                       │
│  RELATIONSHIPS:                                                      │
│  pins.id ──┐                                                        │
│            ├──> pin_items.pin_id ──┐                               │
│                                     ├──> items.id                  │
│  org-member.id ──┐                                                 │
│                  └──> pins.confirmed_by                            │
│  users.id ──┐                                                       │
│             ├──> pins.user_id                                      │
│             └──> org-member.user_id                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Google Maps API                                                         │
│  ┌────────────────────────────────────────────────────────────┐        │
│  │ Service: Reverse Geocoding                                 │        │
│  │ Input: { lat: 16.8409, lng: 96.1735 }                    │        │
│  │ Output: "Yangon Downtown, Main Street, Myanmar"           │        │
│  │ Auth: GOOGLE_MAPS_API_KEY (server-side only)             │        │
│  └────────────────────────────────────────────────────────────┘        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Dashboard Load

```
┌─ User Opens Organization Dashboard
│
├─► Organization Page Component Mounts
│   └─► useEffect(() => { loadData() }, [])
│
├─► fetchConfirmedPinsForDashboard()
│   │
│   ├─► Query: SELECT * FROM pins WHERE status = 'confirmed'
│   │   └─ Result: [pin-1, pin-3]
│   │
│   ├─► Query: SELECT * FROM pin_items JOIN items
│   │   WHERE pin_id IN (pin-1, pin-3)
│   │   └─ Result: [
│   │       { pin_id: pin-1, item_id: itm-1, req: 50, rem: 20, name: Food Packs },
│   │       { pin_id: pin-1, item_id: itm-2, req: 100, rem: 70, name: Water Bottles },
│   │       { pin_id: pin-1, item_id: itm-3, req: 10, rem: 10, name: Medicine Box },
│   │       { pin_id: pin-3, item_id: itm-1, req: 30, rem: 30, name: Food Packs }
│   │     ]
│   │
│   ├─► For each pin, calculate STATUS:
│   │   │
│   │   ├─► pin-1:
│   │   │   ├─ Food Packs: rem=20, req=50 → PARTIAL ✓
│   │   │   ├─ Water Bottles: rem=70, req=100 → PARTIAL ✓
│   │   │   ├─ Medicine Box: rem=10, req=10 → NOT FULFILLED ✓
│   │   │   └─ Status = "partially_accepted" (any partial)
│   │   │
│   │   ├─► pin-3:
│   │   │   ├─ Food Packs: rem=30, req=30 → NOT FULFILLED
│   │   │   └─ Status = "pending" (nothing fulfilled yet)
│   │   │
│   │   └─► If (rem === 0 for ALL items) → SKIP PIN (completed)
│   │
│   ├─► For each pin, GEOCODE coordinates:
│   │   │
│   │   ├─► getReverseGeocodedAddress(16.8409, 96.1735)
│   │   │   └─► POST /api/reverse-geocode { lat, lng }
│   │   │       └─► Google Maps API
│   │   │           └─ "Yangon Downtown, Myanmar"
│   │   │
│   │   └─► getReverseGeocodedAddress(18, 98)
│   │       └─► "Bago Region, Myanmar"
│   │
│   └─► Return HelpRequests:
│       [
│         {
│           id: pin-1,
│           title: "Emergency Response - Damage Report",
│           location: "Yangon Downtown, Myanmar",
│           status: "partially_accepted",
│           requiredItems: [
│             { category: "Food Packs", quantity: 50, remainingQty: 20, ... },
│             { category: "Water Bottles", quantity: 100, remainingQty: 70, ... },
│             { category: "Medicine Box", quantity: 10, remainingQty: 10, ... }
│           ],
│           acceptedItems: [
│             { category: "Food Packs", original: 50, accepted: 30, remaining: 20 },
│             { category: "Water Bottles", original: 100, accepted: 30, remaining: 70 }
│           ]
│         },
│         {
│           id: pin-3,
│           title: "Emergency Response - Damage Report",
│           location: "Bago Region, Myanmar",
│           status: "pending",
│           requiredItems: [
│             { category: "Food Packs", quantity: 30, remainingQty: 30, ... }
│           ]
│         }
│       ]
│
├─► setHelpRequests(result)
│
└─► Render Dashboard with:
    ├─ Card 1: "Yangon Downtown, Myanmar" [Partially Accepted]
    ├─ Card 2: "Bago Region, Myanmar" [Pending]
    └─ ...
```

---

## Data Flow: Accept Items

```
┌─ User clicks "Accept" on pin-1
│
├─► Modal opens showing required items:
│   ├─ Food Packs: 50 boxes needed (20 remaining)
│   ├─ Water Bottles: 100 bottles needed (70 remaining)
│   └─ Medicine Box: 10 boxes needed (10 remaining)
│
├─► User enters quantities to accept:
│   ├─ Food Packs: 10
│   ├─ Water Bottles: 20
│   └─ Medicine Box: [empty]
│
├─► User clicks "Accept Request"
│
├─► handleAcceptRequest() calls:
│   acceptHelpRequestItems(pin-1, [
│     { pinItemId: p1, acceptedQuantity: 10 },
│     { pinItemId: p2, acceptedQuantity: 20 }
│   ])
│
├─► For each item update:
│   │
│   ├─► Update pin_items WHERE id = p1:
│   │   ├─ GET: requested_qty = 50
│   │   ├─ CALC: new remaining_qty = 50 - 10 = 40
│   │   ├─ UPDATE: pin_items.remaining_qty = 40
│   │   └─ Result: Food Packs now has 40 units still needed
│   │
│   ├─► Update pin_items WHERE id = p2:
│   │   ├─ GET: requested_qty = 100
│   │   ├─ CALC: new remaining_qty = 100 - 20 = 80
│   │   ├─ UPDATE: pin_items.remaining_qty = 80
│   │   └─ Result: Water Bottles now has 80 units still needed
│   │
│   └─► Pin p3 (Medicine Box) unchanged (rem: 10)
│
├─► refreshDashboard():
│   └─► fetchConfirmedPinsForDashboard() again
│       └─ pin-1 recalculated:
│         ├─ All items still have rem > 0
│         └─ Status = "partially_accepted" (still)
│         └─ acceptedItems now shows:
│           ├─ Food Packs: accepted 10 of 50, remaining 40
│           ├─ Water Bottles: accepted 20 of 100, remaining 80
│           └─ Medicine Box: accepted 0 of 10, remaining 10
│
├─► showSuccessToast("Items accepted successfully")
│
└─► UI updates to show new accepted quantities
```

---

## Data Flow: Complete Pin

```
┌─ User accepts remaining items for pin-1
│  (Eventually all remaining_qty → 0)
│
├─ After accepting all items:
│  │ Food Packs: accepted 50, remaining 0 ✓
│  │ Water Bottles: accepted 100, remaining 0 ✓
│  │ Medicine Box: accepted 10, remaining 0 ✓
│
├─► refreshDashboard() detects completion:
│   └─► fetchConfirmedPinsForDashboard()
│       └─► For pin-1, check all pin_items:
│           ├─ Food Packs: remaining_qty = 0 ✓
│           ├─ Water Bottles: remaining_qty = 0 ✓
│           ├─ Medicine Box: remaining_qty = 0 ✓
│           └─ All === 0, so SKIP THIS PIN
│
├─► Database cleanup (automatic in next fetch):
│   └─► DELETE FROM pin_items WHERE pin_id = pin-1
│       └─► Deletes p1, p2, p3 records
│
├─► UPDATE pin SET status = 'completed' WHERE id = pin-1
│
├─► Result: pin-1 no longer appears in Help Requests list
│
└─► Dashboard shows only remaining pins:
    └─ Card 1: "Bago Region, Myanmar" [Pending]
       (pin-3 still here with Food Packs unfulfilled)
```

---

## Status Badge Logic (Visual)

```
┌─────────────────────────────────────────┐
│ ONE Badge per Card (Status Only)        │
├─────────────────────────────────────────┤
│                                         │
│  Pending:                              │
│  ┌──────────────────────────────────┐ │
│  │ [yellow badge] Pending           │ │
│  │                                  │ │
│  │ Meaning: No items fulfilled yet  │ │
│  └──────────────────────────────────┘ │
│                                         │
│  Partially Accepted:                   │
│  ┌──────────────────────────────────┐ │
│  │ [blue badge] Partially Accepted  │ │
│  │                                  │ │
│  │ Meaning: Some items fulfilled    │ │
│  └──────────────────────────────────┘ │
│                                         │
│  Completed:                            │
│  ┌──────────────────────────────────┐ │
│  │ [HIDDEN - Card removed from list]│ │
│  │                                  │ │
│  │ Meaning: All items fulfilled     │ │
│  └──────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## Component Hierarchy

```
OrganizationPage
├── State Management
│   ├── helpRequests: HelpRequest[]        [Database-driven]
│   ├── selectedRequest: HelpRequest | null
│   ├── showAcceptDialog: boolean
│   ├── acceptQuantities: Record<string, number>
│   └── ... other state
│
├── Effects
│   └── useEffect(() => {
│       const result = await fetchConfirmedPinsForDashboard()
│       setHelpRequests(result.helpRequests || [])
│     }, [])
│
├── Event Handlers
│   ├── handleViewRequest(request)
│   │   └── setSelectedRequest(request)
│   │
│   ├── handleAcceptRequest()
│   │   └── await acceptHelpRequestItems(pinId, items)
│   │       └── await fetchConfirmedPinsForDashboard()
│   │
│   └── handleViewOnMap(request)
│       └── router.push('/')
│
└── Render
    ├── Help Requests Section
    │   └── For each helpRequest in helpRequests:
    │       └── Card
    │           ├── Title
    │           ├── Location (geocoded)
    │           ├── [ONE Badge] Status
    │           ├── Required Items
    │           ├── [View Details] button
    │           └── [View on Map] button
    │
    └── Modals
        ├── View Details Modal
        │   └── Required Items Table
        │   └── Accepted Items Table (if exists)
        │   └── [Accept Request] button
        │
        └── Accept Dialog
            └── For each requiredItem:
                └── Input: quantity to accept
            └── [Accept] [Cancel] buttons
```

