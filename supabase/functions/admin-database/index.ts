import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DatabaseActionRequest {
  action: 'list_auth_users' | 'create_auth_user' | 'delete_auth_user' | 'update_auth_user'
  userId?: string
  email?: string
  password?: string
  full_name?: string
  role?: string
  is_premium?: boolean
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
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
      const adminEmails = ['marlon.lai@hotmail.com', 'riccardo.lai@example.com']
      if (profileError || profile?.role !== 'admin' || !adminEmails.includes(user.email)) {
        throw new Error('Access denied. Only authorized admins can access this function.')
      }
    }

    // Parse request body
    const { action, userId, email, password, full_name, role, is_premium }: DatabaseActionRequest = await req.json()

    switch (action) {
      case 'list_auth_users':
        // Get all auth users
        const { data: authUsers, error: authUsersError } = await supabaseClient.auth.admin.listUsers()
        
        if (authUsersError) throw authUsersError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_users_listed',
          action_details: { count: authUsers.users?.length || 0 }
        })

        return new Response(
          JSON.stringify(authUsers.users || []),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'create_auth_user':
        if (!email || !password) {
          throw new Error('Email and password are required')
        }

        // Create auth user
        const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: full_name || ''
          }
        })

        if (createError) throw createError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_user_created',
          target_user: newUser.user?.id,
          action_details: { 
            email,
            full_name: full_name || '',
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
        if (!userId) {
          throw new Error('User ID is required')
        }

        // Use the safe delete function
        const { data: deleteResult, error: deleteError } = await supabaseClient
          .rpc('safe_delete_user', {
            target_user_id: userId,
            admin_user_id: user.id
          })

        if (deleteError) {
          console.error('Safe delete error:', deleteError)
          throw new Error(`Failed to delete user: ${deleteError.message}`)
        }

        // Now delete from auth.users
        const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId)
        if (authDeleteError) {
          console.error('Auth delete error:', authDeleteError)
          throw new Error(`Failed to delete auth user: ${authDeleteError.message}`)
        }

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

      case 'update_auth_user':
        if (!userId) {
          throw new Error('User ID is required')
        }

        const updateData: any = {}
        if (email) updateData.email = email
        if (password) updateData.password = password
        if (full_name !== undefined) {
          updateData.user_metadata = { full_name }
        }

        // Update auth user
        const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          updateData
        )

        if (updateError) throw updateError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'auth_user_updated',
          target_user: userId,
          action_details: { 
            updated_fields: Object.keys(updateData),
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