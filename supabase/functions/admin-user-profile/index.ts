import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ProfileActionRequest {
  action: 'create_admin' | 'promote_user' | 'demote_user' | 'toggle_premium' | 'get_profile'
  userId?: string
  profileData?: {
    full_name?: string
    avatar_url?: string
    role?: string
    is_premium?: boolean
  }
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
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin' || user.email !== 'marlon.lai@hotmail.com') {
      throw new Error('Access denied. Only marlon.lai@hotmail.com with admin role can access this function.')
    }

    // Parse request body
    const { action, userId, profileData }: ProfileActionRequest = await req.json()

    switch (action) {
      case 'create_admin':
        // Create admin profile using the database function
        const { error: createAdminError } = await supabaseClient
          .rpc('create_admin_profile')

        if (createAdminError) throw createAdminError

        // Log admin action
        await supabaseClient.rpc('log_admin_action', {
          action_type: 'admin_profile_created',
          action_details: { admin_email: user.email }
        })

        return new Response(
          JSON.stringify({ message: 'Admin profile created successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'promote_user':
        if (!userId) throw new Error('User ID required for promote action')

        // Promote user to admin
        const { data: promoteResult, error: promoteError } = await supabaseClient
          .rpc('promote_to_admin', { target_user_id: userId })

        if (promoteError) throw promoteError

        return new Response(
          JSON.stringify({ message: 'User promoted to admin successfully', result: promoteResult }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'demote_user':
        if (!userId) throw new Error('User ID required for demote action')

        // Demote user from admin
        const { data: demoteResult, error: demoteError } = await supabaseClient
          .rpc('demote_from_admin', { target_user_id: userId })

        if (demoteError) throw demoteError

        return new Response(
          JSON.stringify({ message: 'User demoted from admin successfully', result: demoteResult }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'toggle_premium':
        if (!userId) throw new Error('User ID required for toggle premium action')

        // Toggle premium status
        const { data: toggleResult, error: toggleError } = await supabaseClient
          .rpc('toggle_premium_status', { target_user_id: userId })

        if (toggleError) throw toggleError

        return new Response(
          JSON.stringify({ 
            message: `User premium status toggled successfully`, 
            is_premium: toggleResult 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'get_profile':
        if (!userId) throw new Error('User ID required for get profile action')

        // Get user profile with auth data
        const { data: userProfile, error: userProfileError } = await supabaseClient
          .from('profiles')
          .select(`
            *,
            user:id (
              email,
              created_at,
              email_confirmed_at,
              last_sign_in_at
            )
          `)
          .eq('id', userId)
          .single()

        if (userProfileError) throw userProfileError

        // Get auth user data separately if needed
        const { data: authUser, error: authUserError } = await supabaseClient.auth.admin.getUserById(userId)
        
        const combinedProfile = {
          ...userProfile,
          auth_data: authUser?.user || null
        }

        return new Response(
          JSON.stringify(combinedProfile),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin profile function error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})