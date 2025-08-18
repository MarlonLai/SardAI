import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'SardAI Subscription Management',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, 
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, subscription_id } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's subscription
    const { data: userSubscription, error: subError } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .single();

    if (subError || !userSubscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeSubscriptionId = subscription_id || userSubscription.subscription_id;

    if (!stripeSubscriptionId) {
      return new Response(
        JSON.stringify({ error: 'No subscription ID found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'cancel':
        // Cancel subscription at period end
        result = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        break;

      case 'reactivate':
        // Reactivate subscription
        result = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
        break;

      case 'cancel_immediately':
        // Cancel subscription immediately
        result = await stripe.subscriptions.cancel(stripeSubscriptionId);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Update local database
    await supabase
      .from('stripe_subscriptions')
      .update({
        cancel_at_period_end: result.cancel_at_period_end,
        status: result.status,
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', stripeSubscriptionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: result,
        message: `Subscription ${action} successful`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Stripe manage subscription error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});