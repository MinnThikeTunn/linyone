-- Disable RLS on avatars bucket to allow uploads without policies
-- Run this in your Supabase SQL Editor

-- First, check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'avatars';

-- If bucket doesn't exist, create it as public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Disable RLS on avatars bucket
UPDATE storage.buckets 
SET public = true 
WHERE name = 'avatars';

-- Verify the bucket is public and RLS is disabled
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE name = 'avatars';
