/*
  # Correzione Email Admin

  1. Aggiornamenti
    - Cambia l'email admin da rikydisk@hotmail.com a marlon.lai@hotmail.com
    - Aggiorna tutte le funzioni e policy per utilizzare la nuova email
    - Mantiene la compatibilità con il sistema esistente

  2. Sicurezza
    - Verifica che solo marlon.lai@hotmail.com abbia accesso admin
    - Aggiorna le funzioni di controllo accesso
*/

-- Aggiorna il profilo admin esistente se presente
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'marlon.lai@hotmail.com'
);

-- Rimuovi privilegi admin da altre email se presenti
UPDATE profiles 
SET role = 'user' 
WHERE role = 'admin' 
AND id NOT IN (
  SELECT id FROM auth.users 
  WHERE email = 'marlon.lai@hotmail.com'
);

-- Aggiorna la funzione di verifica admin per utilizzare la nuova email
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  -- Ottieni email e ruolo dell'utente
  SELECT u.email, p.role 
  INTO user_email, user_role
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE u.id = user_id;
  
  -- Verifica che sia l'admin autorizzato E abbia il ruolo admin
  RETURN user_email = 'marlon.lai@hotmail.com' AND user_role = 'admin';
END;
$$;

-- Aggiorna la funzione get_admin_stats per verificare l'email corretta
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
  user_email text;
BEGIN
  -- Verifica che l'utente sia l'admin autorizzato
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email != 'marlon.lai@hotmail.com' OR NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only marlon.lai@hotmail.com with admin role can access this function.';
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

-- Aggiorna la funzione get_user_management_data per verificare l'email corretta
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
  user_email text;
BEGIN
  -- Verifica che l'utente sia l'admin autorizzato
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  IF user_email != 'marlon.lai@hotmail.com' OR NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only marlon.lai@hotmail.com with admin role can access this function.';
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

-- Aggiorna le policy RLS per utilizzare la verifica email corretta
DROP POLICY IF EXISTS "Admin can access admin logs" ON admin_logs;
CREATE POLICY "Admin can access admin logs"
  ON admin_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND u.email = 'marlon.lai@hotmail.com'
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin and reporter can access reports" ON user_reports;
CREATE POLICY "Admin and reporter can access reports"
  ON user_reports
  FOR ALL
  TO authenticated
  USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND u.email = 'marlon.lai@hotmail.com'
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can access system logs" ON system_logs;
CREATE POLICY "Admin can access system logs"
  ON system_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND u.email = 'marlon.lai@hotmail.com'
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin can access stats cache" ON admin_stats_cache;
CREATE POLICY "Admin can access stats cache"
  ON admin_stats_cache
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND u.email = 'marlon.lai@hotmail.com'
      AND p.role = 'admin'
    )
  );

-- Aggiorna anche la policy sui profili per gli admin
DROP POLICY IF EXISTS "Admins can view all user profiles." ON profiles;
CREATE POLICY "Admins can view all user profiles."
  ON profiles
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND u.email = 'marlon.lai@hotmail.com'
      AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile, and admins can update any." ON profiles;
CREATE POLICY "Users can update their own profile, and admins can update any."
  ON profiles
  FOR UPDATE
  TO public
  USING (
    (auth.uid() = id) OR 
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid() 
      AND u.email = 'marlon.lai@hotmail.com'
      AND p.role = 'admin'
    )
  );

-- Inserisci un log di sistema per documentare il cambio
INSERT INTO system_logs (level, message, context) VALUES
('info', 'Admin email updated to marlon.lai@hotmail.com', '{"component": "admin_system", "action": "email_update"}');