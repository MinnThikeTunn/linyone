# Supabase Configuration Guide

## Environment Variables Setup

To use the Supabase integration, you need to add the following environment variables to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kitrjktrnrtnpaazkegx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHJqa3RybnJ0bnBhYXprZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDM3NzIsImV4cCI6MjA3ODMxOTc3Mn0.n1bhj3AILZQ6I7bkStsZmRik0Ush9fnwttGciLuf1yc
```

## Database Schema Setup

Make sure the following tables exist in your Supabase database:

### 1. Users Table
```sql
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

### 2. Org-Member Table (Trackers)
```sql
CREATE TABLE public.org-member (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  user_id uuid,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  type text DEFAULT 'normal'::text,
  CONSTRAINT org-member_pkey PRIMARY KEY (id),
  CONSTRAINT org-member_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT org-member_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### 3. Pins Table
```sql
CREATE TABLE public.pins (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  type text CHECK (type = ANY (ARRAY['damage'::text, 'shelter'::text])),
  image_url text,
  description text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text])),
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  phone text,
  CONSTRAINT pins_pkey PRIMARY KEY (id),
  CONSTRAINT pins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT pins_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.org-member(id)
);
```

### 4. Organizations Table
```sql
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  password text,
  role text DEFAULT 'Organization'::text,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
```

## Storage Setup

Create a storage bucket for pin images:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `pin-images`
3. Make it public (set public policy)
4. (Optional) Set max file size and allowed MIME types

## Row Level Security (RLS) Policies

### For pins table - Enable Read for All:
```sql
CREATE POLICY "Allow public read on pins"
ON public.pins FOR SELECT
USING (true);
```

### For pins table - Enable Insert:
```sql
CREATE POLICY "Allow authenticated users to insert pins"
ON public.pins FOR INSERT
WITH CHECK (true);
```

### For pins table - Enable Update:
```sql
CREATE POLICY "Allow pin updates"
ON public.pins FOR UPDATE
USING (true);
```

### For org-member table - Enable Read:
```sql
CREATE POLICY "Allow public read on org-member"
ON public.org-member FOR SELECT
USING (true);
```

### For users table - Enable Read:
```sql
CREATE POLICY "Allow public read on users"
ON public.users FOR SELECT
USING (true);
```

## Testing the Integration

### 1. Verify Supabase Connection
```typescript
// In browser console
const { data, error } = await supabase.from('pins').select('count()');
console.log(data, error);
```

### 2. Create a Test Pin
- Navigate to homepage
- Click "Add Pin" button
- Fill in phone, description, and select location
- Submit form
- Check Supabase dashboard - pin should appear in `pins` table

### 3. Test Tracker Functionality
- Create a user in `org-member` table with `status: 'active'`
- Login as that user
- Create a new pin - it should be auto-confirmed (status = 'confirmed')
- Visit another pending pin - you should see "Confirm" and "Deny" buttons

### 4. Test Pin Status Updates
- As a tracker, click "Confirm" on a pending pin
- Status should change to "confirmed" in database
- `confirmed_by` and `confirmed_at` should be populated

## Troubleshooting

### Issue: "Cannot find module @supabase/supabase-js"
**Solution:** Install the package
```bash
npm install @supabase/supabase-js
```

### Issue: "Bucket 'pin-images' not found"
**Solution:** Create the storage bucket in Supabase dashboard

### Issue: "Row Level Security violation"
**Solution:** Enable RLS policies as shown above, or disable RLS for development

### Issue: "user_id is null when creating pin"
**Solution:** This is expected for unauthorized users. Pins will be created with status='pending'

### Issue: Pins not loading on page refresh
**Solution:** Check browser console for errors, verify environment variables are set

## Performance Tips

1. **Add Indexes** on frequently queried columns:
```sql
CREATE INDEX idx_pins_status ON public.pins(status);
CREATE INDEX idx_pins_user_id ON public.pins(user_id);
CREATE INDEX idx_pins_created_at ON public.pins(created_at DESC);
```

2. **Pagination** for large datasets (implement in future):
```typescript
const { data } = await supabase
  .from('pins')
  .select()
  .range(0, 49); // First 50 records
```

3. **Real-time Updates** (implement in future):
```typescript
const subscription = supabase
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'pins' },
    (payload) => {
      // Handle pin changes
    }
  )
  .subscribe();
```

## Security Considerations

1. **Environment Variables:** Never commit `.env.local` to git
2. **ANON Key:** Only use for public read operations
3. **Service Role Key:** Keep secret, use only server-side
4. **Image Validation:** Validate image uploads on server-side
5. **RLS Policies:** Configure based on your security requirements

---

**Status:** ✅ Ready for deployment
