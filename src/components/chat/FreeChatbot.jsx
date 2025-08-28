import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import MessageLimitIndicator from '@/components/chat/MessageLimitIndicator';
import MessageLimitBlocker from '@/components/chat/MessageLimitBlocker';
import { useMessageLimits } from '@/hooks/useMessageLimits';
import { validateChatMessage } from '@/utils/validation';

export default function FreeChatbot({ messages, onSendMessage, loading, planStatus, limits, isLimitReached }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { getTimeUntilReset } = useMessageLimits();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate message
    const validation = validateChatMessage(message);
    if (!validation.isValid) {
      return;
    }
    
    if (loading) return;

    // Check limits before sending
    if (isLimitReached) {
      return;
    }
    const result = await onSendMessage(validation.sanitizedMessage, 'free');
    if (result?.success) {
      setMessage('');
    }
  };

  const formatMessage = (content) => {
    // Simple formatting for better readability
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-600 bg-slate-800/30">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-600 text-white">
              <Bot className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold">SardAI Gratuito</h3>
            <p className="text-gray-400 text-sm">Assistente con carattere sardo</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Message Limit Indicator */}
        {limits && limits.plan === 'free' && (
          <MessageLimitIndicator 
            limits={limits} 
            timeUntilReset={getTimeUntilReset()} 
          />
        )}

        {/* Show limit blocker if reached */}
        {isLimitReached ? (
          <MessageLimitBlocker 
            limits={limits} 
            timeUntilReset={getTimeUntilReset()} 
          />
        ) : (
          <div className="p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <Bot className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Ciao! Sono SardAI! 👋
            </h3>
            <p className="text-gray-300 max-w-md mx-auto">
              Sono qui per aiutarti con tutto quello che vuoi sapere sulla Sardegna. 
              Dimmi, cosa ti va di scoprire della nostra bella isola?
            </p>
          </motion.div>
        )}

        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md xl:max-w-lg ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={msg.role === 'user' ? 'bg-green-600' : 'bg-blue-600'}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              
              <Card className={`px-4 py-3 ${
                msg.role === 'user' 
                  ? 'chat-bubble-user text-white border-0' 
                  : 'chat-bubble-ai text-white border-0'
              }`}>
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                <p className="text-xs opacity-70 mt-2">
                  {new Date(msg.created_at).toLocaleTimeString('it-IT', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </Card>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-600">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              
              <Card className="chat-bubble-ai text-white border-0 px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">SardAI sta pensando...</span>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {!isLimitReached && (
        <div className="p-4 border-t border-slate-600 bg-slate-800/30">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              limits && limits.plan === 'free' 
                ? `Scrivi il tuo messaggio... (${limits.messages_remaining} rimasti oggi)`
                : "Scrivi il tuo messaggio..."
            }
            disabled={loading || isLimitReached}
            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
          />
          <Button
            type="submit"
            disabled={!message.trim() || loading || isLimitReached}
            className="sardinian-gradient hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        {planStatus && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            {planStatus.plan === 'trial' && planStatus.trial_days_left > 0 && (
              <span>Prova gratuita: {planStatus.trial_days_left} giorni rimasti</span>
            )}
            {planStatus.plan === 'free' && (
              <span>Piano gratuito - Aggiorna per accedere alla modalità sarda</span>
            )}
          </div>
        )}
        </div>
      )}
    </div>
  );
}