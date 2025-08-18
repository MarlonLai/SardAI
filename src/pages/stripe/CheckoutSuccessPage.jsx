import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  MessageCircle,
  Calendar,
  CreditCard,
  Gift
} from 'lucide-react';

export default function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { subscription, refetch } = useSubscription();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Refresh subscription data
    refetch();

    // Show success toast
    toast({
      title: "Pagamento completato! 🎉",
      description: "Benvenuto in SardAI Premium! Il tuo abbonamento è ora attivo.",
    });

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/chat');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refetch, toast, navigate]);

  const sessionId = searchParams.get('session_id');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency');

  return (
    <>
      <Helmet>
        <title>Pagamento Completato - SardAI Premium</title>
        <meta name="description" content="Il tuo pagamento è stato completato con successo. Benvenuto in SardAI Premium!" />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          {/* Success Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          {/* Success Card */}
          <Card className="sardinian-card premium-glow">
            <CardHeader className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-16 h-16 sardinian-gradient rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Crown className="w-8 h-8 text-white" />
              </motion.div>
              
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Benvenuto in SardAI Premium! 🎉
              </CardTitle>
              
              <p className="text-gray-300 text-lg">
                Il tuo pagamento è stato completato con successo
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Payment Details */}
              <div className="bg-slate-800/30 p-6 rounded-lg border border-green-500/20">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-400" />
                  Dettagli Pagamento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Piano Attivato</p>
                    <p className="text-white font-medium">
                      {subscription?.product?.name || 'SardAI Premium'}
                    </p>
                  </div>
                  
                  {amount && (
                    <div>
                      <p className="text-gray-400 text-sm">Importo</p>
                      <p className="text-white font-medium">
                        {(parseFloat(amount) / 100).toFixed(2)} {currency?.toUpperCase() || 'EUR'}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-gray-400 text-sm">Data Attivazione</p>
                    <p className="text-white font-medium">
                      {new Date().toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  
                  {subscription?.current_period_end && (
                    <div>
                      <p className="text-gray-400 text-sm">Prossimo Rinnovo</p>
                      <p className="text-white font-medium">
                        {new Date(subscription.current_period_end * 1000).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Premium Features */}
              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-6 rounded-lg border border-yellow-500/20">
                <h3 className="text-white font-semibold mb-4 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-yellow-400" />
                  Ora Hai Accesso A:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + (index * 0.1) }}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/chat')}
                  className="w-full sardinian-gradient hover:opacity-90 text-lg py-4"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Inizia a Conversare in Sardo
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => navigate('/subscription')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Gestisci Abbonamento
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Vai alla Dashboard
                  </Button>
                </div>
              </div>

              {/* Auto Redirect Notice */}
              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Reindirizzamento automatico alla chat tra {countdown} secondi...
                </p>
                <Button
                  onClick={() => navigate('/chat')}
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                >
                  Vai subito alla chat
                </Button>
              </div>

              {/* Support */}
              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Hai domande sul tuo abbonamento?{' '}
                  <a 
                    href="mailto:info@sardai.tech" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Contattaci
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fun Sardinian Touch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400 text-sm italic">
              "Bene bene! Ora puoi parlare sardo come un vero isolano!" 🏝️
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}