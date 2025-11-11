# 🧪 Testing Guide - Supabase Integration

## Pre-Testing Checklist

Before running tests, ensure:

- [ ] Environment variables are set in `.env.local`
- [ ] Supabase project is created and accessible
- [ ] Database tables exist (pins, users, org-member, organizations)
- [ ] Storage bucket `pin-images` exists and is public
- [ ] RLS policies are configured
- [ ] `npm install @supabase/supabase-js` has been run
- [ ] Application builds without errors: `npm run build`

---

## 🧪 Test Scenarios

### Test 1: Create Pin as Anonymous User

**Setup:**
- Don't log in, or clear login state
- Navigate to home page

**Steps:**
1. Click "Add Pin" button
2. Select "Damaged" type
3. Enter phone: `09876543210`
4. Enter description: `Test anonymous pin`
5. Click "Select on Map"
6. Click on map to select location
7. Click "Done"
8. Click "Submit"

**Expected Result:**
- ✅ Loading spinner appears
- ✅ Pin appears on map
- ✅ Success toast notification
- ✅ In Supabase dashboard, new pin has:
  - `user_id: NULL`
  - `status: pending`
  - `type: damage`

**Debug:** If fails, check browser console for errors

---

### Test 2: Create Pin as Regular User

**Setup:**
- Login as regular user (not a tracker)
- User must exist in `users` table
- User must NOT be in `org-member` table

**Steps:**
1. Click "Add Pin" button
2. Select "Safe" type
3. Enter phone: `09876543211`
4. Enter description: `Test regular user pin`
5. Click "Submit"

**Expected Result:**
- ✅ Pin created successfully
- ✅ In database, pin has:
  - `user_id: [actual-user-uuid]`
  - `status: pending`
  - `createdBy: [user-name]` (shows in UI)
- ✅ Confirm button should NOT appear on this pin

**Debug:** If Confirm button appears, user might be in org-member table

---

### Test 3: Create Pin as Tracker

**Setup:**
- Ensure user exists in both:
  - `users` table
  - `org-member` table with `status: 'active'`
- Login as this tracker user
- App should detect tracker status on load

**Steps:**
1. Navigate to home page (wait for pins to load)
2. Check console: `isUserTracker` should be `true`
3. Click "Add Pin" button
4. Select "Damaged" type
5. Enter phone: `09876543212`
6. Enter description: `Test tracker auto-confirm`
7. Click "Submit"

**Expected Result:**
- ✅ Pin created successfully
- ✅ In database, pin has:
  - `status: confirmed` (auto-set by code)
  - NOT pending like other users
- ✅ No Confirm button appears (already confirmed)
- ✅ Success message shown

**SQL to create test tracker:**
```sql
-- Create user
INSERT INTO users (id, name, email, phone, password)
VALUES ('tracker-uuid', 'Tracker Name', 'tracker@test.com', '555-0000', 'hashed_pwd');

-- Make them tracker
INSERT INTO org-member (user_id, organization_id, status, type)
VALUES ('tracker-uuid', 'org-uuid', 'active', 'normal');
```

---

### Test 4: Tracker Confirms Pending Pin

**Setup:**
- Must have a pending pin from Test 2 (regular user)
- Must be logged in as tracker (from Test 3)
- Page should already have loaded the pending pin

**Steps:**
1. In "Recent Reports" panel, find the pending pin from Test 2
2. Click the pin to open detail dialog
3. Should see "Confirm" and "Deny" buttons
4. Click "Confirm"
5. Wait for request to complete

**Expected Result:**
- ✅ Pin status changes from "pending" to "confirmed"
- ✅ Success toast notification appears
- ✅ Button disappears (status no longer pending)
- ✅ In database:
  - `status: confirmed`
  - `confirmed_by: [tracker-org-member-id]`
  - `confirmed_at: [timestamp]`

**Debug if fails:**
```javascript
// In browser console
const { data } = await supabase
  .from('pins')
  .select()
  .eq('status', 'pending')
console.log(data) // Should be empty after confirm
```

---

### Test 5: Mark Pin as Completed

**Setup:**
- Must be logged in as supply_volunteer (role: 'supply_volunteer')
- Must have a confirmed damaged pin
- Assumption: UI still shows role-based button for supply volunteer

**Steps:**
1. Find a confirmed damaged pin in Recent Reports
2. Click on it
3. Should see "Mark Delivered" button
4. Click "Mark Delivered"

**Expected Result:**
- ✅ Pin status changes to "completed"
- ✅ Success toast notification
- ✅ Pin disappears from list (no longer confirmed pending)
- ✅ In database: `status: completed`

---

### Test 6: Page Refresh Persistence

**Setup:**
- Have created several pins
- Note their details

**Steps:**
1. Note pins on map before refresh
2. Press F5 or Ctrl+R to refresh page
3. Wait for page to reload
4. Wait for pins to load from database

**Expected Result:**
- ✅ All pins reappear
- ✅ Pins appear in same locations
- ✅ Pin status shows correctly
- ✅ Creator names display correctly
- ✅ No errors in console

---

### Test 7: Image Upload

**Setup:**
- Have an image file ready (JPG or PNG)
- Be ready to create a pin

**Steps:**
1. Click "Add Pin"
2. Fill in form details
3. Click file input under "Upload Image"
4. Select test image
5. File name should appear in input
6. Click "Submit"

**Expected Result:**
- ✅ Image uploads during pin creation
- ✅ Loading spinner shows
- ✅ Pin created successfully
- ✅ In database: `image_url` contains public URL
- ✅ In Supabase Storage: File appears in `pin-images/` folder
- ✅ Opening pin detail shows image

**Debug:**
```javascript
// Check if image URL is valid
const pin = pins[0]
console.log(pin.image)
// Should be: https://kitrjktrnrtnpaazkegx.supabase.co/storage/v1/object/...
```

---

### Test 8: Error Handling

**Setup:**
- Have invalid Supabase connection OR
- Remove network access

**Steps:**
1. Try to create pin with network down
2. Try to confirm pin with network down
3. Try to load pins with network down

**Expected Result:**
- ✅ Error toast notification appears
- ✅ Error message is user-friendly
- ✅ App doesn't crash
- ✅ Console shows detailed error
- ✅ User can retry after network restored

---

### Test 9: UI State Management

**Setup:**
- Have form open
- Monitor button states

**Steps:**
1. Open "Add Pin" dialog
2. Start filling form
3. Click "Submit" button immediately
4. Watch button state

**Expected Result:**
- ✅ Button shows "Creating..." spinner
- ✅ Button is disabled during creation
- ✅ Can't double-click to submit twice
- ✅ After completion, button returns to normal

---

### Test 10: Tracker Role Detection

**Setup:**
- Have two users:
  - User A: Not in org-member
  - User B: In org-member with status='active'

**Steps:**
1. Login as User A
2. Navigate to home
3. Check if Confirm button appears
4. Logout
5. Login as User B
6. Navigate to home
7. Check if Confirm button appears

**Expected Result:**
- ✅ User A: No Confirm buttons visible
- ✅ User B: Confirm buttons visible
- ✅ Role detection works correctly
- ✅ No UI buttons mixed up

---

## 🔍 Browser Developer Tools Tests

### Check Network Requests
```
1. Open DevTools (F12)
2. Go to Network tab
3. Create a pin
4. Look for Supabase requests:
   - Should see POST to .supabase.co/rest/v1/pins
   - Should see response with new pin UUID
5. Status should be 201 (Created)
```

### Check Database State
```
1. Open Supabase dashboard
2. Navigate to Database → pins table
3. Create a pin via app
4. Refresh table view
5. New row should appear
6. Check all fields are correct
```

### Check Storage Uploads
```
1. Open Supabase dashboard
2. Go to Storage → pin-images
3. Upload image with pin
4. Refresh storage view
5. New file should appear
6. Click file to verify it's accessible
```

### Console Errors Check
```
1. Open DevTools Console tab (F12)
2. Perform test actions
3. No red error messages should appear
4. Warnings are OK
5. Check for unhandled promise rejections
```

---

## ✅ Acceptance Criteria

All tests should pass before considering integration complete:

- [ ] Test 1: Anonymous user pin creation works
- [ ] Test 2: Regular user pin creation works
- [ ] Test 3: Tracker auto-confirm works
- [ ] Test 4: Tracker manual confirm works
- [ ] Test 5: Supply volunteer mark complete works
- [ ] Test 6: Data persists across page refresh
- [ ] Test 7: Image uploads work correctly
- [ ] Test 8: Error handling works
- [ ] Test 9: UI loading states work
- [ ] Test 10: Role detection works

**Pass Rate:** 10/10 = ✅ Ready for deployment

---

## 📋 Manual Testing Checklist

### Before Starting:
- [ ] Clear browser cache
- [ ] Clear localStorage
- [ ] Fresh browser tab
- [ ] Network tab open
- [ ] Console tab open

### During Testing:
- [ ] Watch for errors
- [ ] Check network requests
- [ ] Monitor database changes
- [ ] Note UI response times
- [ ] Check for race conditions

### After Each Test:
- [ ] Verify in database
- [ ] Take screenshot if issues
- [ ] Note any unexpected behavior
- [ ] Check console for warnings

---

## 🐛 Debugging Commands

### Check Supabase Connection
```javascript
// In browser console
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase.from('pins').select('count()')
console.log('Connected:', !error)
```

### Check Tracker Status
```javascript
// In browser console
import { isUserActiveTracker } from '@/services/pins'
const isTracker = await isUserActiveTracker('user-id-here')
console.log('Is tracker:', isTracker)
```

### Fetch All Pins
```javascript
// In browser console
import { fetchPins } from '@/services/pins'
const result = await fetchPins()
console.log(result.pins)
```

### Create Test Pin
```javascript
// In browser console
import { createPin } from '@/services/pins'
const result = await createPin({
  type: 'damaged',
  status: 'pending',
  phone: '555-1234',
  description: 'Test pin',
  lat: 16.8409,
  lng: 96.1735,
  createdBy: 'Tester',
  user_id: null
})
console.log(result)
```

### List Database Pins
```sql
-- In Supabase SQL Editor
SELECT id, status, phone, type, created_at 
FROM pins 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Tracker Records
```sql
-- In Supabase SQL Editor
SELECT om.id, u.name, om.status, om.created_at
FROM org-member om
JOIN users u ON om.user_id = u.id
ORDER BY om.created_at DESC;
```

---

## 📸 Test Evidence

Save screenshots showing:
- [ ] Pin created on map
- [ ] Database entry for pin
- [ ] Success notification
- [ ] Status change in database
- [ ] Multiple pins displayed
- [ ] Image uploaded to storage
- [ ] Error message (if applicable)
- [ ] Loading spinner state

---

## 📊 Performance Baseline

Record baseline times for:
- Page load: `___ ms`
- Fetch pins: `___ ms`
- Create pin: `___ ms`
- Update status: `___ ms`
- Image upload: `___ ms`

Compare with:
- Local state (before integration): `___ ms`
- Acceptable threshold: `2000 ms`

---

## 🎯 Test Completion

**Date Started:** ___________  
**Date Completed:** ___________  
**Tester Name:** ___________  
**Total Tests:** 10  
**Tests Passed:** ___/10  
**Tests Failed:** ___/10  
**Pass Rate:** ____%  

**Sign Off:** ☐ Ready for Production

---

## 📞 Support

If tests fail, check:
1. `QUICK_REFERENCE.md` - Common patterns
2. `SUPABASE_SETUP_COMPLETE.md` - Setup issues
3. `INTEGRATION_GUIDE.md` - Technical details
4. Browser console for error messages
5. Supabase dashboard for data verification

---

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** ✅ Complete Testing Guide
