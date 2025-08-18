import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Clock, 
  MessageCircle, 
  AlertTriangle,
  Sparkles,
  Calendar,
  Gift,
  Zap
} from 'lucide-react';

export default function MessageLimitBlocker({ limits, timeUntilReset }) {
  const navigate = useNavigate();

  if (!limits || limits.can_send) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex items-center justify-center p-8"
    >
      <Card className="sardinian-card max-w-md w-full text-center">
        <CardHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <AlertTriangle className="w-8 h-8 text-white" />
          </motion.div>
          
          <CardTitle className="text-2xl text-white mb-2">
            Limite Messaggi Raggiunto! 📝
          </CardTitle>
          
          <p className="text-gray-300">
            Hai utilizzato tutti i <strong>{limits.daily_limit} messaggi gratuiti</strong> di oggi
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Reset Timer */}
          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-600">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 font-semibold">Reset Automatico</span>
            </div>
            <p className="text-white text-lg font-bold">
              {timeUntilReset.hours}h {timeUntilReset.minutes}m
            </p>
            <p className="text-gray-400 text-sm">
              I tuoi messaggi si resettano a mezzanotte
            </p>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-4 rounded-lg border border-yellow-500/20">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-semibold">SardAI Premium</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-200">Messaggi illimitati</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <MessageCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-200">Chat in lingua sarda autentica</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Gift className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-200">Contenuti culturali esclusivi</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/subscription')}
              className="w-full sardinian-gradient hover:opacity-90 text-lg py-3"
            >
              <Crown className="w-5 h-5 mr-2" />
              Diventa Premium - €5/mese
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Dashboard
              </Button>
              
              <Button
                onClick={() => navigate('/subscription')}
                variant="outline"
                className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
              >
                <Gift className="w-4 h-4 mr-1" />
                Piano Annuale
              </Button>
            </div>
          </div>

          {/* Fun Message */}
          <div className="pt-4 border-t border-slate-600">
            <p className="text-gray-400 text-sm italic">
              "Aho, per oggi hai chiacchierato abbastanza! Torna domani o diventa Premium!" 😄
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}