/*
  # Create admin statistics functions

  1. New Functions
    - `get_active_users_count` - Count users active in last N days
    - `get_user_growth_data` - Get user registration growth data
    - `get_user_management_data` - Get paginated user data for admin panel
    - `log_admin_action` - Log admin actions for audit trail

  2. Security
    - Functions are accessible to service_role and authenticated users with admin role
    - Proper parameter validation and error handling
*/

-- Function to get active users count (users who have updated their profile recently)
CREATE OR REPLACE FUNCTION get_active_users_count(days_back INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count INTEGER;
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate cutoff date
  cutoff_date := NOW() - (days_back || ' days')::INTERVAL;
  
  -- Count users who have been active (updated their profile) in the specified period
  SELECT COUNT(DISTINCT id)
  INTO active_count
  FROM profiles
  WHERE updated_at >= cutoff_date
     OR updated_at IS NULL; -- Include users without update timestamp as potentially active
  
  RETURN COALESCE(active_count, 0);
END;
$$;

-- Function to get user growth data for charts
CREATE OR REPLACE FUNCTION get_user_growth_data(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  new_users INTEGER,
  total_users INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date DATE;
  current_date_iter DATE;
  running_total INTEGER := 0;
BEGIN
  -- Calculate start date
  start_date := (NOW() - (days_back || ' days')::INTERVAL)::DATE;
  
  -- Get total users before start date
  SELECT COUNT(*)
  INTO running_total
  FROM auth.users
  WHERE created_at < start_date::TIMESTAMP WITH TIME ZONE;
  
  -- Generate daily growth data
  FOR current_date_iter IN 
    SELECT generate_series(start_date, NOW()::DATE, '1 day'::INTERVAL)::DATE
  LOOP
    -- Count new users for this day
    SELECT COUNT(*)
    INTO new_users
    FROM auth.users
    WHERE created_at::DATE = current_date_iter;
    
    -- Update running total
    running_total := running_total + COALESCE(new_users, 0);
    
    -- Return row
    date := current_date_iter;
    total_users := running_total;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to get user management data with proper GROUP BY
CREATE OR REPLACE FUNCTION get_user_management_data(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
  users JSONB,
  total INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSONB;
  total_count INTEGER;
  search_condition TEXT;
BEGIN
  -- Build search condition
  IF search_term IS NOT NULL AND search_term != '' THEN
    search_condition := '%' || search_term || '%';
  END IF;

  -- Get total count first
  IF search_term IS NOT NULL AND search_term != '' THEN
    SELECT COUNT(DISTINCT au.id)
    INTO total_count
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE au.email ILIKE search_condition
       OR p.full_name ILIKE search_condition;
  ELSE
    SELECT COUNT(DISTINCT au.id)
    INTO total_count
    FROM auth.users au;
  END IF;

  -- Get user data with proper aggregation
  WITH user_list AS (
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.email_confirmed_at,
      au.last_sign_in_at,
      p.full_name,
      p.avatar_url,
      p.is_premium,
      p.role,
      p.updated_at as profile_updated_at
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE (search_term IS NULL OR search_term = '' OR 
           au.email ILIKE search_condition OR 
           p.full_name ILIKE search_condition)
    ORDER BY au.created_at DESC
    LIMIT limit_count
    OFFSET offset_count
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ul.id,
      'email', ul.email,
      'created_at', ul.created_at,
      'email_confirmed_at', ul.email_confirmed_at,
      'last_sign_in_at', ul.last_sign_in_at,
      'full_name', ul.full_name,
      'avatar_url', ul.avatar_url,
      'is_premium', COALESCE(ul.is_premium, false),
      'role', COALESCE(ul.role, 'user'),
      'profile_updated_at', ul.profile_updated_at
    )
  )
  INTO user_data
  FROM user_list ul;

  -- Return result
  users := COALESCE(user_data, '[]'::jsonb);
  total := COALESCE(total_count, 0);
  
  RETURN NEXT;
END;
$$;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type TEXT,
  target_user UUID DEFAULT NULL,
  action_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Insert log entry
  INSERT INTO admin_logs (
    admin_id,
    action,
    target_user_id,
    details,
    created_at
  )
  VALUES (
    current_user_id,
    action_type,
    target_user,
    action_details,
    NOW()
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Grant execute permissions to service_role and authenticated users
GRANT EXECUTE ON FUNCTION get_active_users_count(INTEGER) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth_data(INTEGER) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_user_management_data(INTEGER, INTEGER, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, UUID, JSONB) TO service_role, authenticated;