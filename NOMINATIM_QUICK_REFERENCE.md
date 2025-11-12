# Nominatim Quick Reference

## What Is Nominatim?

**Free, open-source reverse geocoding service using OpenStreetMap data**

- 🆓 **Free** - No cost, no API key
- 🗺️ **Global** - Works worldwide
- ⚡ **Fast** - Instant results
- 📊 **Open** - Transparent, community-driven
- 🔄 **Reliable** - Used by millions

---

## API Endpoint

```
https://nominatim.openstreetmap.org/reverse
```

## Request Format

```bash
GET https://nominatim.openstreetmap.org/reverse?format=json&lat=40.7128&lon=-74.0060&zoom=18&addressdetails=1
```

## Response Format

```json
{
  "address": {
    "house_number": "32",
    "road": "Broadway",
    "city": "New York",
    "state": "New York",
    "postcode": "10007",
    "country": "United States"
  },
  "display_name": "32 Broadway, New York, NY, USA",
  "lat": "40.7128",
  "lon": "-74.0060",
  "osm_id": 123456,
  "osm_type": "way"
}
```

---

## Rate Limits

| Plan | Limit | Cost |
|------|-------|------|
| **Public** | 1 req/sec | FREE |
| **Commercial** | Higher | Paid plans available |

**For your app:** 1 req/sec = 86,400 req/day = More than enough!

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Address found |
| 400 | Bad request (invalid coordinates) |
| 404 | No results found |
| 429 | Rate limited (our code handles this) |
| 500 | Server error (rare) |

---

## Coordinate Rules

| Parameter | Range | Example |
|-----------|-------|---------|
| `lat` | -90 to +90 | 40.7128 (North) |
| `lon` | -180 to +180 | -74.0060 (West) |

---

## Query Parameters

| Param | Values | Default |
|-------|--------|---------|
| `format` | `json`, `xml`, `jsonv2` | `json` |
| `lat` | -90 to 90 | Required |
| `lon` | -180 to 180 | Required |
| `zoom` | 0-18 | 18 (detailed) |
| `addressdetails` | 0 or 1 | 1 (recommended) |

---

## Code Examples

### JavaScript/TypeScript

```typescript
async function getAddress(lat: number, lon: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return data.display_name // "32 Broadway, New York, NY, USA"
}

// Usage
const address = await getAddress(40.7128, -74.0060)
console.log(address)
```

### cURL

```bash
curl "https://nominatim.openstreetmap.org/reverse?format=json&lat=40.7128&lon=-74.0060&zoom=18&addressdetails=1"
```

### Python

```python
import requests

url = "https://nominatim.openstreetmap.org/reverse"
params = {
    "format": "json",
    "lat": 40.7128,
    "lon": -74.0060,
    "zoom": 18,
    "addressdetails": 1
}

response = requests.get(url, params=params)
data = response.json()
print(data['display_name'])
```

---

## Common Addresses to Test

| Place | Coordinates | Expected Result |
|-------|-------------|-----------------|
| Times Square, NYC | 40.7580, -73.9855 | Times Square, Manhattan |
| Eiffel Tower | 48.8584, 2.2945 | Paris, France |
| Big Ben | 51.4975, -0.1357 | London, England |
| Tokyo Tower | 35.6762, 139.6503 | Tokyo, Japan |
| Sydney Opera | -33.8568, 151.2153 | Sydney, Australia |

---

## Address Components

Nominatim returns these address fields:

```json
{
  "address": {
    "house_number": "...",       // 32
    "road": "...",               // Broadway
    "neighborhood": "...",       // Financial District
    "suburb": "...",             // Manhattan
    "city": "...",               // New York
    "county": "...",             // New York County
    "state": "...",              // New York
    "postcode": "...",           // 10007
    "country": "...",            // United States
    "country_code": "..."        // us
  }
}
```

---

## Error Handling

### No Results
```json
{
  "address": null,
  "error": "Unable to geocode"
}
```

### Rate Limited
```
HTTP 429 Too Many Requests
```

### Invalid Parameters
```json
{
  "error": "Invalid lat/lon"
}
```

---

## Performance Tips

1. **Cache results** - Same coordinates = same address
2. **Batch requests** - Group by time instead of rapid-fire
3. **Use appropriate zoom** - 18 for street level, lower for city level
4. **Request timeout** - Set to 10 seconds
5. **User-Agent** - Include your app name

---

## Usage Policy

✅ **Allowed:**
- Non-commercial use
- Commercial use (check terms)
- Attribution appreciated
- Self-hosting

❌ **Not Allowed:**
- Scraping
- Downloading entire dataset
- Excessive automation
- Reselling data

---

## Our Implementation

In your app: `src/app/api/reverse-geocode/route.ts`

```typescript
// Rate limiting: 1 request per second
const MIN_REQUEST_INTERVAL = 1100

// Request with timeout
const response = await fetch(url, {
  headers: {
    'User-Agent': 'LinnYone-App (Disaster Response)',
  },
  signal: AbortSignal.timeout(10000), // 10 second timeout
})

// Parse response
const data = await response.json()
return {
  success: true,
  primary_address: data.display_name,
  results: formattedResults,
}
```

---

## Troubleshooting

### Getting "Location unknown"?
- ❌ Invalid coordinates (outside -90 to 90, -180 to 180)
- ❌ Coordinates in ocean/unpopulated area
- ❌ Network timeout
- ✅ Try with known coordinates like NYC (40.7128, -74.0060)

### Getting rate limited?
- ✅ Our code handles this automatically
- ✅ Waits 1+ second between requests
- ⚠️ If persistent, consider self-hosting

### Getting blank address?
- ❌ Zoom level too low (try zoom=18)
- ❌ Coordinates in unpopulated area
- ✅ Check with online tool: https://nominatim.openstreetmap.org/

---

## Dashboard

Monitor your usage:
https://nominatim.openstreetmap.org/ui/

---

## Support

- **Documentation:** https://nominatim.org/release-docs/develop/
- **GitHub:** https://github.com/osm-search/Nominatim
- **Community:** OpenStreetMap Forum

---

## Key Difference from Google Maps

| Aspect | Google | Nominatim |
|--------|--------|-----------|
| Street format | "1600 Pennsylvania Ave NW" | More OpenStreetMap style |
| Building names | Included | May be missing |
| Postal codes | Always included | Sometimes missing |
| Overall | Slightly more polished | Good, community-driven |

**For your disaster response app: Both are excellent. Nominatim is free!**

---

## Free Tier Quotas

- **Public API:** 1 req/second (unlimited total)
- **Per hour:** ~3,600 requests
- **Per day:** ~86,400 requests
- **Per year:** ~31.5 million requests

**Enough for:** Multiple users using dashboard continuously

---

**Ready to use!** 🚀 No setup needed, completely free.
