import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, BrainCircuit, FileDown, LayoutDashboard, Smile, ShieldCheck, Sparkles, Crown } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "Risposte in Streaming",
      description: "Dialoga in modo fluido e naturale con risposte che arrivano parola per parola, in tempo reale."
    },
    {
      icon: BrainCircuit,
      title: "Memoria Intelligente",
      description: "SardAI si ricorda di te! Nome, preferenze e dettagli delle chat per un'esperienza davvero personale."
    },
    {
      icon: FileDown,
      title: "Export PDF",
      description: "Salva le tue conversazioni più importanti in formato PDF, con un design professionale e logo."
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard Personale",
      description: "Tieni traccia delle tue conversazioni con statistiche e grafici dettagliati."
    },
    {
      icon: Smile,
      title: "Personalità Unica",
      description: "Un assistente che parla più di tua nonna, con un tocco di autentica ironia sarda."
    },
    {
      icon: Sparkles,
      title: "Veloce e Divertente",
      description: "Risposte immediate con il sorriso, che non guasta mai."
    },
    {
      icon: ShieldCheck,
      title: "Privacy al Primo Posto",
      description: "Controllo totale sui tuoi dati, con banner GDPR e policy trasparenti. I tuoi segreti sono al sicuro."
    }
  ];

  return (
    <>
      <Helmet>
        <title>SardAI - L'assistente AI che parla più di tua nonna</title>
        <meta name="description" content="Scopri SardAI, il chatbot AI con personalità sarda autentica. Conversazioni intelligenti, ironia garantita e un tocco di tradizione isolana." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center relative overflow-hidden">
           <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
           <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto relative z-10"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              L'assistente che parla
              <span className="block text-white mt-2">
                più di tua nonna
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Benvenuto nel primo chatbot AI con personalità sarda autentica!
              Preparati a conversazioni intelligenti condite con ironia,
              saggezza popolare e quel tocco di calore che solo noi sappiamo dare.
            </p>

            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="sardinian-gradient hover:opacity-90 text-lg px-8 py-6 pulse-glow rounded-full font-bold"
            >
              <MessageSquare className="w-6 h-6 mr-3" />
              Inizia a Chiacchierare
            </Button>
            
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/features')}
                className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
              >
                <Crown className="w-4 h-4 mr-2" />
                Scopri Premium
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cosa Rende SardAI Speciale
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="sardinian-card hover:border-blue-400/50 transition-all duration-300 h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 sardinian-gradient rounded-xl flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="sardinian-card max-w-4xl mx-auto p-8 md:p-12 rounded-2xl">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Pronto a farti due risate?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Registrati ora. È gratis e più veloce di un mirto a fine pasto.
                </p>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/register')}
                  className="sardinian-gradient hover:opacity-90 text-lg px-8 py-6 rounded-full font-bold"
                >
                  <Sparkles className="w-6 h-6 mr-3" />
                  Crea il tuo Account
                </Button>
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/features')}
                    className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Scopri Tutte le Funzionalità
                  </Button>
                </div>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}