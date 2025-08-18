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
  const { register } = useAuth();
  const { toast } = useToast();
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
        description: "La password deve essere di almeno 6 caratteri",
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
      toast({
        title: "Benvenuto in SardAI! 🎉",
        description: "Registrazione completata con successo! Ora puoi accedere al tuo account."
      });
      navigate('/dashboard');
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
    if (password.length < 6) return { strength: 'weak', color: 'text-red-400', text: 'Troppo corta' };
    if (password.length < 8) return { strength: 'medium', color: 'text-yellow-400', text: 'Media' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 'strong', color: 'text-green-400', text: 'Forte' };
    }
    return { strength: 'medium', color: 'text-yellow-400', text: 'Media' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
                      placeholder="Almeno 6 caratteri"
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