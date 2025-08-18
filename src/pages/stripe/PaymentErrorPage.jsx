import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertTriangle, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Mail,
  CreditCard,
  HelpCircle,
  MessageCircle
} from 'lucide-react';

export default function PaymentErrorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error') || 'Si è verificato un errore durante il pagamento';
    const errorCode = searchParams.get('error_code') || '';
    
    setErrorMessage(decodeURIComponent(error));

    // Show error toast
    toast({
      title: "Errore nel pagamento",
      description: "Si è verificato un problema durante il processo di pagamento.",
      variant: "destructive",
    });
  }, [searchParams, toast]);

  const getErrorDetails = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('card') || lowerMessage.includes('declined')) {
      return {
        title: 'Carta Rifiutata',
        description: 'La tua carta di credito è stata rifiutata. Verifica i dati inseriti o prova con un\'altra carta.',
        suggestions: [
          'Controlla il numero della carta',
          'Verifica la data di scadenza',
          'Controlla il codice CVV',
          'Assicurati di avere fondi sufficienti',
          'Prova con un\'altra carta'
        ]
      };
    }
    
    if (lowerMessage.includes('expired')) {
      return {
        title: 'Sessione Scaduta',
        description: 'La sessione di pagamento è scaduta. Riprova il processo dall\'inizio.',
        suggestions: [
          'Torna alla pagina abbonamenti',
          'Seleziona nuovamente il piano',
          'Completa il pagamento entro 30 minuti'
        ]
      };
    }

    if (lowerMessage.includes('insufficient')) {
      return {
        title: 'Fondi Insufficienti',
        description: 'Non ci sono fondi sufficienti sulla carta per completare il pagamento.',
        suggestions: [
          'Verifica il saldo della carta',
          'Prova con un\'altra carta',
          'Contatta la tua banca'
        ]
      };
    }

    return {
      title: 'Errore di Pagamento',
      description: message,
      suggestions: [
        'Riprova il pagamento',
        'Verifica i dati della carta',
        'Prova con un\'altra carta',
        'Contatta il supporto se il problema persiste'
      ]
    };
  };

  const errorDetails = getErrorDetails(errorMessage);

  return (
    <>
      <Helmet>
        <title>Errore Pagamento - SardAI</title>
        <meta name="description" content="Si è verificato un errore durante il processo di pagamento." />
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
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertTriangle className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          {/* Error Card */}
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-white mb-2">
                {errorDetails.title}
              </CardTitle>
              
              <p className="text-gray-300 text-lg">
                {errorDetails.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Details */}
              <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-lg">
                <h3 className="text-red-300 font-semibold mb-3 flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Cosa Puoi Fare:
                </h3>
                
                <ul className="space-y-2 text-red-200 text-sm">
                  {errorDetails.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Issues */}
              <div className="bg-slate-800/30 p-6 rounded-lg border border-slate-600">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Problemi Comuni:
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                  <div>
                    <p className="font-medium text-white mb-1">Carta Rifiutata</p>
                    <p>Verifica numero, scadenza e CVV</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-white mb-1">Fondi Insufficienti</p>
                    <p>Controlla il saldo disponibile</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-white mb-1">Carta Scaduta</p>
                    <p>Usa una carta con data valida</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-white mb-1">Blocco Banca</p>
                    <p>Contatta la tua banca</p>
                  </div>
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

              {/* Support Section */}
              <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg">
                <h3 className="text-blue-300 font-semibold mb-3 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Hai Bisogno di Aiuto?
                </h3>
                
                <p className="text-blue-200 text-sm mb-4">
                  Il nostro team di supporto è qui per aiutarti con qualsiasi problema di pagamento.
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <a 
                      href="mailto:info@sardai.tech" 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      info@sardai.tech
                    </a>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-200">Risposta entro 24 ore</span>
                  </div>
                </div>
              </div>

              {/* Technical Details (if available) */}
              {searchParams.get('error_code') && (
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                  <h4 className="text-gray-400 font-medium mb-2">Dettagli Tecnici:</h4>
                  <div className="text-xs text-gray-500 font-mono">
                    <p>Codice Errore: {searchParams.get('error_code')}</p>
                    <p>Sessione: {searchParams.get('session_id')?.substring(0, 20)}...</p>
                  </div>
                </div>
              )}
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
              "Madonna mia! Qualcosa è andato storto, ma non ti preoccupare!" 😅
            </p>
        </motion.div>
      </div>
    </>
  );
}