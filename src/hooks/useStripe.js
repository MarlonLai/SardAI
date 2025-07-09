import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (priceId, mode = 'subscription') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: priceId,
          mode,
          success_url: `${window.location.origin}/subscription?payment=success`,
          cancel_url: `${window.location.origin}/subscription?payment=canceled`
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
      description: "Grazie per il tuo acquisto! Il tuo abbonamento è ora attivo.",
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