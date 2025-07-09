-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_user_growth_data(INTEGER);
DROP FUNCTION IF EXISTS get_user_management_data(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS log_admin_action(TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS get_active_users_count(INTEGER);
DROP FUNCTION IF EXISTS get_admin_stats();
DROP FUNCTION IF EXISTS create_user_report(UUID, TEXT, TEXT);

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
  
  -- Count users who have been active (signed in) in the specified period
  SELECT COUNT(DISTINCT id)
  INTO active_count
  FROM auth.users
  WHERE last_sign_in_at >= cutoff_date;
  
  RETURN COALESCE(active_count, 0);
END;
$$;

-- Function to get user growth data for charts (fixed return type)
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
  daily_new INTEGER;
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
    INTO daily_new
    FROM auth.users
    WHERE created_at::DATE = current_date_iter;
    
    -- Update running total
    running_total := running_total + COALESCE(daily_new, 0);
    
    -- Return row
    date := current_date_iter;
    new_users := COALESCE(daily_new, 0);
    total_users := running_total;
    
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to get user management data with proper structure
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

-- Function to get admin stats with caching
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats_data JSONB;
  cache_expiry TIMESTAMP WITH TIME ZONE;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Check if we have valid cached data
  SELECT data, expires_at
  INTO stats_data, cache_expiry
  FROM admin_stats_cache
  WHERE stat_type = 'dashboard_stats'
  AND expires_at > current_time;
  
  -- If no valid cache, calculate fresh stats
  IF stats_data IS NULL THEN
    WITH user_stats AS (
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL) as confirmed_users,
        COUNT(*) FILTER (WHERE u.email_confirmed_at IS NULL) as unconfirmed_users,
        COUNT(*) FILTER (WHERE u.last_sign_in_at >= NOW() - INTERVAL '30 days') as active_users_month,
        COUNT(*) FILTER (WHERE DATE(u.created_at) = CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '30 days') as new_users_month
      FROM auth.users u
    ),
    premium_stats AS (
      SELECT COUNT(*) FILTER (WHERE is_premium = true) as premium_users
      FROM profiles
    ),
    report_stats AS (
      SELECT COUNT(*) FILTER (WHERE status = 'pending') as pending_reports
      FROM user_reports
    ),
    system_stats AS (
      SELECT COUNT(*) FILTER (WHERE level = 'error' AND created_at >= NOW() - INTERVAL '24 hours') as recent_errors
      FROM system_logs
    )
    SELECT jsonb_build_object(
      'total_users', us.total_users,
      'confirmed_users', us.confirmed_users,
      'unconfirmed_users', us.unconfirmed_users,
      'active_users_month', us.active_users_month,
      'new_users_today', us.new_users_today,
      'new_users_week', us.new_users_week,
      'new_users_month', us.new_users_month,
      'premium_users', ps.premium_users,
      'pending_reports', rs.pending_reports,
      'recent_errors', ss.recent_errors,
      'updated_at', current_time
    )
    INTO stats_data
    FROM user_stats us, premium_stats ps, report_stats rs, system_stats ss;
    
    -- Cache the results for 5 minutes
    INSERT INTO admin_stats_cache (stat_type, data, expires_at)
    VALUES ('dashboard_stats', stats_data, current_time + INTERVAL '5 minutes')
    ON CONFLICT (stat_type) 
    DO UPDATE SET 
        data = EXCLUDED.data,
        expires_at = EXCLUDED.expires_at,
        updated_at = current_time;
  END IF;
  
  RETURN stats_data;
END;
$$;

-- Function to create user report
CREATE OR REPLACE FUNCTION create_user_report(
  reported_user_id UUID,
  report_type TEXT,
  description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_id UUID;
  reporter_id UUID;
BEGIN
  reporter_id := auth.uid();
  
  -- Validate report type
  IF report_type NOT IN ('spam', 'abuse', 'inappropriate', 'other') THEN
    RAISE EXCEPTION 'Invalid report type: %', report_type;
  END IF;
  
  -- Prevent self-reporting
  IF reported_user_id = reporter_id THEN
    RAISE EXCEPTION 'Cannot report yourself';
  END IF;
  
  -- Create the report
  INSERT INTO user_reports (
    reporter_id,
    reported_user_id,
    report_type,
    description,
    status,
    created_at,
    updated_at
  ) VALUES (
    reporter_id,
    reported_user_id,
    report_type,
    description,
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$;

-- Grant execute permissions to service_role and authenticated users
GRANT EXECUTE ON FUNCTION get_active_users_count(INTEGER) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth_data(INTEGER) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_user_management_data(INTEGER, INTEGER, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(TEXT, UUID, JSONB) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION create_user_report(UUID, TEXT, TEXT) TO service_role, authenticated;