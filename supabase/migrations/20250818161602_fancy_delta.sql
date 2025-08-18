/*
  # Fix Email Templates Configuration

  1. Email Template Updates
    - Update confirmation email template with correct sender
    - Update recovery email template with correct sender
    - Use proper Supabase auth configuration methods

  2. Notes
    - Removes dependency on auth.config table which may not exist
    - Uses standard Supabase email template configuration
    - Compatible with custom SMTP settings
*/

-- Note: Email templates are typically configured through the Supabase Dashboard
-- under Authentication > Email Templates, not through SQL migrations.
-- 
-- The auth.config table is not available in all Supabase instances.
-- Email template customization should be done through the dashboard:
-- 1. Go to Authentication > Email Templates
-- 2. Customize the "Confirm signup" template
-- 3. Customize the "Reset password" template
-- 4. Set sender email to: info@sardai.tech
-- 5. Set sender name to: SardAI

-- This migration serves as documentation for the required email template configuration
-- but does not attempt to modify system tables that may not be accessible.

-- Log that email templates should be configured manually
INSERT INTO system_logs (level, message, context) 
VALUES (
  'info', 
  'Email templates configuration required',
  jsonb_build_object(
    'action', 'email_templates_setup',
    'sender_email', 'info@sardai.tech',
    'sender_name', 'SardAI',
    'note', 'Configure email templates through Supabase Dashboard'
  )
);