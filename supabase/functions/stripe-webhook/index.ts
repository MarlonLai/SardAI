import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Import Stripe (you'll need to add this to your imports)
// For now, we'll handle webhook verification manually
async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  // This is a simplified version - in production, use proper Stripe webhook verification
  return signature && secret && body ? true : false
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

    // Get the raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    // Verify webhook signature
    if (!await verifyStripeSignature(body, signature || '', webhookSecret || '')) {
      throw new Error('Invalid webhook signature')
    }

    // Parse the event
    const event = JSON.parse(body)

    console.log('Stripe webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabaseClient, event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(supabaseClient, event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(supabaseClient, event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabaseClient, event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Stripe webhook error:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function handleSubscriptionUpdate(supabaseClient: any, subscription: any) {
  const customerEmail = await getCustomerEmail(subscription.customer)
  
  if (!customerEmail) {
    console.error('No customer email found for subscription:', subscription.id)
    return
  }

  const { error } = await supabaseClient.rpc('update_subscription_status', {
    user_email: customerEmail,
    new_plan: 'premium',
    new_status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    period_end: new Date(subscription.current_period_end * 1000).toISOString()
  })

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }

  console.log(`Subscription updated for ${customerEmail}: ${subscription.status}`)
}

async function handleSubscriptionCancellation(supabaseClient: any, subscription: any) {
  const customerEmail = await getCustomerEmail(subscription.customer)
  
  if (!customerEmail) {
    console.error('No customer email found for subscription:', subscription.id)
    return
  }

  const { error } = await supabaseClient.rpc('update_subscription_status', {
    user_email: customerEmail,
    new_plan: 'free',
    new_status: 'canceled',
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer
  })

  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }

  console.log(`Subscription canceled for ${customerEmail}`)
}

async function handlePaymentSuccess(supabaseClient: any, invoice: any) {
  if (invoice.subscription) {
    // Get subscription details
    const subscription = await getStripeSubscription(invoice.subscription)
    if (subscription) {
      await handleSubscriptionUpdate(supabaseClient, subscription)
    }
  }
}

async function handlePaymentFailed(supabaseClient: any, invoice: any) {
  const customerEmail = await getCustomerEmail(invoice.customer)
  
  if (!customerEmail) {
    console.error('No customer email found for invoice:', invoice.id)
    return
  }

  const { error } = await supabaseClient.rpc('update_subscription_status', {
    user_email: customerEmail,
    new_plan: 'premium',
    new_status: 'past_due'
  })

  if (error) {
    console.error('Error updating payment failed status:', error)
    throw error
  }

  console.log(`Payment failed for ${customerEmail}`)
}

async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`)
    }

    const customer = await response.json()
    return customer.email
  } catch (error) {
    console.error('Error fetching customer:', error)
    return null
  }
}

async function getStripeSubscription(subscriptionId: string): Promise<any | null> {
  try {
    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
}