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

    // Check cache first (unless refresh is requested)
    if (!refresh) {
      const { data: cachedStats, error: cacheError } = await supabaseClient
        .from('admin_stats_cache')
        .select('data, expires_at')
        .eq('stat_type', 'dashboard_stats')
        .single()

      if (!cacheError && cachedStats && new Date(cachedStats.expires_at) > new Date()) {
        return new Response(
          JSON.stringify(cachedStats.data),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    // Calculate fresh stats
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get total users count
    const { count: totalUsers, error: totalUsersError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (totalUsersError) throw totalUsersError

    // Get new users in last 30 days
    const { count: newUsers, error: newUsersError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (newUsersError) throw newUsersError

    // Get premium users count
    const { count: premiumUsers, error: premiumUsersError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_premium', true)

    if (premiumUsersError) throw premiumUsersError

    // Get active users (users who signed in within last 7 days)
    const { data: activeUsersData, error: activeUsersError } = await supabaseClient
      .rpc('get_active_users_count', { days_back: 7 })

    const activeUsers = activeUsersError ? 0 : (activeUsersData || 0)

    // Get pending reports count
    const { count: pendingReports, error: pendingReportsError } = await supabaseClient
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingReportsError) throw pendingReportsError

    // Get system errors in last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const { count: systemErrors, error: systemErrorsError } = await supabaseClient
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('level', 'error')
      .gte('created_at', twentyFourHoursAgo.toISOString())

    if (systemErrorsError) throw systemErrorsError

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

    const stats = {
      totalUsers: totalUsers || 0,
      newUsers: newUsers || 0,
      premiumUsers: premiumUsers || 0,
      activeUsers: activeUsers || 0,
      pendingReports: pendingReports || 0,
      systemErrors: systemErrors || 0,
      userGrowth: userGrowth,
      recentActivity: enrichedActivity,
      lastUpdated: now.toISOString()
    }

    // Cache the stats (expires in 5 minutes)
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000)
    await supabaseClient
      .from('admin_stats_cache')
      .upsert({
        stat_type: 'dashboard_stats',
        data: stats,
        expires_at: expiresAt.toISOString()
      })

    // Log admin action
    await supabaseClient.rpc('log_admin_action', {
      action_type: 'stats_viewed',
      action_details: { refresh }
    })

    return new Response(
      JSON.stringify(stats),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const message = error?.message || JSON.stringify(error) || 'Unknown error'
    console.error('Admin stats error:', error)
    
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})