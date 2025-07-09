import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-stats', {
        body: {}
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
      setLoading(false);
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
      value: stats.total_users,
      icon: Users,
      color: "text-blue-400"
    },
    {
      title: "Utenti Confermati",
      value: stats.confirmed_users,
      icon: UserCheck,
      color: "text-green-400"
    },
    {
      title: "Non Confermati",
      value: stats.unconfirmed_users,
      icon: UserX,
      color: "text-yellow-400"
    },
    {
      title: "Attivi (30gg)",
      value: stats.active_users_month,
      icon: Activity,
      color: "text-purple-400"
    },
    {
      title: "Nuovi Oggi",
      value: stats.new_users_today,
      icon: Calendar,
      color: "text-cyan-400"
    },
    {
      title: "Nuovi (7gg)",
      value: stats.new_users_week,
      icon: TrendingUp,
      color: "text-orange-400"
    },
    {
      title: "Nuovi (30gg)",
      value: stats.new_users_month,
      icon: Clock,
      color: "text-pink-400"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Statistiche Utenti</h2>
        <p className="text-gray-400 text-sm">
          Ultimo aggiornamento: {new Date(stats.updated_at).toLocaleString('it-IT')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="sardinian-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="sardinian-card">
          <CardHeader>
            <CardTitle className="text-white">Tasso di Conferma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Confermati</span>
                <span className="text-green-400 font-bold">
                  {((stats.confirmed_users / stats.total_users) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${(stats.confirmed_users / stats.total_users) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sardinian-card">
          <CardHeader>
            <CardTitle className="text-white">Crescita Utenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Crescita Settimanale</span>
                <span className="text-blue-400 font-bold">
                  +{stats.new_users_week}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Crescita Mensile</span>
                <span className="text-purple-400 font-bold">
                  +{stats.new_users_month}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}