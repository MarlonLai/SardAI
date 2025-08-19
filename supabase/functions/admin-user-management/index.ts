import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AdminActionRequest {
  action: 'list' | 'delete' | 'confirm' | 'resend_confirmation' | 'reset_password'
  userId?: string
  email?: string
  limit?: number
  offset?: number
  search?: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for admin operations
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

    // Verify the user is authenticated and get their profile
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Check if user is admin using service_role (server-side verification)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    // Server-side admin verification with service_role
    const adminEmails = ['marlon.lai@hotmail.com', 'riccardo.lai@example.com']
    const isAuthorizedAdmin = profile?.role === 'admin' && adminEmails.includes(user.email)
    
    if (profileError || !isAuthorizedAdmin) {
      throw new Error('Access denied. Only authorized administrators can perform this action.')
    }

    // Parse request body
    const { action, userId, email, limit = 50, offset = 0, search }: AdminActionRequest = await req.json()

    switch (action) {
      case 'list':
        // Get user management data using service_role for complete access
        const { data: userData, error: userError } = await supabaseClient
          .rpc('get_user_management_data', {
            limit_count: limit,
            offset_count: offset,
            search_term: search || null
          })

        if (userError) throw userError

        // Extract the users array from the result
        const result = userData?.[0] || { users: [], total: 0 }

        // Log admin action with service_role
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'user_list_viewed',
          admin_user_id: user.id,
          action_details: { search, limit, offset }
        })

        return new Response(
          JSON.stringify(result.users || []),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'delete':
        if (!userId) throw new Error('User ID required for delete action')

        // Use service_role for safe user deletion
        const { data: deleteResult, error: deleteError } = await supabaseClient
          .rpc('safe_delete_user', {
            target_user_id: userId,
            admin_user_id: user.id
          })

        if (deleteError) {
          console.error('Safe delete error:', deleteError)
          throw new Error(`Failed to delete user: ${deleteError.message}`)
        }

        // Delete from auth.users using service_role admin API
        const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId)
        if (authDeleteError) {
          console.error('Auth delete error:', authDeleteError)
          throw new Error(`Failed to delete auth user: ${authDeleteError.message}`)
        }

        // Log successful deletion
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'user_deleted',
          admin_user_id: user.id,
          target_user: userId,
          action_details: { 
            admin_email: user.email,
            deletion_method: 'service_role_admin_api'
          }
        })
        return new Response(
          JSON.stringify({ 
            message: 'User deleted successfully',
            result: deleteResult
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'confirm':
        if (!userId) throw new Error('User ID required for confirm action')

        // Confirm user email using service_role admin API
        const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { email_confirm: true }
        )
        if (confirmError) throw confirmError

        // Log admin action with service_role
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'user_confirmed',
          admin_user_id: user.id,
          target_user: userId,
          action_details: { admin_email: user.email }
        })

        return new Response(
          JSON.stringify({ message: 'User confirmed successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'resend_confirmation':
        if (!email) throw new Error('Email required for resend confirmation')

        // Resend confirmation email using service_role
        const { error: resendError } = await supabaseClient.auth.resend({
          type: 'signup',
          email: email
        })
        if (resendError) throw resendError

        // Log admin action with service_role
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'confirmation_resent',
          admin_user_id: user.id,
          action_details: { 
            target_email: email,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify({ message: 'Confirmation email resent successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'reset_password':
        if (!email) throw new Error('Email required for password reset')

        // Send password reset email using service_role
        const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email)
        if (resetError) throw resetError

        // Log admin action with service_role
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'password_reset_sent',
          admin_user_id: user.id,
          action_details: { 
            target_email: email,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify({ message: 'Password reset email sent successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin function error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})