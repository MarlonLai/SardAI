import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (priceId = null) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/subscription?payment=canceled`
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Errore nel pagamento",
        description: error.message || "Impossibile avviare il processo di pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Pagamento completato! 🎉",
      description: "Benvenuto in SardAI Premium! Ora puoi accedere alla chat in lingua sarda.",
    });
  };

  const handlePaymentCanceled = () => {
    toast({
      title: "Pagamento annullato",
      description: "Il pagamento è stato annullato. Puoi riprovare quando vuoi.",
      variant: "destructive",
    });
  };

  return {
    loading,
    createCheckoutSession,
    handlePaymentSuccess,
    handlePaymentCanceled
  };
};