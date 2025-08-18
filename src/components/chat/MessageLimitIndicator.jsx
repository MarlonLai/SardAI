import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Clock, 
  MessageCircle, 
  AlertTriangle,
  Zap,
  Calendar
} from 'lucide-react';

export default function MessageLimitIndicator({ limits, timeUntilReset }) {
  const navigate = useNavigate();

  if (!limits || limits.is_admin || limits.plan === 'premium') {
    return null; // No limits for premium users
  }

  // Show trial status
  if (limits.plan === 'trial' && limits.trial_ends_at) {
    const trialEnd = new Date(limits.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4"
        >
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-300 font-semibold text-sm">Prova Gratuita Attiva</p>
                    <p className="text-blue-200 text-xs">
                      {daysLeft} giorni rimasti • Messaggi illimitati
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/subscription')}
                  className="sardinian-gradient hover:opacity-90"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
  }

  // Free plan limits
  const progressPercentage = (limits.messages_used / limits.daily_limit) * 100;
  const isNearLimit = limits.messages_used >= limits.daily_limit - 1;
  const isAtLimit = !limits.can_send;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4"
    >
      <Card className={`${
        isAtLimit 
          ? 'bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30' 
          : isNearLimit
          ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30'
          : 'bg-gradient-to-r from-slate-900/20 to-slate-800/20 border border-slate-600'
      }`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className={`w-4 h-4 ${
                  isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-blue-400'
                }`} />
                <span className={`font-semibold text-sm ${
                  isAtLimit ? 'text-red-300' : isNearLimit ? 'text-yellow-300' : 'text-blue-300'
                }`}>
                  Messaggi Giornalieri
                </span>
              </div>
              
              {isAtLimit && (
                <Button
                  size="sm"
                  onClick={() => navigate('/subscription')}
                  className="sardinian-gradient hover:opacity-90"
                >
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={isAtLimit ? 'text-red-300' : 'text-gray-300'}>
                  {limits.messages_used} / {limits.daily_limit} utilizzati
                </span>
                <span className={isAtLimit ? 'text-red-300' : 'text-gray-300'}>
                  {limits.messages_remaining} rimasti
                </span>
              </div>
              
              <Progress 
                value={progressPercentage} 
                className={`h-2 ${
                  isAtLimit ? 'bg-red-900/30' : isNearLimit ? 'bg-yellow-900/30' : 'bg-slate-700'
                }`}
              />
            </div>

            {/* Status Message */}
            {isAtLimit ? (
              <div className="flex items-center space-x-2 text-red-300 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>Limite raggiunto! Reset tra {timeUntilReset.hours}h {timeUntilReset.minutes}m</span>
              </div>
            ) : isNearLimit ? (
              <div className="flex items-center space-x-2 text-yellow-300 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>Attenzione: solo {limits.messages_remaining} messaggio/i rimasto/i oggi</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400 text-xs">
                <Clock className="w-3 h-3" />
                <span>Reset tra {timeUntilReset.hours}h {timeUntilReset.minutes}m</span>
              </div>
            )}

            {/* Upgrade prompt for free users */}
            {(isAtLimit || isNearLimit) && (
              <div className="pt-2 border-t border-slate-600">
                <p className="text-xs text-gray-400 text-center mb-2">
                  Passa a Premium per messaggi illimitati
                </p>
                <div className="flex items-center justify-center space-x-1 text-xs">
                  <Crown className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">€5/mese</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">Chat sarda autentica</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}