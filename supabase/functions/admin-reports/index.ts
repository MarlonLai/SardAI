import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.')
    }

    // Parse request body
    const { action, reportId, status, notes, limit = 50, offset = 0 }: ReportActionRequest = await req.json()

    switch (action) {
      case 'list':
        // Get reports with user details
        const { data: reports, error: reportsError } = await supabaseClient
          .from('user_reports')
          .select(`
            *,
            reporter:reporter_id(id, email, full_name),
            reported_user:reported_user_id(id, email, full_name),
            resolver:resolved_by(id, email, full_name)
          `)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (reportsError) throw reportsError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'reports_viewed',
          action_details: { limit, offset }
        })

        return new Response(
          JSON.stringify(reports || []),
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