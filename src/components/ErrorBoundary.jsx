import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Here you could also send the error to an error reporting service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-2xl"
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
                  className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertTriangle className="w-8 h-8 text-white" />
                </motion.div>
                
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Ops! Qualcosa è andato storto
                </CardTitle>
                
                <p className="text-gray-300">
                  Si è verificato un errore imprevisto nell'applicazione
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Error Message */}
                {this.props.showDetails && this.state.error && (
                  <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
                    <h3 className="text-red-300 font-semibold mb-2">Dettagli Errore:</h3>
                    <pre className="text-red-200 text-sm whitespace-pre-wrap overflow-x-auto">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-red-300 cursor-pointer">Stack Trace</summary>
                        <pre className="text-red-200 text-xs mt-2 whitespace-pre-wrap overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* User-friendly message */}
                <div className="bg-slate-800/30 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">Cosa puoi fare:</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Ricarica la pagina per riprovare</li>
                    <li>• Controlla la tua connessione internet</li>
                    <li>• Prova a disconnetterti e ricollegarti</li>
                    <li>• Se il problema persiste, contatta il supporto</li>
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={this.handleReset}
                    className="w-full sardinian-gradient hover:opacity-90"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Riprova
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Ricarica Pagina
                    </Button>

                    <Button
                      onClick={() => window.location.href = '/'}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Torna alla Home
                    </Button>
                  </div>
                </div>

                {/* Support */}
                <div className="text-center pt-4 border-t border-slate-600">
                  <p className="text-gray-400 text-sm">
                    L'errore persiste?{' '}
                    <a 
                      href="mailto:info@sardai.tech" 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Contatta il supporto
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sardinian touch */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center mt-6"
            >
              <p className="text-gray-400 text-sm italic">
                "Madonna mia! Qualcosa è andato per traverso, ma lo aggiustiamo subito!" 😅
              </p>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;