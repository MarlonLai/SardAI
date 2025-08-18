/*
  # Update email templates for production

  1. Email Templates
    - Update confirmation email template
    - Update recovery email template
    - Use proper sender information

  2. Configuration
    - Set proper redirect URLs
    - Configure sender details
*/

-- This migration updates email template configurations
-- Note: Email templates are typically configured through the Supabase dashboard
-- but we can set some default configurations here

-- Update auth configuration for production
UPDATE auth.config 
SET 
  site_url = 'https://sardai.tech',
  uri_allow_list = 'https://sardai.tech,https://sardai.tech/auth/confirm,https://sardai.tech/auth/callback,https://sardai.tech/dashboard'
WHERE TRUE;

-- Ensure proper email rate limiting
INSERT INTO auth.config (parameter, value) 
VALUES ('email_rate_limit', '60')
ON CONFLICT (parameter) 
DO UPDATE SET value = EXCLUDED.value;

-- Set email confirmation template variables
INSERT INTO auth.config (parameter, value) 
VALUES ('email_confirm_template', 'confirmation')
ON CONFLICT (parameter) 
DO UPDATE SET value = EXCLUDED.value;