/*
  # Update Admin Privileges for Riccardo Lai

  1. Profile Updates
    - Set role to 'admin' for user d2cd65ef-3ca2-46d2-99fb-9ea6b6940f9a
    - Grant premium access
    - Update profile information

  2. Security Updates
    - Update RLS policies to include marlon.lai@hotmail.com as admin
    - Grant full database administration privileges
    - Allow user management operations

  3. Admin Functions
    - Update admin check functions to include both admin emails
    - Ensure proper access control for sensitive operations
*/

-- Update Riccardo Lai's profile to admin
UPDATE profiles 
SET 
  role = 'admin',
  is_premium = true,
  updated_at = now()
WHERE id = 'd2cd65ef-3ca2-46d2-99fb-9ea6b6940f9a';

-- Create or update admin configuration table
CREATE TABLE IF NOT EXISTS admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_emails text[] NOT NULL DEFAULT ARRAY['marlon.lai@hotmail.com'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert admin emails configuration
INSERT INTO admin_config (admin_emails) 
VALUES (ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
ON CONFLICT (id) DO UPDATE SET 
  admin_emails = EXCLUDED.admin_emails,
  updated_at = now();

-- Enable RLS on admin_config
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admin config access
CREATE POLICY "Only admins can access admin config"
  ON admin_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.role = 'admin'
      AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
    )
  );

-- Update system_logs policy to include both admins
DROP POLICY IF EXISTS "Admin can access system logs" ON system_logs;
CREATE POLICY "Admin can access system logs"
  ON system_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.role = 'admin'
      AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
    )
  );

-- Update user_reports policy to include both admins
DROP POLICY IF EXISTS "Admin and reporter can access reports" ON user_reports;
CREATE POLICY "Admin and reporter can access reports"
  ON user_reports
  FOR ALL
  TO authenticated
  USING (
    reporter_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.role = 'admin'
      AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
    )
  );

-- Update admin_logs policy to include both admins
DROP POLICY IF EXISTS "Admin can access admin logs" ON admin_logs;
CREATE POLICY "Admin can access admin logs"
  ON admin_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.role = 'admin'
      AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
    )
  );

-- Update admin_stats_cache policy to include both admins
DROP POLICY IF EXISTS "Admin can access stats cache" ON admin_stats_cache;
CREATE POLICY "Admin can access stats cache"
  ON admin_stats_cache
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND p.role = 'admin'
      AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
    )
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.id = COALESCE(user_id, auth.uid())
    AND p.role = 'admin'
    AND u.email = ANY(ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'])
  );
END;
$$;

-- Create function to get admin emails
CREATE OR REPLACE FUNCTION get_admin_emails()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'];
END;
$$;

-- Update trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to admin_config
DROP TRIGGER IF EXISTS update_admin_config_updated_at ON admin_config;
CREATE TRIGGER update_admin_config_updated_at
  BEFORE UPDATE ON admin_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant admin privileges to Riccardo Lai in user_subscriptions
UPDATE user_subscriptions 
SET 
  plan = 'premium',
  status = 'active',
  updated_at = now()
WHERE user_id = 'd2cd65ef-3ca2-46d2-99fb-9ea6b6940f9a';

-- Create admin subscription if it doesn't exist
INSERT INTO user_subscriptions (
  user_id,
  plan,
  status,
  trial_started_at,
  trial_ends_at,
  current_period_start,
  current_period_end
) VALUES (
  'd2cd65ef-3ca2-46d2-99fb-9ea6b6940f9a',
  'premium',
  'active',
  now(),
  now() + interval '365 days',
  now(),
  now() + interval '365 days'
) ON CONFLICT (user_id) DO UPDATE SET
  plan = 'premium',
  status = 'active',
  updated_at = now();

-- Log the admin privilege grant
INSERT INTO admin_logs (
  admin_id,
  action,
  target_user_id,
  details,
  created_at
) VALUES (
  'd2cd65ef-3ca2-46d2-99fb-9ea6b6940f9a',
  'admin_privileges_granted',
  'd2cd65ef-3ca2-46d2-99fb-9ea6b6940f9a',
  jsonb_build_object(
    'granted_by', 'system_migration',
    'email', 'riccardo.lai@example.com',
    'privileges', ARRAY['user_management', 'database_admin', 'system_logs', 'reports_management']
  ),
  now()
);