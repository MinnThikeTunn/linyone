# Supabase Connection Verification Script

Run this in your browser console (F12 → Console) to diagnose connection issues:

```javascript
// ============================================
// SUPABASE CONNECTION DIAGNOSTIC
// ============================================

console.log('🔍 Starting Supabase diagnostics...\n');

(async () => {
  // Import Supabase client
  const { supabase } = await import('/src/lib/supabase.ts');
  
  console.log('✅ Supabase client loaded\n');

  // Test 1: Check client initialization
  console.log('📌 Test 1: Client Configuration');
  console.log('URL:', supabase.supabaseUrl || '❌ Missing');
  console.log('Key:', supabase.supabaseKey ? '✅ Present' : '❌ Missing');
  console.log();

  // Test 2: Try simple query
  console.log('📌 Test 2: Database Connection');
  try {
    const { data, error } = await supabase
      .from('pins')
      .select('count()', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      console.error('Message:', error.message);
      console.error('Code:', (error as any).code);
      console.error('Details:', (error as any).details);
    } else {
      console.log('✅ Connection successful');
      console.log('Count query works:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
  console.log();

  // Test 3: Check tables
  console.log('📌 Test 3: Table Existence');
  const tables = ['pins', 'users', 'org-member', 'organizations'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} rows`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Exception`);
    }
  }
  console.log();

  // Test 4: Check RLS
  console.log('📌 Test 4: RLS Policies');
  try {
    const { data: policies, error } = await supabase
      .from('pins')
      .select('id')
      .limit(1);
    
    if (error?.message?.includes('policy')) {
      console.log('⚠️ RLS policy might be blocking access');
    } else if (error) {
      console.log('⚠️ Other error:', error.message);
    } else {
      console.log('✅ RLS policies allow access');
    }
  } catch (err) {
    console.log('❌ Exception checking RLS');
  }
  console.log();

  // Test 5: Try fetching pins
  console.log('📌 Test 5: Fetch Pins');
  try {
    const { data, error } = await supabase
      .from('pins')
      .select('id, phone, status, created_at')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching pins:', error);
    } else {
      console.log(`✅ Fetched ${data?.length || 0} pins`);
      if (data && data.length > 0) {
        console.log('Sample pin:', data[0]);
      }
    }
  } catch (err) {
    console.error('❌ Exception fetching pins:', err);
  }
  console.log();

  console.log('✅ Diagnostics complete!');
})();
```

---

## 🚀 How to Use

1. Open your application in browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. **Paste the script above**
5. Press **Enter**
6. Review the output

---

## 📊 Expected Output

### ✅ Healthy System:
```
✅ Supabase client loaded
✅ Client Configuration
✅ Database Connection
✅ pins: 0 rows (or more)
✅ users: X rows
✅ RLS policies allow access
✅ Fetched X pins
✅ Diagnostics complete!
```

### ❌ Problem Signs:
```
❌ Missing: URL or Key
❌ Error: permission denied for schema public
❌ Error: relation "pins" does not exist
⚠️ RLS policy might be blocking access
```

---

## 🔧 Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `Missing: URL or Key` | Env vars not set | Update `.env.local` |
| `permission denied` | RLS policies missing | Run RLS SQL scripts |
| `relation "pins" does not exist` | Table not created | Create table in Supabase |
| `Invalid API key` | Wrong credentials | Check `.env.local` |

---

## 💡 Tips

- **If connection fails:** Check browser Network tab for actual error
- **If RLS error:** See TROUBLESHOOT_FETCH_ERROR.md
- **If table missing:** Run SQL scripts from SUPABASE_SETUP_COMPLETE.md
- **Still stuck?** Copy the diagnostic output and check against expected output

---

Save this script and run it whenever you see connection errors!
