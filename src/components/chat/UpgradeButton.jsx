import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStripe } from '@/hooks/useStripe';
import { useSubscription } from '@/hooks/useSubscription';
import { STRIPE_PRODUCTS } from '@/stripe-config';
import { Crown, Sparkles, Globe, Heart, Zap } from 'lucide-react';

export default function UpgradeButton({ className = "" }) {
  const { loading, createCheckoutSession } = useStripe();
  const { subscription } = useSubscription();

  const handleUpgrade = (priceId) => {
    createCheckoutSession(priceId, 'subscription');
  };

  if (subscription?.isActive) {
    return null; // Don't show upgrade button if user already has active subscription
  }

  const monthlyProduct = STRIPE_PRODUCTS.find(p => p.interval === 'month');
  const yearlyProduct = STRIPE_PRODUCTS.find(p => p.interval === 'year');

  return (
    <Card className={`sardinian-card premium-glow ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-white text-xl">
          Sblocca SardAI Premium
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
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

        <div className="text-center pt-4 space-y-3">
          {monthlyProduct && (
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl font-bold text-white">
                  {monthlyProduct.price} {monthlyProduct.currency}
                </span>
                <span className="text-gray-400 text-sm">/mese</span>
              </div>
              
              <Button
                onClick={() => handleUpgrade(monthlyProduct.priceId)}
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
                    Diventa Premium
                  </>
                )}
              </Button>
            </div>
          )}

          {yearlyProduct && (
            <div className="border-t border-slate-600 pt-3">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-lg font-bold text-white">
                  {yearlyProduct.price} {yearlyProduct.currency}
                </span>
                <span className="text-gray-400 text-sm">/anno</span>
                <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
                  Risparmia 17%
                </span>
              </div>
              
              <Button
                onClick={() => handleUpgrade(yearlyProduct.priceId)}
                disabled={loading}
                variant="outline"
                className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                Piano Annuale
              </Button>
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-2">
            Cancella in qualsiasi momento
          </p>
        </div>
      </CardContent>
    </Card>
  );
}