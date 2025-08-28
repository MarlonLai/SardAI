import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  CreditCard, 
  Sparkles, 
  Crown,
  Shield,
  Clock
} from 'lucide-react';

export default function PaymentProcessingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dots, setDots] = useState('');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animated dots for loading effect
    const dotsTimer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Check for session_id and redirect accordingly
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    // Simulate processing time then redirect
    const redirectTimer = setTimeout(() => {
      if (success === 'true') {
        navigate('/stripe/success');
      } else if (canceled === 'true') {
        navigate('/stripe/cancel');
      } else {
        // Default redirect after processing
        navigate('/subscription');
      }
    }, 3000);

    return () => {
      clearInterval(dotsTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, searchParams]);

  return (
    <>
      <Helmet>
        <title>Elaborazione Pagamento - SardAI</title>
        <meta name="description" content="Stiamo elaborando il tuo pagamento. Attendere prego..." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          {/* Processing Card */}
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CreditCard className="w-8 h-8 text-white" />
              </motion.div>
              
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Elaborazione Pagamento{dots}
              </CardTitle>
              
              <p className="text-gray-300">
                Stiamo processando il tuo pagamento in sicurezza
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Processing Steps */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center space-x-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  </motion.div>
                  <span className="text-blue-300">Verifica dei dati di pagamento</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                  className="flex items-center space-x-3 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  >
                    <Crown className="w-5 h-5 text-yellow-400" />
                  </motion.div>
                  <span className="text-yellow-300">Attivazione abbonamento Premium</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center space-x-3 p-3 bg-green-900/20 rounded-lg border border-green-500/20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                  >
                    <Shield className="w-5 h-5 text-green-400" />
                  </motion.div>
                  <span className="text-green-300">Configurazione account</span>
                </motion.div>
              </div>

              {/* Security Notice */}
              <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold text-sm">Pagamento Sicuro</span>
                </div>
                <p className="text-gray-300 text-sm">
                  I tuoi dati di pagamento sono protetti da crittografia SSL e processati 
                  in sicurezza tramite Stripe, leader mondiale nei pagamenti online.
                </p>
              </div>

              {/* Processing Info */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Tempo di elaborazione: 30-60 secondi</span>
                </div>
                
                <p className="text-gray-400 text-sm">
                  Non chiudere questa pagina durante l'elaborazione
                </p>
              </div>

              {/* Auto Redirect Notice */}
              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Reindirizzamento automatico tra {countdown} secondi...
                </p>
              </div>

              {/* Support */}
              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Problemi con il pagamento?{' '}
                  <a 
                    href="mailto:info@sardai.tech" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Mail className="w-4 h-4 inline mr-1" />
                    Contatta il supporto
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fun Sardinian Touch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400 text-sm italic">
              "Aspetta un attimo, stiamo preparando tutto per te!" ⏳
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}