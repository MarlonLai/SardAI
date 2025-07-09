/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current policies cause infinite recursion by joining profiles table with itself
    - Admin check policies reference profiles table while being applied to profiles table

  2. Solution
    - Remove recursive policies that join profiles with users and check role
    - Simplify to basic user-based access control
    - Admin access should be handled at application level or through service role

  3. Changes
    - Drop existing problematic policies
    - Create simple policies based on user ID matching
    - Remove admin-specific policies that cause recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all user profiles." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile, and admins can update any." ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);