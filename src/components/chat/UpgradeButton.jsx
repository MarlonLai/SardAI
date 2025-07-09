import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStripe } from '@/hooks/useStripe';
import { Crown, Sparkles, Globe, Heart, Zap } from 'lucide-react';

export default function UpgradeButton({ planStatus, className = "" }) {
  const { loading, createCheckoutSession } = useStripe();

  const handleUpgrade = () => {
    createCheckoutSession();
  };

  if (planStatus?.can_use_premium) {
    return null; // Don't show upgrade button if user already has premium access
  }

  const trialDaysLeft = planStatus?.trial_days_left || 0;
  const isTrialActive = planStatus?.plan === 'trial' && trialDaysLeft > 0;

  return (
    <Card className={`sardinian-card premium-glow ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-white text-xl">
          {isTrialActive ? 'Prova Premium Attiva!' : 'Sblocca SardAI Premium'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isTrialActive && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-center">
            <p className="text-blue-300 font-semibold">
              Ti rimangono {trialDaysLeft} giorni di prova gratuita
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Aggiorna ora per continuare senza interruzioni
            </p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-white font-semibold text-center mb-3">
            Cosa ottieni con Premium:
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-3 text-sm">
              <Globe className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Chat in lingua sarda autentica</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Dialetti logudorese e campidanese</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Heart className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Contenuti culturali esclusivi</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-gray-300">Traduzione italiano/sardo</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <div className="mb-4">
            <span className="text-3xl font-bold text-white">€9.99</span>
            <span className="text-gray-400 text-sm">/mese</span>
          </div>
          
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full sardinian-gradient hover:opacity-90 text-lg py-3"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Caricamento...</span>
              </div>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                {isTrialActive ? 'Continua con Premium' : 'Diventa Premium'}
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-400 mt-2">
            Cancella in qualsiasi momento
          </p>
        </div>
      </CardContent>
    </Card>
  );
}