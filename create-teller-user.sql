-- ============================================
-- Create Teller User Script
-- ============================================
-- This script helps you create a teller user
-- Run this in Supabase SQL Editor after creating a user via Auth
-- ============================================

-- Step 1: Create the user in Supabase Auth (do this via Dashboard or Auth API)
-- Go to: Authentication > Users > Add User
-- Or use the Supabase Auth API to create a user

-- Step 2: After the user is created, update their profile role to 'teller'
-- Replace 'USER_EMAIL_HERE' with the actual user's email
-- Replace 'USER_ID_HERE' with the user's UUID from auth.users

-- Option A: Update by email
UPDATE public.profiles
SET role = 'teller'
WHERE email = 'USER_EMAIL_HERE';

-- Option B: Update by user ID (more reliable)
-- First, get the user ID from auth.users table:
-- SELECT id, email FROM auth.users WHERE email = 'teller@example.com';

-- Then update the profile:
UPDATE public.profiles
SET role = 'teller'
WHERE id = 'USER_ID_HERE';

-- Step 3: Verify the teller user was created
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.role = 'teller';

-- ============================================
-- Example: Create a teller user programmatically
-- ============================================
-- If you want to create a teller user via SQL (requires service_role key):
-- 
-- 1. First create the auth user (requires Supabase Admin API or Dashboard)
-- 2. Then run:
--
-- UPDATE public.profiles
-- SET role = 'teller', full_name = 'Teller User'
-- WHERE email = 'teller@mutuelle.com';
--
-- ============================================


