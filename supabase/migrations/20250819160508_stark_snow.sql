/*
  # Fix GROUP BY clause in get_user_management_data function

  1. Problem
    - Column "au.created_at" must appear in GROUP BY clause or be used in aggregate function
    - SQL function has incorrect GROUP BY structure

  2. Solution
    - Recreate the get_user_management_data function with proper GROUP BY clause
    - Include all non-aggregate columns in GROUP BY
    - Use aggregate functions where appropriate

  3. Security
    - Maintain existing security restrictions
    - Only accessible by admin users
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_management_data(integer, integer, text);

-- Create the corrected function
CREATE OR REPLACE FUNCTION get_user_management_data(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL
)
RETURNS TABLE (
  users jsonb,
  total integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data jsonb;
  total_count integer;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.id = auth.uid() 
    AND p.role = 'admin'
    AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Get total count for pagination
  SELECT COUNT(*)::integer INTO total_count
  FROM auth.users au
  JOIN profiles p ON p.id = au.id
  WHERE (
    search_term IS NULL 
    OR au.email ILIKE '%' || search_term || '%'
    OR p.full_name ILIKE '%' || search_term || '%'
  );

  -- Get user data with proper aggregation
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'full_name', p.full_name,
      'role', p.role,
      'is_premium', p.is_premium,
      'created_at', au.created_at,
      'updated_at', au.updated_at,
      'last_sign_in_at', au.last_sign_in_at,
      'email_confirmed_at', au.email_confirmed_at,
      'confirmed_at', au.confirmed_at,
      'is_super_admin', COALESCE(
        (au.raw_app_meta_data->>'is_super_admin')::boolean, 
        false
      ),
      'subscription_plan', COALESCE(us.plan, 'free'),
      'subscription_status', COALESCE(us.status, 'inactive'),
      'trial_ends_at', us.trial_ends_at,
      'chat_count', COALESCE(chat_stats.total_chats, 0),
      'message_count', COALESCE(chat_stats.total_messages, 0)
    )
    ORDER BY au.created_at DESC
  ) INTO user_data
  FROM auth.users au
  JOIN profiles p ON p.id = au.id
  LEFT JOIN user_subscriptions us ON us.user_id = au.id
  LEFT JOIN (
    SELECT 
      cs.user_id,
      COUNT(DISTINCT cs.id) as total_chats,
      COUNT(cm.id) as total_messages
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cm.session_id = cs.id
    GROUP BY cs.user_id
  ) chat_stats ON chat_stats.user_id = au.id
  WHERE (
    search_term IS NULL 
    OR au.email ILIKE '%' || search_term || '%'
    OR p.full_name ILIKE '%' || search_term || '%'
  )
  LIMIT limit_count
  OFFSET offset_count;

  -- Return the result
  RETURN QUERY SELECT user_data, total_count;
END;
$$;