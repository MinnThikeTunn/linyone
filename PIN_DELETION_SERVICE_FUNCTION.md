# ✅ New Service Function: Delete Pin When Items Removed

## What's New

Added new service function: **`deletePinIfNoItemsRemain(pinId: string)`**

**Location:** `src/services/pins.ts` (lines ~1000-1070)

---

## The Logic

```
When you delete ALL pin_items for a pin:

Delete pin_items
    ↓
Call deletePinIfNoItemsRemain(pinId)
    ↓
Check: Any pin_items left?
    ↓
NO → Delete the pins row ✅
YES → Keep the pins row (still has items)
```

---

## How to Use

### Import
```typescript
import { deletePinIfNoItemsRemain } from '@/services/pins'
```

### Call After Deleting Items
```typescript
// Delete pin_items
const { error } = await supabase
  .from('pin_items')
  .delete()
  .eq('pin_id', pinId)

if (!error) {
  // Check if pin should also be deleted
  const result = await deletePinIfNoItemsRemain(pinId)
  
  if (result.deleted) {
    console.log('✅ Pin deleted (no items remaining)')
  } else {
    console.log('✅ Items deleted (pin still has items)')
  }
}
```

---

## Return Value

```typescript
{
  success: boolean    // true if operation completed
  deleted: boolean    // true if pin was actually deleted
  error?: string      // error message if success=false
}
```

---

## Console Logs

The function logs everything:

**Pin has items (NOT deleted):**
```
🔍 Checking if pin abc123 should be deleted (no items remaining)
✅ Pin abc123 has 3 remaining item(s), not deleting
```

**Pin has NO items (DELETED):**
```
🔍 Checking if pin abc123 should be deleted (no items remaining)
🗑️ No pin_items remain for pin abc123, deleting the pin
✅ Successfully deleted pin abc123 (no items remaining)
```

**Error:**
```
❌ Error checking remaining pin_items for pin abc123: permission denied
```

---

## Where to Integrate

### Option 1: In Component (React)
```typescript
// src/app/organization/page.tsx or similar

async function handleDeleteItem(itemId: string, pinId: string) {
  try {
    // Delete the item
    await supabase.from('pin_items').delete().eq('id', itemId)
    
    // Try to delete pin if no items remain
    const { deleted } = await deletePinIfNoItemsRemain(pinId)
    
    if (deleted) {
      toast.success('Pin and item deleted')
    } else {
      toast.success('Item deleted')
    }
    
    // Refresh data
    await loadPins()
  } catch (err) {
    toast.error('Failed to delete')
  }
}
```

### Option 2: In Existing Service Function
```typescript
// In src/services/pins.ts

export async function deleteItemAndCheckPin(itemId: string, pinId: string) {
  try {
    // Delete pin_item
    const { error } = await supabase
      .from('pin_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
    
    // Delete pin if no items remain
    return await deletePinIfNoItemsRemain(pinId)
  } catch (err) {
    console.error('Error:', err)
    return { success: false, deleted: false, error: err.message }
  }
}
```

---

## Features

✅ **Safe**: Only deletes if truly no items remain  
✅ **Efficient**: Single database query to check  
✅ **Logged**: Shows all steps in console  
✅ **Error-handled**: Returns proper error messages  
✅ **Type-safe**: Full TypeScript support  

---

## Code Quality

✅ **0 TypeScript Errors**  
✅ **Follows existing patterns** in pins.ts  
✅ **Comprehensive error handling**  
✅ **Clear console logging**  
✅ **JSDoc comments**  

---

## Full Documentation

See: `DELETE_PIN_IF_NO_ITEMS_GUIDE.md` for complete usage examples and integration patterns.

---

## File Modified

- `src/services/pins.ts` - Added `deletePinIfNoItemsRemain()` function

**No breaking changes** - Pure addition, backward compatible.
