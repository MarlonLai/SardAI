import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendPasswordResetEmail = async (email) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('custom-email-handler', {
        body: {
          type: 'recovery',
          email: email,
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      });

      if (error) throw error;

      toast({
        title: "Email inviata! 📧",
        description: "Controlla la tua casella di posta per le istruzioni di recupero."
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Errore nell'invio",
        description: error.message || "Impossibile inviare l'email di recupero.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async (email) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('custom-email-handler', {
        body: {
          type: 'resend_confirmation',
          email,
          redirectTo: `${window.location.origin}/auth/confirm?type=signup`
        }
      });

      if (error) throw error;

      toast({
        title: "Email inviata! 📧",
        description: "Controlla la tua casella di posta per il link di conferma."
      });

      return { success: true };
    } catch (error) {
      toast({
        title: "Errore nell'invio",
        description: error.message || "Impossibile inviare l'email di conferma.",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendPasswordResetEmail,
    resendConfirmationEmail
  };
};