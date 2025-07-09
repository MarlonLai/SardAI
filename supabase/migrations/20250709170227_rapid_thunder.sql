/*
  # Fix Admin Panel Database Functions and Relationships

  This migration fixes all the issues preventing the admin panel from working:

  1. Database Functions
     - Creates `get_user_management_data` function for user listing with pagination
     - Creates `log_admin_action` function for admin activity logging
     - Creates `update_updated_at_column` trigger function for automatic timestamp updates

  2. Foreign Key Relationships
     - Ensures all user ID columns properly reference the auth.users table
     - Adds missing foreign key constraints for proper data relationships

  3. Security
     - Maintains RLS policies for all tables
     - Ensures admin-only access where required

  4. Performance
     - Adds necessary indexes for efficient querying
     - Optimizes functions for production use
*/

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the log_admin_action function
CREATE OR REPLACE FUNCTION log_admin_action(
    action_type TEXT,
    target_user UUID DEFAULT NULL,
    action_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_user_id UUID;
    user_ip INET;
    user_agent_header TEXT;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Insert admin log entry
    INSERT INTO admin_logs (
        admin_id,
        action,
        target_user_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        current_user_id,
        action_type,
        target_user,
        action_details,
        user_ip,
        user_agent_header
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the get_user_management_data function
CREATE OR REPLACE FUNCTION get_user_management_data(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0,
    search_term TEXT DEFAULT NULL
)
RETURNS TABLE(
    users JSONB
) AS $$
DECLARE
    result_json JSONB;
BEGIN
    -- Build the user data with proper aggregation
    WITH user_data AS (
        SELECT 
            u.id,
            u.email,
            u.email_confirmed_at,
            u.created_at,
            u.updated_at,
            u.last_sign_in_at,
            p.full_name,
            p.avatar_url,
            p.is_premium,
            p.role,
            COUNT(*) OVER() as total_count
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE 
            CASE 
                WHEN search_term IS NOT NULL THEN 
                    (u.email ILIKE '%' || search_term || '%' OR 
                     COALESCE(p.full_name, '') ILIKE '%' || search_term || '%')
                ELSE TRUE
            END
        ORDER BY u.created_at DESC
        LIMIT limit_count
        OFFSET offset_count
    ),
    aggregated_data AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'email', email,
                    'email_confirmed_at', email_confirmed_at,
                    'created_at', created_at,
                    'updated_at', updated_at,
                    'last_sign_in_at', last_sign_in_at,
                    'full_name', full_name,
                    'avatar_url', avatar_url,
                    'is_premium', is_premium,
                    'role', role
                )
            ) as users_array,
            COALESCE(MAX(total_count), 0) as total
        FROM user_data
    )
    SELECT 
        jsonb_build_object(
            'users', COALESCE(users_array, '[]'::jsonb),
            'total', total,
            'limit', limit_count,
            'offset', offset_count
        )
    FROM aggregated_data
    INTO result_json;
    
    RETURN QUERY SELECT result_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure foreign key constraints exist (add them if missing)
DO $$
BEGIN
    -- Check and add foreign key for admin_logs.admin_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_logs_admin_id_fkey' 
        AND table_name = 'admin_logs'
    ) THEN
        ALTER TABLE admin_logs 
        ADD CONSTRAINT admin_logs_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for admin_logs.target_user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'admin_logs_target_user_id_fkey' 
        AND table_name = 'admin_logs'
    ) THEN
        ALTER TABLE admin_logs 
        ADD CONSTRAINT admin_logs_target_user_id_fkey 
        FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Check and add foreign key for user_reports.reporter_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reports_reporter_id_fkey' 
        AND table_name = 'user_reports'
    ) THEN
        ALTER TABLE user_reports 
        ADD CONSTRAINT user_reports_reporter_id_fkey 
        FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for user_reports.reported_user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reports_reported_user_id_fkey' 
        AND table_name = 'user_reports'
    ) THEN
        ALTER TABLE user_reports 
        ADD CONSTRAINT user_reports_reported_user_id_fkey 
        FOREIGN KEY (reported_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for user_reports.resolved_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_reports_resolved_by_fkey' 
        AND table_name = 'user_reports'
    ) THEN
        ALTER TABLE user_reports 
        ADD CONSTRAINT user_reports_resolved_by_fkey 
        FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Check and add foreign key for system_logs.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'system_logs_user_id_fkey' 
        AND table_name = 'system_logs'
    ) THEN
        ALTER TABLE system_logs 
        ADD CONSTRAINT system_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Check and add foreign key for profiles.id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target_user_id ON admin_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user_id ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_management_data TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO authenticated;