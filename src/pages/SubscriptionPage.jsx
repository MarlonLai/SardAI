import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useStripe } from '@/hooks/useStripe';
import { useChat } from '@/hooks/useChat';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Sparkles,
  MessageCircle,
  Globe,
  Heart,
  Zap,
  Shield,
  Calendar,
  Clock
} from 'lucide-react';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { createCheckoutSession, handlePaymentSuccess, handlePaymentCanceled } = useStripe();
  const { planStatus, fetchPlanStatus } = useChat();

  // Handle payment status from URL params
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      handlePaymentSuccess();
      fetchPlanStatus(); // Refresh plan status
      // Clean URL
      navigate('/subscription', { replace: true });
    } else if (paymentStatus === 'canceled') {
      handlePaymentCanceled();
      // Clean URL
      navigate('/subscription', { replace: true });
    }
  }, [searchParams, handlePaymentSuccess, handlePaymentCanceled, navigate, fetchPlanStatus]);

  // Fetch plan status on component mount
  useEffect(() => {
    fetchPlanStatus();
  }, [fetchPlanStatus]);

  // Admin doesn't need premium upgrade
  if (profile?.role === 'admin') {
    return (
      <>
        <Helmet>
          <title>Abbonamento Premium - SardAI</title>
          <meta name="description" content="Gestisci il tuo abbonamento Premium SardAI." />
        </Helmet>

        <div className="min-h-screen sardinian-pattern">
          <header className="glass-effect border-b border-white/10 p-4">
            <div className="container mx-auto flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Dashboard
              </Button>
              
              <h1 className="text-2xl font-bold text-white">Pannello Admin</h1>
              
              <div className="w-32"></div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Card className="sardinian-card text-center">
                  <CardHeader>
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl text-white">
                      Accesso Amministratore 🛡️
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Come amministratore hai accesso completo a tutte le funzionalità di SardAI!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-white">
                        Il tuo ruolo di amministratore ti dà accesso a:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {[
                          'Tutte le funzionalità Premium',
                          'Chat in lingua sarda autentica',
                          'Pannello di amministrazione',
                          'Gestione utenti e segnalazioni',
                          'Statistiche e log di sistema',
                          'Gestione storage e file'
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-4 mt-6">
                        <Button
                          onClick={() => navigate('/admin')}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Pannello Admin
                        </Button>
                        <Button
                          onClick={() => navigate('/chat')}
                          className="flex-1 sardinian-gradient hover:opacity-90"
                        >
                          Inizia Chat Premium
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If user already has premium access
  if (planStatus?.can_use_premium && planStatus?.subscription_active) {
    return (
      <>
        <Helmet>
          <title>Abbonamento Premium - SardAI</title>
          <meta name="description" content="Gestisci il tuo abbonamento Premium SardAI." />
        </Helmet>

        <div className="min-h-screen sardinian-pattern">
          <header className="glass-effect border-b border-white/10 p-4">
            <div className="container mx-auto flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Dashboard
              </Button>
              
              <h1 className="text-2xl font-bold text-white">Abbonamento Premium</h1>
              
              <div className="w-32"></div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Card className="sardinian-card premium-glow text-center">
                  <CardHeader>
                    <div className="w-16 h-16 sardinian-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl text-white">
                      Sei già Premium! 🎉
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Grazie per supportare SardAI. Goditi tutte le funzionalità premium!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-white">
                        Il tuo abbonamento Premium ti dà accesso a:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {[
                          'Chat in lingua sarda autentica',
                          'Dialetti: Logudorese, Campidanese',
                          'Contenuti culturali esclusivi',
                          'Traduzione italiano/sardo',
                          'Mini-corsi di lingua sarda',
                          'Guida turistica sarda interattiva',
                          'Supporto prioritario',
                          'Accesso anticipato alle nuove funzionalità'
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => navigate('/chat')}
                        className="w-full sardinian-gradient hover:opacity-90 mt-6"
                      >
                        Inizia a Conversare in Sardo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleUpgrade = () => {
    createCheckoutSession();
  };

  const freeFeatures = [
    "Chat in italiano con carattere sardo",
    "Accesso alle informazioni base sulla Sardegna",
    "Umorismo e calore tipico sardo",
    "Supporto via email"
  ];

  const premiumFeatures = [
    "Chat in lingua sarda autentica",
    "Dialetti: Logudorese, Campidanese, Baronia",
    "Contenuti culturali esclusivi",
    "Traduzione italiano/sardo",
    "Mini-corsi di lingua sarda",
    "Guida turistica sarda interattiva",
    "Supporto prioritario",
    "Accesso anticipato alle nuove funzionalità"
  ];

  const isTrialActive = planStatus?.plan === 'trial' && planStatus?.trial_days_left > 0;

  return (
    <>
      <Helmet>
        <title>Diventa Premium - SardAI</title>
        <meta name="description" content="Sblocca la modalità sarda autentica e funzionalità esclusive con SardAI Premium." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern">
        {/* Header */}
        <header className="glass-effect border-b border-white/10 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Button>
            
            <h1 className="text-2xl font-bold text-white">Diventa Premium</h1>
            
            <div className="w-32"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Trial Status Banner */}
            {isTrialActive && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="sardinian-card border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">Prova Premium Attiva!</h3>
                          <p className="text-gray-300">
                            Ti rimangono <strong>{planStatus.trial_days_left} giorni</strong> di accesso gratuito alle funzionalità premium
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate('/chat')}
                        className="sardinian-gradient hover:opacity-90"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Usa Premium Ora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Sblocca il Vero Potere di
                <span className="block sardinian-gradient bg-clip-text text-transparent">
                  SardAI Premium
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Conversa in lingua sarda autentica e accedi a contenuti culturali esclusivi
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="sardinian-card h-full">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Gratuito</CardTitle>
                    <CardDescription className="text-gray-300">
                      Perfetto per iniziare
                    </CardDescription>
                    <div className="text-3xl font-bold text-white mt-4">
                      €0<span className="text-lg font-normal text-gray-400">/mese</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {freeFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-6 border-white/20 text-white hover:bg-white/10"
                      disabled
                    >
                      Piano Attuale
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Premium Plan */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="sardinian-card premium-glow h-full relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-medium">
                      {isTrialActive ? 'Prova Attiva' : 'Più Popolare'}
                    </span>
                  </div>
                  
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 sardinian-gradient rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">Premium</CardTitle>
                    <CardDescription className="text-gray-300">
                      Esperienza completa sarda
                    </CardDescription>
                    <div className="text-3xl font-bold text-white mt-4">
                      €9.99<span className="text-lg font-normal text-gray-400">/mese</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {premiumFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={handleUpgrade}
                      className="w-full mt-6 sardinian-gradient hover:opacity-90 text-lg py-3"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {isTrialActive ? 'Continua con Premium' : 'Diventa Premium'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Features Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center"
            >
              <h3 className="text-3xl font-bold text-white mb-8">
                Perché Scegliere Premium?
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="sardinian-card">
                  <CardHeader className="text-center">
                    <Globe className="w-12 h-12 sardinian-gradient rounded-full p-3 mx-auto mb-4" />
                    <CardTitle className="text-white">Lingua Autentica</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">
                      Conversa in vero sardo con dialetti logudorese, campidanese e varianti locali
                    </p>
                  </CardContent>
                </Card>

                <Card className="sardinian-card">
                  <CardHeader className="text-center">
                    <Heart className="w-12 h-12 sardinian-gradient rounded-full p-3 mx-auto mb-4" />
                    <CardTitle className="text-white">Cultura Profonda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">
                      Accedi a contenuti culturali esclusivi, tradizioni e storia sarda
                    </p>
                  </CardContent>
                </Card>

                <Card className="sardinian-card">
                  <CardHeader className="text-center">
                    <Zap className="w-12 h-12 sardinian-gradient rounded-full p-3 mx-auto mb-4" />
                    <CardTitle className="text-white">Funzionalità Esclusive</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">
                      Mini-corsi, traduzione, guida turistica e accesso anticipato alle novità
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}