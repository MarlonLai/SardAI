/*
  # Email Templates Configuration

  1. Configuration Updates
    - Set proper sender information for SardAI
    - Configure custom email templates
    - Update redirect URLs for production
    
  2. Email Templates
    - Custom confirmation email template
    - Custom recovery email template
    - Branded design with SardAI styling
    
  3. Sender Configuration
    - Set sender name to "SardAI Team"
    - Configure proper reply-to address
    - Set branded email styling
*/

-- Update auth configuration for custom email templates
UPDATE auth.config 
SET 
  site_url = 'https://sardai.tech',
  email_from = 'SardAI Team <noreply@sardai.tech>',
  email_reply_to = 'info@sardai.tech'
WHERE true;

-- Insert or update email templates
INSERT INTO auth.email_templates (template_name, subject, body_html, body_text)
VALUES 
(
  'confirmation',
  'Conferma il tuo account SardAI 🏝️',
  '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conferma Account - SardAI</title>
    <style>
        body { 
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0; 
            padding: 20px; 
            color: #ffffff;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .logo { 
            width: 60px; 
            height: 60px; 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
            border-radius: 12px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 20px;
            font-size: 24px;
        }
        .title { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: bold; 
            margin: 0; 
        }
        .subtitle { 
            color: #cbd5e1; 
            font-size: 16px; 
            margin: 10px 0 0 0; 
        }
        .content { 
            color: #e2e8f0; 
            line-height: 1.6; 
            margin-bottom: 30px; 
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 12px; 
            font-weight: bold; 
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .footer { 
            text-align: center; 
            color: #94a3b8; 
            font-size: 14px; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid rgba(148, 163, 184, 0.2);
        }
        .warning {
            background: rgba(251, 146, 60, 0.1);
            border: 1px solid rgba(251, 146, 60, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #fed7aa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">✨</div>
            <h1 class="title">Benvenuto in SardAI!</h1>
            <p class="subtitle">Conferma il tuo account per iniziare</p>
        </div>
        
        <div class="content">
            <p>Ciao!</p>
            <p>Grazie per esserti registrato a <strong>SardAI</strong>, l''assistente virtuale che parla più di tua nonna! 😄</p>
            <p>Per completare la registrazione e iniziare a conversare con il tuo assistente sardo preferito, clicca sul pulsante qui sotto:</p>
        </div>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">
                🏝️ Conferma il Mio Account
            </a>
        </div>
        
        <div class="warning">
            <strong>⚠️ Importante:</strong> Questo link scadrà tra 24 ore. Se non confermi entro questo tempo, dovrai registrarti nuovamente.
        </div>
        
        <div class="content">
            <p>Se non riesci a cliccare il pulsante, copia e incolla questo link nel tuo browser:</p>
            <p style="word-break: break-all; color: #60a5fa;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p><strong>SardAI Team</strong></p>
            <p>L''assistente AI con personalità sarda autentica</p>
            <p>🌐 <a href="https://sardai.tech" style="color: #60a5fa;">sardai.tech</a> | 📧 <a href="mailto:info@sardai.tech" style="color: #60a5fa;">info@sardai.tech</a></p>
            <p style="margin-top: 20px; font-size: 12px;">
                Se non hai richiesto questa registrazione, puoi ignorare questa email.
            </p>
        </div>
    </div>
</body>
</html>',
  'Ciao!

Grazie per esserti registrato a SardAI, l''assistente virtuale che parla più di tua nonna! 😄

Per completare la registrazione, clicca su questo link:
{{ .ConfirmationURL }}

Questo link scadrà tra 24 ore.

Se non riesci a cliccare il link, copialo e incollalo nel tuo browser.

---
SardAI Team
L''assistente AI con personalità sarda autentica
🌐 sardai.tech | 📧 info@sardai.tech

Se non hai richiesto questa registrazione, puoi ignorare questa email.'
),
(
  'recovery',
  'Reimposta la tua password SardAI 🔑',
  '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - SardAI</title>
    <style>
        body { 
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0; 
            padding: 20px; 
            color: #ffffff;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%);
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .logo { 
            width: 60px; 
            height: 60px; 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
            border-radius: 12px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 20px;
            font-size: 24px;
        }
        .title { 
            color: #ffffff; 
            font-size: 28px; 
            font-weight: bold; 
            margin: 0; 
        }
        .subtitle { 
            color: #cbd5e1; 
            font-size: 16px; 
            margin: 10px 0 0 0; 
        }
        .content { 
            color: #e2e8f0; 
            line-height: 1.6; 
            margin-bottom: 30px; 
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
            color: white; 
            text-decoration: none; 
            padding: 16px 32px; 
            border-radius: 12px; 
            font-weight: bold; 
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .footer { 
            text-align: center; 
            color: #94a3b8; 
            font-size: 14px; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid rgba(148, 163, 184, 0.2);
        }
        .warning {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #fecaca;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔑</div>
            <h1 class="title">Reset Password</h1>
            <p class="subtitle">Reimposta la tua password SardAI</p>
        </div>
        
        <div class="content">
            <p>Ciao!</p>
            <p>Hai richiesto di reimpostare la password per il tuo account <strong>SardAI</strong>.</p>
            <p>Clicca sul pulsante qui sotto per creare una nuova password:</p>
        </div>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="button">
                🔑 Reimposta Password
            </a>
        </div>
        
        <div class="warning">
            <strong>🔒 Sicurezza:</strong> Questo link scadrà tra 1 ora per motivi di sicurezza. Se non lo usi entro questo tempo, dovrai richiedere un nuovo reset.
        </div>
        
        <div class="content">
            <p>Se non riesci a cliccare il pulsante, copia e incolla questo link nel tuo browser:</p>
            <p style="word-break: break-all; color: #60a5fa;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p><strong>SardAI Team</strong></p>
            <p>L''assistente AI con personalità sarda autentica</p>
            <p>🌐 <a href="https://sardai.tech" style="color: #60a5fa;">sardai.tech</a> | 📧 <a href="mailto:info@sardai.tech" style="color: #60a5fa;">info@sardai.tech</a></p>
            <p style="margin-top: 20px; font-size: 12px;">
                Se non hai richiesto questo reset, puoi ignorare questa email. La tua password rimarrà invariata.
            </p>
        </div>
    </div>
</body>
</html>',
  'Ciao!

Hai richiesto di reimpostare la password per il tuo account SardAI.

Clicca su questo link per creare una nuova password:
{{ .ConfirmationURL }}

Questo link scadrà tra 1 ora per motivi di sicurezza.

Se non riesci a cliccare il link, copialo e incollalo nel tuo browser.

---
SardAI Team
L''assistente AI con personalità sarda autentica
🌐 sardai.tech | 📧 info@sardai.tech

Se non hai richiesto questo reset, puoi ignorare questa email. La tua password rimarrà invariata.'
)
ON CONFLICT (template_name) 
DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  updated_at = now();

-- Update site configuration
UPDATE auth.config SET
  site_url = 'https://sardai.tech',
  uri_allow_list = 'https://sardai.tech,https://sardai.tech/**,http://localhost:*,https://*.netlify.app'
WHERE true;

-- Create function to send custom branded emails
CREATE OR REPLACE FUNCTION send_custom_email(
  email_type text,
  user_email text,
  confirmation_url text DEFAULT NULL,
  user_data jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record record;
  email_subject text;
  email_body_html text;
  email_body_text text;
  result json;
BEGIN
  -- Get email template
  SELECT subject, body_html, body_text 
  INTO template_record
  FROM auth.email_templates 
  WHERE template_name = email_type;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Email template not found: %', email_type;
  END IF;
  
  -- Replace placeholders in subject
  email_subject := template_record.subject;
  
  -- Replace placeholders in HTML body
  email_body_html := template_record.body_html;
  IF confirmation_url IS NOT NULL THEN
    email_body_html := replace(email_body_html, '{{ .ConfirmationURL }}', confirmation_url);
  END IF;
  
  -- Replace placeholders in text body
  email_body_text := template_record.body_text;
  IF confirmation_url IS NOT NULL THEN
    email_body_text := replace(email_body_text, '{{ .ConfirmationURL }}', confirmation_url);
  END IF;
  
  -- Log email sending attempt
  INSERT INTO system_logs (level, message, context)
  VALUES (
    'info',
    'Custom email sent',
    jsonb_build_object(
      'email_type', email_type,
      'recipient', user_email,
      'has_confirmation_url', confirmation_url IS NOT NULL
    )
  );
  
  -- Return email data (in production, this would integrate with actual email service)
  result := jsonb_build_object(
    'success', true,
    'email_type', email_type,
    'recipient', user_email,
    'subject', email_subject,
    'message', 'Email template prepared successfully'
  );
  
  RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION send_custom_email TO authenticated;
GRANT EXECUTE ON FUNCTION send_custom_email TO service_role;

-- Create email configuration table for additional settings
CREATE TABLE IF NOT EXISTS email_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert email configuration settings
INSERT INTO email_config (setting_name, setting_value, description)
VALUES 
  ('sender_name', 'SardAI Team', 'Display name for outgoing emails'),
  ('sender_email', 'noreply@sardai.tech', 'From email address'),
  ('reply_to_email', 'info@sardai.tech', 'Reply-to email address'),
  ('support_email', 'info@sardai.tech', 'Support contact email'),
  ('site_name', 'SardAI', 'Application name'),
  ('site_url', 'https://sardai.tech', 'Main site URL'),
  ('confirmation_url_template', 'https://sardai.tech/auth/confirm?token_hash={token}&type={type}', 'Template for confirmation URLs'),
  ('recovery_url_template', 'https://sardai.tech/auth/reset-password?token_hash={token}', 'Template for recovery URLs')
ON CONFLICT (setting_name) 
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- Enable RLS on email_config
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- Create policy for email_config (admin only)
CREATE POLICY "Admin can manage email config"
  ON email_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_email_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_config_updated_at
  BEFORE UPDATE ON email_config
  FOR EACH ROW
  EXECUTE FUNCTION update_email_config_updated_at();