import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Send, 
  Sparkles, 
  Crown, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('free');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState({
    free: [
      {
        id: 1,
        type: 'ai',
        content: 'Ciao! Sono il tuo assistente SardAI! Come stai? Dimmi, cosa ti va di sapere sulla nostra bella Sardegna? 😊',
        timestamp: new Date()
      }
    ],
    premium: [
      {
        id: 1,
        type: 'ai',
        content: profile?.is_premium 
          ? 'Salude! Deo so su assistente SardAI. Comente ses? Ite boles ischire de sa Sardigna nostra? 🌊'
          : 'Per accedere alla modalità premium e conversare in lingua sarda autentica, aggiorna il tuo abbonamento.',
        timestamp: new Date()
      }
    ]
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (activeTab === 'premium' && !profile?.is_premium) {
      toast({
        title: "Abbonamento Premium Richiesto",
        description: "Aggiorna il tuo abbonamento per accedere alla modalità sarda autentica",
        variant: "destructive"
      });
      return;
    }

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], newMessage]
    }));

    setMessage('');

    // Simula risposta AI
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: activeTab === 'free' 
          ? getItalianSardResponse(message)
          : getSardResponse(message),
        timestamp: new Date()
      };

      setMessages(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], aiResponse]
      }));
    }, 1000);
  };

  const getItalianSardResponse = (userMessage) => {
    const responses = [
      "Eh beh, questa è una bella domanda! In Sardegna diciamo sempre che 'chi va piano va sano e va lontano', ma noi andiamo sempre di fretta! 😄",
      "Madonna mia, che bella cosa mi hai chiesto! Sai, noi sardi siamo così: sempre pronti ad aiutare e a raccontare le nostre storie!",
      "Bene bene! Vedo che sei curioso come un vero sardo! Ti dico una cosa: da noi si dice che 'sa vida est bella' e infatti è proprio così!",
      "Aho, che bello parlare con te! Senti, in Sardegna abbiamo un detto: 'Deus ti benedigat' - che Dio ti benedica. E io te lo auguro di cuore!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getSardResponse = (userMessage) => {
    const responses = [
      "Eh eja, custa est una bella pregunta! In Sardigna naraimus semper chi 'chie andat a su pasu andat sanu'! 🌊",
      "Madonna mia, ite bella cosa m'as preguntau! Nois sardos semus aici: semper prontos a agiudare!",
      "Bene bene! Bidu chi ses curiosu comente unu veru sardu! Ti naro una cosa: dae nois si narat chi 'sa vida est bella'!",
      "Salude! Ite bellu faeddare cun tegus! Ascurta, in Sardigna tenimus unu ditzere: 'Deus ti benedigat'!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Arrivederci! 👋",
      description: "Logout effettuato con successo. A presto!"
    });
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - SardAI</title>
        <meta name="description" content="Conversa con l'assistente virtuale SardAI in modalità gratuita o premium." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 glass-effect border-r border-white/10 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SardAI</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="flex items-center space-x-3 mb-6">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {profile?.full_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-medium">{profile?.full_name}</p>
                <p className="text-gray-400 text-sm">
                  {profile?.is_premium ? '👑 Premium' : '🆓 Gratuito'}
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="w-full justify-start text-white hover:bg-white/10"
              >
                <User className="w-4 h-4 mr-3" />
                Profilo
              </Button>
              
              {!profile?.is_premium && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/subscription')}
                  className="w-full justify-start text-yellow-400 hover:bg-yellow-400/10"
                >
                  <Crown className="w-4 h-4 mr-3" />
                  Diventa Premium
                </Button>
              )}

              {profile?.role === 'admin' && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin')}
                  className="w-full justify-start text-green-400 hover:bg-green-400/10"
                >
                  <Shield className="w-4 h-4 mr-3" />
                  Pannello Admin
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => toast({
                  title: "🚧 Funzionalità in arrivo!",
                  description: "Le impostazioni saranno disponibili presto. Puoi richiederle nel prossimo prompt! 🚀"
                })}
                className="w-full justify-start text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-3" />
                Impostazioni
              </Button>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-red-400 hover:bg-red-400/10"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:ml-0">
          {/* Header */}
          <header className="glass-effect border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <h1 className="text-2xl font-bold text-white">
                Conversa con SardAI
              </h1>
              
              <div className="w-10 lg:w-0"></div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-4 bg-slate-800/50 border border-slate-600">
                <TabsTrigger value="free" className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Modalità Gratuita</span>
                </TabsTrigger>
                <TabsTrigger value="premium" className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>Modalità Premium</span>
                  {!profile?.is_premium && (
                    <span className="ml-1 px-2 py-1 text-xs bg-yellow-500 text-black rounded-full">
                      Upgrade
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="free" className="flex-1 flex flex-col mt-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.free.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                        msg.type === 'user' 
                          ? 'chat-bubble-user text-white' 
                          : 'chat-bubble-ai text-white'
                      }`}>
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </TabsContent>

              <TabsContent value="premium" className="flex-1 flex flex-col mt-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.premium.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                        msg.type === 'user' 
                          ? 'chat-bubble-user text-white' 
                          : 'chat-bubble-ai text-white'
                      }`}>
                        <p>{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.timestamp.toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Message Input */}
            <div className="p-4 glass-effect border-t border-white/10">
              <div className="flex space-x-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    activeTab === 'free' 
                      ? "Scrivi il tuo messaggio..." 
                      : profile?.is_premium 
                        ? "Iscrie su messàgiu tuo..." 
                        : "Upgrade a Premium per scrivere in sardo"
                  }
                  disabled={activeTab === 'premium' && !profile?.is_premium}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || (activeTab === 'premium' && !profile?.is_premium)}
                  className="sardinian-gradient hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}