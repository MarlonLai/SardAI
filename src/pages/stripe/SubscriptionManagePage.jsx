import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  ArrowLeft, 
  Crown, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Sparkles,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react';
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

export default function SubscriptionManagePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { subscription, loading, refetch } = useSubscription();
  const { toast } = useToast();
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manage-subscription', {
        body: {
          action: 'cancel',
          subscription_id: subscription.subscription_id
        }
      });

      if (error) throw error;

      toast({
        title: "Abbonamento annullato",
        description: "Il tuo abbonamento verrà cancellato alla fine del periodo corrente.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Errore nell'annullamento",
        description: error.message || "Impossibile annullare l'abbonamento.",
        variant: "destructive",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-manage-subscription', {
        body: {
          action: 'reactivate',
          subscription_id: subscription.subscription_id
        }
      });

      if (error) throw error;

      toast({
        title: "Abbonamento riattivato! 🎉",
        description: "Il tuo abbonamento Premium è stato riattivato con successo.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Errore nella riattivazione",
        description: error.message || "Impossibile riattivare l'abbonamento.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Attivo' },
      past_due: { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle, label: 'Scaduto' },
      canceled: { color: 'bg-red-500/20 text-red-400', icon: AlertTriangle, label: 'Cancellato' },
      trialing: { color: 'bg-blue-500/20 text-blue-400', icon: Clock, label: 'Prova' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (amount, currency) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subscription?.isActive) {
    return (
      <>
        <Helmet>
          <title>Gestione Abbonamento - SardAI</title>
          <meta name="description" content="Gestisci il tuo abbonamento SardAI Premium." />
        </Helmet>

        <div className="min-h-screen sardinian-pattern">
          <header className="glass-effect border-b border-white/10 p-4">
            <div className="container mx-auto flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/subscription')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna agli Abbonamenti
              </Button>
              
              <h1 className="text-2xl font-bold text-white">Gestione Abbonamento</h1>
              
              <div className="w-32"></div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="sardinian-card text-center">
                <CardContent className="p-8">
                  <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Nessun Abbonamento Attivo
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Non hai un abbonamento Premium attivo. Scopri tutti i vantaggi!
                  </p>
                  <Button
                    onClick={() => navigate('/subscription')}
                    className="sardinian-gradient hover:opacity-90"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Diventa Premium
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestione Abbonamento Premium - SardAI</title>
        <meta name="description" content="Gestisci il tuo abbonamento SardAI Premium, visualizza fatture e modifica impostazioni." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern">
        {/* Header */}
        <header className="glass-effect border-b border-white/10 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/subscription')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna agli Abbonamenti
            </Button>
            
            <h1 className="text-2xl font-bold text-white">Gestione Abbonamento</h1>
            
            <div className="w-32"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Subscription Overview */}
              <Card className="sardinian-card premium-glow">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                    Il Tuo Abbonamento Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm">Piano Attuale</p>
                        <p className="text-white text-xl font-semibold">
                          {subscription.product?.name || 'SardAI Premium'}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(subscription.subscription_status)}
                          {subscription.cancel_at_period_end && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-0">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              In Cancellazione
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm">Prezzo</p>
                        <p className="text-white text-lg font-medium">
                          {subscription.product?.price} {subscription.product?.currency?.toUpperCase()} / {subscription.product?.interval === 'month' ? 'mese' : 'anno'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm">Prossimo Rinnovo</p>
                        <p className="text-white text-lg font-medium">
                          {subscription.current_period_end ? 
                            formatDate(subscription.current_period_end) : 
                            'Non disponibile'
                          }
                        </p>
                      </div>

                      {subscription.payment_method_last4 && (
                        <div>
                          <p className="text-gray-400 text-sm">Metodo di Pagamento</p>
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="text-white">
                              {subscription.payment_method_brand?.toUpperCase()} •••• {subscription.payment_method_last4}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {subscription.cancel_at_period_end && (
                    <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">Abbonamento in Cancellazione</span>
                      </div>
                      <p className="text-yellow-200 text-sm">
                        Il tuo abbonamento verrà cancellato il {formatDate(subscription.current_period_end)}. 
                        Potrai continuare a usare le funzionalità Premium fino a quella data.
                      </p>
                      <Button
                        onClick={handleReactivateSubscription}
                        className="mt-3 sardinian-gradient hover:opacity-90"
                        size="sm"
                      >
                        Riattiva Abbonamento
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Billing Management */}
                <Card className="sardinian-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Fatturazione
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          toast({
                            title: "🚧 Funzionalità in arrivo!",
                            description: "La gestione delle fatture sarà disponibile presto."
                          });
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Scarica Fatture
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          toast({
                            title: "🚧 Funzionalità in arrivo!",
                            description: "La modifica del metodo di pagamento sarà disponibile presto."
                          });
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Modifica Metodo di Pagamento
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Actions */}
                <Card className="sardinian-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Gestione Abbonamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {!subscription.cancel_at_period_end ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Annulla Abbonamento
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sardinian-card">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Annulla Abbonamento Premium</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler annullare il tuo abbonamento Premium? 
                                Potrai continuare a usare le funzionalità Premium fino al {formatDate(subscription.current_period_end)}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Mantieni Premium</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleCancelSubscription}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={cancelLoading}
                              >
                                {cancelLoading ? 'Annullamento...' : 'Annulla Abbonamento'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          onClick={handleReactivateSubscription}
                          className="w-full justify-start sardinian-gradient hover:opacity-90"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Riattiva Abbonamento
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                        onClick={() => {
                          toast({
                            title: "🚧 Funzionalità in arrivo!",
                            description: "Il cambio piano sarà disponibile presto."
                          });
                        }}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Cambia Piano
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Billing History */}
              <Card className="sardinian-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Cronologia Fatturazione
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Sample billing history - replace with real data */}
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {subscription.product?.name || 'SardAI Premium'}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatDate(subscription.current_period_start || Date.now() / 1000)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-white font-medium">
                          {subscription.product?.price} {subscription.product?.currency?.toUpperCase()}
                        </p>
                        <Badge className="bg-green-500/20 text-green-400 border-0 mt-1">
                          Pagato
                        </Badge>
                      </div>
                    </div>

                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">
                        La cronologia completa delle fatture sarà disponibile presto
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support Section */}
              <Card className="sardinian-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Supporto e Assistenza
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold">Hai Domande?</h3>
                      <p className="text-gray-300 text-sm">
                        Il nostro team di supporto è qui per aiutarti con qualsiasi domanda 
                        sul tuo abbonamento Premium.
                      </p>
                      <Button
                        variant="outline"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        onClick={() => window.open('mailto:info@sardai.tech', '_blank')}
                      >
                        Contatta il Supporto
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold">Informazioni Utili</h3>
                      <div className="space-y-2 text-sm text-gray-300">
                        <p>• Puoi annullare in qualsiasi momento</p>
                        <p>• Nessun costo di cancellazione</p>
                        <p>• Accesso Premium fino alla scadenza</p>
                        <p>• Fatture inviate via email</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}