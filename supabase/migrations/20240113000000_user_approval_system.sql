-- User Approval System
-- Allows admins to approve users before they can access their profile

-- Add approved and approval fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster queries on approved status
CREATE INDEX IF NOT EXISTS profiles_approved_idx ON public.profiles(approved);
CREATE INDEX IF NOT EXISTS profiles_approved_at_idx ON public.profiles(approved_at);

-- Update handle_new_user function to set approved to false by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false -- New users are not approved by default
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a SECURITY DEFINER function to check if user is admin
-- This function bypasses RLS, preventing recursion
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- RLS Policies for user approval
-- Admins can view all profiles (including approval status)
-- Using function to avoid infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_is_admin());

-- Admins can update approval status
DROP POLICY IF EXISTS "Admins can update approval status" ON public.profiles;
CREATE POLICY "Admins can update approval status"
  ON public.profiles FOR UPDATE
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Users can view their own profile (including approval status)
-- This policy already exists but we ensure it allows viewing approved status
-- The existing "Users can view own profile" policy should work

-- Function to approve a user (only admins can call this)
CREATE OR REPLACE FUNCTION public.approve_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if the current user is an admin using the function (no recursion)
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  UPDATE public.profiles
  SET 
    approved = true,
    approved_at = TIMEZONE('utc'::text, NOW()),
    approved_by = auth.uid(),
    rejection_reason = NULL
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a user (only admins can call this)
CREATE OR REPLACE FUNCTION public.reject_user(user_id UUID, reason TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Check if the current user is an admin using the function (no recursion)
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject users';
  END IF;

  UPDATE public.profiles
  SET 
    approved = false,
    approved_at = NULL,
    approved_by = auth.uid(),
    rejection_reason = reason
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all existing admins are approved
UPDATE public.profiles
SET approved = true
WHERE role = 'admin' AND (approved IS NULL OR approved = false);

-- Grant execute permissions to authenticated users (will be checked by RLS)
GRANT EXECUTE ON FUNCTION public.approve_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user(UUID, TEXT) TO authenticated;

