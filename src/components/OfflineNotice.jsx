import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineNotice() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline message if already offline
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showOfflineMessage && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
        >
          <Card className="max-w-md mx-auto bg-red-600 border-red-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <WifiOff className="w-5 h-5 text-white flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Connessione Persa</p>
                  <p className="text-red-100 text-xs">
                    Alcune funzionalità potrebbero non essere disponibili
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      
      {/* Reconnection notice */}
      {isOnline && !showOfflineMessage && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 p-4"
          onAnimationComplete={() => {
            setTimeout(() => setIsOnline(true), 3000);
          }}
        >
          <Card className="max-w-md mx-auto bg-green-600 border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-white flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Connessione Ripristinata</p>
                  <p className="text-green-100 text-xs">
                    Tutte le funzionalità sono nuovamente disponibili
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}