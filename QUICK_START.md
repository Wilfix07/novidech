# Quick Start Guide

## Your Project
- **Project URL**: https://sbmcresdqspwpgtoumcz.supabase.co
- **Project Reference**: `sbmcresdqspwpgtoumcz`

## Apply Database Migration - Choose One Method

### Method 1: Supabase Dashboard (Easiest - Recommended) ⭐

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/sbmcresdqspwpgtoumcz)
2. Click on **SQL Editor** in the left sidebar
3. Open the file `apply-all-migrations.sql` in this project (contains complete schema)
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. ✅ Done! Your complete database schema is now set up.

### Method 2: Configure MCP and Use AI Assistant

1. **Get your Personal Access Token:**
   - Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
   - Click "Create new token"
   - Name it "Cursor MCP"
   - Copy the token

2. **Update MCP Configuration:**
   - Open `.cursor/mcp.json` in this project
   - Replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your actual token
   - Save the file
   - Restart Cursor

3. **Apply Migration:**
   - Ask the AI assistant: "Apply the database migration using Supabase MCP"
   - The migration will be applied automatically

### Method 3: Supabase CLI

```bash
# Link to your project
supabase link --project-ref sbmcresdqspwpgtoumcz

# Apply migrations
supabase db push
```

## What Gets Created

### Core Tables
✅ **profiles** - User profile information with roles (member, admin, treasurer)
✅ **members** - Mutuelle member details linked to profiles
✅ **transactions** - All financial transactions (contributions, loans, payments, etc.)
✅ **loans** - Loan records with status tracking
✅ **contributions** - Member contribution tracking

### Security & Features
✅ **Row Level Security (RLS)** - Users can only access their own data, admins can see all
✅ **Automatic triggers** - Profile created on signup, timestamps updated automatically
✅ **Indexes** - Optimized for performance on all key fields
✅ **Realtime** - Enabled for transactions, loans, and contributions

## Verify Migration

After applying, run this in SQL Editor:

```sql
-- Check table exists
SELECT * FROM public.profiles LIMIT 1;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Next Steps

- Start building your application!
- Add more tables as needed
- Extend the profiles table with additional fields
- Create more migrations for new features

