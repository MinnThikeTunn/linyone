# Geocoding Error: `Reverse geocoding error: {}`

## What Happened

When the dashboard loads, it tries to convert coordinates (lat/lng) to street addresses using Google Maps Reverse Geocoding API. The API returned an error but with an empty error object `{}`, which makes it hard to diagnose.

## Root Causes (In Order of Likelihood)

### 1. ❌ API Key Not Working (MOST COMMON)
**Symptoms:**
- Error status 400 or 403
- `REQUEST_DENIED` in response
- Empty error object

**Solutions:**
- [ ] Check `.env.local` has `GOOGLE_MAPS_API_KEY=...`
- [ ] Go to https://console.cloud.google.com/
- [ ] Select the correct project
- [ ] APIs & Services → Credentials
- [ ] Find the API key and verify it's **Active**
- [ ] Check **API restrictions** includes "Geocoding API"
- [ ] Remove **IP address restrictions** (set to "None")
- [ ] Restart dev server: `npm run dev`

### 2. ❌ Geocoding API Not Enabled
**Symptoms:**
- `OVER_QUERY_LIMIT` or `REQUEST_DENIED`
- Response: `"The API project does not have the Geocoding API enabled"`

**Solutions:**
- [ ] Go to https://console.cloud.google.com/
- [ ] Select your project
- [ ] APIs & Services → Library
- [ ] Search for "Geocoding API"
- [ ] Click **Enable**
- [ ] Wait 2-5 minutes for activation
- [ ] Restart dev server

### 3. ❌ Billing Not Enabled
**Symptoms:**
- Error message mentions "billing"
- `REQUEST_DENIED` status

**Solutions:**
- [ ] Go to https://console.cloud.google.com/
- [ ] Click on your project
- [ ] Go to Billing
- [ ] Click "Enable Billing"
- [ ] Set up a billing account
- [ ] Wait a few minutes
- [ ] Restart dev server

### 4. ❌ Invalid Coordinates in Database
**Symptoms:**
- Only some requests fail, others work
- `ZERO_RESULTS` response

**Solutions:**
- [ ] Check your test data in Supabase
- [ ] Make sure `latitude` and `longitude` are valid numbers
- [ ] Example valid coordinates:
  - New York: lat=40.7128, lng=-74.0060
  - London: lat=51.5074, lng=-0.1278
  - Tokyo: lat=35.6762, lng=139.6503
- [ ] Invalid coordinates cause `ZERO_RESULTS` but app handles it gracefully

### 5. ❌ Rate Limiting
**Symptoms:**
- Works initially, then stops
- Error: `OVER_QUERY_LIMIT`

**Solutions:**
- [ ] Wait 1-2 hours for rate limit to reset
- [ ] Or upgrade Google Cloud billing to higher tier
- [ ] Or cache geocoding results

## Step-by-Step Troubleshooting

### Step 1: Verify Environment Setup

```bash
# Check if .env.local exists and has the key
cat .env.local | grep GOOGLE_MAPS_API_KEY
```

**Expected output:**
```
GOOGLE_MAPS_API_KEY=AIzaSyDjH3jc7pkdhPjdXKx2j-QJANMd6Z92SF4
```

If missing or blank, add it.

### Step 2: Test API Key Directly

**Option A: Using curl**
```bash
# Replace YOUR_API_KEY with actual key
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=40.7128,-74.0060&key=YOUR_API_KEY"
```

**Option B: Using browser**
1. Open DevTools (F12)
2. Go to Console
3. Run:
```javascript
const key = 'AIzaSyDjH3jc7pkdhPjdXKx2j-QJANMd6Z92SF4'
fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=40.7128,-74.0060&key=${key}`)
  .then(r => r.json())
  .then(d => console.log(d))
```

**Look for:**
- ✅ `"status": "OK"` - Key works!
- ❌ `"status": "REQUEST_DENIED"` - Key not working
- ❌ `"status": "OVER_QUERY_LIMIT"` - Rate limited
- ❌ `"status": "INVALID_REQUEST"` - Bad coordinates

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### Step 4: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for lines starting with:
   ```
   Geocoding request: lat=40.7128, lng=-74.0060
   Geocoding response status: OK
   ```

**If you see:**
- ✅ `Geocoding response status: OK` → Working!
- ❌ `Geocoding response status: PERMISSION_DENIED` → API key issue
- ❌ `Geocoding response status: INVALID_REQUEST` → Bad coordinates

### Step 5: Verify Dashboard Still Works

Even with geocoding errors, the dashboard should:
- ✅ Load help requests from database
- ✅ Show them with status "Location unknown" instead of address
- ✅ Allow accepting items
- ✅ Allow viewing details

If dashboard is empty or crashes, the issue is elsewhere.

## Current Improvements Made

We've improved error handling to show:

**Before:**
```
Reverse geocoding error: {}
```

**After:**
```
Reverse geocoding error (status: 400): {
  error: "Geocoding failed: REQUEST_DENIED - The provided API key is invalid."
}
```

This tells you:
1. The HTTP status code (400, 403, 500, etc.)
2. The actual error message
3. Why it failed

## Workaround: Disable Geocoding (Temporary)

If geocoding is blocking your testing, you can temporarily disable it:

**File:** `src/services/pins.ts`, lines 777-785

Replace:
```typescript
const geocodedRequests = await Promise.all(
  helpRequests.map(async (request: any) => {
    const geoResult = await getReverseGeocodedAddress(request.lat, request.lng)
    return {
      ...request,
      region: geoResult.success ? geoResult.address : 'Location unknown',
      location: geoResult.success ? geoResult.address : 'Location unknown',
    }
  })
)
```

With:
```typescript
// TEMPORARY: Skip geocoding, just show coordinates
const geocodedRequests = helpRequests.map((request: any) => ({
  ...request,
  region: `${request.lat}, ${request.lng}`,
  location: `${request.lat}, ${request.lng}`,
}))
```

**Remember to restore after fixing the API key!**

## How Geocoding Should Work

```
Dashboard loads
    ↓
fetchConfirmedPinsForDashboard() gets pins from database
    ↓
For each pin:
  - Get latitude, longitude from pins table
  - Call getReverseGeocodedAddress(lat, lng)
    ↓
  - Sends POST to /api/reverse-geocode
    ↓
  - Route gets GOOGLE_MAPS_API_KEY from .env
    ↓
  - Calls Google Maps Geocoding API
    ↓
  - Returns formatted address (e.g., "New York, NY, USA")
    ↓
  - If error, shows "Location unknown"
    ↓
Dashboard displays addresses
```

## Testing Checklist

- [ ] GOOGLE_MAPS_API_KEY exists in `.env.local`
- [ ] Key is valid (test with curl/browser)
- [ ] Geocoding API enabled in Google Cloud
- [ ] Billing enabled in Google Cloud
- [ ] API restrictions set to "Geocoding API"
- [ ] Dev server restarted after changes
- [ ] Test pins exist in Supabase with valid lat/lng
- [ ] Dashboard loads without crashing
- [ ] Help requests show with addresses (or "Location unknown")

## Getting Help

### Still Not Working?

1. **Check the console logs:**
   - Look for "Geocoding request:" lines
   - Look for "Geocoding response status:" lines
   - These show what's happening

2. **Check browser Network tab:**
   - F12 → Network tab
   - Look for `/api/reverse-geocode` requests
   - Check the response (should show error details)

3. **Check Google Cloud Console:**
   - Make sure API key is Active
   - Make sure project is correct
   - Make sure Geocoding API is enabled
   - Make sure billing is set up

4. **Try with different coordinates:**
   - Use standard coordinates: 40.7128, -74.0060 (NYC)
   - If those work, issue is your data
   - If those don't work, issue is the API key

5. **Create a new API key:**
   - Sometimes keys get corrupted
   - Go to Google Cloud Console
   - Create a brand new API key
   - Test it with curl first
   - Replace in `.env.local`
   - Restart dev server

---

## What This Doesn't Affect

✅ Dashboard loads  
✅ Help requests display  
✅ Accept workflow  
✅ Database operations  
✅ User authentication  

Only **address display** is affected. App works fine with "Location unknown".

---

**Next Step:** Follow the checklist above. 99% of the time it's an API key issue or Geocoding API not enabled.
