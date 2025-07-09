import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CheckoutRequest {
  priceId?: string
  successUrl?: string
  cancelUrl?: string
}

Deno.serve(async (req: Request) => {
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
    const { 
      priceId = Deno.env.get('STRIPE_PRICE_ID'),
      successUrl = `${req.headers.get('origin')}/dashboard?payment=success`,
      cancelUrl = `${req.headers.get('origin')}/subscription?payment=canceled`
    }: CheckoutRequest = await req.json()

    if (!priceId) {
      throw new Error('Price ID is required')
    }

    // Create Stripe checkout session
    const checkoutData = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email,
        },
      },
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(checkoutData as any).toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const session = await response.json()

    // Log the checkout session creation
    await supabaseClient.rpc('log_admin_action', {
      action_type: 'checkout_session_created',
      target_user: user.id,
      action_details: {
        session_id: session.id,
        price_id: priceId,
        user_email: user.email
      }
    })

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Create checkout session error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})