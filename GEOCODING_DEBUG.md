# Geocoding Debug Guide

## Issue: Empty Error Object `{}`

The reverse geocoding is failing with an empty error object. This could be:

1. **API Key Invalid or Restricted**
2. **API Key Missing Permissions**
3. **Billing Not Enabled**
4. **API Not Enabled in Google Cloud**

## Quick Diagnosis

### Step 1: Check Google Cloud Console

Go to: https://console.cloud.google.com/

1. **Select your project** (or create one if needed)
2. **Enable Geocoding API:**
   - Go to APIs & Services → Library
   - Search for "Geocoding API"
   - Click "Enable"
   - Wait 2-5 minutes for changes to take effect

3. **Check API Restrictions:**
   - Go to APIs & Services → Credentials
   - Find your API key
   - Click on it to edit
   - Under "API restrictions", make sure "Geocoding API" is allowed
   - Remove any IP/referrer restrictions (set to "None" for now)

4. **Enable Billing:**
   - Geocoding API requires billing enabled
   - Go to Billing and enable it
   - (Should be free tier if under usage limits)

### Step 2: Test the API Key

Run this in your browser console or terminal:

```bash
# Replace YOUR_API_KEY with your actual key
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=40.7128,-74.0060&key=YOUR_API_KEY"
```

**Expected Response:**
```json
{
  "results": [
    {
      "formatted_address": "New York, NY, USA",
      ...
    }
  ],
  "status": "OK"
}
```

**Common Error Responses:**

- `"status": "REQUEST_DENIED"` → API key invalid or restricted
- `"status": "ZERO_RESULTS"` → Valid coordinates but no results
- `"status": "OVER_QUERY_LIMIT"` → Rate limited
- `"error_message": "The provided API key is invalid"` → Wrong key
- `"error_message": "Billing not enabled"` → Enable billing in Google Cloud

### Step 3: Verify in Application

After fixing the API key:

1. Stop dev server: `Ctrl+C`
2. Restart: `npm run dev`
3. Check browser console for detailed error messages
4. Look for logs showing:
   - "Geocoding request: lat=..., lng=..."
   - "Geocoding response status: OK"

### Step 4: Check Your API Key

Your current API key in `.env.local`:
```
GOOGLE_MAPS_API_KEY=AIzaSyDjH3jc7pkdhPjdXKx2j-QJANMd6Z92SF4
```

**To verify this key works:**

1. Go to: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Search for this key ID (starts with `AIzaSy`)
4. Check:
   - [ ] Status is "Active"
   - [ ] Geocoding API is in the allowed list
   - [ ] Billing is enabled
   - [ ] API restrictions show "Geocoding API"

### Alternative: Create a New API Key

If the existing key isn't working:

1. Go to https://console.cloud.google.com/
2. APIs & Services → Credentials → Create Credentials → API Key
3. Restrict it to "Geocoding API" only
4. Copy the new key
5. Replace in `.env.local`:
   ```
   GOOGLE_MAPS_API_KEY=your_new_key_here
   ```
6. Restart dev server

## How to Test Locally

### Method 1: Direct API Test

Create a test file `test-geocoding.js`:

```javascript
const apiKey = 'AIzaSyDjH3jc7pkdhPjdXKx2j-QJANMd6Z92SF4'
const lat = 40.7128  // NYC
const lng = -74.0060

const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('Status:', data.status)
    console.log('Error:', data.error_message)
    if (data.results) {
      console.log('Address:', data.results[0]?.formatted_address)
    }
  })
  .catch(err => console.error('Fetch error:', err))
```

Run it:
```bash
node test-geocoding.js
```

### Method 2: Test via Dashboard

1. Create a test pin in Supabase with:
   - `status: 'confirmed'`
   - `latitude: 40.7128`
   - `longitude: -74.0060`

2. Go to Organization Dashboard
3. Check browser console for error details
4. Look for lines like:
   ```
   Geocoding request: lat=40.7128, lng=-74.0060
   Reverse geocoding error (status: ...) ...
   ```

### Method 3: Test the API Route Directly

```bash
curl -X POST http://localhost:3000/api/reverse-geocode \
  -H "Content-Type: application/json" \
  -d '{"lat": 40.7128, "lng": -74.0060}'
```

Expected response:
```json
{
  "success": true,
  "primary_address": "New York, NY 10007, USA",
  "results": [...]
}
```

## Next Steps

1. **Check if Geocoding API is enabled** in Google Cloud
2. **Verify API key is active** and not restricted
3. **Enable billing** if needed
4. **Restart dev server** after any changes
5. **Test with curl** before testing in app

---

## Quick Checklist

- [ ] API Key exists in `.env.local`
- [ ] Geocoding API enabled in Google Cloud Console
- [ ] API Key has "Geocoding API" in restrictions
- [ ] Billing enabled in Google Cloud
- [ ] Dev server restarted after `.env.local` changes
- [ ] Test curl request returns valid results
- [ ] Test data exists in Supabase (pins with status='confirmed')
- [ ] Dashboard loads without geocoding error

If all boxes checked but still failing, the API key may be invalid or credentials corrupted. Create a new one.
