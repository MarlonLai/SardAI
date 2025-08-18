import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useMessageLimits } from '@/hooks/useMessageLimits';

export const useChat = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { 
    limits, 
    incrementMessageCount, 
    checkCanSendMessage, 
    fetchLimits,
    isLimitReached 
  } = useMessageLimits();

  // Fetch user plan status
  const fetchPlanStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_plan_status');
      if (error) throw error;
      setPlanStatus(data[0]);
    } catch (error) {
      console.error('Error fetching plan status:', error);
    }
  }, [user]);

  // Fetch chat sessions
  const fetchSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le sessioni di chat.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch messages for a session
  const fetchMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i messaggi.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Send message
  const sendMessage = useCallback(async (message, chatType = 'free', sessionId = null) => {
    if (!message.trim()) return null;

    // Check message limits for free users
    if (chatType === 'free' && !checkCanSendMessage()) {
      toast({
        title: "🚫 Limite messaggi raggiunto!",
        description: "Hai utilizzato tutti i 5 messaggi gratuiti di oggi. Torna domani o passa a Premium!",
        variant: "destructive",
      });
      return { success: false, error: 'DAILY_LIMIT_REACHED' };
    }
    setLoading(true);
    try {
      // Increment message count for free users before sending
      if (chatType === 'free' && limits && limits.plan === 'free') {
        await incrementMessageCount();
      }

      const { data, error } = await supabase.functions.invoke('chat-openai', {
        body: {
          message: message.trim(),
          sessionId,
          chatType
        }
      });

      if (error) throw error;

      // Update current session if it's new
      if (!sessionId && data.sessionId) {
        setCurrentSession(data.sessionId);
        await fetchSessions(); // Refresh sessions list
      }

      // Refresh messages for current session
      if (data.sessionId) {
        await fetchMessages(data.sessionId);
      }

      // Update plan status
      if (data.planStatus) {
        setPlanStatus(data.planStatus);
      }

      // Refresh limits after successful message
      if (chatType === 'free') {
        await fetchLimits();
      }
      return {
        success: true,
        sessionId: data.sessionId,
        message: data.message,
        tokensUsed: data.tokensUsed
      };

    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.message?.includes('Premium access required')) {
        toast({
          title: "Accesso Premium Richiesto",
          description: "Aggiorna il tuo piano per accedere alla chat premium.",
          variant: "destructive",
        });
        return { success: false, error: 'PREMIUM_REQUIRED' };
      }

      if (error.message?.includes('DAILY_LIMIT_REACHED')) {
        return { success: false, error: 'DAILY_LIMIT_REACHED' };
      }
      toast({
        title: "Errore nell'invio del messaggio",
        description: error.message || "Si è verificato un errore imprevisto.",
        variant: "destructive",
      });

      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast, fetchSessions, fetchMessages, checkCanSendMessage, incrementMessageCount, limits, fetchLimits]);

  // Create new session
  const createSession = useCallback(async (title = 'Nuova Chat', chatType = 'free') => {
    try {
      const { data, error } = await supabase.rpc('create_chat_session', {
        session_title: title,
        session_type: chatType
      });

      if (error) throw error;

      setCurrentSession(data);
      await fetchSessions();
      setMessages([]); // Clear messages for new session

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare una nuova sessione di chat.",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchSessions, toast]);

  // Delete session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // If deleting current session, clear it
      if (currentSession === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }

      await fetchSessions();

      toast({
        title: "Sessione eliminata",
        description: "La sessione di chat è stata eliminata con successo.",
      });

    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la sessione di chat.",
        variant: "destructive",
      });
    }
  }, [currentSession, fetchSessions, toast]);

  // Select session
  const selectSession = useCallback(async (sessionId) => {
    setCurrentSession(sessionId);
    await fetchMessages(sessionId);
  }, [fetchMessages]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchPlanStatus();
      fetchSessions();
    }
  }, [user, fetchPlanStatus, fetchSessions]);

  return {
    sessions,
    currentSession,
    messages,
    loading,
    planStatus,
    limits,
    isLimitReached,
    sendMessage,
    createSession,
    deleteSession,
    selectSession,
    fetchPlanStatus,
    fetchSessions,
    checkCanSendMessage
  };
};