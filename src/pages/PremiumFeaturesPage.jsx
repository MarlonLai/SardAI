import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useStripe } from '@/hooks/useStripe';
import { STRIPE_PRODUCTS } from '@/stripe-config';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Sparkles,
  Globe,
  Heart,
  Zap,
  BookOpen,
  Map,
  MessageCircle,
  Users,
  Star,
  Gift,
  Headphones,
  Download,
  Calendar,
  Shield,
  Infinity,
  Clock,
  Target,
  Award,
  Mic,
  Volume2,
  FileText,
  Camera,
  Music,
  Palette
} from 'lucide-react';

export default function PremiumFeaturesPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { subscription } = useSubscription();
  const { createCheckoutSession, loading } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const handleUpgrade = (priceId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    createCheckoutSession(priceId, 'subscription');
  };

  // Premium Features organized by category
  const premiumFeatures = {
    language: {
      title: "Lingua Sarda Autentica",
      icon: Globe,
      color: "text-blue-400",
      features: [
        {
          name: "Dialetto Logudorese",
          description: "Conversazioni complete nel dialetto del nord Sardegna",
          icon: MessageCircle
        },
        {
          name: "Dialetto Campidanese", 
          description: "Chat autentica nel dialetto del sud dell'isola",
          icon: MessageCircle
        },
        {
          name: "Dialetto Sassarese",
          description: "Variante linguistica di Sassari e provincia",
          icon: MessageCircle
        },
        {
          name: "Traduttore Bidirezionale",
          description: "Traduzione istantanea italiano ↔ sardo",
          icon: Globe
        }
      ]
    },
    culture: {
      title: "Contenuti Culturali Esclusivi",
      icon: Heart,
      color: "text-red-400",
      features: [
        {
          name: "Storia e Tradizioni",
          description: "Racconti storici, leggende e tradizioni popolari",
          icon: BookOpen
        },
        {
          name: "Ricette Tradizionali",
          description: "Cucina sarda autentica con ingredienti e preparazioni",
          icon: Heart
        },
        {
          name: "Feste e Sagre",
          description: "Calendario eventi e celebrazioni tradizionali",
          icon: Calendar
        },
        {
          name: "Musica e Folklore",
          description: "Canti tradizionali, balli e strumenti tipici",
          icon: Music
        }
      ]
    },
    learning: {
      title: "Apprendimento Interattivo",
      icon: BookOpen,
      color: "text-green-400",
      features: [
        {
          name: "Mini-Corsi di Sardo",
          description: "Lezioni progressive per imparare la lingua",
          icon: BookOpen
        },
        {
          name: "Pronuncia Audio",
          description: "Ascolta la pronuncia corretta delle parole",
          icon: Volume2
        },
        {
          name: "Esercizi Interattivi",
          description: "Quiz e giochi per praticare la lingua",
          icon: Target
        },
        {
          name: "Certificati di Completamento",
          description: "Riconoscimenti per i progressi raggiunti",
          icon: Award
        }
      ]
    },
    tourism: {
      title: "Guida Turistica Intelligente",
      icon: Map,
      color: "text-purple-400",
      features: [
        {
          name: "Itinerari Personalizzati",
          description: "Percorsi su misura basati sui tuoi interessi",
          icon: Map
        },
        {
          name: "Luoghi Nascosti",
          description: "Scopri gemme segrete conosciute solo dai locali",
          icon: Camera
        },
        {
          name: "Consigli Gastronomici",
          description: "Ristoranti autentici e specialità locali",
          icon: Heart
        },
        {
          name: "Eventi in Tempo Reale",
          description: "Sagre, concerti e manifestazioni attuali",
          icon: Calendar
        }
      ]
    },
    exclusive: {
      title: "Funzionalità Esclusive",
      icon: Crown,
      color: "text-yellow-400",
      features: [
        {
          name: "Chat Illimitate",
          description: "Nessun limite di messaggi o conversazioni",
          icon: Infinity
        },
        {
          name: "Supporto Prioritario",
          description: "Assistenza dedicata entro 2 ore",
          icon: Headphones
        },
        {
          name: "Export Conversazioni",
          description: "Salva le chat in PDF con design personalizzato",
          icon: Download
        },
        {
          name: "Accesso Anticipato",
          description: "Prova le nuove funzionalità prima di tutti",
          icon: Star
        }
      ]
    }
  };

  const pricingPlans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: '0',
      currency: 'EUR',
      interval: 'sempre',
      description: 'Perfetto per iniziare',
      features: [
        'Chat in italiano con carattere sardo',
        'Informazioni base sulla Sardegna',
        'Umorismo e calore tipico sardo',
        '10 messaggi al giorno',
        'Supporto via email'
      ],
      buttonText: 'Piano Attuale',
      buttonVariant: 'outline',
      popular: false
    },
    {
      id: 'monthly',
      name: 'Premium Mensile',
      price: '5.00',
      currency: 'EUR',
      interval: 'mese',
      description: 'Ideale per esploratori curiosi',
      features: [
        'Tutte le funzionalità gratuite',
        'Chat in lingua sarda autentica',
        'Tutti i dialetti disponibili',
        'Contenuti culturali esclusivi',
        'Mini-corsi di lingua sarda',
        'Guida turistica interattiva',
        'Chat illimitate',
        'Supporto prioritario',
        'Export PDF conversazioni'
      ],
      buttonText: 'Inizia Subito',
      buttonVariant: 'default',
      popular: true,
      priceId: 'price_1RgpsmP3ZDp2xQGdHpezzWn0'
    },
    {
      id: 'yearly',
      name: 'Premium Annuale',
      price: '50.00',
      currency: 'CHF',
      interval: 'anno',
      description: 'Massimo valore per veri appassionati',
      features: [
        'Tutte le funzionalità Premium',
        'Risparmio del 17% sul piano mensile',
        'Accesso anticipato alle novità',
        'Sessioni di coaching culturale',
        'Contenuti esclusivi mensili',
        'Certificati di completamento',
        'Supporto telefonico dedicato',
        'Inviti a eventi speciali'
      ],
      buttonText: 'Risparmia il 17%',
      buttonVariant: 'default',
      popular: false,
      priceId: 'price_1Rgpu7P3ZDp2xQGdtuxS42fy',
      savings: true
    }
  ];

  const testimonials = [
    {
      name: "Maria Carta",
      location: "Cagliari",
      text: "Finalmente posso parlare sardo con un'AI! È incredibile quanto sia autentica.",
      rating: 5
    },
    {
      name: "Giuseppe Mereu", 
      location: "Nuoro",
      text: "I mini-corsi sono fantastici. Sto imparando il logudorese che non conoscevo.",
      rating: 5
    },
    {
      name: "Anna Sanna",
      location: "Sassari", 
      text: "La guida turistica mi ha fatto scoprire posti che non sapevo esistessero!",
      rating: 5
    }
  ];

  const isAdmin = profile?.role === 'admin';
  const isPremium = subscription?.isActive || isAdmin;

  return (
    <>
      <Helmet>
        <title>Funzionalità Premium - SardAI</title>
        <meta name="description" content="Scopri tutte le funzionalità premium di SardAI: chat in sardo autentico, contenuti culturali esclusivi e molto altro." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern">
        {/* Header */}
        <header className="glass-effect border-b border-white/10 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna Indietro
            </Button>
            
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Crown className="w-6 h-6 mr-2 text-yellow-400" />
              SardAI Premium
            </h1>
            
            <div className="w-32"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Sblocca il Vero
                <span className="block sardinian-gradient bg-clip-text text-transparent">
                  Potere di SardAI
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Immergiti nella cultura sarda autentica con funzionalità esclusive, 
                dialetti originali e contenuti che solo un vero sardo può offrirti.
              </p>

              {!isPremium && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => handleUpgrade(STRIPE_PRODUCTS.find(p => p.interval === 'month')?.priceId)}
                    disabled={loading}
                    className="sardinian-gradient hover:opacity-90 text-lg px-8 py-4"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Diventa Premium
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/chat')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4"
                  >
                    Prova Gratuita
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Features Showcase */}
          <div className="space-y-16">
            {Object.entries(premiumFeatures).map(([key, category], categoryIndex) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className={`w-12 h-12 sardinian-gradient rounded-xl flex items-center justify-center`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white">{category.title}</h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card className="sardinian-card hover:border-yellow-400/50 transition-all duration-300 h-full">
                        <CardHeader className="text-center">
                          <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <feature.icon className="w-6 h-6 text-white" />
                          </div>
                          <CardTitle className="text-white text-lg">{feature.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300 text-sm text-center">
                            {feature.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pricing Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-white mb-4">
                Scegli il Tuo Piano
              </h3>
              <p className="text-xl text-gray-300">
                Prezzi trasparenti, nessun costo nascosto
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-yellow-500 text-black px-4 py-1 text-sm font-medium">
                        <Star className="w-3 h-3 mr-1" />
                        Più Popolare
                      </Badge>
                    </div>
                  )}

                  <Card className={`sardinian-card h-full ${plan.popular ? 'premium-glow border-yellow-500/30' : ''} ${plan.id === 'free' ? 'opacity-75' : ''}`}>
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        plan.id === 'free' ? 'bg-gray-600' : 'sardinian-gradient'
                      }`}>
                        {plan.id === 'free' ? (
                          <Users className="w-8 h-8 text-white" />
                        ) : (
                          <Crown className="w-8 h-8 text-white" />
                        )}
                      </div>
                      
                      <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
                      <p className="text-gray-300 mb-4">{plan.description}</p>
                      
                      <div className="text-center">
                        <div className="text-4xl font-bold text-white">
                          €{plan.price}
                          <span className="text-lg font-normal text-gray-400">/{plan.interval}</span>
                        </div>
                        {plan.savings && (
                          <div className="text-green-400 text-sm mt-2 flex items-center justify-center">
                            <Gift className="w-4 h-4 mr-1" />
                            Risparmia €10 all'anno!
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start space-x-3">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        {plan.id === 'free' ? (
                          <Button
                            disabled
                            variant="outline"
                            className="w-full border-gray-500 text-gray-400"
                          >
                            Piano Attuale
                          </Button>
                        ) : isPremium ? (
                          <Button
                            disabled
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Già Premium
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleUpgrade(plan.priceId)}
                            disabled={loading}
                            className={`w-full text-lg py-3 ${
                              plan.popular 
                                ? 'sardinian-gradient hover:opacity-90' 
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                            }`}
                          >
                            {loading ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Caricamento...</span>
                              </div>
                            ) : (
                              <>
                                <Crown className="w-4 h-4 mr-2" />
                                {plan.buttonText}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-white mb-4">
                Cosa Dicono i Nostri Utenti
              </h3>
              <p className="text-xl text-gray-300">
                Storie di successo dalla comunità SardAI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="sardinian-card h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      
                      <p className="text-gray-300 mb-4 italic">
                        "{testimonial.text}"
                      </p>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sardinian-gradient rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{testimonial.name}</p>
                          <p className="text-gray-400 text-sm">{testimonial.location}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-white mb-4">
                Domande Frequenti
              </h3>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              {[
                {
                  question: "Posso cancellare in qualsiasi momento?",
                  answer: "Sì, puoi cancellare il tuo abbonamento in qualsiasi momento dal tuo profilo. Continuerai ad avere accesso Premium fino alla fine del periodo pagato."
                },
                {
                  question: "Quanto è autentico il sardo parlato?",
                  answer: "SardAI è stato addestrato su testi autentici in logudorese, campidanese e sassarese. Collaboriamo con linguisti sardi per garantire l'autenticità."
                },
                {
                  question: "Posso usare SardAI offline?",
                  answer: "Attualmente SardAI richiede una connessione internet. Stiamo lavorando su una versione offline per le funzionalità base."
                },
                {
                  question: "Ci sono sconti per studenti?",
                  answer: "Sì! Contattaci a info@sardai.tech con la tua tessera studente per ottenere uno sconto del 30% sul piano annuale."
                }
              ].map((faq, index) => (
                <Card key={index} className="sardinian-card">
                  <CardContent className="p-6">
                    <h4 className="text-white font-semibold mb-3">{faq.question}</h4>
                    <p className="text-gray-300 text-sm">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Final CTA */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mt-20"
            >
              <Card className="sardinian-card premium-glow max-w-4xl mx-auto">
                <CardContent className="p-8 md:p-12 text-center">
                  <Crown className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                  
                  <h3 className="text-4xl font-bold text-white mb-4">
                    Pronto per l'Esperienza Completa?
                  </h3>
                  
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Unisciti a migliaia di sardi e appassionati che stanno già conversando 
                    in lingua autentica con SardAI Premium.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => handleUpgrade(STRIPE_PRODUCTS.find(p => p.interval === 'month')?.priceId)}
                      disabled={loading}
                      className="sardinian-gradient hover:opacity-90 text-lg px-8 py-4"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Inizia Oggi - €5/mese
                    </Button>
                    
                    <Button
                      onClick={() => handleUpgrade(STRIPE_PRODUCTS.find(p => p.interval === 'year')?.priceId)}
                      disabled={loading}
                      variant="outline"
                      className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 text-lg px-8 py-4"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Piano Annuale - Risparmia 17%
                    </Button>
                  </div>

                  <p className="text-gray-400 text-sm mt-4">
                    Garanzia soddisfatti o rimborsati entro 30 giorni
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}