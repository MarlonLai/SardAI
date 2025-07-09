/*
  # Complete Storage and Database Policies System

  1. Storage Buckets and Policies
    - Create avatars and recipe-images buckets
    - Set up comprehensive storage policies for all operations
    - Enable public access where appropriate

  2. Enhanced Database Policies
    - Fix all RLS policies to prevent recursion
    - Create admin-specific policies
    - Ensure proper user access controls

  3. Admin System Enhancement
    - Create admin profile management
    - Set up proper admin verification
    - Add comprehensive logging
*/

-- =============================================
-- STORAGE BUCKETS AND POLICIES
-- =============================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('recipe-images', 'recipe-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- AVATARS BUCKET POLICIES
-- =============================================

-- SELECT: Avatar images are publicly accessible
CREATE POLICY "avatars_public_access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- INSERT: Users can upload avatars
CREATE POLICY "avatars_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: Users can upload their own avatars (alternative policy)
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: Users can upload their own avatars (specific policy)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update their own avatars
CREATE POLICY "avatars_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update their own avatars (alternative)
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own avatars
CREATE POLICY "avatars_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own avatars (alternative)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own images (general)
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- RECIPE-IMAGES BUCKET POLICIES
-- =============================================

-- SELECT: Recipe images are publicly accessible
CREATE POLICY "recipe_images_public_access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- SELECT: Recipe images are publicly accessible (alternative)
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- INSERT: Users can upload recipe images
CREATE POLICY "recipe_images_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: Users can upload recipe images (alternative)
CREATE POLICY "Users can upload recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: Users can upload their own recipe images
CREATE POLICY "Users can upload their own recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update their own recipe images
CREATE POLICY "recipe_images_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update their own recipe images (alternative)
CREATE POLICY "Users can update their own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own recipe images
CREATE POLICY "recipe_images_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own recipe images (alternative)
CREATE POLICY "Users can delete their own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- ENHANCED PROFILES TABLE POLICIES
-- =============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create comprehensive profile policies
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admin can view and update all profiles (using service role)
CREATE POLICY "profiles_admin_all"
ON profiles FOR ALL
TO service_role
USING (true);

-- =============================================
-- ADMIN PROFILE CREATION AND MANAGEMENT
-- =============================================

-- Function to create admin profile
CREATE OR REPLACE FUNCTION create_admin_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the admin user ID
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'marlon.lai@hotmail.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Insert or update admin profile
    INSERT INTO profiles (id, full_name, role, is_premium, updated_at)
    VALUES (admin_user_id, 'Admin SardAI', 'admin', true, now())
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      is_premium = true,
      updated_at = now();
      
    -- Log the action
    INSERT INTO system_logs (level, message, context, user_id)
    VALUES ('info', 'Admin profile created/updated', 
            jsonb_build_object('admin_email', 'marlon.lai@hotmail.com'), 
            admin_user_id);
  END IF;
END;
$$;

-- Function to ensure admin exists on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text DEFAULT 'user';
  is_premium boolean DEFAULT false;
BEGIN
  -- Check if this is the admin user
  IF NEW.email = 'marlon.lai@hotmail.com' THEN
    user_role := 'admin';
    is_premium := true;
  END IF;

  -- Create profile for new user
  INSERT INTO profiles (id, full_name, role, is_premium, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utente SardAI'),
    user_role,
    is_premium,
    now()
  );

  -- Log user creation
  INSERT INTO system_logs (level, message, context, user_id)
  VALUES (
    'info', 
    'New user registered', 
    jsonb_build_object(
      'email', NEW.email,
      'role', user_role,
      'is_premium', is_premium
    ), 
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- ENHANCED ADMIN FUNCTIONS
-- =============================================

-- Function to promote user to admin (only callable by existing admin)
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email text;
  target_user_email text;
BEGIN
  -- Verify caller is admin
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF current_user_email != 'marlon.lai@hotmail.com' THEN
    RAISE EXCEPTION 'Access denied. Only marlon.lai@hotmail.com can promote users to admin.';
  END IF;
  
  -- Get target user email for logging
  SELECT email INTO target_user_email 
  FROM auth.users 
  WHERE id = target_user_id;
  
  -- Update user role
  UPDATE profiles 
  SET role = 'admin', is_premium = true, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(), 
    'user_promoted_to_admin', 
    target_user_id,
    jsonb_build_object('target_email', target_user_email)
  );
  
  RETURN true;
END;
$$;

-- Function to demote admin to user
CREATE OR REPLACE FUNCTION demote_from_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email text;
  target_user_email text;
BEGIN
  -- Verify caller is admin
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  IF current_user_email != 'marlon.lai@hotmail.com' THEN
    RAISE EXCEPTION 'Access denied. Only marlon.lai@hotmail.com can demote admins.';
  END IF;
  
  -- Prevent self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin role.';
  END IF;
  
  -- Get target user email for logging
  SELECT email INTO target_user_email 
  FROM auth.users 
  WHERE id = target_user_id;
  
  -- Update user role
  UPDATE profiles 
  SET role = 'user', updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(), 
    'admin_demoted_to_user', 
    target_user_id,
    jsonb_build_object('target_email', target_user_email)
  );
  
  RETURN true;
END;
$$;

-- =============================================
-- USER MANAGEMENT FUNCTIONS
-- =============================================

-- Function to create user report
CREATE OR REPLACE FUNCTION create_user_report(
  reported_user_id uuid,
  report_type text,
  description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  report_id uuid;
BEGIN
  -- Validate report type
  IF report_type NOT IN ('spam', 'abuse', 'inappropriate', 'other') THEN
    RAISE EXCEPTION 'Invalid report type. Must be: spam, abuse, inappropriate, or other.';
  END IF;
  
  -- Create report
  INSERT INTO user_reports (reporter_id, reported_user_id, report_type, description)
  VALUES (auth.uid(), reported_user_id, report_type, description)
  RETURNING id INTO report_id;
  
  -- Log system event
  INSERT INTO system_logs (level, message, context, user_id)
  VALUES (
    'warning',
    'User report created',
    jsonb_build_object(
      'report_id', report_id,
      'report_type', report_type,
      'reported_user_id', reported_user_id
    ),
    auth.uid()
  );
  
  RETURN report_id;
END;
$$;

-- Function to toggle premium status
CREATE OR REPLACE FUNCTION toggle_premium_status(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_premium boolean;
  new_premium boolean;
  target_email text;
BEGIN
  -- Get current premium status and email
  SELECT is_premium, (SELECT email FROM auth.users WHERE id = target_user_id)
  INTO current_premium, target_email
  FROM profiles 
  WHERE id = target_user_id;
  
  -- Toggle premium status
  new_premium := NOT current_premium;
  
  UPDATE profiles 
  SET is_premium = new_premium, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (
    auth.uid(), 
    CASE WHEN new_premium THEN 'user_upgraded_to_premium' ELSE 'user_downgraded_from_premium' END,
    target_user_id,
    jsonb_build_object(
      'target_email', target_email,
      'previous_status', current_premium,
      'new_status', new_premium
    )
  );
  
  RETURN new_premium;
END;
$$;

-- =============================================
-- INITIALIZE ADMIN SYSTEM
-- =============================================

-- Create admin profile if user exists
SELECT create_admin_profile();

-- Insert initial system logs
INSERT INTO system_logs (level, message, context) VALUES
('info', 'Complete storage and database policies system initialized', 
 jsonb_build_object('component', 'storage_policies', 'version', '1.0')),
('info', 'Admin system enhanced with comprehensive user management', 
 jsonb_build_object('component', 'admin_system', 'admin_email', 'marlon.lai@hotmail.com'));

-- =============================================
-- GRANT NECESSARY PERMISSIONS
-- =============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_admin_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION demote_from_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_report(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_premium_status(uuid) TO authenticated;