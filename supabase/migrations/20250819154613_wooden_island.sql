/*
  # Update Email Templates with Correct Sender Information

  1. Configuration Updates
    - Update sender email to info@sardai.tech
    - Update sender name to "SardAI Team"
    - Configure SMTP settings for Hostinger
    - Set proper redirect URLs

  2. Template Updates
    - Update all email templates with correct branding
    - Use info@sardai.tech as contact email
    - Maintain SardAI visual identity
    - Add proper footer information

  3. Security
    - Maintain RLS policies
    - Keep admin-only access to configurations
*/

-- Update email configuration with Hostinger SMTP settings
UPDATE email_config 
SET config_value = jsonb_build_object(
  'sender_email', 'info@sardai.tech',
  'sender_name', 'SardAI Team',
  'reply_to', 'info@sardai.tech',
  'site_url', 'https://sardai.tech',
  'smtp_host', 'smtp.hostinger.com',
  'smtp_port', 465,
  'smtp_username', 'info@sardai.tech',
  'smtp_ssl', true,
  'rate_limit_seconds', 120
)
WHERE config_key = 'smtp_settings';

-- Update confirmation email template
UPDATE email_config 
SET config_value = jsonb_build_object(
  'subject', 'Benvenuto in SardAI! Conferma il tuo account 🎉',
  'html_template', '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conferma Account - SardAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); border-radius: 20px; margin-bottom: 20px;">
                <span style="font-size: 40px;">✨</span>
            </div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; background-clip: text; color: transparent;">SardAI</h1>
        </div>

        <!-- Main Content -->
        <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 600; color: #ffffff;">Benvenuto in SardAI! 👋</h2>
            
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #cbd5e1; line-height: 1.6;">
                Ciao! Siamo felicissimi che tu abbia scelto di unirti alla famiglia SardAI. 
                Per completare la registrazione, conferma il tuo indirizzo email cliccando il pulsante qui sotto.
            </p>

            <div style="margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);">
                    ✅ Conferma il Mio Account
                </a>
            </div>

            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #94a3b8;">
                    <strong>⏰ Importante:</strong> Questo link scadrà tra 24 ore per motivi di sicurezza.
                </p>
            </div>

            <p style="margin: 20px 0 0 0; font-size: 14px; color: #64748b;">
                Se non hai creato un account SardAI, puoi ignorare questa email.
            </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Fatto con ❤️ in Sardegna
            </p>
            <p style="margin: 0; font-size: 12px; color: #475569;">
                SardAI © 2025 | <a href="https://sardai.tech" style="color: #3b82f6; text-decoration: none;">sardai.tech</a> | 
                <a href="mailto:info@sardai.tech" style="color: #3b82f6; text-decoration: none;">info@sardai.tech</a>
            </p>
        </div>
    </div>
</body>
</html>',
  'text_template', 'Benvenuto in SardAI!

Ciao! Siamo felicissimi che tu abbia scelto di unirti alla famiglia SardAI.

Per completare la registrazione, conferma il tuo indirizzo email visitando questo link:
{{ .ConfirmationURL }}

IMPORTANTE: Questo link scadrà tra 24 ore per motivi di sicurezza.

Se non hai creato un account SardAI, puoi ignorare questa email.

Fatto con ❤️ in Sardegna
SardAI © 2025 | https://sardai.tech | info@sardai.tech'
)
WHERE config_key = 'confirmation_email_template';

-- Update recovery email template
UPDATE email_config 
SET config_value = jsonb_build_object(
  'subject', 'Reset della Password - SardAI 🔑',
  'html_template', '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - SardAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); border-radius: 20px; margin-bottom: 20px;">
                <span style="font-size: 40px;">🔑</span>
            </div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; background-clip: text; color: transparent;">SardAI</h1>
        </div>

        <!-- Main Content -->
        <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 600; color: #ffffff;">Reset della Password 🔐</h2>
            
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #cbd5e1; line-height: 1.6;">
                Hai richiesto di reimpostare la password per il tuo account SardAI. 
                Clicca il pulsante qui sotto per creare una nuova password sicura.
            </p>

            <div style="margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);">
                    🔑 Reimposta Password
                </a>
            </div>

            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #fca5a5;">
                    <strong>⚠️ Sicurezza:</strong> Questo link scadrà tra 1 ora. Se non hai richiesto questo reset, ignora questa email.
                </p>
            </div>

            <p style="margin: 20px 0 0 0; font-size: 14px; color: #64748b;">
                Per la tua sicurezza, non condividere mai questo link con nessuno.
            </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                Fatto con ❤️ in Sardegna
            </p>
            <p style="margin: 0; font-size: 12px; color: #475569;">
                SardAI © 2025 | <a href="https://sardai.tech" style="color: #3b82f6; text-decoration: none;">sardai.tech</a> | 
                <a href="mailto:info@sardai.tech" style="color: #3b82f6; text-decoration: none;">info@sardai.tech</a>
            </p>
        </div>
    </div>
</body>
</html>',
  'text_template', 'Reset della Password - SardAI

Hai richiesto di reimpostare la password per il tuo account SardAI.

Per creare una nuova password sicura, visita questo link:
{{ .ConfirmationURL }}

SICUREZZA: Questo link scadrà tra 1 ora. Se non hai richiesto questo reset, ignora questa email.

Per la tua sicurezza, non condividere mai questo link con nessuno.

Fatto con ❤️ in Sardegna
SardAI © 2025 | https://sardai.tech | info@sardai.tech'
)
WHERE config_key = 'recovery_email_template';

-- Insert magic link template if not exists
INSERT INTO email_config (config_key, config_value) 
VALUES (
  'magic_link_template',
  jsonb_build_object(
    'subject', 'Il tuo link di accesso SardAI ✨',
    'html_template', '<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Magic Link - SardAI</title>
</head>
<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); border-radius: 20px; margin-bottom: 20px;">
                <span style="font-size: 40px;">✨</span>
            </div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); -webkit-background-clip: text; background-clip: text; color: transparent;">SardAI</h1>
        </div>
        <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px; padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 600; color: #ffffff;">Accesso Rapido 🚀</h2>
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #cbd5e1; line-height: 1.6;">
                Ecco il tuo link magico per accedere a SardAI senza password!
            </p>
            <div style="margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 18px;">
                    ✨ Accedi a SardAI
                </a>
            </div>
        </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <p style="margin: 0; font-size: 12px; color: #475569;">
                SardAI © 2025 | <a href="mailto:info@sardai.tech" style="color: #3b82f6;">info@sardai.tech</a>
            </p>
        </div>
    </div>
</body>
</html>',
    'text_template', 'Accesso Rapido - SardAI

Ecco il tuo link magico per accedere a SardAI senza password:
{{ .ConfirmationURL }}

Questo link scadrà tra 1 ora per motivi di sicurezza.

SardAI © 2025 | https://sardai.tech | info@sardai.tech'
  )
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  updated_at = now();