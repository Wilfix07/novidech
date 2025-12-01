# Teller User Setup Guide

## Overview

A **teller** user is a staff member who can enter and manage data for all members in the mutuelle system. Tellers have permissions to:

- ✅ View all members
- ✅ Create new members
- ✅ Update member information
- ✅ Enter transactions for any member
- ✅ Enter contributions for any member
- ✅ Create and manage loans for any member
- ✅ View all financial records

## Creating a Teller User

### Method 1: Via Supabase Dashboard (Recommended)

1. **Create the user account:**
   - Go to your Supabase Dashboard
   - Navigate to **Authentication** > **Users**
   - Click **Add User**
   - Enter the teller's email and password
   - Click **Create User**

2. **Assign teller role:**
   - Go to **SQL Editor** in your Supabase Dashboard
   - Run this query (replace `teller@example.com` with the actual email):

```sql
UPDATE public.profiles
SET role = 'teller'
WHERE email = 'teller@example.com';
```

3. **Verify the role:**
```sql
SELECT id, email, full_name, role 
FROM public.profiles 
WHERE email = 'teller@example.com';
```

### Method 2: Via Application Code

If you have an admin interface, you can update the role programmatically:

```typescript
// Update user role to teller
const { error } = await supabase
  .from('profiles')
  .update({ role: 'teller' })
  .eq('email', 'teller@example.com');

if (error) {
  console.error('Error updating role:', error);
}
```

### Method 3: Using Supabase MCP

You can ask the AI assistant to create a teller user:

```
"Create a teller user with email teller@mutuelle.com"
```

## Teller Permissions

### What Tellers Can Do

| Action | Members | Transactions | Contributions | Loans |
|--------|---------|--------------|---------------|-------|
| View All | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ❌ |

### What Tellers Cannot Do

- ❌ Delete records (only admins can delete)
- ❌ Change user roles (only admins can manage roles)
- ❌ Access system settings

## Role Hierarchy

1. **member** - Regular members, can only view their own data
2. **teller** - Staff members, can enter/manage data for all members
3. **treasurer** - Financial managers (future implementation)
4. **admin** - Full system access, can manage everything

## Testing Teller Access

After creating a teller user, test their permissions:

```sql
-- Test: Teller should see all members
SELECT COUNT(*) FROM public.members;
-- Should return all members

-- Test: Teller can insert a transaction
INSERT INTO public.transactions (member_id, type, amount, description)
VALUES (
  (SELECT id FROM public.members LIMIT 1),
  'contribution',
  1000.00,
  'Monthly contribution'
);
-- Should succeed

-- Test: Teller can create a new member
INSERT INTO public.members (profile_id, member_id, full_name, phone)
VALUES (
  (SELECT id FROM public.profiles WHERE role = 'teller' LIMIT 1),
  'MEM001',
  'Test Member',
  '+1234567890'
);
-- Should succeed
```

## Security Notes

- Teller users can access all member data, so ensure they are trusted staff members
- Consider implementing audit logging for teller actions
- Regularly review teller user accounts
- Use strong passwords for teller accounts
- Consider implementing 2FA for teller accounts

## Troubleshooting

### Teller cannot see members

Check if the RLS policy exists:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'members' 
AND policyname LIKE '%Teller%';
```

### Teller cannot insert transactions

Verify the role is set correctly:
```sql
SELECT role FROM public.profiles 
WHERE id = auth.uid();
```

### User exists but profile doesn't

The profile should be created automatically when a user signs up. If not:
```sql
INSERT INTO public.profiles (id, email, role)
VALUES (
  'USER_ID_FROM_AUTH_USERS',
  'teller@example.com',
  'teller'
);
```


