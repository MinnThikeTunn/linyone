import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kitrjktrnrtnpaazkegx.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHJqa3RybnJ0bnBhYXprZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NDM3NzIsImV4cCI6MjA3ODMxOTc3Mn0.n1bhj3AILZQ6I7bkStsZmRik0Ush9fnwttGciLuf1yc'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for API routes and server components)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

