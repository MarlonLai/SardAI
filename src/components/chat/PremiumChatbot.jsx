import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSubscription } from '@/hooks/useSubscription';
import { Send, Crown, User, Loader2, Sparkles } from 'lucide-react';

export default function PremiumChatbot({ messages, onSendMessage, loading, isAdmin = false }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { subscription } = useSubscription();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const result = await onSendMessage(message, 'premium');
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

  const canUsePremium = subscription?.isActive || false;

  if (!canUsePremium) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-600 bg-gradient-to-r from-yellow-900/30 to-orange-900/30">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className={isAdmin ? "bg-red-600 text-white" : "bg-yellow-600 text-white"}>
                {isAdmin ? <Shield className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-semibold flex items-center">
                {isAdmin ? <Shield className="w-4 h-4 mr-2 text-red-400" /> : <Crown className="w-4 h-4 mr-2 text-yellow-400" />}
                {isAdmin ? 'Benvenuto Admin! Accesso completo attivo 🛡️' : 'Salude! Deo so SardAI Premium! 👑'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isAdmin ? 
                  'Come amministratore hai accesso a tutte le funzionalità avanzate di SardAI.' :
                  'Oe, comente ses? Deo so inoghe pro ti agiudare in limba sarda auténtica. Ite boles ischire de sa Sardigna nostra?'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Message */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Accesso Premium Richiesto
            </h3>
            
            <p className="text-gray-300 mb-6">
              Per conversare in lingua sarda autentica con SardAI, 
              devi avere un abbonamento Premium attivo.
            </p>

            <div className="space-y-3 text-sm text-gray-400 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Chat in logudorese e campidanese</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Traduzione italiano/sardo</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Contenuti culturali esclusivi</span>
              </div>
            </div>

            <Button 
              onClick={() => window.location.href = '/subscription'}
              className="sardinian-gradient hover:opacity-90 px-8 py-3"
            >
              <Crown className="w-4 h-4 mr-2" />
              Diventa Premium
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-600 bg-gradient-to-r from-yellow-900/30 to-orange-900/30">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-yellow-600 text-white">
              <Crown className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-white font-semibold flex items-center">
              <Crown className="w-4 h-4 mr-2 text-yellow-400" />
              SardAI Premium
            </h3>
            <p className="text-gray-400 text-sm">Chat in lingua sarda autentica</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Salude! Deo so SardAI Premium! 👑
            </h3>
            <p className="text-gray-300 max-w-md mx-auto">
              Oe, comente ses? Deo so inoghe pro ti agiudare in limba sarda auténtica. 
              Ite boles ischire de sa Sardigna nostra?
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
                <AvatarFallback className={msg.role === 'user' ? 'bg-green-600' : 'bg-yellow-600'}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : 
                   isAdmin ? <Shield className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              
              <Card className={`px-4 py-3 ${
                msg.role === 'user' 
                  ? 'chat-bubble-user text-white border-0' 
                  : isAdmin ? 
                    'bg-gradient-to-r from-red-900/20 to-red-800/20 text-white border border-red-500/20' :
                    'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 text-white border border-yellow-500/20'
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
                <AvatarFallback className={isAdmin ? "bg-red-600" : "bg-yellow-600"}>
                  {isAdmin ? <Shield className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
              
              <Card className={`px-4 py-3 text-white border ${
                isAdmin ? 
                  'bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500/20' :
                  'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/20'
              }`}>
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {isAdmin ? 'SardAI Admin sta elaborando...' : 'SardAI est pensende...'}
                  </span>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t border-slate-600 ${
        isAdmin ? 
          'bg-gradient-to-r from-red-900/10 to-red-800/10' :
          'bg-gradient-to-r from-yellow-900/10 to-orange-900/10'
      }`}>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isAdmin ? "Scrivi il tuo messaggio..." : "Iscrie su messàgiu tuo in sardu..."}
            disabled={loading}
            className={`bg-slate-800/50 text-white placeholder:text-gray-400 ${
              isAdmin ? 
                'border-red-500/30 focus:border-red-400' :
                'border-yellow-500/30 focus:border-yellow-400'
            }`}
          />
          <Button
            type="submit"
            disabled={!message.trim() || loading}
            className={isAdmin ? 
              "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800" :
              "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
            }
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        
        <div className="mt-2 text-xs text-yellow-400 text-center">
          {isAdmin ? <Shield className="w-3 h-3 inline mr-1" /> : <Crown className="w-3 h-3 inline mr-1" />}
          {isAdmin ? 
            'Modalità Admin Attiva - Accesso completo alle funzionalità' :
            'Modalità Premium Attiva - Chat in lingua sarda autentica'
          }
        </div>
      </div>
    </div>
  );
}