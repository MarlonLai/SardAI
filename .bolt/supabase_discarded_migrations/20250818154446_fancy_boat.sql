/*
  # Sistema di Limitazioni Messaggi Giornalieri

  1. Nuove Tabelle
    - `daily_message_limits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `date` (date)
      - `message_count` (integer)
      - `last_message_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Funzioni
    - `get_daily_message_count` - Ottiene conteggio messaggi giornalieri
    - `increment_daily_message_count` - Incrementa contatore
    - `reset_daily_limits` - Reset automatico mezzanotte
    - `can_send_message` - Verifica se utente può inviare messaggi

  3. Security
    - Enable RLS on `daily_message_limits` table
    - Add policies for users to access own data
*/

-- Create daily message limits table
CREATE TABLE IF NOT EXISTS daily_message_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_message_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily limits"
  ON daily_message_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily limits"
  ON daily_message_limits
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily limits"
  ON daily_message_limits
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_message_limits_user_date 
  ON daily_message_limits(user_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_message_limits_date 
  ON daily_message_limits(date);

-- Function to get daily message count for a user
CREATE OR REPLACE FUNCTION get_daily_message_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_result integer;
BEGIN
  SELECT COALESCE(message_count, 0)
  INTO count_result
  FROM daily_message_limits
  WHERE user_id = user_uuid 
    AND date = CURRENT_DATE;
  
  RETURN COALESCE(count_result, 0);
END;
$$;

-- Function to increment daily message count
CREATE OR REPLACE FUNCTION increment_daily_message_count(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  -- Insert or update daily limit record
  INSERT INTO daily_message_limits (user_id, date, message_count, last_message_at)
  VALUES (user_uuid, CURRENT_DATE, 1, now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    message_count = daily_message_limits.message_count + 1,
    last_message_at = now(),
    updated_at = now()
  RETURNING message_count INTO new_count;
  
  RETURN new_count;
END;
$$;

-- Function to check if user can send message
CREATE OR REPLACE FUNCTION can_send_message(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan text;
  current_count integer;
  daily_limit integer := 5; -- Free users get 5 messages per day
  result json;
  subscription_record record;
  is_admin boolean := false;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM profiles
  WHERE id = user_uuid;
  
  -- Admin users have unlimited access
  IF is_admin THEN
    RETURN json_build_object(
      'can_send', true,
      'plan', 'admin',
      'messages_used', 0,
      'messages_remaining', -1,
      'daily_limit', -1,
      'is_admin', true
    );
  END IF;

  -- Get user subscription status
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If no subscription record, create trial
  IF subscription_record IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan, status)
    VALUES (user_uuid, 'trial', 'active')
    RETURNING * INTO subscription_record;
  END IF;
  
  user_plan := subscription_record.plan;
  
  -- Premium users (including trial) have unlimited messages
  IF user_plan IN ('premium', 'trial') AND subscription_record.status = 'active' THEN
    -- Check if trial is still valid
    IF user_plan = 'trial' AND subscription_record.trial_ends_at < now() THEN
      -- Trial expired, treat as free user
      user_plan := 'free';
    ELSE
      RETURN json_build_object(
        'can_send', true,
        'plan', user_plan,
        'messages_used', 0,
        'messages_remaining', -1,
        'daily_limit', -1,
        'trial_ends_at', subscription_record.trial_ends_at,
        'is_admin', false
      );
    END IF;
  END IF;
  
  -- For free users, check daily limit
  current_count := get_daily_message_count(user_uuid);
  
  result := json_build_object(
    'can_send', current_count < daily_limit,
    'plan', user_plan,
    'messages_used', current_count,
    'messages_remaining', GREATEST(0, daily_limit - current_count),
    'daily_limit', daily_limit,
    'is_admin', false
  );
  
  RETURN result;
END;
$$;

-- Function to reset daily limits (called by cron job)
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old records (older than 7 days to keep some history)
  DELETE FROM daily_message_limits
  WHERE date < CURRENT_DATE - INTERVAL '7 days';
  
  -- Log the reset action
  INSERT INTO system_logs (level, message, context)
  VALUES (
    'info',
    'Daily message limits reset completed',
    json_build_object(
      'component', 'daily_limits',
      'action', 'reset',
      'date', CURRENT_DATE
    )
  );
END;
$$;

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_daily_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_daily_message_limits_updated_at
  BEFORE UPDATE ON daily_message_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_limits_updated_at();