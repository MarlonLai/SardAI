import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface EmailRequest {
  type: 'signup' | 'recovery' | 'resend_confirmation'
  email: string
  password?: string
  redirectTo?: string
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

    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}`

    if (req.method === 'POST') {
      // Parse request body for email actions
      const body = await req.json()
      console.log('Received request body:', body) // Debug log
      
      const { type, email, password, redirectTo }: EmailRequest = body

      if (!type || !email) {
        throw new Error('Type and email are required')
      }
      
      if (type === 'signup' && !password) {
        throw new Error('Password is required for signup')
      }

      let result
      const defaultRedirectTo = `${baseUrl}/auth/callback`

      switch (type) {
        case 'signup':
          result = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo || `${baseUrl}/auth/confirm?type=signup`
            }
          })
          break

        case 'recovery':
          result = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo || `${baseUrl}/auth/confirm?type=recovery`
          })
          break

        case 'resend_confirmation':
          result = await supabaseClient.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: redirectTo || `${baseUrl}/auth/confirm?type=signup`
            }
          })
          break

        default:
          throw new Error('Invalid email type')
      }

      if (result.error) {
        throw result.error
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: getSuccessMessage(type),
          data: result.data
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Handle GET requests for email confirmations and redirects
    if (req.method === 'GET') {
      const token_hash = url.searchParams.get('token_hash')
      const type = url.searchParams.get('type')
      const next = url.searchParams.get('next') || '/dashboard'

      if (!token_hash || !type) {
        // Redirect to error page if missing parameters
        return Response.redirect(`${baseUrl}/auth/error?message=Invalid+confirmation+link`, 302)
      }

      try {
        // Verify the token
        const { data, error } = await supabaseClient.auth.verifyOtp({
          token_hash,
          type: type as any
        })

        if (error) {
          console.error('Email verification error:', error)
          return Response.redirect(
            `${baseUrl}/auth/error?message=${encodeURIComponent(error.message)}`, 
            302
          )
        }

        // Success - redirect based on type
        if (type === 'signup') {
          return Response.redirect(`${baseUrl}/auth/success?type=signup&next=${encodeURIComponent(next)}`, 302)
        } else if (type === 'recovery') {
          return Response.redirect(`${baseUrl}/auth/reset-password?token=${token_hash}`, 302)
        }

        return Response.redirect(`${baseUrl}/auth/success?type=${type}&next=${encodeURIComponent(next)}`, 302)

      } catch (verifyError) {
        console.error('Token verification failed:', verifyError)
        return Response.redirect(
          `${baseUrl}/auth/error?message=Token+verification+failed`, 
          302
        )
      }
    }

    throw new Error('Method not allowed')

  } catch (error) {
    console.error('Custom email handler error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

function getSuccessMessage(type: string): string {
  switch (type) {
    case 'signup':
      return 'Email di conferma inviata! Controlla la tua casella di posta.'
    case 'recovery':
      return 'Email di recupero password inviata! Controlla la tua casella di posta.'
    case 'resend_confirmation':
      return 'Email di conferma reinviata! Controlla la tua casella di posta.'
    default:
      return 'Email inviata con successo!'
  }
}