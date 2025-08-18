import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useChat } from '@/hooks/useChat';
import { useStripe } from '@/hooks/useStripe';
import { useSubscription } from '@/hooks/useSubscription';
import Sidebar from '@/components/Sidebar';
import FreeChatbot from '@/components/chat/FreeChatbot';
import PremiumChatbot from '@/components/chat/PremiumChatbot';
import UpgradeButton from '@/components/chat/UpgradeButton';
import { 
  ArrowLeft, 
  Menu,
  MessageCircle, 
  Crown,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Shield
} from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { handlePaymentSuccess, handlePaymentCanceled } = useStripe();
  const { subscription, refetch: refetchSubscription } = useSubscription();
  const [activeTab, setActiveTab] = useState('free');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const {
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
    checkCanSendMessage
  } = useChat();

  // Handle payment status from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handlePaymentSuccess();
      fetchPlanStatus(); // Refresh plan status
      refetchSubscription(); // Refresh subscription status
      // Clean URL
      navigate('/chat', { replace: true });
    } else if (paymentStatus === 'canceled') {
      handlePaymentCanceled();
      // Clean URL
      navigate('/chat', { replace: true });
    }
  }, [searchParams, handlePaymentSuccess, handlePaymentCanceled, navigate, fetchPlanStatus, refetchSubscription]);

  const handleNewChat = async (chatType = 'free') => {
    const sessionId = await createSession(`Chat ${chatType}`, chatType);
    if (sessionId) {
      selectSession(sessionId);
      setActiveTab(chatType);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId);
  };

  const handleSelectSession = async (sessionId) => {
    await selectSession(sessionId);
    // Find session type and switch tab
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveTab(session.chat_type);
    }
  };

  const currentSessionMessages = messages.filter(msg => 
    currentSession && msg.session_id === currentSession
  );

  const freeSessions = sessions.filter(s => s.chat_type === 'free');
  const premiumSessions = sessions.filter(s => s.chat_type === 'premium');

  // Determine access levels
  const isAdmin = profile?.role === 'admin';
  const canUsePremium = subscription?.isActive || isAdmin || (planStatus?.can_use_premium);

  return (
    <>
      <Helmet>
        <title>Chat - SardAI</title>
        <meta name="description" content="Conversa con SardAI in modalità gratuita o premium con lingua sarda autentica." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Chat Sessions Sidebar */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-900/50">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-white hover:bg-white/10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                <h2 className="text-lg font-semibold text-white">Le tue Chat</h2>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* New Chat Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => handleNewChat('free')}
                  variant="outline"
                  className="w-full justify-start border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuova Chat Gratuita
                </Button>
                
                {canUsePremium && (
                  <Button
                    onClick={() => handleNewChat('premium')}
                    variant="outline"
                    className="w-full justify-start border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isAdmin ? <Shield className="w-4 h-4 mr-1" /> : <Crown className="w-4 h-4 mr-1" />}
                    Nuova Chat {isAdmin ? 'Admin' : 'Premium'}
                  </Button>
                )}
              </div>
            </div>

            {/* User Status */}
            <div className="p-4 border-b border-white/10">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Stato Account</span>
                  <span className={`text-sm font-semibold ${
                    isAdmin ? 'text-red-400' : 
                    subscription?.isActive || planStatus?.can_use_premium ? 'text-yellow-400' : 'text-blue-400'
                  }`}>
                    {isAdmin ? 'Admin' : 
                     subscription?.isActive ? 'Premium' : 
                     planStatus?.plan === 'trial' && !planStatus?.trial_expired ? 'Prova Gratuita' : 'Gratuito'}
                  </span>
                </div>
                
                {planStatus && (
                  <div className="text-xs text-gray-400">
                    {planStatus.plan === 'trial' && !planStatus.trial_expired && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>Prova: {planStatus.trial_days_left} giorni rimasti</span>
                      </div>
                    )}
                    {subscription?.isActive && subscription.current_period_end && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Rinnovo: {new Date(subscription.current_period_end * 1000).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {/* Free Sessions */}
              {freeSessions.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Gratuite ({freeSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {freeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          currentSession === session.id
                            ? 'bg-blue-600/20 border border-blue-500/30'
                            : 'hover:bg-slate-800/50'
                        }`}
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(session.updated_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Premium Sessions */}
              {premiumSessions.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
                    {isAdmin ? <Shield className="w-4 h-4 mr-2 text-red-400" /> : <Crown className="w-4 h-4 mr-2 text-yellow-400" />}
                    Chat {isAdmin ? 'Admin' : 'Premium'} ({premiumSessions.length})
                  </h3>
                  <div className="space-y-2">
                    {premiumSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          currentSession === session.id
                            ? isAdmin ? 'bg-red-600/20 border border-red-500/30' : 'bg-yellow-600/20 border border-yellow-500/30'
                            : 'hover:bg-slate-800/50'
                        }`}
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(session.updated_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {sessions.length === 0 && (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Nessuna chat ancora</p>
                  <Button
                    onClick={() => handleNewChat('free')}
                    className="sardinian-gradient hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Inizia la prima chat
                  </Button>
                </div>
              )}

              {/* Upgrade Section */}
              {!canUsePremium && (
                <div className="p-4">
                  <UpgradeButton />
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentSession ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 pt-4 border-b border-white/10">
                  <TabsList className="bg-slate-800/50 border border-slate-600">
                    <TabsTrigger value="free" className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Modalità Gratuita</span>
                    </TabsTrigger>
                    <TabsTrigger value="premium" className="flex items-center space-x-2">
                      {isAdmin ? <Shield className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                      <span>Modalità {isAdmin ? 'Admin' : 'Premium'}</span>
                      {!canUsePremium && (
                        <span className="ml-1 px-2 py-1 text-xs bg-yellow-500 text-black rounded-full">
                          Upgrade
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="free" className="flex-1 flex flex-col mt-0">
                  <FreeChatbot
                    messages={currentSessionMessages}
                    onSendMessage={sendMessage}
                    loading={loading}
                    planStatus={planStatus}
                    limits={limits}
                    isLimitReached={isLimitReached}
                  />
                </TabsContent>

                <TabsContent value="premium" className="flex-1 flex flex-col mt-0">
                  <PremiumChatbot
                    messages={currentSessionMessages}
                    onSendMessage={sendMessage}
                    loading={loading}
                    isAdmin={isAdmin}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              /* Welcome Screen */
              <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center max-w-md"
                >
                  <div className="w-20 h-20 sardinian-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Benvenuto in SardAI Chat!
                  </h2>
                  
                  <p className="text-gray-300 mb-8">
                    {isAdmin ? 
                      "Come amministratore hai accesso completo a tutte le funzionalità di chat." :
                      "Seleziona una chat esistente dalla barra laterale o creane una nuova per iniziare a conversare con il tuo assistente sardo preferito."
                    }
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleNewChat('free')}
                      className="w-full sardinian-gradient hover:opacity-90"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Inizia Chat Gratuita
                    </Button>
                    
                    {canUsePremium && (
                      <Button
                        onClick={() => handleNewChat('premium')}
                        variant="outline"
                        className={`w-full ${
                          isAdmin ? 
                            'border-red-500/50 text-red-400 hover:bg-red-500/10' :
                            'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-4 h-4 mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                        Inizia Chat {isAdmin ? 'Admin' : 'Premium'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}