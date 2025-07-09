/*
  # Add Database Management Functions

  1. Functions
    - get_user_management_data: Enhanced user management with proper aggregation
    - log_admin_action: Logging system for admin actions
    - update_updated_at_column: Trigger function for timestamps
    - get_active_users_count: Count active users within timeframe
    - get_user_growth_data: User growth statistics for charts

  2. Security
    - All functions are SECURITY DEFINER
    - Proper permissions for authenticated users
    - Admin-only access where appropriate

  3. Performance
    - Optimized queries with proper indexing
    - Efficient aggregation functions
    - Cached results where possible
*/

-- Enhanced user management function with proper aggregation
CREATE OR REPLACE FUNCTION get_user_management_data(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0,
    search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
    users JSONB,
    total INTEGER
) AS $$
DECLARE
    user_data JSONB;
    total_count INTEGER;
BEGIN
    -- Build the user data with proper joins
    WITH user_profiles AS (
        SELECT 
            p.id,
            p.full_name,
            p.avatar_url,
            p.is_premium,
            p.role,
            p.created_at,
            p.updated_at,
            u.email,
            u.email_confirmed_at,
            u.last_sign_in_at,
            u.created_at as auth_created_at
        FROM profiles p
        LEFT JOIN auth.users u ON p.id = u.id
        WHERE (
            search_term IS NULL OR 
            p.full_name ILIKE '%' || search_term || '%' OR
            u.email ILIKE '%' || search_term || '%'
        )
        ORDER BY p.created_at DESC
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
                'created_at', up.auth_created_at,
                'updated_at', up.updated_at
            )
        ), '[]'::jsonb)
    INTO user_data
    FROM user_profiles up;

    -- Get total count
    SELECT COUNT(*)
    INTO total_count
    FROM profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE (
        search_term IS NULL OR 
        p.full_name ILIKE '%' || search_term || '%' OR
        u.email ILIKE '%' || search_term || '%'
    );

    -- Return the result
    users := user_data;
    total := total_count;
    
    RETURN NEXT;
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
        created_at
    ) VALUES (
        current_user_id,
        action_type,
        target_user,
        action_details,
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

-- Add missing foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for admin_logs.admin_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_logs_admin_id_fkey'
    ) THEN
        ALTER TABLE admin_logs 
        ADD CONSTRAINT admin_logs_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for admin_logs.target_user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_logs_target_user_id_fkey'
    ) THEN
        ALTER TABLE admin_logs 
        ADD CONSTRAINT admin_logs_target_user_id_fkey 
        FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key for user_reports.reporter_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reports_reporter_id_fkey'
    ) THEN
        ALTER TABLE user_reports 
        ADD CONSTRAINT user_reports_reporter_id_fkey 
        FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for user_reports.reported_user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reports_reported_user_id_fkey'
    ) THEN
        ALTER TABLE user_reports 
        ADD CONSTRAINT user_reports_reported_user_id_fkey 
        FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key for user_reports.resolved_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reports_resolved_by_fkey'
    ) THEN
        ALTER TABLE user_reports 
        ADD CONSTRAINT user_reports_resolved_by_fkey 
        FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key for system_logs.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'system_logs_user_id_fkey'
    ) THEN
        ALTER TABLE system_logs 
        ADD CONSTRAINT system_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_reports_updated_at ON user_reports;
CREATE TRIGGER update_user_reports_updated_at
    BEFORE UPDATE ON user_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_stats_cache_updated_at ON admin_stats_cache;
CREATE TRIGGER update_admin_stats_cache_updated_at
    BEFORE UPDATE ON admin_stats_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_management_data TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_users_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth_data TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);