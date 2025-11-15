# Deploy Updated Gemini Edge Function

## The Fix
Changed API endpoint from `v1` to `v1beta` to support Gemini 1.5 models.

## Option 1: Install Supabase CLI (Recommended)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref vuhjzuidqrffggdidcvt

# Deploy the updated function
supabase functions deploy gemini-chat

# Set the API key (if not already set)
supabase secrets set GCP_GEMINI_API_KEY=AIzaSyALUPAReFMoUVchfzG02jEcHejtGwFwoPs
```

## Option 2: Manual Deployment via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/vuhjzuidqrffggdidcvt/functions
2. Click on **"gemini-chat"** function
3. Click **"Edit Function"**
4. Copy the contents of `supabase/functions/gemini-chat/index.ts`
5. Paste it in the editor
6. Click **"Deploy"**
7. Go to **"Secrets"** tab and ensure `GCP_GEMINI_API_KEY` is set

## Option 3: Use Supabase VSCode Extension

1. Install the Supabase extension in VS Code
2. Connect to your project
3. Right-click on the function and select "Deploy"

## Verify Deployment

After deploying, test the function:

```bash
curl -X POST https://vuhjzuidqrffggdidcvt.functions.supabase.co/gemini-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aGp6dWlkcXJmZmdnZGlkY3Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjM3OTgsImV4cCI6MjA3ODE5OTc5OH0.-CnasN1J80i_Shzlmi50AD8dpr1dH6bbCntYDDDPrYk" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello"}
    ],
    "model": "gemini-1.5-flash"
  }'
```

Expected response:
```json
{
  "content": "Hello! How can I help you today?",
  "model": "gemini-1.5-flash"
}
```
