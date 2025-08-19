import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface StatsRequest {
  refresh?: boolean
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
    const { refresh = false, adminEmail }: StatsRequest = await req.json()

    if (!adminEmail) {
      throw new Error('Admin email is required')
    }

    // SERVER-SIDE ADMIN VERIFICATION - Only check for super admin
    if (adminEmail !== 'marlon.lai@hotmail.com') {
      throw new Error('Access denied. Only marlon.lai@hotmail.com can access admin statistics.')
    }

    // Get admin user for logging
    const { data: adminUsers } = await supabaseClient.auth.admin.listUsers()
    const adminUser = adminUsers.users.find(u => u.email === adminEmail)

    // Get stats using SERVICE ROLE - direct database access
    const { data: stats, error: statsError } = await supabaseClient
      .rpc('get_admin_stats')

    if (statsError) throw statsError

    // Get additional data using SERVICE ROLE
    const { data: activeUsersData, error: activeUsersError } = await supabaseClient
      .rpc('get_active_users_count', { days_back: 7 })

    const activeUsers = activeUsersError ? 0 : (activeUsersData || 0)

    // Get user growth data using SERVICE ROLE
    const { data: userGrowthData, error: userGrowthError } = await supabaseClient
      .rpc('get_user_growth_data', { days_back: 30 })

    const userGrowth = userGrowthError ? [] : (userGrowthData || [])

    // Get recent activity using SERVICE ROLE
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

    // Enrich recent activity with admin details using SERVICE ROLE
    const enrichedActivity = await Promise.all((recentActivity || []).map(async (activity) => {
      if (activity.admin_id) {
        const { data: adminUserData } = await supabaseClient.auth.admin.getUserById(activity.admin_id)
        const { data: adminProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', activity.admin_id)
          .single()
        
        return {
          ...activity,
          admin_email: adminUserData?.user?.email,
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

    // Log admin action using SERVICE ROLE
    if (adminUser) {
      await supabaseClient
        .from('admin_logs')
        .insert({
          admin_id: adminUser.id,
          action: 'stats_viewed',
          details: { refresh },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          user_agent: req.headers.get('user-agent')
        })
    }

    return new Response(
      JSON.stringify(finalStats),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Admin stats error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})