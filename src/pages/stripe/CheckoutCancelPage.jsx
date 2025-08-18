import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  XCircle, 
  ArrowLeft, 
  Crown, 
  Sparkles, 
  RefreshCw,
  MessageCircle,
  HelpCircle,
  Mail
} from 'lucide-react';

export default function CheckoutCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Show cancel toast
    toast({
      title: "Pagamento annullato",
      description: "Il pagamento è stato annullato. Puoi riprovare quando vuoi.",
      variant: "destructive",
    });

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/subscription');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast, navigate]);

  const sessionId = searchParams.get('session_id');

  return (
    <>
      <Helmet>
        <title>Pagamento Annullato - SardAI</title>
        <meta name="description" content="Il pagamento è stato annullato. Puoi riprovare quando vuoi." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          {/* Cancel Card */}
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Pagamento Annullato
              </CardTitle>
              
              <p className="text-gray-300 text-lg">
                Nessun problema! Il tuo pagamento è stato annullato
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Info Message */}
              <div className="bg-orange-900/20 border border-orange-500/30 p-6 rounded-lg">
                <h3 className="text-orange-300 font-semibold mb-3 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Cosa è successo?
                </h3>
                
                <div className="space-y-2 text-orange-200 text-sm">
                  <p>• Il processo di pagamento è stato interrotto</p>
                  <p>• Non è stato addebitato alcun importo</p>
                  <p>• Il tuo account rimane invariato</p>
                  <p>• Puoi riprovare in qualsiasi momento</p>
                </div>
              </div>

              {/* Premium Benefits Reminder */}
              <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-6 rounded-lg border border-yellow-500/20">
                <h3 className="text-yellow-300 font-semibold mb-3 flex items-center">
                  <Crown className="w-5 h-5 mr-2" />
                  Ti Ricordiamo i Vantaggi Premium:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Chat in lingua sarda autentica',
                    'Dialetti logudorese e campidanese',
                    'Contenuti culturali esclusivi',
                    'Traduzione italiano/sardo',
                    'Mini-corsi di lingua sarda',
                    'Guida turistica sarda interattiva',
                    'Supporto prioritario',
                    'Accesso anticipato alle novità'
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + (index * 0.1) }}
                      className="flex items-center space-x-2"
                    >
                      <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/subscription')}
                  className="w-full sardinian-gradient hover:opacity-90 text-lg py-4"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Riprova il Pagamento
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => navigate('/chat')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Gratuita
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>

              {/* Auto Redirect Notice */}
              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Reindirizzamento automatico agli abbonamenti tra {countdown} secondi...
                </p>
                <Button
                  onClick={() => navigate('/subscription')}
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                >
                  Vai subito
                </Button>
              </div>

              {/* Support */}
              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Hai avuto problemi con il pagamento?{' '}
                  <a 
                    href="mailto:info@sardai.tech" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Mail className="w-4 h-4 inline mr-1" />
                    Contattaci per assistenza
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
              "Aho, non ti preoccupare! Quando sei pronto, SardAI ti aspetta!" 😊
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}