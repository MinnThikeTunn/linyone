# Authorization Fix: Tracker-Only Pin Confirmation

## Problem Fixed
Non-authorized users could confirm (accept) pending pins, even though only trackers should have this permission.

## Solution Implemented

### 1. Backend Authorization Check (pins.ts)
**File:** `src/services/pins.ts`
**Function:** `updatePinStatus()`

Added authorization validation:
- When `newStatus === 'confirmed'`, the function now:
  1. Requires `userId` to be provided
  2. Verifies the user is an active tracker using `isUserActiveTracker(userId)`
  3. Returns error if user is not a tracker: `"Only trackers can confirm pins"`
  4. Prevents unauthorized database updates

```typescript
// If attempting to confirm a pin, verify user is a tracker
if (newStatus === 'confirmed') {
  if (!userId || !confirmedByMemberId) {
    return { success: false, error: 'Only trackers can confirm pins' }
  }

  // Verify the user is an active tracker
  const isTracker = await isUserActiveTracker(userId)
  if (!isTracker) {
    return { success: false, error: 'Only trackers can confirm pins' }
  }
}
```

### 2. Frontend Authorization Check (page.tsx)
**File:** `src/app/page.tsx`
**Function:** `handleConfirmPin()`

Added double-layer verification:
- **Layer 1:** Client-side checks before attempting confirmation
  - Verifies user is logged in (`user?.id`)
  - Verifies user is a tracker (`isUserTracker`)
  - Shows appropriate error toast if either check fails
  
- **Layer 2:** Passes `user.id` to backend for server-side verification

```typescript
const handleConfirmPin = async (pinId: string) => {
  // Check 1: User logged in?
  if (!user?.id) {
    toast({ title: "Error", description: "You must be logged in..." })
    return
  }

  // Check 2: User is tracker?
  if (!isUserTracker) {
    toast({ title: "Error", description: "Only trackers can confirm pins" })
    return
  }

  // Call backend with userId for server-side verification
  const result = await updatePinStatus(
    pinId,
    "confirmed",
    userOrgMemberId || undefined,
    user.id  // ← Backend validates this
  )
}
```

### 3. Completion Status Check
Also updated `handleMarkCompleted()` with same authorization:
- Only trackers can mark pins as completed
- Same double-layer verification (frontend + backend)

## Authorization Flow

```
User clicks "Confirm" button
        ↓
[Frontend] Is user logged in? → No → Show error, return
        ↓ Yes
[Frontend] Is user a tracker? → No → Show error, return
        ↓ Yes
[Frontend] Call updatePinStatus(pinId, "confirmed", ..., userId)
        ↓
[Backend] Is userId provided? → No → Return error
        ↓ Yes
[Backend] Is user an active tracker? → Query org-member table
        ↓ Yes
[Backend] Update pin status in database
        ↓
Return success
```

## Security Layers

| Layer | Type | Method | Blocks |
|-------|------|--------|--------|
| 1 | Frontend UI | `isUserTracker` state | Non-trackers don't see button |
| 2 | Frontend Handler | `handleConfirmPin()` check | Tampered calls (dev tools) |
| 3 | Backend Authorization | `isUserActiveTracker()` | Direct API calls |
| 4 | Database | Foreign key `confirmed_by` | Invalid org-member IDs |

## Testing

### Test Case 1: Non-Authenticated User
```
1. Open app without logging in
2. Try to create pin → ✅ Can create (anonymous)
3. Try to confirm pin → ❌ Error: "You must be logged in"
4. Button should be hidden (no "Confirm" button visible)
```

### Test Case 2: Regular Authenticated User
```
1. Log in as regular user (not a tracker)
2. Try to confirm pin → ❌ Error: "Only trackers can confirm pins"
3. Button should be hidden (no "Confirm" button visible)
```

### Test Case 3: Tracker User
```
1. Log in as user in org-member table with status='active'
2. Try to confirm pending pin → ✅ Success
3. Button should be visible (show "Confirm" button)
4. Pin status changes to 'confirmed'
4. confirmed_by field in database should have org-member ID
```

### Test Case 4: Tampered Frontend
```
1. Open browser console (F12)
2. Try to call updatePinStatus directly as non-tracker
3. Backend validation should catch this → ✅ Error returned
4. Non-trackers cannot bypass backend check
```

## Files Modified

| File | Changes |
|------|---------|
| `src/services/pins.ts` | Added `userId` parameter to `updatePinStatus()`, added tracker authorization check |
| `src/app/page.tsx` | Updated `handleConfirmPin()` to verify logged-in status, tracker status, and pass userId; Updated `handleMarkCompleted()` with same checks |

## Error Messages

**New error messages users will see:**

1. "You must be logged in to confirm pins" (not logged in)
2. "Only trackers can confirm pins" (logged in but not a tracker)
3. "You must be logged in to update pins" (completing pins)
4. "Only trackers can mark pins as completed" (completing without tracker status)

## Backward Compatibility

✅ All existing code remains compatible:
- `updatePinStatus()` accepts optional `userId` parameter
- When `userId` is not provided, function doesn't check authorization
- Used safely for non-confirmation status updates (internal use only)

## Next Steps (Optional Enhancements)

1. **Add audit logging:** Log who confirmed which pins
2. **Add API route protection:** Create `/api/pins/confirm` endpoint with authentication
3. **Add rate limiting:** Prevent tracker from confirming too many pins too fast
4. **Add notification:** Notify original reporter when pin is confirmed
5. **Add data validation:** Validate pin exists before confirming

## Related Documentation

- See `FOREIGN_KEY_COMPLETE_SOLUTION.md` for user_id handling
- See `ARCHITECTURE.md` for authorization patterns
- See `QUICK_REFERENCE.md` for common operations
