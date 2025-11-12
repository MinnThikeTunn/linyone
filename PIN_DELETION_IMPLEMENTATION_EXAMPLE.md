# 🚀 Implementation Example: Using deletePinIfNoItemsRemain()

## Scenario

You want to delete a pin_item from the organization dashboard, and if that was the last item, automatically delete the pin too.

---

## Step 1: Import the Function

**File:** `src/app/organization/page.tsx`

```typescript
import { 
  deletePinIfNoItemsRemain,  // ← Add this import
  acceptHelpRequestItems,
  deletePin,
  // ... other imports
} from '@/services/pins'
```

---

## Step 2: Add Delete Item Handler

Add this function to your organization dashboard component:

```typescript
/**
 * Handle deleting a pin_item
 * If it's the last item for that pin, also delete the pin
 */
async function handleDeletePinItem(
  pinItemId: string,
  pinId: string,
  itemName: string
) {
  try {
    console.log(`🗑️ Deleting pin_item ${pinItemId} from pin ${pinId}`)

    // Step 1: Delete the pin_item from database
    const { error: deleteError } = await supabase
      .from('pin_items')
      .delete()
      .eq('id', pinItemId)

    if (deleteError) {
      toast({
        title: '❌ Error',
        description: `Could not delete item: ${deleteError.message}`,
        variant: 'destructive',
      })
      return
    }

    console.log(`✅ Pin_item ${pinItemId} deleted from database`)

    // Step 2: Check if pin should also be deleted (if no items remain)
    const { success, deleted, error } = await deletePinIfNoItemsRemain(pinId)

    if (!success) {
      toast({
        title: '⚠️ Warning',
        description: `Item deleted but couldn't check pin status: ${error}`,
      })
      return
    }

    // Step 3: Show appropriate message and refresh
    if (deleted) {
      // Pin was deleted too (it had no other items)
      toast({
        title: '✅ Success',
        description: `Pin and "${itemName}" deleted (no more items)`,
      })
      console.log(`✅ Pin ${pinId} auto-deleted (no items remaining)`)
    } else {
      // Pin still exists (had other items)
      toast({
        title: '✅ Success',
        description: `"${itemName}" deleted (pin still has other items)`,
      })
      console.log(`✅ Item deleted, pin ${pinId} still exists`)
    }

    // Step 4: Refresh the dashboard
    await loadDashboardData()
  } catch (err) {
    console.error('❌ Error in handleDeletePinItem:', err)
    toast({
      title: '❌ Error',
      description: 'Failed to delete item',
      variant: 'destructive',
    })
  }
}
```

---

## Step 3: Add Delete Button to UI

In your pin items list, add a delete button:

```tsx
{selectedRequest?.pin_items?.map((item) => (
  <div key={item.id} className="flex justify-between items-center p-2 border">
    <span>{item.item?.name} × {item.remaining_qty}</span>
    
    {/* Delete button */}
    <button
      onClick={() => handleDeletePinItem(
        item.id,
        selectedRequest.id,
        item.item?.name || 'Item'
      )}
      className="text-red-500 hover:text-red-700"
    >
      🗑️ Delete
    </button>
  </div>
))}
```

---

## Step 4: Test It

1. **Go to Organization Dashboard** (`/organization`)
2. **Select a pin** with items
3. **Click Delete on one item:**
   - ✅ Item deleted
   - ✅ Toast shows success
   - ✅ Console shows logs
4. **If it was the last item:**
   - ✅ Pin automatically deleted too
   - ✅ Toast says "Pin and item deleted"
   - ✅ Pin disappears from map
5. **If pin had more items:**
   - ✅ Pin stays
   - ✅ Toast says "item deleted (pin still has other items)"

---

## Full Console Output Example

### When Pin Has Other Items
```
🗑️ Deleting pin_item item123 from pin pin456
✅ Pin_item item123 deleted from database
🔍 Checking if pin pin456 should be deleted (no items remaining)
✅ Pin pin456 has 2 remaining item(s), not deleting
✅ Item deleted, pin pin456 still exists
```

### When Pin Has NO Other Items (All Deleted)
```
🗑️ Deleting pin_item item123 from pin pin456
✅ Pin_item item123 deleted from database
🔍 Checking if pin pin456 should be deleted (no items remaining)
🗑️ No pin_items remain for pin pin456, deleting the pin
✅ Successfully deleted pin pin456 (no items remaining)
✅ Pin auto-deleted (no items remaining)
```

---

## Error Handling

If something goes wrong:

```
🗑️ Deleting pin_item item123 from pin pin456
❌ Error deleting pin_item: permission denied
❌ Error in handleDeletePinItem: permission denied
```

User sees toast: "Failed to delete item"

---

## Alternative: Simpler Version

If you want a simpler version without toasts:

```typescript
async function deleteItemSimple(pinItemId: string, pinId: string) {
  // Delete item
  await supabase.from('pin_items').delete().eq('id', pinItemId)
  
  // Check and delete pin if needed
  const { deleted } = await deletePinIfNoItemsRemain(pinId)
  
  // Refresh UI
  await loadDashboardData()
  
  return { deleted }
}
```

Then call it:
```typescript
const { deleted } = await deleteItemSimple(itemId, pinId)
console.log(deleted ? 'Pin deleted too' : 'Item only')
```

---

## Integration Points

| Location | Use Case |
|----------|----------|
| Organization Dashboard | Delete item button → auto-delete pin |
| Pin completion flow | Delete all items → auto-delete pin |
| Admin interface | Bulk delete items → auto-delete pins |
| API route | Delete via API → check pin status |

---

## Notes

- ✅ Function handles all error cases
- ✅ Safe: Won't delete pin if items remain
- ✅ Efficient: Single query per call
- ✅ User-friendly: Clear toast messages
- ✅ Logged: See all steps in console

---

## See Also

- `DELETE_PIN_IF_NO_ITEMS_GUIDE.md` - Function reference
- `PIN_DELETION_SERVICE_FUNCTION.md` - Technical details
- `src/services/pins.ts` - Source code
