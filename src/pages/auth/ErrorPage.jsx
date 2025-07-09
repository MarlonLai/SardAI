import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

export default function ErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');

  useEffect(() => {
    const errorMessage = searchParams.get('message') || 'Si è verificato un errore imprevisto';
    setMessage(decodeURIComponent(errorMessage));
  }, [searchParams]);

  const handleResendEmail = () => {
    navigate('/auth/resend-confirmation');
  };

  const getErrorDetails = (message) => {
    if (message.toLowerCase().includes('expired')) {
      return {
        title: 'Link Scaduto',
        description: 'Il link di conferma è scaduto. Richiedi un nuovo link per continuare.',
        showResend: true
      };
    }
    
    if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('token')) {
      return {
        title: 'Link Non Valido',
        description: 'Il link utilizzato non è valido o è già stato utilizzato. Richiedi un nuovo link.',
        showResend: true
      };
    }

    if (message.toLowerCase().includes('already confirmed')) {
      return {
        title: 'Account Già Confermato',
        description: 'Il tuo account è già stato confermato. Puoi accedere normalmente.',
        showResend: false
      };
    }

    return {
      title: 'Errore di Autenticazione',
      description: message,
      showResend: true
    };
  };

  const errorDetails = getErrorDetails(message);

  return (
    <>
      <Helmet>
        <title>Errore - SardAI</title>
        <meta name="description" content="Si è verificato un errore durante l'autenticazione." />
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
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                {errorDetails.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <p className="text-gray-300">
                {errorDetails.description}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full sardinian-gradient hover:opacity-90"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Torna al Login
                </Button>

                {errorDetails.showResend && (
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Richiedi Nuovo Link
                  </Button>
                )}

                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Riprova
                </Button>
              </div>

              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Hai bisogno di aiuto?{' '}
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