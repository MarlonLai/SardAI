/*
  # Fix handle_new_user trigger function

  1. Database Functions
    - Update `handle_new_user()` function to handle profile creation more robustly
    - Add proper error handling and conflict resolution
    - Ensure user_subscriptions are created correctly

  2. Security
    - Maintain existing RLS policies
    - Ensure proper permissions for profile creation

  3. Changes
    - Fix potential conflicts in profile creation
    - Add ON CONFLICT handling for both profiles and user_subscriptions
    - Improve error handling in trigger function
*/

-- Drop and recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, full_name, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    updated_at = NOW();

  -- Create user subscription with trial
  INSERT INTO public.user_subscriptions (user_id, plan, trial_started_at, trial_ends_at)
  VALUES (
    NEW.id,
    'trial',
    NOW(),
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();