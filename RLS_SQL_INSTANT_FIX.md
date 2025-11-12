# ⚡ INSTANT FIX: RLS Policies (Copy-Paste SQL)

## Problem
Pins not loading → Error: `{}`

## Solution (90 Seconds)

### Step 1
Go to: https://supabase.com/dashboard/projects → Your Project → **SQL Editor**

### Step 2
Copy and paste this ENTIRE code:

```sql
-- Enable RLS and create policies for all tables
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on pins" ON public.pins FOR SELECT USING (true);
CREATE POLICY "Allow public insert on pins" ON public.pins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on pins" ON public.pins FOR UPDATE USING (true);

ALTER TABLE public.pin_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on pin_items" ON public.pin_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on pin_items" ON public.pin_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on pin_items" ON public.pin_items FOR UPDATE USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on users" ON public.users FOR SELECT USING (true);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on items" ON public.items FOR SELECT USING (true);

ALTER TABLE public."org-member" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on org-member" ON public."org-member" FOR SELECT USING (true);
CREATE POLICY "Allow public insert on org-member" ON public."org-member" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on org-member" ON public."org-member" FOR UPDATE USING (true);
```

### Step 3
Click **RUN** button (blue)

### Step 4
Refresh app: `http://localhost:3000` (F5)

✅ **DONE!** Pins should now load.

---

## What Happened

- ❌ Pins table had RLS enabled but no policies
- ❌ Supabase blocked all queries for anonymous users
- ✅ We added policies allowing public read/write
- ✅ Pins can now load on home page

---

## Pin Completion Also Works Now

When you mark a pin complete:
1. All pin_items deleted
2. Database trigger fires
3. Pin auto-deleted
4. Dashboard refreshes

Test it in `/organization` page!

---

## Not Working?

1. Hard refresh: `Ctrl+Shift+R`
2. Check console (F12): Look for `✅ Successfully fetched pins`
3. Restart dev server: `npm run dev`
4. See `PIN_COMPLETION_AND_RLS_QUICK_FIX.md` for full guide
