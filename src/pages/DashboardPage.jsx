import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { 
  Sparkles, 
  Crown, 
  MessageCircle, 
  Menu,
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  Zap,
  Shield
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Dashboard - SardAI</title>
        <meta name="description" content="Dashboard personale di SardAI con statistiche e accesso rapido alle funzionalità." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="glass-effect border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-white hover:bg-white/10"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sardinian-gradient rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">
                    Dashboard
                  </h1>
                </div>
              </div>
              
              <div className="text-sm text-gray-300">
                Benvenuto, {profile?.full_name}!
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="sardinian-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          Ciao, {profile?.full_name}! 👋
                        </h2>
                        <p className="text-gray-300">
                          Pronto per una nuova conversazione con SardAI?
                        </p>
                      </div>
                      <Link to="/chat">
                        <Button className="sardinian-gradient hover:opacity-90">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Inizia Chat
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <Card className="sardinian-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Conversazioni</p>
                        <p className="text-2xl font-bold text-white">12</p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="sardinian-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Giorni Attivo</p>
                        <p className="text-2xl font-bold text-white">
                          {user?.created_at ? 
                            Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) 
                            : 0
                          }
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="sardinian-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Messaggi Inviati</p>
                        <p className="text-2xl font-bold text-white">47</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="sardinian-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Piano</p>
                        <p className="text-2xl font-bold text-white">
                          {profile?.role === 'admin' ? 'Admin' : profile?.is_premium ? 'Premium' : 'Gratuito'}
                        </p>
                      </div>
                      {profile?.role === 'admin' ? (
                        <Shield className="w-8 h-8 text-red-400" />
                      ) : profile?.is_premium ? (
                        <Crown className="w-8 h-8 text-yellow-400" />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="sardinian-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Azioni Rapide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Link to="/chat">
                        <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-white/20 text-white hover:bg-white/10">
                          <MessageCircle className="w-6 h-6" />
                          <span>Nuova Chat</span>
                        </Button>
                      </Link>
                      
                      <Link to="/profile">
                        <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-white/20 text-white hover:bg-white/10">
                          <Users className="w-6 h-6" />
                          <span>Modifica Profilo</span>
                        </Button>
                      </Link>
                      
                      {!profile?.is_premium && profile?.role !== 'admin' && (
                        <Link to="/subscription">
                          <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10">
                            <Crown className="w-6 h-6" />
                            <span>Diventa Premium</span>
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="sardinian-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Attività Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/30">
                        <MessageCircle className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-white text-sm">Conversazione in modalità gratuita</p>
                          <p className="text-gray-400 text-xs">2 ore fa</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/30">
                        <Users className="w-5 h-5 text-green-400" />
                        <div className="flex-1">
                          <p className="text-white text-sm">Profilo aggiornato</p>
                          <p className="text-gray-400 text-xs">1 giorno fa</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/30">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <div className="flex-1">
                          <p className="text-white text-sm">Primo accesso a SardAI</p>
                          <p className="text-gray-400 text-xs">
                            {user?.created_at ? 
                              new Date(user.created_at).toLocaleDateString('it-IT')
                              : 'Data non disponibile'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Premium Upgrade Card */}
              {!profile?.is_premium && profile?.role !== 'admin' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="sardinian-card premium-glow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Crown className="w-12 h-12 text-yellow-400" />
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">
                              Sblocca SardAI Premium
                            </h3>
                            <p className="text-gray-300">
                              Conversa in lingua sarda autentica e accedi a funzionalità esclusive
                            </p>
                          </div>
                        </div>
                        <Link to="/subscription">
                          <Button className="sardinian-gradient hover:opacity-90">
                            Scopri Premium
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}