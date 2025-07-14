/*
  # Fix user management function and registration issues

  1. Database Functions
    - Fix `get_user_management_data` function with proper GROUP BY clause
    - Create `log_admin_action` function for admin logging
    - Fix user registration trigger

  2. Security
    - Update RLS policies for proper user registration
    - Ensure profiles can be created for new users

  3. Triggers
    - Fix `handle_new_user` trigger for automatic profile creation
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_management_data(integer, integer, text);

-- Create the corrected user management function
CREATE OR REPLACE FUNCTION get_user_management_data(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL
)
RETURNS TABLE(
  users jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'users', COALESCE(jsonb_agg(user_data), '[]'::jsonb),
      'total', (
        SELECT COUNT(*)::integer 
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE (search_term IS NULL OR 
               au.email ILIKE '%' || search_term || '%' OR 
               p.full_name ILIKE '%' || search_term || '%')
      )
    ) as users
  FROM (
    SELECT jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'email_confirmed_at', au.email_confirmed_at,
      'created_at', au.created_at,
      'updated_at', au.updated_at,
      'last_sign_in_at', au.last_sign_in_at,
      'full_name', p.full_name,
      'is_premium', COALESCE(p.is_premium, false),
      'role', COALESCE(p.role, 'user'),
      'avatar_url', p.avatar_url
    ) as user_data
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE (search_term IS NULL OR 
           au.email ILIKE '%' || search_term || '%' OR 
           p.full_name ILIKE '%' || search_term || '%')
    ORDER BY au.created_at DESC
    LIMIT limit_count
    OFFSET offset_count
  ) subquery;
END;
$$;

-- Create log_admin_action function if it doesn't exist
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type text,
  target_user uuid DEFAULT NULL,
  action_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$$;

-- Create or replace the handle_new_user trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO profiles (id, full_name, avatar_url, is_premium, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    false,
    'user'
  );

  -- Insert into user_subscriptions table for trial period
  INSERT INTO user_subscriptions (
    user_id,
    plan,
    trial_started_at,
    trial_ends_at,
    status
  )
  VALUES (
    NEW.id,
    'trial',
    now(),
    now() + interval '7 days',
    'active'
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update RLS policies to allow profile creation
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow user_subscriptions creation
DROP POLICY IF EXISTS "Users can insert own subscription" ON user_subscriptions;
CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;