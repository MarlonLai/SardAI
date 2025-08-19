import { createClient } from 'npm:@supabase/supabase-js@2'

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

Deno.serve(async (req: Request) => {
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
      const adminEmails = ['marlon.lai@hotmail.com', 'riccardo.lai@example.com']
      if (profileError || profile?.role !== 'admin' || !adminEmails.includes(user.email)) {
        throw new Error('Access denied. Only authorized admins can access this function.')
      }
    }

    // Parse request body
    const { type, limit = 100, offset = 0, level, search }: LogsRequest = await req.json()

    if (type === 'admin') {
      // Get admin logs with manual joins
      let query = supabaseClient
        .from('admin_logs')
        .select(`
          id,
          admin_id,
          action,
          target_user_id,
          details,
          ip_address,
          user_agent,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`action.ilike.%${search}%,details->>description.ilike.%${search}%`)
      }

      const { data: adminLogs, error: adminLogsError } = await query

      if (adminLogsError) throw adminLogsError

      // Manually fetch admin and target user details
      const enrichedLogs = await Promise.all((adminLogs || []).map(async (log) => {
        const enrichedLog = { ...log }

        // Get admin details
        if (log.admin_id) {
          const { data: adminUser } = await supabaseClient.auth.admin.getUserById(log.admin_id)
          const { data: adminProfile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', log.admin_id)
            .single()
          
          enrichedLog.admin = {
            email: adminUser?.user?.email,
            full_name: adminProfile?.full_name
          }
        }

        // Get target user details
        if (log.target_user_id) {
          const { data: targetUser } = await supabaseClient.auth.admin.getUserById(log.target_user_id)
          const { data: targetProfile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', log.target_user_id)
            .single()
          
          enrichedLog.target_user = {
            email: targetUser?.user?.email,
            full_name: targetProfile?.full_name
          }
        }

        return enrichedLog
      }))

      return new Response(
        JSON.stringify(enrichedLogs),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )

    } else if (type === 'system') {
      // Get system logs with manual joins
      let query = supabaseClient
        .from('system_logs')
        .select(`
          id,
          level,
          message,
          context,
          user_id,
          created_at
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

      // Manually fetch user details
      const enrichedLogs = await Promise.all((systemLogs || []).map(async (log) => {
        const enrichedLog = { ...log }

        // Get user details
        if (log.user_id) {
          const { data: logUser } = await supabaseClient.auth.admin.getUserById(log.user_id)
          const { data: userProfile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', log.user_id)
            .single()
          
          enrichedLog.user = {
            email: logUser?.user?.email,
            full_name: userProfile?.full_name
          }
        }

        return enrichedLog
      }))

      return new Response(
        JSON.stringify(enrichedLogs),
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