import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [type, setType] = useState('');
  const [nextUrl, setNextUrl] = useState('/dashboard');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const authType = searchParams.get('type') || 'signup';
    const next = searchParams.get('next') || '/dashboard';
    
    setType(authType);
    setNextUrl(decodeURIComponent(next));

    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(next);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, navigate]);

  const getSuccessDetails = (type) => {
    switch (type) {
      case 'signup':
        return {
          title: 'Account Confermato! 🎉',
          description: 'Il tuo account SardAI è stato confermato con successo. Ora puoi accedere a tutte le funzionalità.',
          buttonText: 'Inizia a Usare SardAI'
        };
      case 'recovery':
        return {
          title: 'Password Reimpostata! ✅',
          description: 'La tua password è stata reimpostata con successo. Ora puoi accedere con la nuova password.',
          buttonText: 'Vai alla Dashboard'
        };
      default:
        return {
          title: 'Operazione Completata! ✅',
          description: 'L\'operazione è stata completata con successo.',
          buttonText: 'Continua'
        };
    }
  };

  const successDetails = getSuccessDetails(type);

  return (
    <>
      <Helmet>
        <title>Successo - SardAI</title>
        <meta name="description" content="Operazione completata con successo." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-white">
                {successDetails.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <p className="text-gray-300">
                {successDetails.description}
              </p>

              {type === 'signup' && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-300 font-semibold">Benvenuto in SardAI!</span>
                  </div>
                  <p className="text-blue-200 text-sm">
                    Ora puoi iniziare a conversare con il tuo assistente sardo preferito.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => navigate(nextUrl)}
                  className="w-full sardinian-gradient hover:opacity-90"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {successDetails.buttonText}
                </Button>

                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Reindirizzamento automatico tra {countdown} secondi...
                  </p>
                  <Button
                    onClick={() => navigate(nextUrl)}
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Vai subito
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Hai domande?{' '}
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
        </motion.div>
      </div>
    </>
  );
}