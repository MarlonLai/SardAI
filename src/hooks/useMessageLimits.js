import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useMessageLimits = () => {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchLimits = useCallback(async () => {
    if (!user) {
      setLimits(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('can_send_message', {
        user_uuid: user.id
      });

      if (error) throw error;

      setLimits(data);
    } catch (error) {
      console.error('Error fetching message limits:', error);
      // Set default limits on error
      setLimits({
        can_send: false,
        plan: 'free',
        messages_used: 5,
        messages_remaining: 0,
        daily_limit: 5,
        is_admin: false
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const incrementMessageCount = useCallback(async () => {
    if (!user || !limits) return null;

    // Don't increment for premium users or admins
    if (limits.plan !== 'free' || limits.is_admin) {
      return limits;
    }

    try {
      const { data: newCount, error } = await supabase.rpc('increment_daily_message_count', {
        user_uuid: user.id
      });

      if (error) throw error;

      const updatedLimits = {
        ...limits,
        messages_used: newCount,
        messages_remaining: Math.max(0, limits.daily_limit - newCount),
        can_send: newCount < limits.daily_limit
      };

      setLimits(updatedLimits);

      // Show warning when approaching limit
      if (newCount === limits.daily_limit - 1) {
        toast({
          title: "⚠️ Ultimo messaggio gratuito!",
          description: "Hai utilizzato 4 dei 5 messaggi giornalieri. Considera l'upgrade a Premium per messaggi illimitati.",
        });
      } else if (newCount >= limits.daily_limit) {
        toast({
          title: "🚫 Limite raggiunto!",
          description: "Hai utilizzato tutti i 5 messaggi gratuiti di oggi. Torna domani o passa a Premium!",
          variant: "destructive",
        });
      }

      return updatedLimits;
    } catch (error) {
      console.error('Error incrementing message count:', error);
      return limits;
    }
  }, [user, limits, toast]);

  const checkCanSendMessage = useCallback(() => {
    if (!limits) return false;
    
    // Admin and premium users can always send
    if (limits.is_admin || limits.plan === 'premium' || 
        (limits.plan === 'trial' && limits.trial_ends_at && new Date(limits.trial_ends_at) > new Date())) {
      return true;
    }

    // Free users check daily limit
    return limits.can_send;
  }, [limits]);

  const getTimeUntilReset = useCallback(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: hoursUntilReset, minutes: minutesUntilReset };
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  // Auto-refresh limits every minute to update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (limits && !limits.can_send && limits.plan === 'free') {
        // Only refresh if we're at the limit to update countdown
        fetchLimits();
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [limits, fetchLimits]);

  return {
    limits,
    loading,
    fetchLimits,
    incrementMessageCount,
    checkCanSendMessage,
    getTimeUntilReset,
    isLimitReached: limits && !limits.can_send && limits.plan === 'free',
    isPremium: limits && (limits.plan === 'premium' || limits.is_admin || 
                         (limits.plan === 'trial' && limits.trial_ends_at && new Date(limits.trial_ends_at) > new Date()))
  };
};