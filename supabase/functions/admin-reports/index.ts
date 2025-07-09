import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReportActionRequest {
  action: 'list' | 'update_status' | 'add_notes'
  reportId?: string
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  notes?: string
  limit?: number
  offset?: number
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
    const { action, reportId, status, notes, limit = 50, offset = 0 }: ReportActionRequest = await req.json()

    switch (action) {
      case 'list':
        // Get reports without automatic joins
        const { data: reports, error: reportsError } = await supabaseClient
          .from('user_reports')
          .select(`
            id,
            reporter_id,
            reported_user_id,
            report_type,
            description,
            status,
            admin_notes,
            resolved_by,
            resolved_at,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (reportsError) throw reportsError

        // Manually fetch user details for each report
        const enrichedReports = await Promise.all((reports || []).map(async (report) => {
          const enrichedReport = { ...report }

          // Get reporter details
          if (report.reporter_id) {
            const { data: reporterUser } = await supabaseClient.auth.admin.getUserById(report.reporter_id)
            const { data: reporterProfile } = await supabaseClient
              .from('profiles')
              .select('full_name')
              .eq('id', report.reporter_id)
              .single()
            
            enrichedReport.reporter = {
              id: report.reporter_id,
              email: reporterUser?.user?.email,
              full_name: reporterProfile?.full_name
            }
          }

          // Get reported user details
          if (report.reported_user_id) {
            const { data: reportedUser } = await supabaseClient.auth.admin.getUserById(report.reported_user_id)
            const { data: reportedProfile } = await supabaseClient
              .from('profiles')
              .select('full_name')
              .eq('id', report.reported_user_id)
              .single()
            
            enrichedReport.reported_user = {
              id: report.reported_user_id,
              email: reportedUser?.user?.email,
              full_name: reportedProfile?.full_name
            }
          }

          // Get resolver details
          if (report.resolved_by) {
            const { data: resolverUser } = await supabaseClient.auth.admin.getUserById(report.resolved_by)
            const { data: resolverProfile } = await supabaseClient
              .from('profiles')
              .select('full_name')
              .eq('id', report.resolved_by)
              .single()
            
            enrichedReport.resolver = {
              id: report.resolved_by,
              email: resolverUser?.user?.email,
              full_name: resolverProfile?.full_name
            }
          }

          return enrichedReport
        }))

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'reports_viewed',
          action_details: { limit, offset }
        })

        return new Response(
          JSON.stringify(enrichedReports),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'update_status':
        if (!reportId || !status) throw new Error('Report ID and status required')

        // Update report status
        const { data: updatedReport, error: updateError } = await supabaseClient
          .from('user_reports')
          .update({
            status,
            resolved_by: status === 'resolved' ? user.id : null,
            resolved_at: status === 'resolved' ? new Date().toISOString() : null,
            admin_notes: notes || null
          })
          .eq('id', reportId)
          .select()
          .single()

        if (updateError) throw updateError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'report_status_updated',
          action_details: { 
            report_id: reportId,
            new_status: status,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify({ message: 'Report status updated successfully', report: updatedReport }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'add_notes':
        if (!reportId || !notes) throw new Error('Report ID and notes required')

        // Add admin notes to report
        const { data: notedReport, error: notesError } = await supabaseClient
          .from('user_reports')
          .update({ admin_notes: notes })
          .eq('id', reportId)
          .select()
          .single()

        if (notesError) throw notesError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'report_notes_added',
          action_details: { 
            report_id: reportId,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify({ message: 'Notes added successfully', report: notedReport }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin reports error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})