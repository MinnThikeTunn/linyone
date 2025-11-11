# 🔧 Troubleshooting: "Error fetching pins: {}"

## Problem
When loading the page, you see this error:
```
Error fetching pins: {}
```

The empty error object `{}` indicates a Supabase query failure without a clear error message.

---

## Common Causes & Solutions

### 1. **RLS Policies Not Configured** (Most Common)

**Symptom:** Error with empty object `{}`

**Solution:**
Enable the SELECT policy on the pins table:

```sql
-- Run in Supabase SQL Editor

-- Enable RLS on pins table
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read pins
CREATE POLICY "Allow public read on pins"
ON public.pins FOR SELECT
USING (true);

-- Allow anyone to insert pins
CREATE POLICY "Allow public insert on pins"
ON public.pins FOR INSERT
WITH CHECK (true);

-- Allow updates on pins
CREATE POLICY "Allow public update on pins"
ON public.pins FOR UPDATE
USING (true);

-- Same for org-member table
ALTER TABLE public.org-member ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on org-member"
ON public.org-member FOR SELECT
USING (true);

-- Same for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on users"
ON public.users FOR SELECT
USING (true);
```

After running these, refresh the page.

---

### 2. **Tables Don't Exist**

**Symptom:** Same error with empty object

**Check:**
```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Solution:**
If tables are missing, create them using the SQL scripts in `SUPABASE_SETUP_COMPLETE.md`

---

### 3. **Wrong Environment Variables**

**Symptom:** Empty error on page load

**Check:**
```javascript
// In browser console
import { supabase } from '@/lib/supabase'
console.log(supabase)
```

**Solution:**
Verify `.env.local` has correct values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kitrjktrnrtnpaazkegx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

### 4. **Columns Missing**

**Symptom:** Error when fetching specific columns

**Check:**
```sql
-- In Supabase SQL Editor
DESCRIBE public.pins;
-- or
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='pins';
```

**Required columns:**
- id (uuid)
- user_id (uuid, nullable)
- latitude (numeric)
- longitude (numeric)
- type (text)
- phone (text)
- description (text)
- status (text)
- image_url (text, nullable)
- confirmed_by (uuid, nullable)
- confirmed_at (timestamp, nullable)
- created_at (timestamp)

If any are missing, create them.

---

### 5. **Network/Connection Issue**

**Symptom:** Intermittent errors

**Check:**
```javascript
// In browser console
const { data, error } = await supabase.from('pins').select('count()');
console.log('Connection test:', data, error);
```

**Solution:**
- Check internet connection
- Check Supabase project status
- Check for CORS issues in Network tab

---

## 🔍 Detailed Debugging

### Step 1: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for detailed error message
4. Copy full error text

### Step 2: Check Network Tab

1. Go to Network tab in DevTools
2. Look for requests to `supabase.co`
3. Click on failed request
4. Check Response tab for error details

### Step 3: Test Supabase Connection

```javascript
// In browser console

// Test 1: Can we reach Supabase?
import { supabase } from '@/lib/supabase'
const { data: testData, error: testError } = await supabase.from('pins').select('count()');
console.log('Test:', testData, testError);

// Test 2: Check if tables exist
const { data: tableCheck } = await supabase.from('pins').select('id').limit(1);
console.log('Table check:', tableCheck);

// Test 3: Check RLS
const { data: rls } = await supabase.rpc('get_rls_status', { table_name: 'pins' });
console.log('RLS status:', rls);
```

### Step 4: Verify RLS Policies

```sql
-- In Supabase SQL Editor

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('pins', 'users', 'org-member')
AND schemaname = 'public';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('pins', 'users', 'org-member')
AND schemaname = 'public';
```

---

## ✅ Quick Fix Checklist

- [ ] Run RLS policy SQL scripts
- [ ] Verify database tables exist
- [ ] Check `.env.local` credentials
- [ ] Verify columns in tables
- [ ] Test connection in browser console
- [ ] Refresh page
- [ ] Check browser Network tab

---

## 📝 If Still Not Working

### Provide this information:
1. Your error message from console
2. Network tab response for the failed request
3. Output of this query:
```sql
SELECT * FROM pg_policies WHERE tablename='pins';
```
4. Output of this check:
```sql
DESCRIBE public.pins;
```

### Quick Backup: Use Mock Data

If you need to proceed without database:
1. Uncomment mock pins in `src/app/page.tsx` line ~73
2. Comment out `fetchPins()` call
3. Pins will display locally

---

## 🆘 Still Stuck?

1. Check `SUPABASE_SETUP_COMPLETE.md` § Troubleshooting
2. Review `TESTING_GUIDE.md` § Debugging Commands
3. Verify Supabase project status at supabase.com

---

**Status:** This guide should resolve the "Error fetching pins: {}" issue.

**Next Step:** Follow the checklist above.
