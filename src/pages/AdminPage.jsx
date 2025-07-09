import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Shield, Users, ArrowLeft, Trash2, UserCheck, CheckCircle, Clock, MailCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-list', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      toast({
        title: "Errore nel caricamento degli utenti",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (action, userId, email = null) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-list', {
        body: { action, userId, email }
      });
      if (error) throw error;
      
      toast({
        title: "Successo!",
        description: data.message || "Azione completata con successo.",
      });
      fetchUsers(); // Refresh the user list
    } catch (error) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Admin - SardAI</title>
        <meta name="description" content="Pannello di amministrazione per la gestione utenti di SardAI." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern">
        <header className="glass-effect border-b border-white/10 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Button>
            
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Pannello Admin
            </h1>
            
            <div className="w-32"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="sardinian-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Gestione Utenti ({users.length})
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Visualizza, conferma ed elimina gli utenti della piattaforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-white">
                      <thead>
                        <tr className="border-b border-slate-600">
                          <th className="p-4">Email</th>
                          <th className="p-4">Stato</th>
                          <th className="p-4">Registrato il</th>
                          <th className="p-4 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                            <td className="p-4">{user.email}</td>
                            <td className="p-4">
                              {user.email_confirmed_at ? (
                                <span className="flex items-center text-green-400">
                                  <CheckCircle className="w-4 h-4 mr-2" /> Confermato
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-400">
                                  <Clock className="w-4 h-4 mr-2" /> In attesa
                                </span>
                              )}
                            </td>
                            <td className="p-4">{new Date(user.created_at).toLocaleDateString('it-IT')}</td>
                            <td className="p-4 text-right space-x-2">
                              {!user.email_confirmed_at && (
                                <>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="text-green-400 hover:bg-green-400/10 hover:text-green-300">
                                        <UserCheck className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="sardinian-card">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Conferma Utente</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Sei sicuro di voler confermare manualmente l'utente {user.email}? Questa azione è irreversibile.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleAction('confirm', user.id)}>Conferma</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="text-blue-400 hover:bg-blue-400/10 hover:text-blue-300">
                                        <MailCheck className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="sardinian-card">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Reinvia Email di Conferma</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Sei sicuro di voler reinviare l'email di conferma a {user.email}?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleAction('resend_confirmation', null, user.email)}>Reinvia</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="icon" variant="ghost" className="text-red-400 hover:bg-red-400/10 hover:text-red-300">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="sardinian-card">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Elimina Utente</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Sei sicuro di voler eliminare l'utente {user.email}? Questa azione è irreversibile e rimuoverà tutti i dati associati.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annulla</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleAction('delete', user.id)} className="bg-destructive hover:bg-destructive/90">Elimina</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}