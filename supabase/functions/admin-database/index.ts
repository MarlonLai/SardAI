import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DatabaseActionRequest {
  action: 'list_auth_users' | 'create_auth_user' | 'delete_auth_user' | 'update_auth_user' | 'get_system_stats'
  userId?: string
  email?: string
  password?: string
  full_name?: string
  updates?: Record<string, any>
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
    const { action, userId, email, password, full_name, updates }: DatabaseActionRequest = await req.json()

    switch (action) {
      case 'list_auth_users':
        // Get all auth users
        const { data: authUsers, error: authUsersError } = await supabaseClient.auth.admin.listUsers()
        
        if (authUsersError) throw authUsersError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_users_viewed',
          action_details: { admin_email: user.email }
        })

        return new Response(
          JSON.stringify(authUsers.users || []),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'create_auth_user':
        if (!email || !full_name) throw new Error('Email and full name are required')

        // Create auth user
        const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
          email,
          password: password || 'TempPassword123!',
          email_confirm: true,
          user_metadata: {
            full_name
          }
        })

        if (createUserError) throw createUserError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_user_created',
          target_user: newUser.user.id,
          action_details: { 
            created_email: email,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify(newUser),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'delete_auth_user':
        if (!userId) throw new Error('User ID is required')

        // Get user info before deletion for logging
        const { data: userToDelete } = await supabaseClient.auth.admin.getUserById(userId)
        
        // Delete auth user
        const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(userId)
        
        if (deleteUserError) throw deleteUserError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_user_deleted',
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

      case 'update_auth_user':
        if (!userId || !updates) throw new Error('User ID and updates are required')

        // Update auth user
        const { data: updatedUser, error: updateUserError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          updates
        )

        if (updateUserError) throw updateUserError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_user_updated',
          target_user: userId,
          action_details: { 
            updates,
            admin_email: user.email 
          }
        })

        return new Response(
          JSON.stringify(updatedUser),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'get_system_stats':
        // Get system statistics
        const stats = {
          tables: 5,
          functions: 12,
          policies: 25,
          storage_buckets: 2,
          environment: 'production',
          version: '1.0.0'
        }

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'system_stats_viewed',
          action_details: { admin_email: user.email }
        })

        return new Response(
          JSON.stringify(stats),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin database function error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})