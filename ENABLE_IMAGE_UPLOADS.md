# 🚀 Quick Setup: Enable Image Uploads (2 Minutes)

## The Issue

Pin was created ✅ but image didn't appear because the storage bucket doesn't exist.

---

## Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard
Go to your Supabase project

### Step 2: Click Storage
Left sidebar → **Storage**

### Step 3: Create Bucket
- **Create new bucket**
- **Name:** `pin-images`
- **Click Create**

### Step 4: Make Public
- Click the `pin-images` bucket
- **Settings** tab
- Toggle: **Make public**

### Step 5: Test It
- Go back to app
- Create new pin
- **Select an image**
- Submit
- **Image should now upload!** ✅

---

## Verification

**In Supabase Dashboard:**
- Storage → pin-images
- Should see uploaded images there ✅

**In Your App:**
- Click a pin with image
- Image should display in details panel ✅

**In Console (F12):**
- Should see: `"Image uploaded successfully: https://..."`

---

## That's It! 🎉

Images now work. Create pins with photos and they'll upload automatically.

---

**Time Spent:** 2 minutes  
**Result:** Full image upload support ✅

