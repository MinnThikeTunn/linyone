# Storage Upload Debugging Guide

## Issue
Image upload returns empty error object `{}`, which means:
1. ❌ Not a network error (would have details)
2. ❌ Not a bucket not found (would say "Bucket not found")
3. ⚠️ **Most likely: RLS policy is blocking the upload**

## Quick Fix - Check RLS Policies

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** → **Policies**

### Step 2: Check pin-images Bucket Policies

Look for policies on the `pin-images` bucket. You should see:
- ❌ If you see policies with `auth.uid()` → Bucket requires authentication
- ✅ If you see `(bucket_id = 'pin-images')` → Public bucket policy

### Step 3: Add Public Upload Policy

If no policies exist or they restrict uploads:

1. Click **pin-images** bucket
2. Click **Policies** tab
3. Click **New policy** or **Create policy**
4. Select **For INSERT (allow uploads)**
5. Choose template: **Select a template** → **Allow public insert access**
6. Policy name: `allow public uploads`
7. Leave everything as default
8. Click **Review**
9. Click **Save policy**

This creates a policy like:
```sql
CREATE POLICY "allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'pin-images');
```

### Step 4: Test Upload

After adding the policy:

1. **Reload browser** (Ctrl+F5 or Cmd+Shift+R to clear cache)
2. **Create a new pin with image**
3. **Open browser console (F12)**
4. **Look for the emoji logs:**
   - 🔍 Image upload starting
   - 📤 Upload response
   - ✨ Image URL ready

## What to Share With Me

After trying this, tell me:
1. Did you see RLS policies on pin-images bucket?
2. Did you add the public upload policy?
3. What do the console logs show now? (🔍 → 📤 → ✨)
4. Did the image upload work?

## Alternative: Allow Anonymous Uploads

If the simple policy doesn't work, we can allow completely anonymous:

```sql
CREATE POLICY "allow anon uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'pin-images');
```

But the public policy should be sufficient.

## Console Output Expected

**Success:**
```
🔍 Image upload starting: {fileName: "pins/1731336234567_image.jpg", fileSize: 45632, fileType: "image/jpeg", bucket: "pin-images"}
📤 Upload response: {uploadData: {path: "pins/1731336234567_image.jpg", id: "..."}, uploadError: null}
✅ File uploaded to: pins/1731336234567_image.jpg
🔗 Public URL response: {publicUrl: "https://kitrjktrnrtnpaazkegx.supabase.co/storage/v1/object/public/pin-images/pins/1731336234567_image.jpg"}
✨ Image URL ready: https://kitrjktrnrtnpaazkegx.supabase.co/storage/v1/object/public/pin-images/pins/1731336234567_image.jpg
```

**Failure (RLS Policy Blocking):**
```
🔍 Image upload starting: {fileName: "pins/1731336234567_image.jpg", ...}
📤 Upload response: {uploadData: undefined, uploadError: {}}
❌ Image upload failed: {}
```

## RLS Policy Reference

The bucket being **Public** in the UI doesn't mean uploads are allowed without policies.
You need explicit `INSERT` policies for upload to work.

Check if this solves it! If the console still shows empty error `{}`, we'll need to check if the bucket path is correct or if there are other policies blocking.
