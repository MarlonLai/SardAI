import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwswkexklduofykaucql.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3c3drZXhrbGR1b2Z5a2F1Y3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNzI0NjAsImV4cCI6MjA2NzY0ODQ2MH0.C0oHcfcYLpyeR9AQqj6zW-ZDXuco6A1RkmBzE-2sffg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);