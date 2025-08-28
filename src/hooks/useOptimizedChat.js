import { useMemo, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';

export const useOptimizedChat = () => {
  const chatContext = useChat();
  
  // Memoize session statistics
  const sessionStats = useMemo(() => {
    const freeSessions = chatContext.sessions.filter(s => s.chat_type === 'free');
    const premiumSessions = chatContext.sessions.filter(s => s.chat_type === 'premium');
    
    return {
      total: chatContext.sessions.length,
      free: freeSessions.length,
      premium: premiumSessions.length,
      hasActiveSessions: chatContext.sessions.length > 0,
      currentSessionType: chatContext.currentSession ? 
        chatContext.sessions.find(s => s.id === chatContext.currentSession)?.chat_type : null
    };
  }, [chatContext.sessions, chatContext.currentSession]);

  // Memoize current session messages
  const currentSessionMessages = useMemo(() => {
    if (!chatContext.currentSession) return [];
    return chatContext.messages.filter(msg => msg.session_id === chatContext.currentSession);
  }, [chatContext.messages, chatContext.currentSession]);

  // Memoize user limits info
  const userLimits = useMemo(() => {
    if (!chatContext.limits) return null;
    
    return {
      ...chatContext.limits,
      progressPercentage: (chatContext.limits.messages_used / chatContext.limits.daily_limit) * 100,
      isNearLimit: chatContext.limits.messages_used >= chatContext.limits.daily_limit - 1,
      canSendMore: chatContext.limits.can_send && !chatContext.isLimitReached
    };
  }, [chatContext.limits, chatContext.isLimitReached]);

  // Optimized callbacks
  const optimizedSendMessage = useCallback(async (message, type = 'free') => {
    if (!message?.trim()) return { success: false, error: 'Message is empty' };
    
    return await chatContext.sendMessage(message, type, chatContext.currentSession);
  }, [chatContext.sendMessage, chatContext.currentSession]);

  const optimizedCreateSession = useCallback(async (title, type = 'free') => {
    const sessionId = await chatContext.createSession(title, type);
    if (sessionId) {
      await chatContext.selectSession(sessionId);
    }
    return sessionId;
  }, [chatContext.createSession, chatContext.selectSession]);

  return {
    ...chatContext,
    stats: sessionStats,
    currentMessages: currentSessionMessages,
    userLimits,
    optimizedSendMessage,
    optimizedCreateSession
  };
};