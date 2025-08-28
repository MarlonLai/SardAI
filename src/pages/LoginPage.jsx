import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { validateEmail } from '@/utils/validation';
import { Sparkles, Mail, Lock, ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, sendPasswordResetEmail } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      toast({
        title: "Errore",
        description: emailValidation.error,
        variant: "destructive"
      });
      return;
    }

    if (!formData.password) {
      toast({
        title: "Errore",
        description: "La password è obbligatoria",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast({
        title: "Bentornato! 🎉",
        description: "Accesso effettuato con successo. Benvenuto in SardAI!"
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Errore di accesso",
        description: result.error || "Credenziali non valide",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Email richiesta",
        description: "Per favore, inserisci la tua email per il recupero.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { success, error } = await sendPasswordResetEmail(resetEmail);
    if (success) {
      toast({
        title: "Email inviata!",
        description: "Controlla la tua casella di posta per le istruzioni di recupero.",
      });
    } else {
      toast({
        title: "Errore",
        description: error || "Impossibile inviare l'email di recupero.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Accedi - SardAI</title>
        <meta name="description" content="Accedi al tuo account SardAI e inizia a conversare con l'assistente virtuale sardo." />
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
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/10 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
            
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          {/* Login Form */}
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Bentornato!
              </CardTitle>
              <CardDescription className="text-gray-300">
                Accedi al tuo account per continuare a conversare
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="la.tua.email@esempio.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="La tua password"
                      value={formData.password}
                      onChange={handleChange}
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
                  {loading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-300">
                  Non hai ancora un account?{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Registrati qui
                  </Link>
                </p>
              </div>

              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth/resend-confirmation')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Password dimenticata?
                </Button>
              </div>
              
              <div className="mt-2 text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth/resend-confirmation')}
                  className="text-gray-400 hover:text-gray-300 text-sm"
                >
                  Non hai ricevuto l'email di conferma?
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}