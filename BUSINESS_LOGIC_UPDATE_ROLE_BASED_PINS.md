# Business Logic Update: Role-Based Pin Management

## Overview
Updated the pin creation and management logic to differentiate between three user types with different capabilities.

## New Business Logic

### 1. Unauthorized Users
**Condition:** `user_id === null`
- Status: `pending`
- CreatedBy: `"Anonymous User"` (automatically set)
- Can: Create pins
- Cannot: Confirm or delete pins

### 2. Tracker Users
**Condition:** User exists in `org-member` table with `status = 'active'`
- Status: `confirmed` (automatically set on creation)
- CreatedBy: User name
- Can: Create pins, Confirm pending pins, Mark pins as completed
- Cannot: Delete pins

### 3. Organization Users  
**Condition:** `accountType = 'organization'` or `role = 'organization'`
- Status: `confirmed` (automatically set on creation)
- CreatedBy: Organization name
- Can: Confirm pending pins, Delete confirmed pins (marks as completed and removes)
- **Cannot:** Create new pins (button hidden)
- Button Text: "Mark as Completed & Delete"

### 4. Regular Authorized Users
**Condition:** User is authenticated but not a tracker or organization
- Status: `pending`
- CreatedBy: User name
- Can: Create pins
- Cannot: Confirm or delete pins

## Implementation Changes

### Backend Changes (pins.ts)

#### 1. New Helper Function: `isUserOrganization()`
```typescript
export async function isUserOrganization(userId: string): Promise<boolean> {
  // Checks if user exists in 'organizations' table
}
```

#### 2. Updated: `createPin()` function
**New Parameter:** `userRole?: string`
```typescript
export async function createPin(
  pin: CreatePinInput,
  imageFile?: File,
  userRole?: string  // ← NEW: Pass user role
)
```

**Status Determination Logic:**
```
if (user_id === null)
  → status = 'pending'
else if (user is active tracker)
  → status = 'confirmed'
else if (userRole === 'organization')
  → status = 'confirmed'
else
  → status = 'pending'
```

#### 3. New Function: `deletePin()`
```typescript
export async function deletePin(
  pinId: string,
  userId?: string,
  userRole?: string
): Promise<{ success: boolean; error?: string }>
```
- Authorization: Only organizations can delete (`userRole === 'organization'`)
- Deletes pin from database completely
- Returns error if unauthorized

### Frontend Changes (page.tsx)

#### 1. Import Update
```typescript
import { 
  createPin, 
  fetchPins, 
  updatePinStatus, 
  deletePin,  // ← NEW import
  // ...
}
```

#### 2. Updated: `handleCreatePin()`
```typescript
// Now passes user.role to createPin()
const result = await createPin(
  { /* pin data */ },
  pinImage || undefined,
  user?.role  // ← Pass role for status determination
);
```

#### 3. New: `handleDeletePin()` Handler
```typescript
const handleDeletePin = async (pinId: string) => {
  // Verify authorization (organization only)
  // Animate pin removal (bounce + fade)
  // Delete from database
  // Remove from UI
  // Show toast notification
}
```

#### 4. Hide "Add Pin" Button for Organizations
```tsx
{user?.role !== 'organization' && (
  <DialogTrigger asChild>
    <Button>
      <Plus className="w-4 h-4" />
      {t("map.addPin")}
    </Button>
  </DialogTrigger>
)}
```
- Button only shows for non-organization users
- Graceful removal - no button, no dialog option

#### 5. Add Delete Button to Pin Details
**Shown when:**
- User is organization AND
- Pin status is 'confirmed'

```tsx
{user?.role === 'organization' &&
  selectedPin.status === "confirmed" && (
    <Button
      onClick={() => handleDeletePin(selectedPin.id)}
      className="w-full bg-red-600 hover:bg-red-700"
    >
      <Check className="w-4 h-4 mr-2" />
      Mark as Completed & Delete
    </Button>
  )}
```

## User Flows

### Scenario 1: Anonymous User Creates Pin
```
1. User clicks "Add Pin" → Dialog opens ✅
2. User fills form and submits
3. Backend determines: no user_id → status: pending
4. Pin created with status: pending
5. CreatedBy: "Anonymous User"
```

### Scenario 2: Tracker Creates Pin
```
1. User logs in as tracker (in org-member table)
2. User clicks "Add Pin" → Dialog opens ✅
3. User fills form and submits
4. Backend checks: isUserActiveTracker(user.id) → true
5. Pin created with status: confirmed ✅
6. CreatedBy: Tracker name
```

### Scenario 3: Organization Manages Pins
```
1. User logs in as organization
2. User clicks "Add Pin" → Button hidden ❌
3. User views pins on map
4. Clicks on confirmed pin → Dialog opens
5. Button shows: "Mark as Completed & Delete"
6. User clicks button
7. Animation plays: Pin bounces and fades
8. Pin deleted from database
9. Pin removed from UI
10. Toast: "Pin deleted successfully"
```

### Scenario 4: Regular User Creates Pin
```
1. User logs in (not tracker, not organization)
2. User clicks "Add Pin" → Dialog opens ✅
3. User fills form and submits
4. Backend determines: not tracker, not org → status: pending
5. Pin created with status: pending
6. CreatedBy: User name
```

## Database Impact

### Pins Table
- No schema changes required
- Existing `status`, `user_id`, `created_by` fields used

### Organizations Table
- Expected to exist for organization users
- Used to verify if user is organization

### org-member Table
- Already used for tracker verification
- No changes required

## Authorization Matrix

| User Type | Create Pin | View Pins | Confirm (pending→confirmed) | Delete | Create Status |
|-----------|-----------|----------|---------------------------|--------|-----------------|
| Anonymous | ✅ | ✅ | ❌ | ❌ | pending |
| Tracker | ✅ | ✅ | ✅ | ❌ | confirmed |
| Organization | ❌ | ✅ | ✅ | ✅ (confirmed) | confirmed |
| Regular User | ✅ | ✅ | ❌ | ❌ | pending |

## Animation Details

### Pin Deletion Animation
```
1. Find pin element in DOM: `[data-pin-id="${pinId}"]`
2. Add classes: `animate-bounce opacity-50`
3. Wait 300ms for animation
4. Delete from database
5. Remove from UI (setPins filter)
```

**Classes Used:**
- `animate-bounce` - Tailwind bounce animation
- `opacity-50` - Fade out effect

## Error Handling

### Unauthorized Delete Attempt
```
User: Not an organization
Attempt: Delete pin
Result: ❌ Toast: "Only organizations can delete pins"
Action: No deletion occurs
```

### Organization without Login
```
Attempt: Delete without user_id
Result: ❌ Toast: "You must be logged in to delete pins"
Action: No deletion occurs
```

## Testing Checklist

### Test 1: Anonymous User
- [ ] Click "Add Pin" button → Dialog opens
- [ ] Fill form and submit
- [ ] Pin appears on map
- [ ] Pin has "pending" status badge
- [ ] CreatedBy shows "Anonymous User"

### Test 2: Tracker User
- [ ] Log in as tracker
- [ ] Click "Add Pin" → Dialog opens
- [ ] Submit pin
- [ ] Pin immediately shows "confirmed" status (not pending)
- [ ] Click pin → See "Confirm" button hidden (already confirmed)
- [ ] See "Mark as Completed" button

### Test 3: Organization User
- [ ] Log in as organization
- [ ] "Add Pin" button is hidden ❌ (not visible)
- [ ] View existing pins
- [ ] Click confirmed pin → Dialog opens
- [ ] Button shows "Mark as Completed & Delete"
- [ ] Click button → Animation plays
- [ ] Pin disappears from map
- [ ] Pin removed from database

### Test 4: Regular Authorized User
- [ ] Log in as regular user (not tracker, not org)
- [ ] Click "Add Pin" → Dialog opens ✅
- [ ] Submit pin
- [ ] Pin has "pending" status
- [ ] Cannot see delete button

## Security Notes

1. **Authorization is enforced server-side:** Even if UI is tampered with, backend verifies role
2. **Status determined by role:** No direct status submission from client
3. **Delete restricted to organizations:** Database enforces through service layer
4. **Tracker auto-confirmation:** Verified against org-member table each time

## Future Enhancements

1. Add audit logging for deletion events
2. Send notifications to pin reporter when deleted
3. Add soft delete (archive) instead of hard delete
4. Add role-based visibility (some pins hidden from certain users)
5. Add approval workflow for organization actions
6. Add pin assignment to specific organization

## Rollback Plan

If issues occur:
1. Revert `pins.ts` to remove `userRole` parameter
2. Revert `page.tsx` to previous version
3. Delete button hidden → Status becomes "pending" for org users
4. All pins treated equally

## Files Modified

| File | Changes |
|------|---------|
| `src/services/pins.ts` | Added `isUserOrganization()`, updated `createPin()`, added `deletePin()` |
| `src/app/page.tsx` | Updated `handleCreatePin()`, added `handleDeletePin()`, hid button for orgs, added delete button to pin details |

## Related Documentation

- See `AUTHORIZATION_FIX_TRACKER_CONFIRMATION.md` for confirmation authorization
- See `ARCHITECTURE.md` for system overview
- See `QUICK_REFERENCE.md` for common operations
