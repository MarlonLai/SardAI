
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Camera,
  Save
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({ full_name: profile.full_name || '', email: user.email });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile({ full_name: formData.full_name });
    
    if (error) {
      toast({
        title: "Errore",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profilo aggiornato! ✅",
        description: "Le tue informazioni sono state salvate con successo."
      });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      await updateProfile({ avatar_url: publicUrl });
      setAvatarUrl(publicUrl);

      toast({
        title: "Avatar aggiornato!",
        description: "La tua immagine del profilo è stata cambiata."
      });

    } catch (error) {
      toast({
        title: "Errore caricamento avatar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profilo - SardAI</title>
        <meta name="description" content="Gestisci il tuo profilo SardAI e le impostazioni del tuo account." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern">
        {/* Header */}
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
            
            <h1 className="text-2xl font-bold text-white">Il Mio Profilo</h1>
            
            <div className="w-32"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Profile Header */}
              <Card className="sardinian-card mb-8">
                <CardHeader className="text-center">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="w-24 h-24 mx-auto">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-blue-600 text-white text-2xl">
                        {profile?.full_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      asChild
                      className="absolute bottom-0 right-0 rounded-full w-8 h-8 sardinian-gradient"
                    >
                      <Label htmlFor="avatar-upload">
                        <Camera className="w-4 h-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </Label>
                    </Button>
                  </div>
                  
                  <CardTitle className="text-2xl text-white">
                    {profile?.full_name}
                  </CardTitle>
                  
                  <CardDescription className="text-gray-300 flex items-center justify-center space-x-2">
                    {profile?.is_premium ? (
                      <>
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span>Utente Premium</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4" />
                        <span>Utente Gratuito</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Account Info */}
              <Card className="sardinian-card mb-8">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Informazioni Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-white">
                        Nome completo
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="bg-slate-800/50 border-slate-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-slate-800/50 border-slate-600 text-white disabled:opacity-70"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || uploading}
                      className="w-full sardinian-gradient hover:opacity-90"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Account Stats */}
              <Card className="sardinian-card mb-8">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Statistiche Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {user?.created_at ? 
                          Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)) 
                          : 0
                        }
                      </p>
                      <p className="text-gray-300">Giorni con SardAI</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        {profile?.is_premium ? 'Premium' : 'Gratuito'}
                      </p>
                      <p className="text-gray-300">Tipo di Account</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Card */}
              {!profile?.is_premium && (
                <Card className="sardinian-card premium-glow">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Crown className="w-5 h-5 mr-2 text-yellow-400" />
                      Diventa Premium
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Sblocca la modalità sarda autentica e funzionalità esclusive
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => navigate('/subscription')}
                      className="w-full sardinian-gradient hover:opacity-90"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Scopri Premium
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
