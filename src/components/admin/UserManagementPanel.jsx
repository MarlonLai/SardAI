import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search,
  Trash2, 
  UserCheck, 
  CheckCircle, 
  Clock, 
  MailCheck,
  RefreshCw,
  Key
} from 'lucide-react';
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

export default function UserManagementPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const { toast } = useToast();

  const USERS_PER_PAGE = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: { 
          action: 'list',
          limit: USERS_PER_PAGE,
          offset: currentPage * USERS_PER_PAGE,
          search: searchTerm || null
        }
      });

      if (error) throw error;
      setUsers(data || []);
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

  const handleAction = async (action, userId, email = null) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page when searching
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Gestione Utenti</h2>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cerca per email o nome..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 w-64"
            />
          </div>
          
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="icon"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="sardinian-card">
        <CardHeader>
          <CardTitle className="text-white">
            Utenti Registrati ({users.length})
          </CardTitle>
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
                    <th className="p-4 font-medium">Utente</th>
                    <th className="p-4 font-medium">Stato</th>
                    <th className="p-4 font-medium">Registrato</th>
                    <th className="p-4 font-medium">Ultimo Accesso</th>
                    <th className="p-4 font-medium text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{user.full_name || 'Nome non disponibile'}</p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          {user.is_premium && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 mt-1">
                              👑 Premium
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {user.email_confirmed_at ? (
                          <span className="flex items-center text-green-400">
                            <CheckCircle className="w-4 h-4 mr-2" /> 
                            Confermato
                          </span>
                        ) : (
                          <span className="flex items-center text-yellow-400">
                            <Clock className="w-4 h-4 mr-2" /> 
                            In attesa
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 mt-1">
                            🛡️ Admin
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-300">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="p-4 text-gray-300">
                        {formatDate(user.last_sign_in_at)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {!user.email_confirmed_at && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-green-400 hover:bg-green-400/10 hover:text-green-300"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="sardinian-card">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Conferma Utente</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sei sicuro di voler confermare manualmente l'utente {user.email}? 
                                      Questa azione è irreversibile.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleAction('confirm', user.id)}
                                    >
                                      Conferma
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                                  >
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
                                    <AlertDialogAction 
                                      onClick={() => handleAction('resend_confirmation', null, user.email)}
                                    >
                                      Reinvia
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-orange-400 hover:bg-orange-400/10 hover:text-orange-300"
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sardinian-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset Password</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler inviare un'email di reset password a {user.email}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleAction('reset_password', null, user.email)}
                                >
                                  Invia Reset
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sardinian-card">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Elimina Utente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare l'utente {user.email}? 
                                  Questa azione è irreversibile e rimuoverà tutti i dati associati.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleAction('delete', user.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400">
                  {searchTerm ? 'Nessun utente trovato per la ricerca.' : 'Nessun utente registrato.'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">
          Pagina {currentPage + 1} - Mostrando {users.length} utenti
        </p>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Precedente
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={users.length < USERS_PER_PAGE}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Successiva
          </Button>
        </div>
      </div>
    </div>
  );
}