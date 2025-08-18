/*
  # Fix user registration for production

  1. Updates
    - Fix handle_new_user trigger function for production use
    - Add proper error handling and logging
    - Ensure profile creation works with email confirmation flow
    - Add user subscription initialization

  2. Security
    - Maintain RLS policies
    - Add proper error logging without breaking registration
*/

-- Drop existing trigger and function to recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Extract full_name from user metadata
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Create profile with conflict handling
  INSERT INTO public.profiles (id, full_name, updated_at)
  VALUES (NEW.id, user_full_name, NOW())
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  -- Create user subscription with trial (only if not exists)
  INSERT INTO public.user_subscriptions (user_id, plan, status, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id, 
    'trial', 
    'active',
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Log successful user creation (with error handling)
  BEGIN
    INSERT INTO public.system_logs (level, message, context, user_id)
    VALUES (
      'info',
      'New user registered successfully',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', user_full_name,
        'confirmed', NEW.email_confirmed_at IS NOT NULL
      ),
      NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    -- If logging fails, don't break the registration
    NULL;
  END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the registration
  BEGIN
    INSERT INTO public.system_logs (level, message, context, user_id)
    VALUES (
      'error',
      'Error in handle_new_user trigger: ' || SQLERRM,
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'error_detail', SQLERRM
      ),
      NEW.id
    );
  EXCEPTION WHEN OTHERS THEN
    -- If even error logging fails, just continue
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Add function to handle email confirmation updates
CREATE OR REPLACE FUNCTION public.handle_user_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile when user confirms email
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Log successful confirmation
    BEGIN
      INSERT INTO public.system_logs (level, message, context, user_id)
      VALUES (
        'info',
        'User email confirmed',
        jsonb_build_object(
          'user_id', NEW.id,
          'email', NEW.email,
          'confirmed_at', NEW.email_confirmed_at
        ),
        NEW.id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail if logging fails
      NULL;
    END;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't fail the confirmation process
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email confirmation
DROP TRIGGER IF EXISTS on_user_confirmed ON auth.users;
CREATE TRIGGER on_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmation();