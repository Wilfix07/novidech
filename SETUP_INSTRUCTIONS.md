# Setup Instructions

## Your Supabase Project
- **URL**: https://sbmcresdqspwpgtoumcz.supabase.co
- **Reference ID**: `sbmcresdqspwpgtoumcz`

## 🚀 Fastest Way: Apply Migration via Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/sbmcresdqspwpgtoumcz)
2. Go to **SQL Editor**
3. Open `apply-directly.sql` from this project
4. Copy all contents and paste into SQL Editor
5. Click **Run**
6. ✅ Done!

## 🔧 Setup MCP for Future Use

To enable the AI assistant to manage your database via MCP:

1. **Create Personal Access Token:**
   - Visit: https://supabase.com/dashboard/account/tokens
   - Click "Create new token"
   - Name: "Cursor MCP"
   - Copy the token

2. **Create MCP Config File:**
   - Create `.cursor/mcp.json` in your project root
   - Copy contents from `mcp-config-template.json`
   - Replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your token
   - Save and restart Cursor

3. **Verify MCP Connection:**
   - In Cursor, go to Settings → MCP
   - You should see "supabase" with a green status

## 📁 Files Created

- `supabase/migrations/20240101000000_initial_schema.sql` - Migration file
- `apply-directly.sql` - Ready-to-run SQL for dashboard
- `mcp-config-template.json` - MCP configuration template
- `QUICK_START.md` - Quick reference guide

## ✅ What's Included

- **profiles** table with RLS policies
- Automatic profile creation on user signup
- Timestamp tracking (created_at, updated_at)
- Email index for performance


