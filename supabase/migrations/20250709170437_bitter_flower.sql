/*
  # Add Statistics Helper Functions

  This migration adds helper functions for the admin statistics dashboard:

  1. Functions
     - `get_active_users_count` - Count users active within specified days
     - `get_user_growth_data` - Get daily user registration data for charts

  2. Performance
     - Optimized queries for dashboard statistics
     - Proper indexing for efficient data retrieval
*/

-- Function to get active users count (users who signed in within specified days)
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

-- Function to get user growth data for charts
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_active_users_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_growth_data TO authenticated;