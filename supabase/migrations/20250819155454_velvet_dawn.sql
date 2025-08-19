/*
  # Fix Superadmin Status for Marlon Lai

  1. Updates
    - Set `is_super_admin` to true for marlon.lai@hotmail.com
    - Update user metadata to reflect superadmin status
    - Ensure admin role in profiles table
    - Add superadmin flag in app_metadata

  2. Security
    - Verify user exists before update
    - Log the superadmin assignment
    - Maintain data integrity

  3. Metadata Updates
    - Add superadmin flag to app_metadata
    - Update user_metadata with correct information
    - Ensure consistency across auth tables
*/

-- Function to update superadmin status
CREATE OR REPLACE FUNCTION update_superadmin_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
    target_email text := 'marlon.lai@hotmail.com';
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    -- Check if user exists
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', target_email;
    END IF;

    -- Update is_super_admin flag in auth.users
    UPDATE auth.users
    SET 
        is_super_admin = true,
        raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                           jsonb_build_object(
                               'provider', 'email',
                               'providers', ARRAY['email'],
                               'is_super_admin', true,
                               'role', 'superadmin'
                           ),
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                            jsonb_build_object(
                                'full_name', 'Marlon Lai',
                                'role', 'superadmin',
                                'is_super_admin', true
                            ),
        updated_at = now()
    WHERE id = target_user_id;

    -- Ensure profile exists and is admin
    INSERT INTO public.profiles (id, full_name, role, is_premium, updated_at)
    VALUES (target_user_id, 'Marlon Lai', 'admin', true, now())
    ON CONFLICT (id) 
    DO UPDATE SET 
        full_name = 'Marlon Lai',
        role = 'admin',
        is_premium = true,
        updated_at = now();

    -- Log the superadmin assignment
    INSERT INTO public.system_logs (level, message, context, user_id)
    VALUES (
        'info',
        'Superadmin status assigned to user',
        jsonb_build_object(
            'user_email', target_email,
            'user_id', target_user_id,
            'action', 'superadmin_assignment',
            'timestamp', now()
        ),
        target_user_id
    );

    RAISE NOTICE 'Superadmin status successfully assigned to %', target_email;
END;
$$;

-- Execute the function to update superadmin status
SELECT update_superadmin_status();

-- Also update Riccardo Lai to ensure both admins are properly configured
DO $$
DECLARE
    riccardo_user_id uuid;
    riccardo_email text := 'riccardo.lai@example.com';
BEGIN
    -- Get Riccardo's user ID if exists
    SELECT id INTO riccardo_user_id
    FROM auth.users
    WHERE email = riccardo_email;

    -- If Riccardo exists, update his status too
    IF riccardo_user_id IS NOT NULL THEN
        UPDATE auth.users
        SET 
            raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
                               jsonb_build_object(
                                   'provider', 'email',
                                   'providers', ARRAY['email'],
                                   'is_admin', true,
                                   'role', 'admin'
                               ),
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                                jsonb_build_object(
                                    'full_name', 'Riccardo Lai',
                                    'role', 'admin',
                                    'is_admin', true
                                ),
            updated_at = now()
        WHERE id = riccardo_user_id;

        -- Ensure Riccardo's profile is admin
        INSERT INTO public.profiles (id, full_name, role, is_premium, updated_at)
        VALUES (riccardo_user_id, 'Riccardo Lai', 'admin', true, now())
        ON CONFLICT (id) 
        DO UPDATE SET 
            full_name = 'Riccardo Lai',
            role = 'admin',
            is_premium = true,
            updated_at = now();
    END IF;
END;
$$;

-- Update admin_config table to reflect both admins
INSERT INTO public.admin_config (admin_emails, updated_at)
VALUES (
    ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'],
    now()
)
ON CONFLICT (id)
DO UPDATE SET 
    admin_emails = ARRAY['marlon.lai@hotmail.com', 'riccardo.lai@example.com'],
    updated_at = now();

-- Create function to check superadmin status
CREATE OR REPLACE FUNCTION is_superadmin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN user_email = 'marlon.lai@hotmail.com';
END;
$$;

-- Create function to check admin status (includes both superadmin and regular admin)
CREATE OR REPLACE FUNCTION is_admin_user(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN user_email IN ('marlon.lai@hotmail.com', 'riccardo.lai@example.com');
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_superadmin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_superadmin_status() TO service_role;

-- Clean up the function after use
DROP FUNCTION update_superadmin_status();