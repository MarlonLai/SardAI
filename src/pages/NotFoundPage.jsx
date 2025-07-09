import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search, Sparkles } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>404 - Pagina Non Trovata | SardAI</title>
        <meta name="description" content="La pagina che stai cercando non esiste. Torna alla home di SardAI." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">SardAI</span>
            </div>
          </div>

          <Card className="sardinian-card">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-8xl font-bold text-blue-400 mb-4"
              >
                404
              </motion.div>
              <CardTitle className="text-3xl font-bold text-white mb-2">
                Pagina Non Trovata
              </CardTitle>
              <p className="text-gray-300">
                Madonna mia! La pagina che stai cercando non esiste o è stata spostata.
              </p>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-2">Cosa puoi fare:</h3>
                <ul className="text-blue-200 text-sm text-left space-y-1">
                  <li>• Controlla l'URL per errori di battitura</li>
                  <li>• Torna alla pagina principale</li>
                  <li>• Usa la navigazione per trovare quello che cerchi</li>
                  <li>• Contattaci se il problema persiste</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/')}
                  className="w-full sardinian-gradient hover:opacity-90"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Torna alla Home
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => navigate(-1)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                  </Button>

                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-600">
                <p className="text-gray-400 text-sm">
                  Hai bisogno di aiuto?{' '}
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

          {/* Fun Sardinian Touch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6"
          >
            <p className="text-gray-400 text-sm italic">
              "Aho, dove sei andato a finire? Torna da noi!" 😄
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}