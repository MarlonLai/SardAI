/*
  # Chat System Migration

  1. New Tables
    - `chat_sessions` - Store chat sessions for users
    - `chat_messages` - Store individual messages in chat sessions
    - `user_subscriptions` - Track user subscription status and trial periods

  2. Security
    - Enable RLS on all new tables
    - Add policies for user access control

  3. Functions
    - Function to check user plan status
    - Function to create chat session
    - Function to add chat message
*/

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Nuova Chat',
  chat_type text CHECK (chat_type IN ('free', 'premium')) NOT NULL DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('user', 'assistant')) NOT NULL,
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan text CHECK (plan IN ('trial', 'free', 'premium')) NOT NULL DEFAULT 'trial',
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  subscription_id text, -- Stripe subscription ID
  customer_id text, -- Stripe customer ID
  current_period_start timestamptz,
  current_period_end timestamptz,
  status text CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages from own sessions"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admin can access all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to get user plan status
CREATE OR REPLACE FUNCTION get_user_plan_status(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
  plan text,
  status text,
  trial_days_left integer,
  can_use_premium boolean,
  subscription_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_sub user_subscriptions%ROWTYPE;
  days_left integer;
  can_premium boolean := false;
  sub_active boolean := false;
BEGIN
  -- Get user subscription
  SELECT * INTO user_sub
  FROM user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If no subscription record, create trial
  IF user_sub IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan, trial_started_at, trial_ends_at)
    VALUES (user_uuid, 'trial', now(), now() + interval '7 days')
    RETURNING * INTO user_sub;
  END IF;
  
  -- Calculate trial days left
  IF user_sub.plan = 'trial' THEN
    days_left := GREATEST(0, EXTRACT(days FROM (user_sub.trial_ends_at - now()))::integer);
    can_premium := days_left > 0;
  ELSIF user_sub.plan = 'premium' AND user_sub.status = 'active' THEN
    days_left := 0;
    can_premium := true;
    sub_active := true;
  ELSE
    days_left := 0;
    can_premium := false;
  END IF;
  
  RETURN QUERY SELECT 
    user_sub.plan,
    user_sub.status,
    days_left,
    can_premium,
    sub_active;
END;
$$;

-- Function to create chat session
CREATE OR REPLACE FUNCTION create_chat_session(
  session_title text DEFAULT 'Nuova Chat',
  session_type text DEFAULT 'free'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
  user_plan_info record;
BEGIN
  -- Check user plan
  SELECT * INTO user_plan_info
  FROM get_user_plan_status(auth.uid());
  
  -- Validate access to premium chat
  IF session_type = 'premium' AND NOT user_plan_info.can_use_premium THEN
    RAISE EXCEPTION 'Premium access required for premium chat';
  END IF;
  
  -- Create session
  INSERT INTO chat_sessions (user_id, title, chat_type)
  VALUES (auth.uid(), session_title, session_type)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to add chat message
CREATE OR REPLACE FUNCTION add_chat_message(
  session_uuid uuid,
  message_role text,
  message_content text,
  tokens integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id uuid;
  session_owner uuid;
BEGIN
  -- Verify session ownership
  SELECT user_id INTO session_owner
  FROM chat_sessions
  WHERE id = session_uuid;
  
  IF session_owner != auth.uid() THEN
    RAISE EXCEPTION 'Access denied to chat session';
  END IF;
  
  -- Add message
  INSERT INTO chat_messages (session_id, role, content, tokens_used)
  VALUES (session_uuid, message_role, message_content, tokens)
  RETURNING id INTO message_id;
  
  -- Update session timestamp
  UPDATE chat_sessions 
  SET updated_at = now()
  WHERE id = session_uuid;
  
  RETURN message_id;
END;
$$;

-- Function to update subscription status (for Stripe webhooks)
CREATE OR REPLACE FUNCTION update_subscription_status(
  user_email text,
  new_plan text,
  new_status text,
  stripe_subscription_id text DEFAULT NULL,
  stripe_customer_id text DEFAULT NULL,
  period_start timestamptz DEFAULT NULL,
  period_end timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_email;
  END IF;
  
  -- Update or insert subscription
  INSERT INTO user_subscriptions (
    user_id, 
    plan, 
    status, 
    subscription_id, 
    customer_id,
    current_period_start,
    current_period_end,
    updated_at
  )
  VALUES (
    target_user_id, 
    new_plan, 
    new_status, 
    stripe_subscription_id, 
    stripe_customer_id,
    period_start,
    period_end,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    subscription_id = EXCLUDED.subscription_id,
    customer_id = EXCLUDED.customer_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();
  
  -- Update profile premium status
  UPDATE profiles 
  SET is_premium = (new_plan = 'premium' AND new_status = 'active')
  WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_plan_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_session(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_chat_message(uuid, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_subscription_status(text, text, text, text, text, timestamptz, timestamptz) TO service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);