-- Drop dependent triggers first before dropping the function
DROP TRIGGER IF EXISTS update_user_reports_updated_at ON user_reports;
DROP TRIGGER IF EXISTS update_admin_stats_cache_updated_at ON admin_stats_cache;

-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS get_active_users_count(INTEGER);
DROP FUNCTION IF EXISTS get_user_growth_data(INTEGER);
DROP FUNCTION IF EXISTS get_user_management_data(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS log_admin_action(TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_admin_stats();

-- Function to count active users in last N days
CREATE FUNCTION get_active_users_count(days_back INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Count users from auth.users who signed in within the specified days
  SELECT COUNT(*)::INTEGER INTO active_count
  FROM auth.users
  WHERE last_sign_in_at >= (NOW() - (days_back || ' days')::INTERVAL);
  
  RETURN COALESCE(active_count, 0);
END;
$$;

-- Function to get user growth data for charts
CREATE FUNCTION get_user_growth_data(days_back INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (days_back || ' days')::INTERVAL)::DATE,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE as date
  ),
  daily_signups AS (
    SELECT 
      au.created_at::DATE as signup_date,
      COUNT(*) as daily_count
    FROM auth.users au
    WHERE au.created_at >= (CURRENT_DATE - (days_back || ' days')::INTERVAL)
    GROUP BY au.created_at::DATE
  )
  SELECT 
    ds.date,
    COALESCE(ds_daily.daily_count, 0) as count
  FROM date_series ds
  LEFT JOIN daily_signups ds_daily ON ds.date = ds_daily.signup_date
  ORDER BY ds.date;
END;
$$;

-- Function to get user management data with pagination
CREATE FUNCTION get_user_management_data(
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
  total_count INTEGER;
  users_data JSONB;
BEGIN
  -- Get total count first
  SELECT COUNT(*)::INTEGER INTO total_count
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE (search_term IS NULL OR 
         au.email ILIKE '%' || search_term || '%' OR 
         p.full_name ILIKE '%' || search_term || '%');

  -- Get paginated user data
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', au.id,
      'email', au.email,
      'created_at', au.created_at,
      'last_sign_in_at', au.last_sign_in_at,
      'email_confirmed_at', au.email_confirmed_at,
      'banned_until', au.banned_until,
      'full_name', p.full_name,
      'role', p.role,
      'is_premium', p.is_premium,
      'updated_at', p.updated_at
    )
  ) INTO users_data
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE (search_term IS NULL OR 
         au.email ILIKE '%' || search_term || '%' OR 
         p.full_name ILIKE '%' || search_term || '%')
  ORDER BY au.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;

  RETURN QUERY SELECT users_data, total_count;
END;
$$;

-- Function to log admin actions
CREATE FUNCTION log_admin_action(
  action_type TEXT,
  target_user UUID DEFAULT NULL,
  action_details JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID from auth context
  current_user_id := auth.uid();
  
  -- Insert admin log entry
  INSERT INTO admin_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address,
    created_at
  ) VALUES (
    current_user_id,
    action_type,
    target_user,
    action_details,
    NULL, -- IP address would need to be passed from the edge function
    NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Trigger function to update updated_at column
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to get admin statistics
CREATE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_result JSONB;
BEGIN
  WITH user_counts AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
      COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users,
      COUNT(*) FILTER (WHERE last_sign_in_at >= NOW() - INTERVAL '30 days') as active_users_month,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_users_today,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month
    FROM auth.users
  ),
  premium_counts AS (
    SELECT COUNT(*) FILTER (WHERE is_premium = true) as premium_users
    FROM profiles
  )
  SELECT jsonb_build_object(
    'total_users', uc.total_users,
    'confirmed_users', uc.confirmed_users,
    'unconfirmed_users', uc.unconfirmed_users,
    'active_users_month', uc.active_users_month,
    'new_users_today', uc.new_users_today,
    'new_users_week', uc.new_users_week,
    'new_users_month', uc.new_users_month,
    'premium_users', pc.premium_users,
    'updated_at', NOW()
  ) INTO stats_result
  FROM user_counts uc, premium_counts pc;
  
  RETURN stats_result;
END;
$$;

-- Recreate the triggers that depend on update_updated_at_column
CREATE TRIGGER update_user_reports_updated_at
    BEFORE UPDATE ON user_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_stats_cache_updated_at
    BEFORE UPDATE ON admin_stats_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant execute permissions to authenticated users (will be further restricted by RLS)
GRANT EXECUTE ON FUNCTION get_active_users_count(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth_data(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_management_data(INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;