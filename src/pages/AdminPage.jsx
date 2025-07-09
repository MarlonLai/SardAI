import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AdminStats from '@/components/admin/AdminStats';
import UserManagementPanel from '@/components/admin/UserManagementPanel';
import ReportsPanel from '@/components/admin/ReportsPanel';
import StorageManagement from '@/components/admin/StorageManagement';
import DatabaseManagement from '@/components/admin/DatabaseManagement';
import SystemLogsPanel from '@/components/admin/SystemLogsPanel';
import Sidebar from '@/components/Sidebar';
import { 
  Shield, 
  ArrowLeft, 
  Menu,
  BarChart3,
  Users,
  Flag,
  FileText,
  HardDrive,
  Database
} from 'lucide-react';


export default function AdminPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  // Verifica accesso admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast({
        title: "Accesso Negato",
        description: "Non hai i permessi per accedere al pannello admin.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [profile, navigate, toast]);

  // Verifica che l'email sia quella autorizzata
  useEffect(() => {
    if (user && user.email !== 'marlon.lai@hotmail.com') {
      toast({
        title: "Accesso Limitato",
        description: "Solo l'amministratore autorizzato può accedere a questo pannello.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  if (!profile || profile.role !== 'admin' || !user || user.email !== 'marlon.lai@hotmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pannello Admin - SardAI</title>
        <meta name="description" content="Pannello di amministrazione completo per la gestione di SardAI." />
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
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white">
                    Pannello Admin
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-300">
                  Admin: {profile?.full_name}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
          </header>

          {/* Admin Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="bg-slate-800/50 border border-slate-600">
                    <TabsTrigger value="stats" className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Statistiche</span>
                    </TabsTrigger>
                    <TabsTrigger value="users" className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Utenti</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center space-x-2">
                      <Flag className="w-4 h-4" />
                      <span>Segnalazioni</span>
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Log Sistema</span>
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4" />
                      <span>Storage</span>
                    </TabsTrigger>
                    <TabsTrigger value="database" className="flex items-center space-x-2">
                      <Database className="w-4 h-4" />
                      <span>Database</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="stats">
                    <AdminStats />
                  </TabsContent>
                  
                  <TabsContent value="users">
                    <UserManagementPanel />
                  </TabsContent>
                  
                  <TabsContent value="reports">
                    <ReportsPanel />
                  </TabsContent>
                  
                  <TabsContent value="logs">
                    <SystemLogsPanel />
                  </TabsContent>
                  
                  <TabsContent value="storage">
                    <StorageManagement />
                  </TabsContent>
                  
                  <TabsContent value="database">
                    <DatabaseManagement />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}