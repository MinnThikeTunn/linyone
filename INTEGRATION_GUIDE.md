# Supabase Integration - Pins Management System

## Overview

The application has been successfully integrated with Supabase to persist pin data to the database. This document explains the architecture, database schema, and how the frontend interacts with the backend.

## Key Changes

### 1. **New Service File: `src/services/pins.ts`**

Created a centralized service layer for all pin-related database operations:

#### Functions Implemented:

- **`isUserActiveTracker(userId: string): Promise<boolean>`**
  - Checks if a user is an active tracker from the `org-member` table
  - Returns `true` if user has active status in org-member table
  - Used to determine permissions for confirming pins

- **`createPin(pin: ..., imageFile?: File): Promise<...>`**
  - Creates a new pin in the `pins` table
  - Handles image uploads to Supabase storage (bucket: `pin-images`)
  - **Key Logic (Status Determination - "B code"):**
    - If no user_id (unauthorized): status = `pending`
    - Else if user is active tracker (checked via isUserActiveTracker): status = `confirmed`
    - Else: status = `pending`
  - Converts frontend types to database types:
    - `damaged` → `damage`
    - `safe` → `shelter`
  - Returns newly created pin with UUID and timestamp

- **`fetchPins(): Promise<...>`**
  - Fetches all pins from database with creator information
  - Joins with `users` table to get creator names
  - Ordered by most recent first
  - Converts database types back to frontend format

- **`updatePinStatus(pinId: string, newStatus: ..., confirmedByMemberId?: string): Promise<...>`**
  - Updates pin status in database
  - Records who confirmed the pin (`confirmed_by`) and when (`confirmed_at`)
  - Can update to: `pending` → `confirmed` → `completed`

- **`getUserOrgMember(userId: string): Promise<...>`**
  - Retrieves org-member ID for a user
  - Used when confirming pins to set the `confirmed_by` field

### 2. **Updated `src/app/page.tsx`**

#### New State Variables:
```typescript
const [isCreatingPin, setIsCreatingPin] = useState(false);        // Loading state for pin creation
const [isUserTracker, setIsUserTracker] = useState(false);        // Whether current user is a tracker
const [userOrgMemberId, setUserOrgMemberId] = useState<string | null>(null); // User's org-member ID
```

#### Updated Functions:

**`useEffect` (on mount):**
- Fetches all pins from Supabase database
- Checks if current user is an active tracker
- Sets `isUserTracker` flag for UI conditionals
- Retrieves user's org-member ID for confirmations

**`handleCreatePin()`:**
- Now async function that calls `createPin()` service
- Saves pin to Supabase instead of just local state
- Shows loading spinner while creating
- Displays toast notification on success/error
- Updates local state only after successful database save

**`handleConfirmPin(pinId: string)`:**
- Now async function that calls `updatePinStatus()`
- Changes status from `pending` to `confirmed`
- Records who confirmed it via org-member ID
- Updates local state and shows notification

**`handleMarkCompleted(pinId: string)`:**
- Now async function that calls `updatePinStatus()`
- Changes status to `completed`
- Updates local state and shows notification

#### UI Changes:

1. **Status Update Buttons - Now use `isUserTracker` flag:**
   - Only visible to active trackers (database determined)
   - Shows on pending pins in both list view and detail dialog
   - Shows "Confirm" button to approve pin
   - Shows "Deny" button to reject pin

2. **Create Pin Button:**
   - Now shows loading spinner while creating
   - Disabled during creation to prevent double-submission

3. **Toast Notifications:**
   - Success messages when pins are created/updated
   - Error messages with details if operations fail

## Database Schema Reference

### Relevant Tables:

**`pins` table:**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users table)
- latitude: NUMERIC
- longitude: NUMERIC
- type: TEXT ('damage' | 'shelter')
- image_url: TEXT
- description: TEXT
- status: TEXT ('pending' | 'confirmed' | 'completed')
- confirmed_by: UUID (foreign key to org-member)
- confirmed_at: TIMESTAMP
- created_at: TIMESTAMP
- phone: NUMERIC or TEXT
```

**`org-member` table (Trackers):**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- organization_id: UUID
- status: TEXT ('active' | 'inactive')
- type: TEXT (default: 'normal')
- created_at: TIMESTAMP
```

**`users` table:**
```sql
- id: UUID (primary key)
- name: TEXT
- email: TEXT
- phone: TEXT
- password: TEXT (hashed)
- created_at: TIMESTAMP
- is_admin: BOOLEAN
```

## Type Conversions

The frontend uses different naming conventions than the database:

### Pin Type Conversion:
- Frontend: `damaged` ↔ Database: `damage`
- Frontend: `safe` ↔ Database: `shelter`

### Status Values (same on both sides):
- `pending`: New pin awaiting confirmation
- `confirmed`: Pin confirmed by a tracker
- `completed`: Pin fully processed/delivered

## User Roles & Permissions

### Permission Logic:

1. **Unauthorized Users (no user_id):**
   - Can create pins → Status automatically set to `pending`
   - Cannot confirm or mark as completed

2. **Regular Users (user_id exists, not a tracker):**
   - Can create pins → Status automatically set to `pending`
   - Cannot confirm or mark as completed

3. **Trackers (active in org-member table):**
   - Can create pins → Status automatically set to `confirmed`
   - Can confirm other pending pins (approve them)
   - Can deny pins (reject them)

4. **Supply Volunteers:**
   - Can mark confirmed damaged pins as `completed` (delivered)

## Data Flow

### Creating a Pin:
```
1. User fills form and submits
2. handleCreatePin() called
3. createPin() service called with pin data + optional image
4. Image uploaded to Supabase storage (if provided)
5. Pin inserted into 'pins' table
6. Status auto-determined based on user role
7. Response returned to component
8. Local state updated
9. Toast notification shown
10. Map flies to new pin location
```

### Confirming a Pin:
```
1. Tracker clicks "Confirm" button on pending pin
2. handleConfirmPin() called with pin ID
3. updatePinStatus() service called with new status
4. Database updates: status → 'confirmed', confirmed_by → tracker's org-member ID, confirmed_at → now
5. Local state updated
6. Toast notification shown
```

### Fetching Pins:
```
1. Component mounts
2. fetchPins() service called
3. Database query with JOIN to users table
4. Creator names populated from users table
5. Local state set with all pins
6. Map updated with markers
```

## Integration Points

### 1. Authentication Check:
```typescript
const { user, isAuthenticated } = useAuth();
// user.id used to determine permissions
```

### 2. Toast Notifications:
```typescript
const { toast } = useToast();
// Used for success/error feedback
```

### 3. Supabase Client:
```typescript
import { supabase } from '@/lib/supabase'
// Client already configured with credentials in src/lib/supabase.ts
```

## API Usage in Components

### In Page Component:

```typescript
// Load pins on mount
useEffect(() => {
  const pinsResult = await fetchPins();
  setPins(pinsResult.pins);
}, []);

// Create new pin
const result = await createPin(pinData, imageFile);
if (result.success) {
  // Handle success
}

// Update pin status
const result = await updatePinStatus(pinId, 'confirmed', orgMemberId);
```

## Error Handling

All service functions include try-catch blocks and return error information:

```typescript
{
  success: boolean,
  pin?: Pin,           // Only on create success
  pins?: Pin[],        // Only on fetch success
  error?: string       // Error message if failed
}
```

Errors are caught and displayed to user via toast notifications.

## Future Enhancements

1. **Real-time Updates:**
   - Use Supabase realtime subscriptions for live pin updates
   - Show when other users confirm pins

2. **Batch Operations:**
   - Bulk confirm/deny pins
   - Export pin data

3. **Advanced Filtering:**
   - Filter by status, type, date range
   - Search by phone number

4. **Image Optimization:**
   - Compress images before upload
   - Generate thumbnails

5. **Audit Trail:**
   - Track all status changes
   - Record reason for denial

6. **Assignments:**
   - Assign pins to specific volunteers
   - Track assignment completion

## Testing Checklist

- [ ] Create pin as unauthorized user (status = pending)
- [ ] Create pin as regular user (status = pending)
- [ ] Create pin as tracker (status = confirmed)
- [ ] Tracker confirms a pending pin
- [ ] Tracker denies a pending pin
- [ ] Supply volunteer marks confirmed pin as completed
- [ ] Image upload works
- [ ] Toast notifications appear
- [ ] Map updates in real-time
- [ ] Pins load on page refresh
- [ ] Creator names display correctly

## Configuration

Supabase credentials are configured in `src/lib/supabase.ts`:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

These should be set in your `.env.local` file.

---

**Last Updated:** November 11, 2025
**Integration Status:** ✅ Complete
