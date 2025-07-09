-- Drop existing functions first to avoid type conflicts
DROP FUNCTION IF EXISTS get_user_management_data(INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS log_admin_action(TEXT, UUID, JSONB);
DROP FUNCTION IF EXISTS get_active_users_count(INTEGER);
DROP FUNCTION IF EXISTS get_user_growth_data(INTEGER);
DROP FUNCTION IF EXISTS get_admin_stats();
DROP FUNCTION IF EXISTS create_user_report(UUID, TEXT, TEXT);

-- Enhanced user management function with proper aggregation
CREATE OR REPLACE FUNCTION get_user_management_data(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0,
    search_term TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB;
BEGIN
    -- Build the user data with proper joins using correct column names
    WITH user_profiles AS (
        SELECT 
            p.id,
            p.full_name,
            p.avatar_url,
            p.is_premium,
            p.role,
            p.updated_at,
            u.email,
            u.email_confirmed_at,
            u.last_sign_in_at,
            u.created_at
        FROM profiles p
        LEFT JOIN auth.users u ON p.id = u.id
        WHERE (
            search_term IS NULL OR 
            COALESCE(p.full_name, '') ILIKE '%' || search_term || '%' OR
            COALESCE(u.email, '') ILIKE '%' || search_term || '%'
        )
        ORDER BY u.created_at DESC NULLS LAST
        LIMIT limit_count
        OFFSET offset_count
    )
    SELECT 
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', up.id,
                'full_name', up.full_name,
                'email', up.email,
                'avatar_url', up.avatar_url,
                'is_premium', up.is_premium,
                'role', up.role,
                'email_confirmed_at', up.email_confirmed_at,
                'last_sign_in_at', up.last_sign_in_at,
                'created_at', up.created_at,
                'updated_at', up.updated_at
            )
        ), '[]'::jsonb)
    INTO user_data
    FROM user_profiles up;

    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin action logging function
CREATE OR REPLACE FUNCTION log_admin_action(
    action_type TEXT,
    target_user UUID DEFAULT NULL,
    action_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
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
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        current_user_id,
        action_type,
        target_user,
        action_details,
        NULL, -- IP address can be set from application
        NULL, -- User agent can be set from application
        NOW()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get active users count
CREATE OR REPLACE FUNCTION get_active_users_count(days_back INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    cutoff_date := NOW() - (days_back || ' days')::INTERVAL;
    
    SELECT COUNT(DISTINCT u.id)
    INTO active_count
    FROM auth.users u
    WHERE u.last_sign_in_at >= cutoff_date;
    
    RETURN COALESCE(active_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user growth data
CREATE OR REPLACE FUNCTION get_user_growth_data(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    date DATE,
    new_users INTEGER,
    total_users INTEGER
) AS $$
DECLARE
    start_date DATE;
    current_date DATE;
    running_total INTEGER := 0;
BEGIN
    start_date := CURRENT_DATE - days_back;
    
    -- Get the total users before the start date
    SELECT COUNT(*)
    INTO running_total
    FROM auth.users u
    WHERE DATE(u.created_at) < start_date;
    
    -- Generate daily data
    FOR current_date IN 
        SELECT generate_series(start_date, CURRENT_DATE, '1 day'::interval)::date
    LOOP
        -- Get new users for this date
        SELECT COUNT(*)
        INTO new_users
        FROM auth.users u
        WHERE DATE(u.created_at) = current_date;
        
        -- Update running total
        running_total := running_total + new_users;
        total_users := running_total;
        date := current_date;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin statistics with proper caching
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user report
CREATE OR REPLACE FUNCTION create_user_report(
    reported_user_id UUID,
    report_type TEXT,
    description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
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
    
    -- Log the action
    PERFORM log_admin_action(
        'user_report_created',
        reported_user_id,
        jsonb_build_object(
            'report_id', report_id,
            'report_type', report_type,
            'reporter_email', (SELECT email FROM auth.users WHERE id = reporter_id)
        )
    );
    
    RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    current_user_email TEXT;
BEGIN
    -- Check if current user is admin
    SELECT p.role, u.email
    INTO current_user_role, current_user_email
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = auth.uid();
    
    IF current_user_role != 'admin' OR current_user_email != 'marlon.lai@hotmail.com' THEN
        RAISE EXCEPTION 'Access denied. Only authorized admin can promote users.';
    END IF;
    
    -- Update user role to admin
    UPDATE profiles 
    SET role = 'admin', updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the action
    PERFORM log_admin_action(
        'user_promoted_to_admin',
        target_user_id,
        jsonb_build_object('promoted_by', current_user_email)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote user from admin
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    current_user_email TEXT;
BEGIN
    -- Check if current user is admin
    SELECT p.role, u.email
    INTO current_user_role, current_user_email
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = auth.uid();
    
    IF current_user_role != 'admin' OR current_user_email != 'marlon.lai@hotmail.com' THEN
        RAISE EXCEPTION 'Access denied. Only authorized admin can demote users.';
    END IF;
    
    -- Prevent self-demotion
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot demote yourself';
    END IF;
    
    -- Update user role to user
    UPDATE profiles 
    SET role = 'user', updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the action
    PERFORM log_admin_action(
        'user_demoted_from_admin',
        target_user_id,
        jsonb_build_object('demoted_by', current_user_email)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle premium status
CREATE OR REPLACE FUNCTION toggle_premium_status(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    current_user_email TEXT;
    current_premium_status BOOLEAN;
    new_premium_status BOOLEAN;
BEGIN
    -- Check if current user is admin
    SELECT p.role, u.email
    INTO current_user_role, current_user_email
    FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.id = auth.uid();
    
    IF current_user_role != 'admin' OR current_user_email != 'marlon.lai@hotmail.com' THEN
        RAISE EXCEPTION 'Access denied. Only authorized admin can toggle premium status.';
    END IF;
    
    -- Get current premium status
    SELECT is_premium INTO current_premium_status
    FROM profiles
    WHERE id = target_user_id;
    
    -- Toggle the status
    new_premium_status := NOT COALESCE(current_premium_status, false);
    
    -- Update premium status
    UPDATE profiles 
    SET is_premium = new_premium_status, updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Log the action
    PERFORM log_admin_action(
        'premium_status_toggled',
        target_user_id,
        jsonb_build_object(
            'old_status', current_premium_status,
            'new_status', new_premium_status,
            'changed_by', current_user_email
        )
    );
    
    RETURN new_premium_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_management_data TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_users_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_report TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin TO authenticated;
GRANT EXECUTE ON FUNCTION demote_from_admin TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_premium_status TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user_id ON user_reports(reported_user_id);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_stats_cache_stat_type ON admin_stats_cache(stat_type);
CREATE INDEX IF NOT EXISTS idx_admin_stats_cache_expires_at ON admin_stats_cache(expires_at);

-- Insert initial admin stats cache entry if it doesn't exist
INSERT INTO admin_stats_cache (stat_type, data, expires_at)
VALUES ('dashboard_stats', '{}'::jsonb, NOW() - INTERVAL '1 minute')
ON CONFLICT (stat_type) DO NOTHING;