import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Mail, ArrowLeft, Sparkles, Send } from 'lucide-react';

export default function ResendConfirmationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Errore",
        description: "Inserisci il tuo indirizzo email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Use custom email handler
      const { data, error } = await supabase.functions.invoke('custom-email-handler', {
        body: {
          type: 'resend_confirmation',
          email: email,
          redirectTo: `${window.location.origin}/auth/confirm?type=signup`
        }
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Email inviata! 📧",
        description: "Controlla la tua casella di posta per il link di conferma."
      });

    } catch (error) {
      toast({
        title: "Errore nell'invio",
        description: error.message || "Impossibile inviare l'email di conferma.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <Helmet>
          <title>Email Inviata - SardAI</title>
          <meta name="description" content="Email di conferma inviata con successo." />
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
                  <Send className="w-8 h-8 text-white" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-white">
                  Email Inviata! 📧
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center space-y-6">
                <p className="text-gray-300">
                  Abbiamo inviato un nuovo link di conferma a <strong>{email}</strong>
                </p>

                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-300 font-semibold mb-2">Cosa fare ora:</h3>
                  <ol className="text-blue-200 text-sm text-left space-y-1">
                    <li>1. Controlla la tua casella di posta</li>
                    <li>2. Cerca l'email da SardAI</li>
                    <li>3. Clicca sul link di conferma</li>
                    <li>4. Completa la registrazione</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full sardinian-gradient hover:opacity-90"
                  >
                    Vai al Login
                  </Button>

                  <Button
                    onClick={() => setSent(false)}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Invia a un altro indirizzo
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-slate-600">
                  <p className="text-gray-400 text-sm">
                    Non hai ricevuto l'email? Controlla la cartella spam o{' '}
                    <a 
                      href="mailto:info@sardai.tech" 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      contattaci
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

  return (
    <>
      <Helmet>
        <title>Reinvia Conferma - SardAI</title>
        <meta name="description" content="Richiedi un nuovo link di conferma per il tuo account SardAI." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-white hover:bg-white/10 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al Login
            </Button>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          {/* Resend Form */}
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Reinvia Conferma
              </CardTitle>
              <p className="text-gray-300">
                Inserisci la tua email per ricevere un nuovo link di conferma
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Indirizzo Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="la.tua.email@esempio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sardinian-gradient hover:opacity-90 text-lg py-3"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Invio in corso...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Invia Link di Conferma
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-300 text-sm">
                  Hai già confermato il tuo account?{' '}
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="text-blue-400 hover:text-blue-300 p-0 h-auto font-medium"
                  >
                    Accedi qui
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}