import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  Calendar,
  TrendingUp,
  Clock,
  Crown,
  Flag,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const { data, error } = await supabase.functions.invoke('admin-stats', {
        body: { refresh, adminEmail: user?.email }
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      toast({
        title: "Errore nel caricamento delle statistiche",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="sardinian-card animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-slate-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Utenti Totali",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400"
    },
    {
      title: "Nuovi Utenti",
      value: stats.newUsers,
      icon: TrendingUp,
      color: "text-green-400"
    },
    {
      title: "Utenti Premium",
      value: stats.premiumUsers,
      icon: Crown,
      color: "text-yellow-400"
    },
    {
      title: "Attivi (7gg)",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-purple-400"
    },
    {
      title: "Segnalazioni",
      value: stats.pendingReports,
      icon: Flag,
      color: "text-cyan-400"
    },
    {
      title: "Errori Sistema",
      value: stats.systemErrors,
      icon: AlertTriangle,
      color: "text-orange-400"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Statistiche Utenti</h2>
        <div className="flex items-center space-x-4">
          <p className="text-gray-400 text-sm">
            Ultimo aggiornamento: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString('it-IT') : 'Mai'}
          </p>
          <Button
            onClick={() => fetchStats(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="sardinian-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="sardinian-card">
          <CardHeader>
            <CardTitle className="text-white">Crescita Utenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Nuovi (30gg)</span>
                <span className="text-blue-400 font-bold">
                  +{stats.newUsers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Attivi</span>
                <span className="text-purple-400 font-bold">
                  {stats.activeUsers}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sardinian-card">
          <CardHeader>
            <CardTitle className="text-white">Premium Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Utenti Premium</span>
                <span className="text-yellow-400 font-bold">
                  {stats.premiumUsers}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Tasso Conversione</span>
                <span className="text-green-400 font-bold">
                  {stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sardinian-card">
          <CardHeader>
            <CardTitle className="text-white">Attività Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity?.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-gray-300">{activity.action}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(activity.created_at).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
              {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                <p className="text-gray-400 text-sm">Nessuna attività recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}