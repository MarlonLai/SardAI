import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { getProductByPriceId } from '@/stripe-config';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
        return;
      }

      if (data && data.subscription_id) {
        // Get product details from our config
        const product = getProductByPriceId(data.price_id);
        
        setSubscription({
          ...data,
          product,
          isActive: data.subscription_status === 'active',
          isPastDue: data.subscription_status === 'past_due',
          isCanceled: data.subscription_status === 'canceled',
          isTrialing: data.subscription_status === 'trialing'
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return {
    subscription,
    loading,
    refetch: fetchSubscription
  };
};