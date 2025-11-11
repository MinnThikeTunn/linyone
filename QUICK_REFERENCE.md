# 🚀 Quick Reference Guide - Supabase Integration

## File Locations

```
src/
├── services/
│   └── pins.ts              ← NEW: Database operations
├── app/
│   └── page.tsx             ← UPDATED: Database integration
└── lib/
    └── supabase.ts          ← EXISTING: Supabase client
    
docs/
├── INTEGRATION_GUIDE.md     ← Technical details
├── SUPABASE_SETUP_COMPLETE.md ← Setup instructions
├── IMPLEMENTATION_SUMMARY.md ← Full documentation
└── QUICK_REFERENCE.md       ← This file
```

---

## Core Functions

### 1. Create Pin
```typescript
import { createPin } from '@/services/pins'

const result = await createPin(
  {
    type: 'damaged',
    status: 'pending',
    phone: '09786993797',
    description: 'Building damaged',
    lat: 16.8409,
    lng: 96.1735,
    createdBy: 'John Doe',
    user_id: 'uuid-here' // or null for anonymous
  },
  imageFile // optional
)

if (result.success) {
  console.log('Pin created:', result.pin)
} else {
  console.error('Error:', result.error)
}
```

### 2. Fetch All Pins
```typescript
import { fetchPins } from '@/services/pins'

const result = await fetchPins()
if (result.success) {
  const pins = result.pins
  pins.forEach(pin => console.log(pin.phone, pin.status))
}
```

### 3. Update Pin Status
```typescript
import { updatePinStatus } from '@/services/pins'

const result = await updatePinStatus(
  'pin-id-here',
  'confirmed',      // new status
  'org-member-id'   // who confirmed it (optional)
)
```

### 4. Check if User is Tracker
```typescript
import { isUserActiveTracker } from '@/services/pins'

const isTracker = await isUserActiveTracker('user-id-here')
console.log('Is tracker:', isTracker)
```

---

## Status Flow

```
┌─────────────┐
│   pending   │  ← New pin created
└──────┬──────┘
       │ (Tracker confirms)
       ▼
┌─────────────┐
│ confirmed   │  ← Approved by tracker
└──────┬──────┘
       │ (Volunteer delivers)
       ▼
┌─────────────┐
│ completed   │  ← Task finished
└─────────────┘
```

---

## Status Determination at Creation

```
User: ANONYMOUS
└─ Status: pending

User: REGULAR USER
└─ Status: pending

User: TRACKER (active in org-member)
└─ Status: confirmed (auto-approved)
```

---

## UI Components

### Show Confirm Button Only for Trackers
```tsx
{isUserTracker && pin.status === "pending" && (
  <Button onClick={() => handleConfirmPin(pin.id)}>
    Confirm
  </Button>
)}
```

### Show Supply Volunteer Button
```tsx
{userRole === "supply_volunteer" && 
 pin.status === "confirmed" &&
 pin.type === "damaged" && (
  <Button onClick={() => handleMarkCompleted(pin.id)}>
    Mark Delivered
  </Button>
)}
```

---

## Error Handling Pattern

```typescript
try {
  const result = await createPin(pinData, imageFile)
  
  if (result.success) {
    toast({ title: "Success", description: "Pin created" })
  } else {
    toast({
      title: "Error",
      description: result.error,
      variant: "destructive"
    })
  }
} catch (error) {
  console.error(error)
  toast({
    title: "Error",
    description: "Operation failed",
    variant: "destructive"
  })
}
```

---

## Database Queries Reference

### Get user's org-member record
```sql
SELECT * FROM org-member 
WHERE user_id = 'user-uuid' 
AND status = 'active'
```

### Get all pending pins
```sql
SELECT * FROM pins 
WHERE status = 'pending' 
ORDER BY created_at DESC
```

### Get pins by status
```sql
SELECT * FROM pins 
WHERE status = 'confirmed'
```

### Count pins by status
```sql
SELECT status, COUNT(*) as count
FROM pins
GROUP BY status
```

---

## Common Patterns

### Load pins on component mount
```typescript
useEffect(() => {
  const loadPins = async () => {
    const result = await fetchPins()
    if (result.success) {
      setPins(result.pins)
    }
  }
  loadPins()
}, [])
```

### Check user permissions on mount
```typescript
useEffect(() => {
  if (user?.id) {
    isUserActiveTracker(user.id).then(isTracker => {
      setIsUserTracker(isTracker)
    })
  }
}, [user?.id])
```

### Update UI after status change
```typescript
const handleConfirm = async (pinId: string) => {
  const result = await updatePinStatus(pinId, 'confirmed')
  if (result.success) {
    // Update local state
    setPins(pins.map(p => 
      p.id === pinId ? {...p, status: 'confirmed'} : p
    ))
  }
}
```

---

## Type Definitions

```typescript
interface Pin {
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
  user_id?: string
}

interface CreatePinInput {
  type: 'damaged' | 'safe'
  status: 'pending' | 'confirmed' | 'completed'
  phone: string
  description: string
  lat: number
  lng: number
  createdBy: string
  user_id: string | null
}
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://kitrjktrnrtnpaazkegx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Set these in `.env.local`

---

## Debugging Tips

### Check if pin saved
```typescript
// In browser console
const { data } = await supabase.from('pins').select()
console.log(data)
```

### Check user tracker status
```typescript
const { data } = await supabase
  .from('org-member')
  .select()
  .eq('user_id', 'user-id')
console.log(data)
```

### Check for database errors
```typescript
const result = await createPin(pinData)
if (!result.success) {
  console.error('Database error:', result.error)
}
```

---

## Testing Quick Checklist

```
☐ Create pin as anonymous → Check DB (pending)
☐ Create pin as user → Check DB (pending)
☐ Create pin as tracker → Check DB (confirmed)
☐ Confirm pending pin → Status changes
☐ Refresh page → Pins load from DB
☐ Delete old pin → New pin appears
☐ Check creator names → Shows correct names
☐ Upload image → Shows in pin detail
☐ Show error → Toast appears
```

---

## Performance Tips

### Batch Operations
```typescript
// Fetch pins with pagination
const result = await supabase
  .from('pins')
  .select()
  .range(0, 49) // First 50
```

### Optimize Queries
```typescript
// Only fetch needed columns
.select('id, status, phone, description')

// Use indexes on common filters
// CREATE INDEX idx_pins_status ON pins(status)
// CREATE INDEX idx_pins_user_id ON pins(user_id)
```

---

## Troubleshooting Commands

### Clear local cache
```javascript
// In browser console
localStorage.clear()
location.reload()
```

### Reset database
```sql
-- In Supabase SQL editor
DELETE FROM pins WHERE true;
```

### Check Supabase connection
```javascript
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.from('pins').select('count()')
console.log(data, error)
```

---

## Related Documentation

- 📖 [Full Integration Guide](./INTEGRATION_GUIDE.md)
- ⚙️ [Setup Instructions](./SUPABASE_SETUP_COMPLETE.md)
- 📋 [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- 🗄️ [Database Schema](./supabase-migration.sql)

---

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** ✅ Ready to Use
