import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatDate } from '@/utils/formatters';
import { 
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  User,
  Clock
} from 'lucide-react';

export default function SystemLogsPanel() {
  const [adminLogs, setAdminLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState({ admin: true, system: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminLogs();
    fetchSystemLogs();
  }, [searchTerm, selectedLevel]);

  const fetchAdminLogs = async () => {
    try {
      setLoading(prev => ({ ...prev, admin: true }));
      const { data, error } = await supabase.functions.invoke('admin-logs', {
        body: { 
          type: 'admin',
          search: searchTerm || null,
          limit: 100,
          adminEmail: user?.email
        }
      });

      if (error) throw error;
      setAdminLogs(data || []);
    } catch (error) {
      toast({
        title: "Errore nel caricamento dei log admin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, admin: false }));
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setLoading(prev => ({ ...prev, system: true }));
      const { data, error } = await supabase.functions.invoke('admin-logs', {
        body: { 
          type: 'system',
          level: selectedLevel || null,
          search: searchTerm || null,
          limit: 100,
          adminEmail: user?.email
        }
      });

      if (error) throw error;
      setSystemLogs(data || []);
    } catch (error) {
      toast({
        title: "Errore nel caricamento dei log di sistema",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, system: false }));
    }
  };

  const getLevelBadge = (level) => {
    const levelConfig = {
      info: { color: 'bg-blue-500/20 text-blue-400', icon: Info },
      warning: { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle },
      error: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
      critical: { color: 'bg-red-600/20 text-red-300', icon: AlertCircle }
    };

    const config = levelConfig[level] || levelConfig.info;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {level.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    const actions = {
      user_deleted: 'Utente Eliminato',
      user_confirmed: 'Utente Confermato',
      confirmation_resent: 'Email Conferma Reinviata',
      password_reset_sent: 'Reset Password Inviato',
      user_list_viewed: 'Lista Utenti Visualizzata',
      stats_viewed: 'Statistiche Visualizzate',
      reports_viewed: 'Segnalazioni Visualizzate',
      report_status_updated: 'Stato Segnalazione Aggiornato',
      report_notes_added: 'Note Segnalazione Aggiunte'
    };
    return actions[action] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Log di Sistema
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cerca nei log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 w-64"
            />
          </div>
          
          <Button
            onClick={() => {
              fetchAdminLogs();
              fetchSystemLogs();
            }}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-600">
          <TabsTrigger value="admin">Log Admin</TabsTrigger>
          <TabsTrigger value="system">Log Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
          <Card className="sardinian-card">
            <CardHeader>
              <CardTitle className="text-white">Azioni Amministrative</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.admin ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminLogs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nessun log admin trovato.</p>
                  ) : (
                    adminLogs.map((log) => (
                      <div key={log.id} className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-blue-500/20 text-blue-400 border-0">
                              {getActionLabel(log.action)}
                            </Badge>
                            <div className="flex items-center text-gray-400 text-sm">
                              <User className="w-4 h-4 mr-1" />
                              {log.admin?.full_name || log.admin?.email || 'Admin'}
                            </div>
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                        
                        {log.target_user && (
                          <p className="text-gray-300 text-sm mb-2">
                            Target: {log.target_user.full_name || log.target_user.email}
                          </p>
                        )}
                        
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="bg-slate-900/50 p-3 rounded mt-2">
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
            >
              <option value="">Tutti i livelli</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <Card className="sardinian-card">
            <CardHeader>
              <CardTitle className="text-white">Log di Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              {loading.system ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {systemLogs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nessun log di sistema trovato.</p>
                  ) : (
                    systemLogs.map((log) => (
                      <div key={log.id} className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {getLevelBadge(log.level)}
                            {log.user && (
                              <div className="flex items-center text-gray-400 text-sm">
                                <User className="w-4 h-4 mr-1" />
                                {log.user.full_name || log.user.email}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(log.created_at)}
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-2">{log.message}</p>
                        
                        {log.context && Object.keys(log.context).length > 0 && (
                          <div className="bg-slate-900/50 p-3 rounded mt-2">
                            <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}