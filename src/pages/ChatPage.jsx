import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import Sidebar from '@/components/Sidebar';
import { 
  Send, 
  Menu,
  MessageCircle, 
  Crown,
  Sparkles,
  Download,
  Trash2
} from 'lucide-react';

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
        content: (profile?.is_premium || profile?.role === 'admin')
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
    // Update premium message based on user status
    if (profile) {
      setMessages(prev => ({
        ...prev,
        premium: [
          {
            id: 1,
            type: 'ai',
            content: (profile?.is_premium || profile?.role === 'admin')
              ? 'Salude! Deo so su assistente SardAI. Comente ses? Ite boles ischire de sa Sardigna nostra? 🌊'
              : 'Per accedere alla modalità premium e conversare in lingua sarda autentica, aggiorna il tuo abbonamento.',
            timestamp: new Date()
          }
        ]
      }));
    }
  }, [profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Admin has access to all features, otherwise check premium status
    if (activeTab === 'premium' && !profile?.is_premium && profile?.role !== 'admin') {
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

  const clearChat = () => {
    setMessages(prev => ({
      ...prev,
      [activeTab]: [prev[activeTab][0]] // Keep only the initial message
    }));
    toast({
      title: "Chat pulita",
      description: "La conversazione è stata cancellata."
    });
  };

  const exportChat = () => {
    toast({
      title: "🚧 Funzionalità in arrivo!",
      description: "L'export PDF sarà disponibile presto."
    });
  };

  return (
    <>
      <Helmet>
        <title>Chat - SardAI</title>
        <meta name="description" content="Conversa con l'assistente virtuale SardAI in modalità gratuita o premium." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="glass-effect border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-white hover:bg-white/10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">
                    Chat con SardAI
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportChat}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 pt-4">
                <TabsList className="bg-slate-800/50 border border-slate-600">
                  <TabsTrigger value="free" className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Modalità Gratuita</span>
                  </TabsTrigger>
                  <TabsTrigger value="premium" className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span>Modalità Premium</span>
                    {!profile?.is_premium && profile?.role !== 'admin' && (
                      <span className="ml-1 px-2 py-1 text-xs bg-yellow-500 text-black rounded-full">
                        Upgrade
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="free" className="flex-1 flex flex-col mt-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.free.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <Card className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 ${
                        msg.type === 'user' 
                          ? 'chat-bubble-user text-white border-0' 
                          : 'chat-bubble-ai text-white border-0'
                      }`}>
                        <p className="mb-2">{msg.content}</p>
                        <p className="text-xs opacity-70">
                          {msg.timestamp.toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </Card>
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
                      <Card className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 ${
                        msg.type === 'user' 
                          ? 'chat-bubble-user text-white border-0' 
                          : 'chat-bubble-ai text-white border-0'
                      }`}>
                        <p className="mb-2">{msg.content}</p>
                        <p className="text-xs opacity-70">
                          {msg.timestamp.toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </Card>
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
                      : (profile?.is_premium || profile?.role === 'admin')
                        ? "Iscrie su messàgiu tuo..." 
                        : "Upgrade a Premium per scrivere in sardo"
                  }
                  disabled={activeTab === 'premium' && !profile?.is_premium && profile?.role !== 'admin'}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || (activeTab === 'premium' && !profile?.is_premium && profile?.role !== 'admin')}
                  className="sardinian-gradient hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}