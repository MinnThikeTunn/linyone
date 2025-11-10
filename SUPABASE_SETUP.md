# Supabase Setup Guide

This guide will help you set up Supabase for your Lin Yone Tech application.

## Prerequisites

- Supabase project created at: https://supabase.com/dashboard/project/kitrjktrnrtnpaazkegx
- Project URL: `https://kitrjktrnrtnpaazkegx.supabase.co`
- API Key: Already configured in `.env.local`

## Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/kitrjktrnrtnpaazkegx
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `supabase-migration.sql`
5. Click **Run** to execute the migration

This will create:
- `users` table for storing user profiles
- Row Level Security (RLS) policies
- Automatic triggers for profile creation
- Indexes for better query performance

## Step 2: Verify Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://kitrjktrnrtnpaazkegx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHJqa3RybnJ0bnBhYXprZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDM3NzIsImV4cCI6MjA3ODMxOTc3Mn0.n1bhj3AILZQ6I7bkStsZmRik0Ush9fnwttGciLuf1yc
```

## Step 3: Install Dependencies

Run the following command to install Supabase client:

```bash
npm install
```

This will install `@supabase/supabase-js` and remove Prisma dependencies.

## Step 4: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/register` and create a new account
3. Navigate to `/login` and sign in with your credentials

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, references `auth.users(id)` |
| `email` | TEXT | User's email address |
| `name` | TEXT | User's full name |
| `phone` | TEXT | User's phone number (optional) |
| `role` | TEXT | User role: `user`, `tracking_volunteer`, `supply_volunteer`, `organization`, `admin` |
| `organization_id` | TEXT | Organization ID for volunteers (optional) |
| `image` | TEXT | Profile image URL (optional) |
| `created_at` | TIMESTAMP | Account creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Security

- **Row Level Security (RLS)** is enabled on the `users` table
- Users can only read, update, and insert their own profiles
- All authentication is handled by Supabase Auth

## Troubleshooting

### Error: "relation 'users' does not exist"
- Make sure you've run the SQL migration in Step 1

### Error: "new row violates row-level security policy"
- Check that RLS policies are correctly set up
- Verify that the user is authenticated

### Authentication not working
- Verify environment variables are set correctly
- Check Supabase project URL and API key
- Ensure Supabase Auth is enabled in your project settings

## Next Steps

- Configure email templates in Supabase Auth settings
- Set up email confirmation if needed
- Add additional tables as needed for your application
- Configure storage buckets if you need file uploads

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Dashboard](https://supabase.com/dashboard/project/kitrjktrnrtnpaazkegx)

