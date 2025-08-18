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
import { Sparkles, Mail, Lock, User, ArrowLeft, Eye, EyeOff, CheckCircle, Send } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, resendConfirmationEmail } = useAuth();
  const { toast } = useToast();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non coincidono",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve essere di almeno 6 caratteri con almeno una maiuscola e un numero",
        variant: "destructive"
      });
      return;
    }

    // Additional password validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      toast({
        title: "Password troppo debole",
        description: "La password deve contenere almeno una lettera minuscola, una maiuscola e un numero",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    
    if (result.success) {
      if (result.needsConfirmation) {
        setUserEmail(formData.email);
        setRegistrationSuccess(true);
      } else {
        toast({
          title: "Benvenuto in SardAI! 🎉",
          description: "Registrazione completata con successo! Ora puoi accedere al tuo account."
        });
        navigate('/dashboard');
      }
    } else {
      let errorMessage = result.error || "Si è verificato un errore durante la registrazione.";
      
      // Handle specific error cases
      if (result.error?.includes('already registered') || result.error?.includes('already exists')) {
        errorMessage = "Questo indirizzo email è già registrato. Prova ad accedere o usa un'altra email.";
      } else if (result.error?.includes('invalid email')) {
        errorMessage = "L'indirizzo email non è valido.";
      } else if (result.error?.includes('weak password')) {
        errorMessage = "La password è troppo debole. Usa almeno 6 caratteri.";
      }
      
      toast({
        title: "Errore di registrazione",
        description: errorMessage,
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

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', color: 'text-red-400', text: 'Troppo corta (min 6)' };
    if (password.length < 8) return { strength: 'medium', color: 'text-yellow-400', text: 'Media (min 8 consigliati)' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 'strong', color: 'text-green-400', text: 'Forte' };
    }
    return { strength: 'medium', color: 'text-yellow-400', text: 'Media (aggiungi numeri/maiuscole)' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Success screen after registration
  if (registrationSuccess) {
    return (
      <>
        <Helmet>
          <title>Conferma Email - SardAI</title>
          <meta name="description" content="Controlla la tua email per confermare l'account SardAI." />
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
                  Registrazione Completata! 🎉
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center space-y-6">
                <p className="text-gray-300">
                  Abbiamo inviato un'email di conferma a <strong>{userEmail}</strong>
                </p>

                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-blue-300 font-semibold mb-2">Prossimi passi:</h3>
                  <ol className="text-blue-200 text-sm text-left space-y-1">
                    <li>1. Controlla la tua casella di posta</li>
                    <li>2. Cerca l'email da SardAI (info@sardai.tech)</li>
                    <li>3. Clicca sul link di conferma</li>
                    <li>4. Inizia a usare SardAI!</li>
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
                    onClick={() => navigate('/auth/resend-confirmation')}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Button
                      onClick={async () => {
                        const result = await resendConfirmationEmail(userEmail);
                        if (result.success) {
                          toast({
                            title: "Email reinviata! 📧",
                            description: "Controlla nuovamente la tua casella di posta."
                          });
                        }
                      }}
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      Reinvia Email
                    </Button>
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-slate-600">
                  <p className="text-gray-400 text-sm">
                    Controlla anche la cartella spam. Hai problemi?{' '}
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

  return (
    <>
      <Helmet>
        <title>Registrati - SardAI</title>
        <meta name="description" content="Crea il tuo account SardAI e inizia a conversare con l'assistente virtuale sardo." />
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

          {/* Register Form */}
          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Unisciti a SardAI
              </CardTitle>
              <CardDescription className="text-gray-300">
                Crea il tuo account e inizia a conversare
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Nome completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Il tuo nome"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

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
                      type={showPassword ? "text" : "password"}
                      placeholder="Almeno 6 caratteri (maiuscola + numero)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.password && (
                    <p className={`text-xs ${passwordStrength.color}`}>
                      Sicurezza: {passwordStrength.text}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Conferma password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ripeti la password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-400">
                      Le password non coincidono
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || formData.password !== formData.confirmPassword || !formData.name.trim()}
                  className="w-full sardinian-gradient hover:opacity-90 text-lg py-3"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Registrazione in corso...</span>
                    </div>
                  ) : (
                    'Crea Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-xs">
                  Registrandoti accetti i nostri{' '}
                  <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                    Termini di Servizio
                  </Link>
                  {' '}e la{' '}
                  <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-300">
                  Hai già un account?{' '}
                  <Link 
                    to="/login" 
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    Accedi qui
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}