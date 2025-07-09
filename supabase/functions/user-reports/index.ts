import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReportRequest {
  action: 'create' | 'list_my_reports'
  reportedUserId?: string
  reportType?: 'spam' | 'abuse' | 'inappropriate' | 'other'
  description?: string
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

    // Parse request body
    const { action, reportedUserId, reportType, description }: ReportRequest = await req.json()

    switch (action) {
      case 'create':
        if (!reportedUserId || !reportType) {
          throw new Error('Reported user ID and report type are required')
        }

        // Prevent self-reporting
        if (reportedUserId === user.id) {
          throw new Error('Cannot report yourself')
        }

        // Create report using database function
        const { data: reportId, error: createError } = await supabaseClient
          .rpc('create_user_report', {
            reported_user_id: reportedUserId,
            report_type: reportType,
            description: description || null
          })

        if (createError) throw createError

        return new Response(
          JSON.stringify({ 
            message: 'Report created successfully',
            report_id: reportId
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'list_my_reports':
        // Get user's reports
        const { data: myReports, error: reportsError } = await supabaseClient
          .from('user_reports')
          .select(`
            *,
            reported_user:reported_user_id(id, full_name, email)
          `)
          .eq('reporter_id', user.id)
          .order('created_at', { ascending: false })

        if (reportsError) throw reportsError

        return new Response(
          JSON.stringify(myReports || []),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('User reports function error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})