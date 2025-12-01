# Database Schema Documentation

## Project: sbmcresdqspwpgtoumcz

Complete database schema for the Mutuelle (Mutual Aid/Cooperative) application.

## Tables Overview

### 1. profiles
User profiles extending Supabase auth.users

**Columns:**
- `id` (UUID, PK) - References auth.users(id)
- `email` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `role` (TEXT) - 'member', 'admin', or 'treasurer'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Policies:**
- Users can view/update their own profile
- Users can insert their own profile

### 2. members
Mutuelle member records

**Columns:**
- `id` (UUID, PK)
- `profile_id` (UUID, FK → profiles.id)
- `member_id` (TEXT, UNIQUE) - Member identification number
- `full_name` (TEXT, NOT NULL)
- `phone` (TEXT)
- `address` (TEXT)
- `join_date` (TIMESTAMP)
- `status` (TEXT) - 'active', 'inactive', or 'suspended'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Policies:**
- Users can view their own member record
- Admins can view all members

**Indexes:**
- `members_profile_id_idx` on profile_id
- `members_member_id_idx` on member_id

### 3. transactions
All financial transactions

**Columns:**
- `id` (UUID, PK)
- `member_id` (UUID, FK → members.id)
- `type` (TEXT) - 'contribution', 'loan', 'payment', 'withdrawal', 'interest'
- `amount` (DECIMAL(15,2), NOT NULL)
- `description` (TEXT)
- `transaction_date` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `created_by` (UUID, FK → auth.users.id)

**RLS Policies:**
- Users can view their own transactions
- Admins can view all transactions
- Admins can insert transactions

**Indexes:**
- `transactions_member_id_idx` on member_id
- `transactions_type_idx` on type
- `transactions_date_idx` on transaction_date

**Realtime:** Enabled

### 4. loans
Loan records

**Columns:**
- `id` (UUID, PK)
- `member_id` (UUID, FK → members.id)
- `amount` (DECIMAL(15,2), NOT NULL)
- `interest_rate` (DECIMAL(5,2)) - Default 0.00
- `status` (TEXT) - 'pending', 'approved', 'active', 'paid', 'defaulted'
- `due_date` (TIMESTAMP)
- `approved_at` (TIMESTAMP)
- `approved_by` (UUID, FK → auth.users.id)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**RLS Policies:**
- Users can view their own loans
- Admins can view and manage all loans

**Indexes:**
- `loans_member_id_idx` on member_id
- `loans_status_idx` on status

**Realtime:** Enabled

### 5. contributions
Member contribution tracking

**Columns:**
- `id` (UUID, PK)
- `member_id` (UUID, FK → members.id)
- `amount` (DECIMAL(15,2), NOT NULL)
- `contribution_date` (TIMESTAMP)
- `period` (TEXT) - e.g., '2024-01' for monthly contributions
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `created_by` (UUID, FK → auth.users.id)

**RLS Policies:**
- Users can view their own contributions
- Admins can view all contributions
- Admins can insert contributions

**Indexes:**
- `contributions_member_id_idx` on member_id
- `contributions_date_idx` on contribution_date

**Realtime:** Enabled

## Functions

### handle_new_user()
Automatically creates a profile when a new user signs up.

### handle_updated_at()
Automatically updates the `updated_at` timestamp on record updates.

## Triggers

- `on_auth_user_created` - Creates profile on user signup
- `set_updated_at` - Updates timestamp on profiles table
- `set_members_updated_at` - Updates timestamp on members table
- `set_loans_updated_at` - Updates timestamp on loans table

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with policies that:
- Allow users to access only their own data
- Allow admins to access all data
- Restrict write operations to admins where appropriate

### Role-Based Access
- **member**: Can view own data
- **admin**: Can view and manage all data
- **treasurer**: (Future implementation)

## Applying Migrations

See `QUICK_START.md` for instructions on applying migrations.

## Verification Queries

```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View all policies
SELECT * FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```


