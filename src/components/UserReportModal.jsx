import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Flag } from 'lucide-react';

export default function UserReportModal({ reportedUserId, reportedUserName, children }) {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { value: 'spam', label: 'Spam' },
    { value: 'abuse', label: 'Comportamento Abusivo' },
    { value: 'inappropriate', label: 'Contenuto Inappropriato' },
    { value: 'other', label: 'Altro' }
  ];

  const handleSubmitReport = async () => {
    if (!reportType) {
      toast({
        title: "Errore",
        description: "Seleziona un tipo di segnalazione.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('user-reports', {
        body: {
          action: 'create',
          reportedUserId,
          reportType,
          description: description.trim() || null
        }
      });

      if (error) throw error;

      toast({
        title: "Segnalazione Inviata",
        description: "La tua segnalazione è stata inviata e verrà esaminata dal nostro team.",
      });

      // Reset form and close modal
      setReportType('');
      setDescription('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="sardinian-card max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Flag className="w-5 h-5 mr-2 text-red-400" />
            Segnala Utente
          </AlertDialogTitle>
          <AlertDialogDescription>
            Stai segnalando <strong>{reportedUserName}</strong>. 
            Seleziona il motivo della segnalazione.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-white mb-2 block">Tipo di Segnalazione *</Label>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-300">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="description" className="text-white mb-2 block">
              Descrizione (opzionale)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fornisci dettagli aggiuntivi sulla segnalazione..."
              className="bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>
            Annulla
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmitReport}
            disabled={loading || !reportType}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Invio...' : 'Invia Segnalazione'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}