# Supabase MCP Setup Guide

## Current Issue

The Supabase MCP tools are returning access control errors. This means the MCP connection needs to be properly configured with the right permissions.

## Solution: Configure Supabase MCP Access

### Step 1: Create a Personal Access Token

1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Click "Create new token"
3. Give it a descriptive name (e.g., "Cursor MCP Access")
4. Copy the token (you won't be able to see it again)

### Step 2: Get Your Project Reference

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID" (it looks like: `sbmcresdqspwpgtoumcz`)

### Step 3: Configure MCP in Cursor

1. Create `.cursor/mcp.json` in your project root (if it doesn't exist)
2. Add the following configuration:

**For Windows:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=<YOUR_PROJECT_REF>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<YOUR_PERSONAL_ACCESS_TOKEN>"
      }
    }
  }
}
```

**For macOS/Linux:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=<YOUR_PROJECT_REF>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<YOUR_PERSONAL_ACCESS_TOKEN>"
      }
    }
  }
}
```

3. Replace:
   - `<YOUR_PROJECT_REF>` with your project reference ID
   - `<YOUR_PERSONAL_ACCESS_TOKEN>` with your personal access token

4. Restart Cursor

### Step 4: Apply Migrations

Once MCP is configured, you can apply the migration using one of these methods:

#### Option A: Using Supabase MCP (Recommended)
Ask the AI assistant to apply the migration using the MCP tools. The migration file is already created at:
`supabase/migrations/20240101000000_initial_schema.sql`

#### Option B: Using Supabase CLI
```bash
# If using local Supabase
supabase db reset

# If connecting to cloud project
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

#### Option C: Using Supabase Dashboard
1. Go to your project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20240101000000_initial_schema.sql`
4. Paste and run the SQL

## What Was Created

The initial database schema includes:

1. **profiles table**: Extends auth.users with additional user profile information
2. **Row Level Security (RLS)**: Policies ensuring users can only access their own data
3. **Automatic profile creation**: Trigger that creates a profile when a user signs up
4. **Updated timestamp**: Automatic tracking of when records are updated

## Next Steps

After applying the migration, you can:
- Add more tables as needed
- Extend the profiles table with additional fields
- Create additional RLS policies
- Add more migrations for new features

## Troubleshooting

If you still get access errors after configuring MCP:

1. Verify your personal access token is valid
2. Check that your project reference ID is correct
3. Ensure Node.js and npx are in your system PATH
4. Try using read-only mode by adding `--read-only` to the args array
5. Check Cursor's MCP settings to see if the server is connected (should show green status)


