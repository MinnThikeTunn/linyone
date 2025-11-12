# Database Schema Integration - pins, pin_items, items

## Overview

The application now uses a proper relational database schema with three core tables for managing disaster response pins and item requests:

1. **pins** - Individual disaster reports/locations
2. **pin_items** - Requested items for each pin
3. **items** - Master list of available relief items

## Database Schema

### pins Table
```sql
| Column       | Type    | Description                    |
|--------------|---------|--------------------------------|
| id           | uuid    | Primary key                    |
| user_id      | uuid    | Foreign key to users (nullable)|
| latitude     | numeric | Pin location latitude          |
| longitude    | numeric | Pin location longitude         |
| type         | text    | 'damage' or 'shelter'          |
| status       | text    | pending/confirmed/completed    |
| confirmed_by | uuid    | Foreign key to org-member (FK) |
| confirmed_at | timestamp | When tracker confirmed pin    |
| created_at   | timestamp | Pin creation time             |
| phone        | numeric | Contact phone number           |
| description  | text    | Pin description                |
| image_url    | text    | URL to uploaded image          |
```

**Foreign Keys:**
- `user_id` → `users.id` (nullable - anonymous users can create pins)
- `confirmed_by` → `org-member.id` (nullable - set when tracker confirms)

**Indexes:**
- Primary: `id`
- Query: `status`, `created_at`, `user_id`

---

### pin_items Table
```sql
| Column       | Type    | Description                    |
|--------------|---------|--------------------------------|
| id           | uuid    | Primary key                    |
| pin_id       | uuid    | Foreign key to pins (FK)       |
| item_id      | uuid    | Foreign key to items (FK)      |
| requested_qty| integer | Quantity requested by tracker  |
| remaining_qty| integer | Quantity still needed          |
| created_at   | timestamp | When item was requested       |
```

**Foreign Keys:**
- `pin_id` → `pins.id` (required - each item belongs to a pin)
- `item_id` → `items.id` (required - each record points to an item type)

**Constraints:**
- `requested_qty > 0` - must request at least 1
- `remaining_qty >= 0` - can't go below 0

**Indexes:**
- Primary: `id`
- Query: `pin_id`, `item_id`

---

### items Table (Master List)
```sql
| Column       | Type    | Description                    |
|--------------|---------|--------------------------------|
| id           | uuid    | Primary key                    |
| name         | text    | Item name (e.g., "Food Packs") |
| unit         | text    | Unit of measure (e.g., "packs")|
| category     | text    | Category (e.g., "relief")      |
| created_at   | timestamp | When item was added to system |
```

**Constraints:**
- `name` UNIQUE - each item type is unique

**Example Data:**
```
| id    | name          | unit    | category |
|-------|---------------|---------|----------|
| itm-1 | Food Packs    | packs   | relief   |
| itm-2 | Water Bottles | bottles | relief   |
| itm-3 | Medicine Box  | boxes   | medical  |
| itm-4 | Blankets      | pieces  | comfort  |
| itm-5 | Clothes Packs | packs   | clothing |
```

---

## Relationships

### pins → pin_items (1:∞)
Each pin can request many different items:
```
pin-1 (damaged building at lat:16.8409, lng:96.1735)
├── pin_items
│   ├── Food Packs: 50 requested, 20 remaining
│   ├── Water Bottles: 100 requested, 70 remaining
│   └── Medicine Box: 10 requested, 5 remaining
```

### pin_items → items (∞:1)
Multiple pin_items can reference the same item:
```
items["Food Packs"]
├── pin-1: 50 requested
├── pin-2: 30 requested
└── pin-3: 25 requested
```

### pins ← org-member (confirmed_by)
Each pin is confirmed by exactly one tracker:
```
pin-1: confirmed_by = mem-2 (tracker user)
pin-2: confirmed_by = mem-3 (another tracker)
```

---

## Workflow: Tracker Confirms Pin with Items

### Step 1: Tracker Selects Pin
- Tracker views map showing nearby unconfirmed pins
- Finds damaged location within 5km
- Clicks pin to open details

### Step 2: Tracker Selects Items
- Dialog shows all available items from `items` table
- Tracker checks boxes for needed items:
  - ✓ Food Packs
  - ✓ Water Bottles
  - ✓ Medicine Box
- Tracker sets quantities:
  - Food Packs: 50
  - Water Bottles: 100
  - Medicine Box: 10

### Step 3: Database Operations

**Transaction:**
```typescript
1. UPDATE pins
   SET status = 'confirmed',
       confirmed_by = mem-2,
       confirmed_at = NOW()
   WHERE id = pin-1

2. INSERT INTO pin_items (pin_id, item_id, requested_qty, remaining_qty)
   VALUES
   (pin-1, itm-1, 50, 50),    // Food Packs
   (pin-1, itm-2, 100, 100),  // Water Bottles
   (pin-1, itm-3, 10, 10)     // Medicine Box
```

### Step 4: Result
- Pin status changes to "confirmed"
- pin_items records created
- `remaining_qty` matches `requested_qty` initially
- Supply volunteers can now see this pin and track deliveries

---

## Service Layer Functions

### In `src/services/pins.ts`

#### 1. **fetchItems()**
```typescript
export async function fetchItems(): Promise<{
  success: boolean
  items?: Item[]
  error?: string
}>

// Returns all items from database
// Called on page load to populate dropdown
```

**Usage:**
```typescript
const itemsResult = await fetchItems()
if (itemsResult.success && itemsResult.items) {
  setAvailableItems(itemsResult.items)
}
```

---

#### 2. **createPinItems()**
```typescript
export async function createPinItems(
  pinId: string,
  items: Array<{ item_id: string; requested_qty: number }>
): Promise<{ success: boolean; error?: string }>

// Creates pin_items records when tracker confirms pin
// Called after pin status updated to 'confirmed'
```

**Usage:**
```typescript
const itemsToCreate = [
  { item_id: 'itm-1', requested_qty: 50 },
  { item_id: 'itm-2', requested_qty: 100 }
]
const result = await createPinItems(pinId, itemsToCreate)
```

---

#### 3. **fetchPinsWithItems()**
```typescript
export async function fetchPinsWithItems(): Promise<{
  success: boolean
  pins?: (Pin & {
    pin_items?: (PinItem & { item?: Item })[]
  })[]
  error?: string
}>

// Fetches all pins with their associated items
// Includes full item details from items table
// Used for dashboards/analytics
```

**Returns:**
```typescript
{
  id: 'pin-1',
  status: 'confirmed',
  pin_items: [
    {
      id: 'pni-1',
      pin_id: 'pin-1',
      item_id: 'itm-1',
      requested_qty: 50,
      remaining_qty: 20,
      item: {
        id: 'itm-1',
        name: 'Food Packs',
        unit: 'packs',
        category: 'relief'
      }
    }
  ]
}
```

---

#### 4. **updatePinItemQuantity()**
```typescript
export async function updatePinItemQuantity(
  pinItemId: string,
  newRemainingQty: number
): Promise<{ success: boolean; error?: string }>

// Updates remaining quantity after supply volunteer delivery
// Called when volunteer marks items as delivered
```

**Usage:**
```typescript
// After delivering 30 food packs
const result = await updatePinItemQuantity('pni-1', 20)
// remaining_qty: 50 - 30 = 20
```

---

## Frontend Implementation

### State Management (in `page.tsx`)

```typescript
// Master list of available items
const [availableItems, setAvailableItems] = useState<Item[]>([])

// Tracker's selected items for confirmation
const [selectedItems, setSelectedItems] = useState<Map<string, number>>(
  new Map() // Map<itemId, quantity>
)
```

### Item Selection Flow

```typescript
// Toggle item selection
const handleItemToggle = (itemId: string, defaultQty: number) => {
  const newSelected = new Map(selectedItems)
  if (newSelected.has(itemId)) {
    newSelected.delete(itemId)
  } else {
    newSelected.set(itemId, defaultQty)
  }
  setSelectedItems(newSelected)
}

// Update quantity
const handleItemQuantityChange = (itemId: string, quantity: number) => {
  const newSelected = new Map(selectedItems)
  if (quantity > 0) {
    newSelected.set(itemId, quantity)
  } else {
    newSelected.delete(itemId)
  }
  setSelectedItems(newSelected)
}

// Confirm pin with items
const handleConfirmPinWithItems = async () => {
  // 1. Confirm pin status
  const result = await updatePinStatus(pinId, 'confirmed', ...)
  
  // 2. Create pin_items records
  if (selectedItems.size > 0) {
    const itemsToCreate = Array.from(selectedItems.entries()).map(
      ([itemId, quantity]) => ({ item_id: itemId, requested_qty: quantity })
    )
    await createPinItems(pinId, itemsToCreate)
  }
}
```

### UI Rendering

```typescript
{availableItems.map((item) => (
  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
    <input
      type="checkbox"
      checked={selectedItems.has(item.id)}
      onChange={() => handleItemToggle(item.id, 10)}
    />
    <Label>{item.name} ({item.unit})</Label>
    
    {selectedItems.has(item.id) && (
      <div className="flex items-center gap-2">
        <Button onClick={() => handleItemQuantityChange(item.id, (selectedItems.get(item.id) || 0) - 1)}>
          -
        </Button>
        <span>{selectedItems.get(item.id)}</span>
        <Button onClick={() => handleItemQuantityChange(item.id, (selectedItems.get(item.id) || 0) + 1)}>
          +
        </Button>
      </div>
    )}
  </div>
))}
```

---

## Authorization & Business Logic

### Who Can Do What?

| Operation | User Type | Authority |
|-----------|-----------|-----------|
| Create Pin | Any (Anonymous/Tracker/Regular) | Frontend validation + Backend status |
| Confirm Pin (update status) | Tracker Only | Backend verifies `org-member.status='active'` |
| Set Item Quantities | Tracker (during confirmation) | Only visible in confirmation dialog |
| Update Remaining Qty | Supply Volunteer | Via delivery interface (future) |
| Delete Pin | Organization | Backend authorization check |

---

## Data Persistence

### On Initial Load
```typescript
useEffect(() => {
  // 1. Fetch all pins
  const pinsResult = await fetchPins()
  
  // 2. Fetch all available items
  const itemsResult = await fetchItems()
  
  // 3. Check user role
  const isTracker = await isUserActiveTracker(user.id)
}, [user?.id])
```

### During Confirmation
```typescript
// Atomic transaction (backend should handle):
BEGIN TRANSACTION
  UPDATE pins SET status='confirmed', confirmed_by=mem-id, confirmed_at=NOW()
  INSERT INTO pin_items (pin_id, item_id, requested_qty, remaining_qty)
  VALUES (pin-id, item-1, qty1, qty1), (pin-id, item-2, qty2, qty2), ...
COMMIT
```

### After Delivery
```typescript
UPDATE pin_items SET remaining_qty = remaining_qty - delivered_qty
WHERE id = pin_item_id
```

---

## Testing Checklist

- [ ] Fetch items on page load
- [ ] Display items in confirmation dialog
- [ ] Toggle item selection (checkbox)
- [ ] Increment/decrement quantities
- [ ] Confirm pin creates pin_items records
- [ ] Confirmed pin visible to supply volunteers
- [ ] Delivery updates remaining_qty
- [ ] All quantities persist after page refresh
- [ ] Error handling for network failures

---

## Example Queries

### Get all items needed for a pin
```sql
SELECT i.* FROM items i
JOIN pin_items pi ON i.id = pi.item_id
WHERE pi.pin_id = $1
ORDER BY i.category, i.name
```

### Get pins with pending items (not fully delivered)
```sql
SELECT DISTINCT p.* FROM pins p
JOIN pin_items pi ON p.id = pi.pin_id
WHERE pi.remaining_qty > 0
AND p.status = 'confirmed'
ORDER BY p.created_at DESC
```

### Calculate total items needed by category
```sql
SELECT i.category, i.unit, SUM(pi.requested_qty) as total
FROM pin_items pi
JOIN items i ON pi.item_id = i.id
WHERE pi.pin_id = $1
GROUP BY i.category, i.unit
```

---

## Migration Notes

✅ **Completed:**
- Added `Item` and `PinItem` types to pins.ts
- Created `fetchItems()` function
- Created `createPinItems()` function
- Created `fetchPinsWithItems()` function
- Created `updatePinItemQuantity()` function
- Updated state management in page.tsx
- Updated confirmation dialog to use database items
- Removed hardcoded item checkboxes
- Added item selection with dynamic quantity controls

🔄 **Next Steps (for future enhancement):**
- Implement supply volunteer dashboard to track deliveries
- Add `updatePinItemQuantity()` calls in delivery interface
- Create reports dashboard showing:
  - Items requested vs. delivered
  - Fulfillment percentage by category
  - Location heatmap of unfulfilled items
- Add RLS policies for item visibility
