import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface LogsRequest {
  type: 'admin' | 'system'
  limit?: number
  offset?: number
  level?: string
  search?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin' || user.email !== 'marlon.lai@hotmail.com') {
      throw new Error('Access denied. Only marlon.lai@hotmail.com with admin role can access this function.')
    }

    // Parse request body
    const { type, limit = 100, offset = 0, level, search }: LogsRequest = await req.json()

    if (type === 'admin') {
      // Get admin logs
      let query = supabaseClient
        .from('admin_logs')
        .select(`
          *,
          admin:admin_id(email, full_name),
          target_user:target_user_id(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`action.ilike.%${search}%,details->>description.ilike.%${search}%`)
      }

      const { data: adminLogs, error: adminLogsError } = await query

      if (adminLogsError) throw adminLogsError

      return new Response(
        JSON.stringify(adminLogs || []),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } else if (type === 'system') {
      // Get system logs
      let query = supabaseClient
        .from('system_logs')
        .select(`
          *,
          user:user_id(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (level) {
        query = query.eq('level', level)
      }

      if (search) {
        query = query.or(`message.ilike.%${search}%,context->>component.ilike.%${search}%`)
      }

      const { data: systemLogs, error: systemLogsError } = await query

      if (systemLogsError) throw systemLogsError

      return new Response(
        JSON.stringify(systemLogs || []),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    throw new Error('Invalid log type')

  } catch (error) {
    console.error('Admin logs error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})