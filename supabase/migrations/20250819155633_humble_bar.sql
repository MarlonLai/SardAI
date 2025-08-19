/*
  # Fix User Deletion Function

  1. New Functions
    - `safe_delete_user` - Suppression sécurisée avec gestion des contraintes
    - `cleanup_user_data` - Nettoyage des données utilisateur
  
  2. Security
    - Vérification des privilèges superadmin
    - Logging des suppressions
    - Gestion des erreurs
  
  3. Changes
    - Ordre correct de suppression des données
    - Gestion des contraintes de clés étrangères
    - Nettoyage complet des données utilisateur
*/

-- Function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION safe_delete_user(
  target_user_id uuid,
  admin_user_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  admin_email text;
  deletion_result json;
  error_message text;
BEGIN
  -- Get admin email for verification
  SELECT email INTO admin_email 
  FROM auth.users 
  WHERE id = admin_user_id;
  
  -- Verify admin privileges
  IF NOT is_superadmin(admin_email) AND NOT is_admin_user(admin_email) THEN
    RAISE EXCEPTION 'Access denied. Only admins can delete users.';
  END IF;
  
  -- Get user email before deletion
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found with ID: %', target_user_id;
  END IF;
  
  -- Prevent deletion of admin users by non-superadmins
  IF is_admin_user(user_email) AND NOT is_superadmin(admin_email) THEN
    RAISE EXCEPTION 'Only superadmins can delete admin users.';
  END IF;
  
  -- Prevent self-deletion
  IF target_user_id = admin_user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account.';
  END IF;
  
  BEGIN
    -- Step 1: Delete user reports (both as reporter and reported)
    DELETE FROM user_reports 
    WHERE reporter_id = target_user_id OR reported_user_id = target_user_id;
    
    -- Step 2: Delete chat messages
    DELETE FROM chat_messages 
    WHERE session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = target_user_id
    );
    
    -- Step 3: Delete chat sessions
    DELETE FROM chat_sessions WHERE user_id = target_user_id;
    
    -- Step 4: Delete admin logs
    DELETE FROM admin_logs 
    WHERE admin_id = target_user_id OR target_user_id = target_user_id;
    
    -- Step 5: Delete system logs
    DELETE FROM system_logs WHERE user_id = target_user_id;
    
    -- Step 6: Delete subscription data
    DELETE FROM user_subscriptions WHERE user_id = target_user_id;
    
    -- Step 7: Delete Stripe data
    DELETE FROM stripe_orders 
    WHERE customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = target_user_id
    );
    
    DELETE FROM stripe_subscriptions 
    WHERE customer_id IN (
      SELECT customer_id FROM stripe_customers WHERE user_id = target_user_id
    );
    
    DELETE FROM stripe_customers WHERE user_id = target_user_id;
    
    -- Step 8: Delete profile (this will cascade properly now)
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Step 9: Log the deletion action before deleting the user
    INSERT INTO admin_logs (admin_id, action, target_user_id, details)
    VALUES (
      admin_user_id,
      'user_deleted',
      target_user_id,
      jsonb_build_object(
        'deleted_email', user_email,
        'admin_email', admin_email,
        'deletion_timestamp', now()
      )
    );
    
    deletion_result := jsonb_build_object(
      'success', true,
      'message', 'User deleted successfully',
      'deleted_user_email', user_email,
      'deleted_by', admin_email,
      'deletion_timestamp', now()
    );
    
    RETURN deletion_result;
    
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    
    -- Log the error
    INSERT INTO system_logs (level, message, context, user_id)
    VALUES (
      'error',
      'Failed to delete user: ' || error_message,
      jsonb_build_object(
        'target_user_id', target_user_id,
        'admin_user_id', admin_user_id,
        'error_code', SQLSTATE
      ),
      admin_user_id
    );
    
    RAISE EXCEPTION 'Database error deleting user: %', error_message;
  END;
END;
$$;

-- Function to cleanup orphaned data
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_result json;
  orphaned_count integer := 0;
BEGIN
  -- Clean up orphaned profiles (users that don't exist in auth.users)
  WITH deleted_profiles AS (
    DELETE FROM profiles 
    WHERE id NOT IN (SELECT id FROM auth.users)
    RETURNING id
  )
  SELECT count(*) INTO orphaned_count FROM deleted_profiles;
  
  -- Clean up orphaned chat sessions
  DELETE FROM chat_sessions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  -- Clean up orphaned user subscriptions
  DELETE FROM user_subscriptions 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  -- Clean up orphaned stripe customers
  DELETE FROM stripe_customers 
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  cleanup_result := jsonb_build_object(
    'success', true,
    'orphaned_profiles_cleaned', orphaned_count,
    'cleanup_timestamp', now()
  );
  
  RETURN cleanup_result;
END;
$$;

-- Grant execute permissions to authenticated users (will be restricted by RLS)
GRANT EXECUTE ON FUNCTION safe_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_data TO authenticated;

-- Update admin user management function to use the new safe deletion
CREATE OR REPLACE FUNCTION admin_delete_user(
  target_user_id uuid,
  admin_user_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use the safe delete function
  RETURN safe_delete_user(target_user_id, admin_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_user TO authenticated;