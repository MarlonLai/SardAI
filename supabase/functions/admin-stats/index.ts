import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface StatsRequest {
  refresh?: boolean
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
      throw new Error('Access denied. Only marlon.lai@hotmail.com with admin role can access this function.')
    }

    // Parse request body
    const { refresh = false }: StatsRequest = await req.json()

    // Get admin stats using the database function
    const { data: stats, error: statsError } = await supabaseClient
      .rpc('get_admin_stats')

    if (statsError) throw statsError

    // Get additional data for dashboard
    const { data: activeUsersData, error: activeUsersError } = await supabaseClient
      .rpc('get_active_users_count', { days_back: 7 })

    const activeUsers = activeUsersError ? 0 : (activeUsersData || 0)

    // Get user growth data for chart (last 30 days)
    const { data: userGrowthData, error: userGrowthError } = await supabaseClient
      .rpc('get_user_growth_data', { days_back: 30 })

    const userGrowth = userGrowthError ? [] : (userGrowthData || [])

    // Get recent activity (last 10 admin actions)
    const { data: recentActivity, error: recentActivityError } = await supabaseClient
      .from('admin_logs')
      .select(`
        id,
        action,
        created_at,
        admin_id
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentActivityError) throw recentActivityError

    // Enrich recent activity with admin details
    const enrichedActivity = await Promise.all((recentActivity || []).map(async (activity) => {
      if (activity.admin_id) {
        const { data: adminUser } = await supabaseClient.auth.admin.getUserById(activity.admin_id)
        const { data: adminProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', activity.admin_id)
          .single()
        
        return {
          ...activity,
          admin_email: adminUser?.user?.email,
          admin_name: adminProfile?.full_name
        }
      }
      return activity
    }))

    const finalStats = {
      totalUsers: stats.total_users || 0,
      confirmedUsers: stats.confirmed_users || 0,
      unconfirmedUsers: stats.unconfirmed_users || 0,
      newUsers: stats.new_users_month || 0,
      premiumUsers: stats.premium_users || 0,
      activeUsers: activeUsers || 0,
      pendingReports: stats.pending_reports || 0,
      systemErrors: stats.recent_errors || 0,
      userGrowth: userGrowth,
      recentActivity: enrichedActivity,
      lastUpdated: stats.updated_at || new Date().toISOString()
    }

    // Log admin action
    await supabaseClient.rpc('log_admin_action', {
      action_type: 'stats_viewed',
      action_details: { refresh }
    })

    return new Response(
      JSON.stringify(finalStats),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Admin stats error:', error)
    const message = (error?.message && error.message.trim()) || 
                   (error && typeof error === 'object' ? JSON.stringify(error) : String(error)) || 
                   'Failed to fetch admin statistics'
    
    return new Response(
      JSON.stringify({
        error: message,
        fullError: error || 'No error details available'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})