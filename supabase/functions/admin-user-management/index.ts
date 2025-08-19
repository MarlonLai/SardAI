import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AdminActionRequest {
  action: 'list' | 'delete' | 'confirm' | 'resend_confirmation' | 'reset_password' | 'promote_user' | 'demote_user' | 'toggle_premium'
  userId?: string
  email?: string
  limit?: number
  offset?: number
  search?: string
  adminEmail: string // Email dell'admin che fa l'azione
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with SERVICE ROLE - NO USER AUTHENTICATION
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { action, userId, email, limit = 50, offset = 0, search, adminEmail }: AdminActionRequest = await req.json()

    if (!adminEmail) {
      throw new Error('Admin email is required')
    }

    // SERVER-SIDE ADMIN VERIFICATION - Check only in profiles table
    const { data: adminProfile, error: adminError } = await supabaseClient
      .from('profiles')
      .select('role, full_name')
      .eq('id', (await supabaseClient.auth.admin.listUsers()).data.users.find(u => u.email === adminEmail)?.id)
      .single()

    // Alternative: Direct check for super admin
    if (adminEmail !== 'marlon.lai@hotmail.com') {
      throw new Error('Access denied. Only marlon.lai@hotmail.com can perform admin actions.')
    }

    // Get admin user ID for logging
    const { data: adminUsers } = await supabaseClient.auth.admin.listUsers()
    const adminUser = adminUsers.users.find(u => u.email === adminEmail)
    
    if (!adminUser) {
      throw new Error('Admin user not found')
    }

    switch (action) {
      case 'list':
        // Get all users using SERVICE ROLE - direct database access
        const { data: allUsers } = await supabaseClient.auth.admin.listUsers()
        
        // Get profiles data
        let profileQuery = supabaseClient
          .from('profiles')
          .select(`
            id,
            full_name,
            role,
            is_premium,
            updated_at
          `)
          .order('updated_at', { ascending: false })

        if (search) {
          profileQuery = profileQuery.or(`full_name.ilike.%${search}%`)
        }

        const { data: profiles, error: profilesError } = await profileQuery
          .range(offset, offset + limit - 1)

        if (profilesError) throw profilesError

        // Combine auth and profile data
        const combinedUsers = profiles?.map(profile => {
          const authUser = allUsers.users.find(u => u.id === profile.id)
          return {
            ...profile,
            email: authUser?.email,
            created_at: authUser?.created_at,
            last_sign_in_at: authUser?.last_sign_in_at,
            email_confirmed_at: authUser?.email_confirmed_at,
            banned_until: authUser?.banned_until
          }
        }) || []

        // Filter by email search if provided
        const filteredUsers = search 
          ? combinedUsers.filter(user => 
              user.email?.toLowerCase().includes(search.toLowerCase()) ||
              user.full_name?.toLowerCase().includes(search.toLowerCase())
            )
          : combinedUsers

        // Log admin action using SERVICE ROLE
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'user_list_viewed',
            details: { search, limit, offset },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify(filteredUsers),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'delete':
        if (!userId) throw new Error('User ID required for delete action')

        // Prevent self-deletion
        if (userId === adminUser.id) {
          throw new Error('Cannot delete your own account')
        }

        // Get target user info before deletion
        const { data: targetUser } = await supabaseClient.auth.admin.getUserById(userId)
        const { data: targetProfile } = await supabaseClient
          .from('profiles')
          .select('role, full_name')
          .eq('id', userId)
          .single()

        // Prevent deletion of other admins (only super admin can delete admins)
        if (targetProfile?.role === 'admin' && adminEmail !== 'marlon.lai@hotmail.com') {
          throw new Error('Only super admin can delete admin users')
        }

        // Delete user using SERVICE ROLE
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)
        if (deleteError) throw deleteError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'user_deleted',
            target_user_id: userId,
            details: { 
              target_email: targetUser?.user?.email,
              target_name: targetProfile?.full_name,
              admin_email: adminEmail
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
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

        // Confirm user using SERVICE ROLE
        const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { email_confirm: true }
        )
        if (confirmError) throw confirmError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'user_confirmed',
            target_user_id: userId,
            details: { admin_email: adminEmail },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
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

        // Resend confirmation using SERVICE ROLE
        const { error: resendError } = await supabaseClient.auth.resend({
          type: 'signup',
          email: email
        })
        if (resendError) throw resendError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'confirmation_resent',
            details: { 
              target_email: email,
              admin_email: adminEmail 
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
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

        // Send password reset using SERVICE ROLE
        const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email)
        if (resetError) throw resetError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'password_reset_sent',
            details: { 
              target_email: email,
              admin_email: adminEmail 
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify({ message: 'Password reset email sent successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'promote_user':
        if (!userId) throw new Error('User ID required for promote action')

        // Only super admin can promote users
        if (adminEmail !== 'marlon.lai@hotmail.com') {
          throw new Error('Only super admin can promote users to admin')
        }

        // Promote user using SERVICE ROLE
        const { error: promoteError } = await supabaseClient
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId)

        if (promoteError) throw promoteError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'user_promoted',
            target_user_id: userId,
            details: { admin_email: adminEmail },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify({ message: 'User promoted to admin successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'demote_user':
        if (!userId) throw new Error('User ID required for demote action')

        // Only super admin can demote users
        if (adminEmail !== 'marlon.lai@hotmail.com') {
          throw new Error('Only super admin can demote admin users')
        }

        // Prevent self-demotion
        if (userId === adminUser.id) {
          throw new Error('Cannot demote yourself')
        }

        // Demote user using SERVICE ROLE
        const { error: demoteError } = await supabaseClient
          .from('profiles')
          .update({ role: 'user' })
          .eq('id', userId)

        if (demoteError) throw demoteError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'user_demoted',
            target_user_id: userId,
            details: { admin_email: adminEmail },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify({ message: 'User demoted from admin successfully' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      case 'toggle_premium':
        if (!userId) throw new Error('User ID required for toggle premium action')

        // Get current premium status
        const { data: currentProfile, error: getCurrentError } = await supabaseClient
          .from('profiles')
          .select('is_premium')
          .eq('id', userId)
          .single()

        if (getCurrentError) throw getCurrentError

        // Toggle premium status using SERVICE ROLE
        const newPremiumStatus = !currentProfile.is_premium
        const { error: toggleError } = await supabaseClient
          .from('profiles')
          .update({ is_premium: newPremiumStatus })
          .eq('id', userId)

        if (toggleError) throw toggleError

        // Log admin action
        await supabaseClient
          .from('admin_logs')
          .insert({
            admin_id: adminUser.id,
            action: 'premium_status_toggled',
            target_user_id: userId,
            details: { 
              new_premium_status: newPremiumStatus,
              admin_email: adminEmail 
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent')
          })

        return new Response(
          JSON.stringify({ 
            message: `User premium status ${newPremiumStatus ? 'enabled' : 'disabled'} successfully`,
            is_premium: newPremiumStatus
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Admin user management error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})