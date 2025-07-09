/*
  # Sistema Chat Completo - Fix Duplicazioni

  1. Nuove Tabelle
    - `user_subscriptions` - Gestione piani utente (trial, free, premium)
    - `chat_sessions` - Sessioni di conversazione
    - `chat_messages` - Messaggi delle conversazioni

  2. Funzioni
    - `get_user_plan_status` - Verifica stato piano utente
    - `create_chat_session` - Crea nuova sessione chat
    - `add_chat_message` - Aggiunge messaggio alla conversazione

  3. Sicurezza
    - RLS abilitato su tutte le tabelle
    - Policies per accesso controllato ai dati
    - Validazione accesso premium
*/

-- Tabella per gestire abbonamenti e periodi di prova
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'premium')),
  trial_started_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  subscription_id text, -- Stripe subscription ID
  customer_id text, -- Stripe customer ID
  current_period_start timestamptz,
  current_period_end timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabella per sessioni di chat
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Nuova Chat',
  chat_type text NOT NULL DEFAULT 'free' CHECK (chat_type IN ('free', 'premium')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella per messaggi chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Abilita RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  -- Drop user_subscriptions policies
  DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
  DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
  DROP POLICY IF EXISTS "Admin can access all subscriptions" ON user_subscriptions;
  
  -- Drop chat_sessions policies
  DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
  DROP POLICY IF EXISTS "Users can create own chat sessions" ON chat_sessions;
  DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
  DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
  
  -- Drop chat_messages policies
  DROP POLICY IF EXISTS "Users can view messages from own sessions" ON chat_messages;
  DROP POLICY IF EXISTS "Users can create messages in own sessions" ON chat_messages;
END $$;

-- Policies per user_subscriptions
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can access all subscriptions" ON user_subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies per chat_sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Policies per chat_messages
CREATE POLICY "Users can view messages from own sessions" ON chat_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Triggers per updated_at (solo se non esistono già)
DO $$
BEGIN
  -- Check and create trigger for user_subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_subscriptions_updated_at'
  ) THEN
    CREATE TRIGGER update_user_subscriptions_updated_at
      BEFORE UPDATE ON user_subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check and create trigger for chat_sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chat_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_chat_sessions_updated_at
      BEFORE UPDATE ON chat_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Funzione per ottenere lo stato del piano utente
CREATE OR REPLACE FUNCTION get_user_plan_status(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE(
  plan text,
  status text,
  trial_days_left integer,
  trial_expired boolean,
  can_use_premium boolean,
  subscription_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_sub user_subscriptions%ROWTYPE;
  user_prof profiles%ROWTYPE;
  days_left integer;
  trial_exp boolean;
  can_premium boolean;
  sub_active boolean;
BEGIN
  -- Get user subscription
  SELECT * INTO user_sub
  FROM user_subscriptions
  WHERE user_id = user_uuid;
  
  -- Get user profile
  SELECT * INTO user_prof
  FROM profiles
  WHERE id = user_uuid;
  
  -- If no subscription exists, create trial
  IF user_sub IS NULL THEN
    INSERT INTO user_subscriptions (user_id, plan, trial_started_at, trial_ends_at)
    VALUES (user_uuid, 'trial', now(), now() + interval '7 days')
    RETURNING * INTO user_sub;
  END IF;
  
  -- Calculate trial days left
  IF user_sub.plan = 'trial' THEN
    days_left := GREATEST(0, EXTRACT(days FROM (user_sub.trial_ends_at - now()))::integer);
    trial_exp := (now() > user_sub.trial_ends_at);
    
    -- Auto-transition to free if trial expired
    IF trial_exp AND user_sub.plan = 'trial' THEN
      UPDATE user_subscriptions 
      SET plan = 'free', status = 'active'
      WHERE user_id = user_uuid;
      user_sub.plan := 'free';
    END IF;
  ELSE
    days_left := 0;
    trial_exp := true;
  END IF;
  
  -- Determine subscription status
  sub_active := (user_sub.status = 'active');
  
  -- Determine premium access
  can_premium := (
    user_prof.role = 'admin' OR 
    (user_sub.plan = 'premium' AND sub_active) OR
    (user_sub.plan = 'trial' AND NOT trial_exp)
  );
  
  RETURN QUERY SELECT 
    user_sub.plan,
    user_sub.status,
    days_left,
    trial_exp,
    can_premium,
    sub_active;
END;
$$;

-- Funzione per creare sessione chat
CREATE OR REPLACE FUNCTION create_chat_session(
  session_title text DEFAULT 'Nuova Chat',
  session_type text DEFAULT 'free'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_session_id uuid;
  user_plan_info record;
BEGIN
  -- Check user plan status
  SELECT * INTO user_plan_info FROM get_user_plan_status();
  
  -- Validate access to premium chat
  IF session_type = 'premium' AND NOT user_plan_info.can_use_premium THEN
    RAISE EXCEPTION 'Premium access required for premium chat sessions';
  END IF;
  
  -- Create new session
  INSERT INTO chat_sessions (user_id, title, chat_type)
  VALUES (auth.uid(), session_title, session_type)
  RETURNING id INTO new_session_id;
  
  RETURN new_session_id;
END;
$$;

-- Funzione per aggiungere messaggio chat
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
  new_message_id uuid;
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
  RETURNING id INTO new_message_id;
  
  -- Update session timestamp
  UPDATE chat_sessions 
  SET updated_at = now()
  WHERE id = session_uuid;
  
  RETURN new_message_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_plan_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_session(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_chat_message(uuid, text, text, integer) TO authenticated;