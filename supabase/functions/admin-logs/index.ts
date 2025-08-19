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
  adminEmail: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with SERVICE ROLE ONLY
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { type, limit = 100, offset = 0, level, search, adminEmail }: LogsRequest = await req.json()

    if (!adminEmail) {
      throw new Error('Admin email is required')
    }

    // SERVER-SIDE ADMIN VERIFICATION - Only check for authorized admins
    const authorizedAdmins = ['marlon.lai@hotmail.com', 'riccardo.lai@example.com']
    if (!authorizedAdmins.includes(adminEmail)) {
      throw new Error('Access denied. Only authorized administrators can access logs.')
    }

    // Get admin user for logging
    const { data: adminUsers } = await supabaseClient.auth.admin.listUsers()
    const adminUser = adminUsers.users.find(u => u.email === adminEmail)

    if (type === 'admin') {
      // Get admin logs using SERVICE ROLE
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

      // Manually fetch admin and target user details using SERVICE ROLE
      const enrichedLogs = await Promise.all((adminLogs || []).map(async (log) => {
        const enrichedLog = { ...log }

        // Get admin details
        if (log.admin_id) {
          const { data: adminUserData } = await supabaseClient.auth.admin.getUserById(log.admin_id)
          const { data: adminProfile } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', log.admin_id)
            .single()
          
          enrichedLog.admin = {
            email: adminUserData?.user?.email,
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
      // Get system logs using SERVICE ROLE
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

      // Manually fetch user details using SERVICE ROLE
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