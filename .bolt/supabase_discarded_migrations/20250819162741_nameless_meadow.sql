/*
  # Fix User Management and Admin Functions

  1. Database Functions
    - `get_user_management_data()` - Fixed GROUP BY clause issues
    - `safe_delete_user()` - Enhanced user deletion with proper FK handling
    - `is_superadmin()` - Check if user is superadmin
    - `is_admin_user()` - Check if user is admin (including superadmin)
    - `cleanup_orphaned_data()` - Clean orphaned data

  2. Security Updates
    - Set marlon.lai@hotmail.com as superadmin
    - Update user metadata with superadmin status
    - Enhanced admin verification functions

  3. Admin Configuration
    - Update admin_config table with proper email list
    - Ensure admin privileges are correctly set
*/

-- Set superadmin status for marlon.lai@hotmail.com
UPDATE auth.users 
SET 
  is_super_admin = true,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_super_admin": true}'::jsonb,
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_super_admin": true}'::jsonb,
  updated_at = now()
WHERE email = 'marlon.lai@hotmail.com';

-- Ensure profile exists and is admin
INSERT INTO profiles (id, full_name, role, is_premium, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', 'Marlon Lai'),
  'admin',
  true,
  now()
FROM auth.users 
WHERE email = 'marlon.lai@hotmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  is_premium = true,
  updated_at = now();

-- Update admin_config table
INSERT INTO admin_config (admin_emails, created_at, updated_at)
VALUES (
  ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'],
  now(),
  now()
)
ON CONFLICT (id) 
DO UPDATE SET 
  admin_emails = ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'],
  updated_at = now();

-- Helper function to check if user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_email = 'marlon.lai@hotmail.com';
END;
$$;

-- Helper function to check if user is admin (including superadmin)
CREATE OR REPLACE FUNCTION is_admin_user(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN user_email IN ('marlon.lai@hotmail.com', 'riccardo.lai@example.com');
END;
$$;

-- Enhanced safe user deletion function
CREATE OR REPLACE FUNCTION safe_delete_user(
  target_user_id uuid,
  admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_email text;
  target_email text;
  target_role text;
  deletion_summary jsonb := '{}';
  temp_count integer;
BEGIN
  -- Get admin email for verification
  SELECT email INTO admin_email
  FROM auth.users
  WHERE id = admin_user_id;

  -- Get target user info
  SELECT u.email, COALESCE(p.role, 'user') 
  INTO target_email, target_role
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = target_user_id;

  -- Security checks
  IF NOT is_admin_user(admin_email) THEN
    RAISE EXCEPTION 'Access denied: Only authorized admins can delete users';
  END IF;

  IF target_user_id = admin_user_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  IF target_role = 'admin' AND NOT is_superadmin(admin_email) THEN
    RAISE EXCEPTION 'Only superadmin can delete admin users';
  END IF;

  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Start deletion process in correct order
  
  -- 1. Delete user reports (as reporter)
  DELETE FROM user_reports WHERE reporter_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('reports_as_reporter', temp_count);

  -- 2. Update reports where user was reported (set to null)
  UPDATE user_reports SET reported_user_id = NULL WHERE reported_user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('reports_as_reported', temp_count);

  -- 3. Delete chat messages
  DELETE FROM chat_messages 
  WHERE session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('chat_messages', temp_count);

  -- 4. Delete chat sessions
  DELETE FROM chat_sessions WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('chat_sessions', temp_count);

  -- 5. Update admin logs (set admin_id to null for logs they created)
  UPDATE admin_logs SET admin_id = NULL WHERE admin_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('admin_logs_as_admin', temp_count);

  -- 6. Update admin logs (set target_user_id to null)
  UPDATE admin_logs SET target_user_id = NULL WHERE target_user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('admin_logs_as_target', temp_count);

  -- 7. Update system logs (set user_id to null)
  UPDATE system_logs SET user_id = NULL WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('system_logs', temp_count);

  -- 8. Delete user subscriptions
  DELETE FROM user_subscriptions WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('user_subscriptions', temp_count);

  -- 9. Get stripe customer_id before deletion
  DECLARE
    stripe_customer_id text;
  BEGIN
    SELECT customer_id INTO stripe_customer_id
    FROM stripe_customers
    WHERE user_id = target_user_id AND deleted_at IS NULL;

    -- 10. Soft delete stripe customer (don't actually delete, just mark)
    UPDATE stripe_customers 
    SET deleted_at = now(), updated_at = now()
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deletion_summary := deletion_summary || jsonb_build_object('stripe_customers', temp_count);

    -- 11. Soft delete stripe subscriptions
    IF stripe_customer_id IS NOT NULL THEN
      UPDATE stripe_subscriptions 
      SET deleted_at = now(), updated_at = now()
      WHERE customer_id = stripe_customer_id;
      GET DIAGNOSTICS temp_count = ROW_COUNT;
      deletion_summary := deletion_summary || jsonb_build_object('stripe_subscriptions', temp_count);

      -- 12. Soft delete stripe orders
      UPDATE stripe_orders 
      SET deleted_at = now(), updated_at = now()
      WHERE customer_id = stripe_customer_id;
      GET DIAGNOSTICS temp_count = ROW_COUNT;
      deletion_summary := deletion_summary || jsonb_build_object('stripe_orders', temp_count);
    END IF;
  END;

  -- 13. Delete profile
  DELETE FROM profiles WHERE id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deletion_summary := deletion_summary || jsonb_build_object('profiles', temp_count);

  -- Log the deletion action
  INSERT INTO admin_logs (admin_id, action, target_user_id, details, created_at)
  VALUES (
    admin_user_id,
    'user_deleted',
    target_user_id,
    jsonb_build_object(
      'target_email', target_email,
      'target_role', target_role,
      'admin_email', admin_email,
      'deletion_summary', deletion_summary,
      'method', 'safe_delete_user_function'
    ),
    now()
  );

  -- Add summary info
  deletion_summary := deletion_summary || jsonb_build_object(
    'target_email', target_email,
    'target_role', target_role,
    'deleted_by', admin_email,
    'deleted_at', now()
  );

  RETURN deletion_summary;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO system_logs (level, message, context, user_id, created_at)
    VALUES (
      'error',
      'Failed to delete user: ' || SQLERRM,
      jsonb_build_object(
        'target_user_id', target_user_id,
        'admin_user_id', admin_user_id,
        'error_code', SQLSTATE,
        'function', 'safe_delete_user'
      ),
      admin_user_id,
      now()
    );
    
    RAISE EXCEPTION 'Database error deleting user: %', SQLERRM;
END;
$$;

-- Fixed get_user_management_data function without GROUP BY issues
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
  WITH user_stats AS (
    SELECT 
      cs.user_id,
      COUNT(DISTINCT cs.id) as chat_count,
      COUNT(DISTINCT cm.id) as message_count
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cm.session_id = cs.id
    GROUP BY cs.user_id
  ),
  user_data AS (
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.email_confirmed_at,
      au.last_sign_in_at,
      au.is_super_admin,
      au.raw_app_meta_data,
      au.raw_user_meta_data,
      au.banned_until,
      p.full_name,
      p.role,
      p.is_premium,
      p.avatar_url,
      p.updated_at as profile_updated_at,
      us.plan,
      us.status as subscription_status,
      us.trial_ends_at,
      COALESCE(stats.chat_count, 0) as chat_count,
      COALESCE(stats.message_count, 0) as message_count
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    LEFT JOIN user_subscriptions us ON us.user_id = au.id
    LEFT JOIN user_stats stats ON stats.user_id = au.id
    WHERE 
      au.deleted_at IS NULL
      AND (
        search_term IS NULL 
        OR au.email ILIKE '%' || search_term || '%'
        OR p.full_name ILIKE '%' || search_term || '%'
      )
    ORDER BY au.created_at DESC
    LIMIT limit_count
    OFFSET offset_count
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ud.id,
      'email', ud.email,
      'full_name', ud.full_name,
      'role', COALESCE(ud.role, 'user'),
      'is_premium', COALESCE(ud.is_premium, false),
      'is_super_admin', COALESCE(ud.is_super_admin, false),
      'avatar_url', ud.avatar_url,
      'created_at', ud.created_at,
      'email_confirmed_at', ud.email_confirmed_at,
      'last_sign_in_at', ud.last_sign_in_at,
      'profile_updated_at', ud.profile_updated_at,
      'banned_until', ud.banned_until,
      'subscription_plan', ud.plan,
      'subscription_status', ud.subscription_status,
      'trial_ends_at', ud.trial_ends_at,
      'chat_count', ud.chat_count,
      'message_count', ud.message_count,
      'raw_app_meta_data', ud.raw_app_meta_data,
      'raw_user_meta_data', ud.raw_user_meta_data
    )
  ) as users
  FROM user_data ud;
END;
$$;

-- Function to clean up orphaned data
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_summary jsonb := '{}';
  temp_count integer;
BEGIN
  -- Clean up profiles without auth users
  DELETE FROM profiles 
  WHERE id NOT IN (SELECT id FROM auth.users WHERE deleted_at IS NULL);
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('orphaned_profiles', temp_count);

  -- Clean up chat sessions without users
  DELETE FROM chat_sessions 
  WHERE user_id NOT IN (SELECT id FROM auth.users WHERE deleted_at IS NULL);
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('orphaned_chat_sessions', temp_count);

  -- Clean up user subscriptions without users
  DELETE FROM user_subscriptions 
  WHERE user_id NOT IN (SELECT id FROM auth.users WHERE deleted_at IS NULL);
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('orphaned_subscriptions', temp_count);

  -- Clean up stripe customers without users
  UPDATE stripe_customers 
  SET deleted_at = now(), updated_at = now()
  WHERE user_id NOT IN (SELECT id FROM auth.users WHERE deleted_at IS NULL)
    AND deleted_at IS NULL;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('orphaned_stripe_customers', temp_count);

  -- Log cleanup action
  INSERT INTO system_logs (level, message, context, created_at)
  VALUES (
    'info',
    'Orphaned data cleanup completed',
    cleanup_summary,
    now()
  );

  RETURN cleanup_summary;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_management_data TO service_role;
GRANT EXECUTE ON FUNCTION safe_delete_user TO service_role;
GRANT EXECUTE ON FUNCTION is_superadmin TO service_role;
GRANT EXECUTE ON FUNCTION is_admin_user TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_data TO service_role;

-- Update RLS policies to use new admin functions
DROP POLICY IF EXISTS "Admin can access all subscriptions" ON user_subscriptions;
CREATE POLICY "Admin can access all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN profiles p ON p.id = au.id
      WHERE au.id = auth.uid() 
        AND p.role = 'admin'
        AND is_admin_user(au.email)
    )
  );

DROP POLICY IF EXISTS "Admin can access system logs" ON system_logs;
CREATE POLICY "Admin can access system logs"
  ON system_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN profiles p ON p.id = au.id
      WHERE au.id = auth.uid() 
        AND p.role = 'admin'
        AND is_admin_user(au.email)
    )
  );

DROP POLICY IF EXISTS "Admin can access admin logs" ON admin_logs;
CREATE POLICY "Admin can access admin logs"
  ON admin_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN profiles p ON p.id = au.id
      WHERE au.id = auth.uid() 
        AND p.role = 'admin'
        AND is_admin_user(au.email)
    )
  );

DROP POLICY IF EXISTS "Only admins can access admin config" ON admin_config;
CREATE POLICY "Only admins can access admin config"
  ON admin_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN profiles p ON p.id = au.id
      WHERE au.id = auth.uid() 
        AND p.role = 'admin'
        AND is_admin_user(au.email)
    )
  );

DROP POLICY IF EXISTS "Admin and reporter can access reports" ON user_reports;
CREATE POLICY "Admin and reporter can access reports"
  ON user_reports
  FOR ALL
  TO authenticated
  USING (
    reporter_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM auth.users au
      JOIN profiles p ON p.id = au.id
      WHERE au.id = auth.uid() 
        AND p.role = 'admin'
        AND is_admin_user(au.email)
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_auth_users_is_super_admin ON auth.users(is_super_admin) WHERE is_super_admin = true;

-- Log migration completion
INSERT INTO system_logs (level, message, context, created_at)
VALUES (
  'info',
  'Admin functions and security migration completed',
  jsonb_build_object(
    'migration', '20250819162658_empty_beacon',
    'superadmin_set', 'marlon.lai@hotmail.com',
    'functions_updated', ARRAY['get_user_management_data', 'safe_delete_user', 'is_superadmin', 'is_admin_user', 'cleanup_orphaned_data'],
    'policies_updated', ARRAY['user_subscriptions', 'system_logs', 'admin_logs', 'admin_config', 'user_reports']
  ),
  now()
);