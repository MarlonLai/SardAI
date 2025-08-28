import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Settings, 
  Bell, 
  Palette, 
  Globe, 
  Shield,
  Download,
  Trash2,
  Save,
  Eye,
  Volume2
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

export default function UserSettings() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useLocalStorage('sardai_user_settings', {
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    appearance: {
      theme: 'dark',
      animations: true,
      compactMode: false
    },
    chat: {
      soundEffects: true,
      autoScroll: true,
      showTimestamps: true,
      messagePreview: true
    },
    privacy: {
      dataCollection: true,
      analytics: false,
      shareUsage: false
    }
  });
  const [saving, setSaving] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save to profile
      await updateProfile({
        settings: settings
      });
      
      toast({
        title: "Impostazioni salvate! ✅",
        description: "Le tue preferenze sono state aggiornate con successo."
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExportingData(true);
    try {
      // In a real implementation, this would call an edge function
      // For now, we'll simulate the export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userData = {
        profile: {
          name: profile?.full_name,
          email: user?.email,
          created_at: user?.created_at
        },
        settings: settings,
        exported_at: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `sardai-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Dati esportati! 📦",
        description: "I tuoi dati sono stati scaricati con successo."
      });
    } catch (error) {
      toast({
        title: "Errore nell'esportazione",
        description: "Impossibile esportare i dati.",
        variant: "destructive"
      });
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.functions.invoke('delete-user-account', {
        body: { confirmation: true }
      });
      
      if (error) throw error;
      
      toast({
        title: "Account eliminato",
        description: "Il tuo account è stato eliminato permanentemente.",
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'account. Contatta il supporto.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6" role="main" aria-labelledby="settings-title">
      <h2 id="settings-title" className="text-2xl font-bold text-white flex items-center">
        <Settings className="w-6 h-6 mr-2" />
        Impostazioni Account
      </h2>

      {/* Notifications Settings */}
      <Card className="sardinian-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifiche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between" role="group" aria-labelledby="email-notifications">
            <div>
              <Label id="email-notifications" className="text-white font-medium">
                Notifiche Email
              </Label>
              <p className="text-gray-400 text-sm">
                Ricevi aggiornamenti importanti via email
              </p>
            </div>
            <Switch
              checked={settings.notifications.email}
              onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
              aria-labelledby="email-notifications"
            />
          </div>

          <div className="flex items-center justify-between" role="group" aria-labelledby="marketing-emails">
            <div>
              <Label id="marketing-emails" className="text-white font-medium">
                Email Marketing
              </Label>
              <p className="text-gray-400 text-sm">
                Ricevi newsletter e promozioni
              </p>
            </div>
            <Switch
              checked={settings.notifications.marketing}
              onCheckedChange={(checked) => updateSetting('notifications', 'marketing', checked)}
              aria-labelledby="marketing-emails"
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card className="sardinian-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Aspetto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between" role="group" aria-labelledby="animations-toggle">
            <div>
              <Label id="animations-toggle" className="text-white font-medium">
                Animazioni
              </Label>
              <p className="text-gray-400 text-sm">
                Abilita transizioni e animazioni nell'interfaccia
              </p>
            </div>
            <Switch
              checked={settings.appearance.animations}
              onCheckedChange={(checked) => updateSetting('appearance', 'animations', checked)}
              aria-labelledby="animations-toggle"
            />
          </div>

          <div className="flex items-center justify-between" role="group" aria-labelledby="compact-mode">
            <div>
              <Label id="compact-mode" className="text-white font-medium">
                Modalità Compatta
              </Label>
              <p className="text-gray-400 text-sm">
                Riduci spaziature per mostrare più contenuto
              </p>
            </div>
            <Switch
              checked={settings.appearance.compactMode}
              onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
              aria-labelledby="compact-mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chat Settings */}
      <Card className="sardinian-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            Impostazioni Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between" role="group" aria-labelledby="sound-effects">
            <div>
              <Label id="sound-effects" className="text-white font-medium">
                Effetti Sonori
              </Label>
              <p className="text-gray-400 text-sm">
                Suoni per messaggi ricevuti e inviati
              </p>
            </div>
            <Switch
              checked={settings.chat.soundEffects}
              onCheckedChange={(checked) => updateSetting('chat', 'soundEffects', checked)}
              aria-labelledby="sound-effects"
            />
          </div>

          <div className="flex items-center justify-between" role="group" aria-labelledby="auto-scroll">
            <div>
              <Label id="auto-scroll" className="text-white font-medium">
                Scorrimento Automatico
              </Label>
              <p className="text-gray-400 text-sm">
                Scorri automaticamente ai nuovi messaggi
              </p>
            </div>
            <Switch
              checked={settings.chat.autoScroll}
              onCheckedChange={(checked) => updateSetting('chat', 'autoScroll', checked)}
              aria-labelledby="auto-scroll"
            />
          </div>

          <div className="flex items-center justify-between" role="group" aria-labelledby="show-timestamps">
            <div>
              <Label id="show-timestamps" className="text-white font-medium">
                Mostra Orari
              </Label>
              <p className="text-gray-400 text-sm">
                Visualizza l'orario di invio dei messaggi
              </p>
            </div>
            <Switch
              checked={settings.chat.showTimestamps}
              onCheckedChange={(checked) => updateSetting('chat', 'showTimestamps', checked)}
              aria-labelledby="show-timestamps"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="sardinian-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Privacy e Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between" role="group" aria-labelledby="data-collection">
            <div>
              <Label id="data-collection" className="text-white font-medium">
                Raccolta Dati Analytics
              </Label>
              <p className="text-gray-400 text-sm">
                Aiutaci a migliorare SardAI condividendo dati anonimi di utilizzo
              </p>
            </div>
            <Switch
              checked={settings.privacy.analytics}
              onCheckedChange={(checked) => updateSetting('privacy', 'analytics', checked)}
              aria-labelledby="data-collection"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-600">
            <h3 className="text-white font-medium">Gestione Dati</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleExportData}
                variant="outline"
                disabled={exportingData}
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                aria-label="Esporta i tuoi dati personali"
              >
                <Download className="w-4 h-4 mr-2" />
                {exportingData ? 'Esportazione...' : 'Esporta Dati'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    aria-label="Elimina permanentemente il tuo account"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Elimina Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="sardinian-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Elimina Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sei sicuro di voler eliminare permanentemente il tuo account? 
                      Questa azione è irreversibile e rimuoverà:
                      <br />• Tutti i tuoi dati e conversazioni
                      <br />• Il tuo abbonamento Premium
                      <br />• Tutte le impostazioni personalizzate
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mantieni Account</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Elimina Definitivamente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Management */}
      <InvoiceManagement />

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-slate-600">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="sardinian-gradient hover:opacity-90"
          aria-label="Salva tutte le impostazioni"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </Button>
      </div>
    </div>
  );
}