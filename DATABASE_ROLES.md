# Database Roles and Permissions

## Role Overview

The mutuelle system supports four user roles with different permission levels:

### 1. Member (Default)
**Role:** `member`

**Permissions:**
- ✅ View own profile
- ✅ Update own profile
- ✅ View own member record
- ✅ View own transactions
- ✅ View own contributions
- ✅ View own loans

**Use Case:** Regular members of the mutuelle who can only access their own data.

---

### 2. Teller
**Role:** `teller`

**Permissions:**
- ✅ View all members
- ✅ Create new members
- ✅ Update member information
- ✅ View all transactions
- ✅ Create transactions for any member
- ✅ Update transactions
- ✅ View all contributions
- ✅ Create contributions for any member
- ✅ Update contributions
- ✅ View all loans
- ✅ Create loans for any member
- ✅ Update loans (approve, change status, etc.)

**Use Case:** Staff members who handle daily operations and data entry for all members.

**Cannot:**
- ❌ Delete records
- ❌ Change user roles
- ❌ Access admin functions

---

### 3. Treasurer
**Role:** `treasurer`

**Permissions:** (To be implemented)
- Financial reporting
- Advanced financial operations
- Audit capabilities

**Use Case:** Financial managers who need advanced reporting and audit capabilities.

---

### 4. Admin
**Role:** `admin`

**Permissions:**
- ✅ All teller permissions
- ✅ Delete records
- ✅ Manage user roles
- ✅ System configuration
- ✅ Full system access

**Use Case:** System administrators with complete control over the system.

---

## Role Hierarchy

```
member < teller < treasurer < admin
```

Lower roles have fewer permissions, higher roles inherit permissions from lower roles.

## Setting User Roles

### Via SQL (Supabase Dashboard)

```sql
-- Set user as teller
UPDATE public.profiles
SET role = 'teller'
WHERE email = 'user@example.com';

-- Set user as admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Set user as member (default)
UPDATE public.profiles
SET role = 'member'
WHERE email = 'member@example.com';
```

### Via Application Code

```typescript
// Update user role
const { error } = await supabase
  .from('profiles')
  .update({ role: 'teller' })
  .eq('email', 'teller@example.com');
```

## Checking Current User Role

### In Application Code

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single();

console.log('User role:', profile?.role);
```

### Via SQL

```sql
-- Check current authenticated user's role
SELECT role FROM public.profiles WHERE id = auth.uid();

-- Check any user's role
SELECT email, role FROM public.profiles WHERE email = 'user@example.com';
```

## Role-Based Access Control (RLS)

All tables use Row Level Security (RLS) to enforce role-based permissions:

- **Members table:** Users see own record, tellers/admins see all
- **Transactions table:** Users see own transactions, tellers/admins see all
- **Contributions table:** Users see own contributions, tellers/admins see all
- **Loans table:** Users see own loans, tellers/admins see all

## Best Practices

1. **Principle of Least Privilege:** Assign the minimum role needed for a user's job
2. **Regular Audits:** Review user roles periodically
3. **Secure Role Changes:** Only admins should be able to change roles
4. **Documentation:** Keep track of who has which role and why
5. **Testing:** Test permissions after role changes

## Migration History

- `20240101000000_initial_schema.sql` - Created profiles table with role column
- `20240102000000_mutuelle_schema.sql` - Added member, admin, treasurer roles
- `20240103000000_add_teller_role.sql` - Added teller role and permissions


