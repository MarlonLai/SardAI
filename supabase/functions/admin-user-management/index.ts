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
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin' || user.email !== 'marlon.lai@hotmail.com') {
      const adminEmails = ['marlon.lai@hotmail.com', 'riccardo.lai@example.com']
      if (profileError || profile?.role !== 'admin' || !adminEmails.includes(user.email)) {
        throw new Error('Access denied. Only authorized admins can access this function.')
      }
    }

    // Parse request body
    const { action, userId, email, limit = 50, offset = 0, search }: AdminActionRequest = await req.json()

    switch (action) {
      case 'list':
        // Get user management data using the fixed function
        const { data: userData, error: userError } = await supabaseClient
          .rpc('get_user_management_data', {
            limit_count: limit,
            offset_count: offset,
            search_term: search || null
          })

        if (userError) throw userError

        // Extract the users array from the result
        const result = userData?.[0] || { users: [], total: 0 }

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'user_list_viewed',
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

        // Get user info before deletion for logging
        const { data: userToDelete } = await supabaseClient.auth.admin.getUserById(userId)
        
        // Delete user
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'user_deleted',
          target_user: userId,
          action_details: { 
            deleted_email: userToDelete?.user?.email,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify({ message: 'User deleted successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'confirm':
        if (!userId) throw new Error('User ID required for confirm action')

        // Confirm user email
        const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { email_confirm: true }
        )
        if (confirmError) throw confirmError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'user_confirmed',
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

        // Resend confirmation email
        const { error: resendError } = await supabaseClient.auth.resend({
          type: 'signup',
          email: email
        })
        if (resendError) throw resendError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'confirmation_resent',
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

        // Send password reset email
        const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email)
        if (resetError) throw resetError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'password_reset_sent',
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