# 📌 Delete Pin When No Items Remain - Service Function

## Overview

New service function: `deletePinIfNoItemsRemain(pinId: string)`

**Purpose:** When you delete all `pin_items` for a pin, automatically delete the `pins` row too.

---

## Function Signature

```typescript
export async function deletePinIfNoItemsRemain(
  pinId: string
): Promise<{ success: boolean; deleted: boolean; error?: string }>
```

---

## How It Works

```
1. Call deletePinIfNoItemsRemain(pinId)
   ↓
2. Query: Check if ANY pin_items remain for this pin_id
   ↓
3A. If pin_items exist → Return { success: true, deleted: false }
   ↓ (pin is NOT deleted)
   
3B. If NO pin_items exist → Delete the pins row
   ↓
4. Return { success: true, deleted: true }
```

---

## When to Call This Function

Call this **after deleting `pin_items`**:

### Example 1: Delete a Single Item
```typescript
// User deletes one item from a pin with multiple items
const { error } = await supabase
  .from('pin_items')
  .delete()
  .eq('id', itemId)

if (!error) {
  // Check if pin should be deleted
  const result = await deletePinIfNoItemsRemain(pinId)
  console.log(result)
  // If result.deleted = true, the pin was deleted too
}
```

### Example 2: Delete All Items for a Pin
```typescript
// Delete all pin_items for a pin
const { error } = await supabase
  .from('pin_items')
  .delete()
  .eq('pin_id', pinId)

if (!error) {
  // Delete the pin if no items remain (they don't!)
  const result = await deletePinIfNoItemsRemain(pinId)
  // result.deleted will be true since we deleted all items
}
```

### Example 3: Integration with Existing Code
```typescript
// In your acceptance workflow:
async function handleCompletePin(pinId: string) {
  try {
    // Step 1: Delete all pin_items
    const { error: deleteItemsError } = await supabase
      .from('pin_items')
      .delete()
      .eq('pin_id', pinId)

    if (deleteItemsError) throw deleteItemsError

    // Step 2: Delete the pin if no items remain
    const result = await deletePinIfNoItemsRemain(pinId)

    if (result.deleted) {
      console.log(`✅ Pin ${pinId} and all its items deleted`)
      toast.success('Pin completed and deleted')
    } else {
      console.log(`✅ Items deleted, pin still has items`)
    }

    return result
  } catch (err) {
    console.error('Error:', err)
    toast.error('Failed to complete pin')
  }
}
```

---

## Return Values

### Success Case - Pin Deleted
```javascript
{
  success: true,
  deleted: true,
  error: undefined
}
```

### Success Case - Pin Still Has Items
```javascript
{
  success: true,
  deleted: false,
  error: undefined
}
```

### Error Case
```javascript
{
  success: false,
  deleted: false,
  error: "Error message from Supabase"
}
```

---

## Console Logs

The function logs all steps:

### When Pin Has Items
```
🔍 Checking if pin abc123 should be deleted (no items remaining)
✅ Pin abc123 has 3 remaining item(s), not deleting
```

### When Pin Has No Items (Deleted)
```
🔍 Checking if pin abc123 should be deleted (no items remaining)
🗑️ No pin_items remain for pin abc123, deleting the pin
✅ Successfully deleted pin abc123 (no items remaining)
```

### On Error
```
❌ Error checking remaining pin_items for pin abc123: permission denied
```

---

## Integration Checklist

- [ ] Import function: `import { deletePinIfNoItemsRemain } from '@/services/pins'`
- [ ] Call after deleting pin_items
- [ ] Check `result.deleted` to know if pin was deleted
- [ ] Show appropriate toast message to user
- [ ] Refresh dashboard if pin was deleted
- [ ] Handle error case gracefully

---

## File Location

`src/services/pins.ts` - Lines ~1000-1070

---

## Related Functions

- `checkAndHandleCompletedPin()` - Marks pin complete when all items accepted (deletes all items)
- `deletePin()` - Manually delete a specific pin
- `acceptHelpRequestItems()` - Accept help items (reduces remaining_qty)

---

## Notes

- ✅ Safe: Only deletes pin if truly NO items remain
- ✅ Reliable: Queries database each time (no assumptions)
- ✅ Logged: Shows all steps in console
- ✅ Error-handled: Returns proper error messages
- ✅ No defaults: Won't create pins, only deletes them
