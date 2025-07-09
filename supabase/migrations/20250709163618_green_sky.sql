/*
  # Sistema Admin Completo per SardAI

  1. Nuove Tabelle
    - `admin_logs` - Log delle azioni amministrative
    - `user_reports` - Segnalazioni degli utenti
    - `system_logs` - Log di sistema
    - `admin_stats` - Cache delle statistiche

  2. Funzioni RPC
    - `is_admin` - Verifica se l'utente è admin
    - `get_admin_stats` - Statistiche per dashboard admin
    - `get_user_management_data` - Dati per gestione utenti

  3. Security
    - RLS abilitato su tutte le tabelle
    - Policy per accesso admin only
    - Trigger per logging automatico
*/

-- Tabella per i log delle azioni amministrative
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Tabella per le segnalazioni degli utenti
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('spam', 'abuse', 'inappropriate', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella per i log di sistema
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message text NOT NULL,
  context jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabella per cache delle statistiche admin
CREATE TABLE IF NOT EXISTS admin_stats_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_type text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Abilita RLS su tutte le tabelle
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_stats_cache ENABLE ROW LEVEL SECURITY;

-- Policy per admin_logs - solo admin possono accedere
CREATE POLICY "Admin can access admin logs"
  ON admin_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per user_reports - admin e reporter possono accedere
CREATE POLICY "Admin and reporter can access reports"
  ON user_reports
  FOR ALL
  TO authenticated
  USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per system_logs - solo admin
CREATE POLICY "Admin can access system logs"
  ON system_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy per admin_stats_cache - solo admin
CREATE POLICY "Admin can access stats cache"
  ON admin_stats_cache
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Funzione per verificare se l'utente è admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$;

-- Funzione per ottenere statistiche admin
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
  total_users integer;
  confirmed_users integer;
  unconfirmed_users integer;
  active_users_month integer;
  new_users_today integer;
  new_users_week integer;
  new_users_month integer;
BEGIN
  -- Verifica che l'utente sia admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Calcola statistiche
  SELECT COUNT(*) INTO total_users FROM auth.users;
  
  SELECT COUNT(*) INTO confirmed_users 
  FROM auth.users 
  WHERE email_confirmed_at IS NOT NULL;
  
  SELECT COUNT(*) INTO unconfirmed_users 
  FROM auth.users 
  WHERE email_confirmed_at IS NULL;
  
  SELECT COUNT(*) INTO active_users_month 
  FROM auth.users 
  WHERE last_sign_in_at > now() - interval '30 days';
  
  SELECT COUNT(*) INTO new_users_today 
  FROM auth.users 
  WHERE created_at::date = CURRENT_DATE;
  
  SELECT COUNT(*) INTO new_users_week 
  FROM auth.users 
  WHERE created_at > now() - interval '7 days';
  
  SELECT COUNT(*) INTO new_users_month 
  FROM auth.users 
  WHERE created_at > now() - interval '30 days';

  -- Costruisci oggetto JSON con le statistiche
  stats := jsonb_build_object(
    'total_users', total_users,
    'confirmed_users', confirmed_users,
    'unconfirmed_users', unconfirmed_users,
    'active_users_month', active_users_month,
    'new_users_today', new_users_today,
    'new_users_week', new_users_week,
    'new_users_month', new_users_month,
    'updated_at', now()
  );

  RETURN stats;
END;
$$;

-- Funzione per ottenere dati di gestione utenti
CREATE OR REPLACE FUNCTION get_user_management_data(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  search_term text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  users_data jsonb;
  total_count integer;
BEGIN
  -- Verifica che l'utente sia admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Query per ottenere utenti con filtro di ricerca opzionale
  WITH filtered_users AS (
    SELECT 
      u.id,
      u.email,
      u.created_at,
      u.email_confirmed_at,
      u.last_sign_in_at,
      u.raw_user_meta_data,
      p.full_name,
      p.is_premium,
      p.role
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE 
      CASE 
        WHEN search_term IS NOT NULL THEN 
          u.email ILIKE '%' || search_term || '%' OR 
          p.full_name ILIKE '%' || search_term || '%'
        ELSE TRUE
      END
    ORDER BY u.created_at DESC
    LIMIT limit_count
    OFFSET offset_count
  ),
  user_count AS (
    SELECT COUNT(*) as total
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE 
      CASE 
        WHEN search_term IS NOT NULL THEN 
          u.email ILIKE '%' || search_term || '%' OR 
          p.full_name ILIKE '%' || search_term || '%'
        ELSE TRUE
      END
  )
  SELECT 
    jsonb_build_object(
      'users', jsonb_agg(
        jsonb_build_object(
          'id', fu.id,
          'email', fu.email,
          'full_name', fu.full_name,
          'created_at', fu.created_at,
          'email_confirmed_at', fu.email_confirmed_at,
          'last_sign_in_at', fu.last_sign_in_at,
          'is_premium', fu.is_premium,
          'role', fu.role
        )
      ),
      'total_count', uc.total
    )
  INTO users_data
  FROM filtered_users fu, user_count uc;

  RETURN users_data;
END;
$$;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_reports_updated_at 
  BEFORE UPDATE ON user_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_stats_cache_updated_at 
  BEFORE UPDATE ON admin_stats_cache 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Imposta l'utente admin iniziale
DO $$
BEGIN
  -- Aggiorna il profilo per l'admin se esiste
  UPDATE profiles 
  SET role = 'admin' 
  WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'rikydisk@hotmail.com'
  );
  
  -- Se non esiste ancora il profilo, verrà creato dal trigger quando l'utente si registra
END $$;

-- Funzione per logging delle azioni admin
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type text,
  target_user uuid DEFAULT NULL,
  action_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_logs (admin_id, action, target_user_id, details)
  VALUES (auth.uid(), action_type, target_user, action_details);
END;
$$;

-- Inserisci alcuni log di sistema di esempio
INSERT INTO system_logs (level, message, context) VALUES
('info', 'Admin system initialized', '{"component": "admin_panel"}'),
('info', 'Database migration completed', '{"migration": "create_admin_system"}');