# 🎯 Quick Start: Delete Pin When Items Removed

## The Problem
You want pins to auto-delete when all their `pin_items` are removed.

## The Solution
Service function: `deletePinIfNoItemsRemain(pinId: string)`

---

## ⚡ 60-Second Integration

### Copy This Code

```typescript
// 1. Import
import { deletePinIfNoItemsRemain } from '@/services/pins'

// 2. Add handler function
async function deleteItemAndCheckPin(itemId: string, pinId: string) {
  try {
    // Delete the item
    const { error } = await supabase
      .from('pin_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    // Delete pin if no items remain
    const { deleted, error: delError } = await deletePinIfNoItemsRemain(pinId)

    if (delError) throw delError

    // Inform user
    const message = deleted 
      ? 'Item and pin deleted' 
      : 'Item deleted (pin still has items)'
    
    toast.success(message)
    
    // Refresh UI
    await loadPins()
  } catch (err) {
    toast.error('Failed: ' + err.message)
  }
}

// 3. Add to button click
<button onClick={() => deleteItemAndCheckPin(item.id, pin.id)}>
  Delete Item
</button>
```

---

## 📊 How It Works

```
Delete pin_items
    ↓
Call deletePinIfNoItemsRemain(pinId)
    ↓
Check: Any pin_items left?
    ├─ YES → Keep pin, return { deleted: false }
    └─ NO → Delete pin, return { deleted: true }
```

---

## 📋 3-Step Process

### Step 1: Import
```typescript
import { deletePinIfNoItemsRemain } from '@/services/pins'
```

### Step 2: Call After Delete
```typescript
await supabase.from('pin_items').delete().eq('pin_id', pinId)
const { deleted } = await deletePinIfNoItemsRemain(pinId)
```

### Step 3: Show Result
```typescript
if (deleted) {
  console.log('Pin deleted!')
} else {
  console.log('Item deleted (pin stays)')
}
```

---

## ✅ Return Values

```typescript
// Pin was deleted
{ success: true, deleted: true }

// Pin kept (has items)
{ success: true, deleted: false }

// Error occurred
{ success: false, deleted: false, error: "msg" }
```

---

## 🎮 Real Usage Example

```typescript
// Organization Dashboard Delete Button

async function handleDelete(pinItemId: string, pinId: string) {
  // Delete from database
  await supabase.from('pin_items').delete().eq('id', pinItemId)

  // Check if pin should be deleted
  const { deleted } = await deletePinIfNoItemsRemain(pinId)

  // Show message
  if (deleted) {
    toast.success('✅ Pin & item deleted')
  } else {
    toast.success('✅ Item deleted')
  }

  // Refresh
  await loadDashboard()
}
```

---

## 🧪 Test It

### Test 1: Item Deleted (Pin Stays)
```
Setup: Pin with 2 items
Action: Delete 1 item
Result: ✅ Item deleted, pin stays
Console: "Pin has 1 remaining item(s), not deleting"
```

### Test 2: Pin Deleted
```
Setup: Pin with 1 item
Action: Delete item
Result: ✅ Item AND pin deleted
Console: "No pin_items remain, deleting the pin"
```

---

## 📁 Full Examples

See: `PIN_DELETION_IMPLEMENTATION_EXAMPLE.md`

---

## 🔗 Learn More

| Want to... | Read |
|-----------|------|
| See full code | `PIN_DELETION_IMPLEMENTATION_EXAMPLE.md` |
| Understand API | `DELETE_PIN_IF_NO_ITEMS_GUIDE.md` |
| Get details | `PIN_DELETION_COMPLETE.md` |
| Follow steps | `PIN_DELETION_CHECKLIST.md` |

---

## ✨ Key Points

✅ **Safe** - Won't delete if items exist  
✅ **Simple** - Just call the function  
✅ **Logged** - See all steps in console  
✅ **Error-safe** - Handles errors gracefully  
✅ **Ready** - Use as-is, no config needed  

---

**That's it! Copy the code and test it! 🚀**
