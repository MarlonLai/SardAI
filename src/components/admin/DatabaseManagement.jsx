import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  Database,
  Users,
  Settings,
  Shield,
  Crown,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  EyeOff
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

export default function DatabaseManagement() {
  const [profiles, setProfiles] = useState([]);
  const [authUsers, setAuthUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProfile, setEditingProfile] = useState(null);
  const [newProfile, setNewProfile] = useState({
    full_name: '',
    role: 'user',
    is_premium: false
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch auth users via admin function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-database', {
        body: { action: 'list_auth_users' }
      });

      if (usersError) throw usersError;
      setAuthUsers(usersData || []);

    } catch (error) {
      toast({
        title: "Errore nel caricamento dei dati",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === profileId ? data : p));
      setEditingProfile(null);

      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });

    } catch (error) {
      toast({
        title: "Errore nell'aggiornamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateProfile = async () => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-database', {
        body: { 
          action: 'create_auth_user',
          email: newProfile.email,
          password: newProfile.password || 'TempPassword123!',
          full_name: newProfile.full_name
        }
      });

      if (authError) throw authError;

      // Then create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: newProfile.full_name,
          role: newProfile.role,
          is_premium: newProfile.is_premium
        })
        .select()
        .single();

      if (profileError) throw profileError;

      setProfiles(prev => [profileData, ...prev]);
      setNewProfile({ full_name: '', role: 'user', is_premium: false });
      setShowCreateForm(false);

      toast({
        title: "Utente creato",
        description: "Nuovo utente creato con successo.",
      });

      fetchData(); // Refresh data

    } catch (error) {
      toast({
        title: "Errore nella creazione",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = async (profileId) => {
    try {
      // Delete auth user (this will cascade to profile)
      const { error } = await supabase.functions.invoke('admin-database', {
        body: { 
          action: 'delete_auth_user',
          userId: profileId
        }
      });

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setAuthUsers(prev => prev.filter(u => u.id !== profileId));

      toast({
        title: "Utente eliminato",
        description: "L'utente è stato eliminato con successo.",
      });

    } catch (error) {
      toast({
        title: "Errore nell'eliminazione",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTogglePremium = async (profileId, currentStatus) => {
    await handleUpdateProfile(profileId, { is_premium: !currentStatus });
  };

  const handleToggleRole = async (profileId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await handleUpdateProfile(profileId, { role: newRole });
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAuthUserData = (profileId) => {
    return authUsers.find(user => user.id === profileId);
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Gestione Database
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cerca utenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 w-64"
            />
          </div>
          
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>

          <Button
            onClick={() => setShowCreateForm(true)}
            className="sardinian-gradient hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Utente
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-600">
          <TabsTrigger value="profiles">Profili Utenti</TabsTrigger>
          <TabsTrigger value="auth">Dati Autenticazione</TabsTrigger>
          <TabsTrigger value="system">Configurazioni Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          {/* Create New User Form */}
          {showCreateForm && (
            <Card className="sardinian-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Crea Nuovo Utente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Nome Completo
                    </label>
                    <Input
                      value={newProfile.full_name}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={newProfile.email || ''}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Ruolo
                    </label>
                    <select
                      value={newProfile.role}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
                    >
                      <option value="user">Utente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_premium"
                      checked={newProfile.is_premium}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, is_premium: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="is_premium" className="text-sm text-gray-300">
                      Account Premium
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="border-gray-500 text-gray-300 hover:bg-gray-500/10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annulla
                  </Button>
                  <Button
                    onClick={handleCreateProfile}
                    className="sardinian-gradient hover:opacity-90"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Crea Utente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profiles Table */}
          <Card className="sardinian-card">
            <CardHeader>
              <CardTitle className="text-white">
                Profili Utenti ({filteredProfiles.length})
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
                        <th className="p-4 font-medium">Ruolo</th>
                        <th className="p-4 font-medium">Premium</th>
                        <th className="p-4 font-medium">Creato</th>
                        <th className="p-4 font-medium">Ultimo Aggiornamento</th>
                        <th className="p-4 font-medium text-right">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map((profile) => {
                        const authUser = getAuthUserData(profile.id);
                        const isEditing = editingProfile?.id === profile.id;
                        
                        return (
                          <tr key={profile.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                            <td className="p-4">
                              <div>
                                {isEditing ? (
                                  <Input
                                    value={editingProfile.full_name || ''}
                                    onChange={(e) => setEditingProfile(prev => ({ ...prev, full_name: e.target.value }))}
                                    className="bg-slate-800/50 border-slate-600 text-white text-sm"
                                  />
                                ) : (
                                  <>
                                    <p className="font-medium">{profile.full_name || 'Nome non disponibile'}</p>
                                    <p className="text-gray-400 text-sm">{authUser?.email}</p>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  value={editingProfile.role}
                                  onChange={(e) => setEditingProfile(prev => ({ ...prev, role: e.target.value }))}
                                  className="bg-slate-800/50 border border-slate-600 text-white rounded px-2 py-1 text-sm"
                                >
                                  <option value="user">Utente</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <Badge className={profile.role === 'admin' ? 'bg-red-500/20 text-red-400 border-0' : 'bg-blue-500/20 text-blue-400 border-0'}>
                                  {profile.role === 'admin' ? (
                                    <>
                                      <Shield className="w-3 h-3 mr-1" />
                                      Admin
                                    </>
                                  ) : (
                                    <>
                                      <Users className="w-3 h-3 mr-1" />
                                      Utente
                                    </>
                                  )}
                                </Badge>
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <input
                                  type="checkbox"
                                  checked={editingProfile.is_premium}
                                  onChange={(e) => setEditingProfile(prev => ({ ...prev, is_premium: e.target.checked }))}
                                  className="rounded"
                                />
                              ) : (
                                <Badge className={profile.is_premium ? 'bg-yellow-500/20 text-yellow-400 border-0' : 'bg-gray-500/20 text-gray-400 border-0'}>
                                  {profile.is_premium ? (
                                    <>
                                      <Crown className="w-3 h-3 mr-1" />
                                      Premium
                                    </>
                                  ) : (
                                    'Gratuito'
                                  )}
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-gray-300 text-sm">
                              {formatDate(authUser?.created_at)}
                            </td>
                            <td className="p-4 text-gray-300 text-sm">
                              {formatDate(profile.updated_at)}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateProfile(profile.id, editingProfile)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingProfile(null)}
                                      className="text-gray-400 hover:text-gray-300"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingProfile(profile)}
                                      className="text-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleTogglePremium(profile.id, profile.is_premium)}
                                      className="text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300"
                                    >
                                      <Crown className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleToggleRole(profile.id, profile.role)}
                                      className="text-purple-400 hover:bg-purple-400/10 hover:text-purple-300"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </Button>

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
                                            Sei sicuro di voler eliminare l'utente "{profile.full_name}"? 
                                            Questa azione è irreversibile e rimuoverà tutti i dati associati.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteProfile(profile.id)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            Elimina
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredProfiles.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-400">
                      {searchTerm ? 'Nessun utente trovato per la ricerca.' : 'Nessun utente presente.'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card className="sardinian-card">
            <CardHeader>
              <CardTitle className="text-white">Dati Autenticazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-white">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Stato</th>
                      <th className="p-4 font-medium">Ultimo Accesso</th>
                      <th className="p-4 font-medium">Confermato</th>
                      <th className="p-4 font-medium">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-gray-400 text-xs">{user.id}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={user.banned_until ? 'bg-red-500/20 text-red-400 border-0' : 'bg-green-500/20 text-green-400 border-0'}>
                            {user.banned_until ? 'Bannato' : 'Attivo'}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {formatDate(user.last_sign_in_at)}
                        </td>
                        <td className="p-4">
                          <Badge className={user.email_confirmed_at ? 'bg-green-500/20 text-green-400 border-0' : 'bg-yellow-500/20 text-yellow-400 border-0'}>
                            {user.email_confirmed_at ? 'Confermato' : 'In Attesa'}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-300 text-sm">
                          {user.app_metadata?.provider || 'email'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="sardinian-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configurazioni Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Impostazioni Generali</h3>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Nome Applicazione
                      </label>
                      <Input
                        value="SardAI"
                        className="bg-slate-800/50 border-slate-600 text-white"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Versione
                      </label>
                      <Input
                        value="1.0.0"
                        className="bg-slate-800/50 border-slate-600 text-white"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Ambiente
                      </label>
                      <Badge className="bg-green-500/20 text-green-400 border-0">
                        Produzione
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Statistiche Database</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Tabelle</p>
                        <p className="text-2xl font-bold text-white">5</p>
                      </div>
                      
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Funzioni</p>
                        <p className="text-2xl font-bold text-white">12</p>
                      </div>
                      
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Policies</p>
                        <p className="text-2xl font-bold text-white">25</p>
                      </div>
                      
                      <div className="bg-slate-800/30 p-4 rounded-lg">
                        <p className="text-gray-400 text-sm">Storage</p>
                        <p className="text-2xl font-bold text-white">2 Bucket</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-600 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Azioni Sistema</h3>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="outline"
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Aggiorna Cache
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Backup Database
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Ottimizza Performance
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}