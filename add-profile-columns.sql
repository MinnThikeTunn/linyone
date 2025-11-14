-- Add address, latitude, longitude, and image columns to users table if they don't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS image text;

-- Add latitude, longitude, and image columns to organizations table if they don't exist
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS image text;

-- Create index for faster location-based queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_organizations_location ON public.organizations (latitude, longitude);
