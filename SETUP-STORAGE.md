# Supabase Storage Setup for Profile Pictures

## Step 1: Create the Avatars Bucket

1. Go to your Supabase Dashboard
2. Click on **Storage** in the left sidebar
3. Click **New bucket**
4. Enter the following details:
   - **Name**: `avatars`
   - **Public bucket**: ✅ **Enable** (check this box so images are publicly accessible)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `image/*` (or leave empty to allow all)
5. Click **Create bucket**

## Step 2: Set Storage Policies (Optional but Recommended)

After creating the bucket, set up policies for security:

1. Go to **Storage** → **Policies**
2. Click on the **avatars** bucket
3. Add the following policies:

### Policy 1: Allow Anyone to View Images (SELECT)
```sql
-- Name: Public Access
-- Operation: SELECT
-- Policy Definition:
true
```

### Policy 2: Allow Authenticated Users to Upload (INSERT)
```sql
-- Name: Authenticated Upload
-- Operation: INSERT
-- Policy Definition:
auth.role() = 'authenticated'
```

### Policy 3: Allow Users to Update Their Own Images (UPDATE)
```sql
-- Name: Users Update Own
-- Operation: UPDATE
-- Policy Definition:
auth.uid()::text = (storage.foldername(name))[1]
```

### Policy 4: Allow Users to Delete Their Own Images (DELETE)
```sql
-- Name: Users Delete Own
-- Operation: DELETE
-- Policy Definition:
auth.uid()::text = (storage.foldername(name))[1]
```

## Step 3: Test the Upload

1. Go to your app's profile page
2. Click the Edit button
3. Hover over your avatar and click to upload an image
4. Select an image file
5. Click Save Changes

The image should now upload successfully!

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the bucket with the exact name `avatars`
- Check that the bucket is set to **Public**

### Error: "Permission denied"
- Enable RLS policies as shown above
- Make sure you're logged in when uploading

### Images not displaying
- Verify the bucket is set to **Public**
- Check the image URL in the database - it should look like:
  `https://[project-id].supabase.co/storage/v1/object/public/avatars/[filename]`

## Alternative: Without Storage Bucket

If you don't want to use Supabase Storage, you can:

1. Use a service like Cloudinary, Imgur, or AWS S3
2. Or simply paste an image URL directly into the database
3. Update the profile page to accept URL input instead of file upload
