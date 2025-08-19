import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Flag,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MessageSquare
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

export default function ReportsPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('admin-reports', {
        body: { action: 'list', adminEmail: user?.email }
      });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      toast({
        title: "Errore nel caricamento delle segnalazioni",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-reports', {
        body: { 
          action: 'update_status', 
          reportId, 
          status: newStatus,
          notes: adminNotes,
          adminEmail: user?.email
        }
      });

      if (error) throw error;

      toast({
        title: "Stato aggiornato!",
        description: `Segnalazione marcata come ${newStatus}.`,
      });

      fetchReports();
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error) {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock, label: 'In Attesa' },
      reviewed: { color: 'bg-blue-500/20 text-blue-400', icon: AlertTriangle, label: 'Revisionata' },
      resolved: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle, label: 'Risolta' },
      dismissed: { color: 'bg-gray-500/20 text-gray-400', icon: XCircle, label: 'Respinta' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getReportTypeLabel = (type) => {
    const types = {
      spam: 'Spam',
      abuse: 'Abuso',
      inappropriate: 'Contenuto Inappropriato',
      other: 'Altro'
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
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
          <Flag className="w-6 h-6 mr-2" />
          Gestione Segnalazioni
        </h2>
        
        <Button
          onClick={fetchReports}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.length === 0 ? (
            <Card className="sardinian-card">
              <CardContent className="p-8 text-center">
                <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Nessuna segnalazione presente.</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="sardinian-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                      {getReportTypeLabel(report.report_type)}
                    </CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Segnalato da:</h4>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">
                          {report.reporter?.full_name || 'Nome non disponibile'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({report.reporter?.email})
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Utente segnalato:</h4>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-white">
                          {report.reported_user?.full_name || 'Nome non disponibile'}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({report.reported_user?.email})
                        </span>
                      </div>
                    </div>
                  </div>

                  {report.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Descrizione:</h4>
                      <p className="text-gray-300 bg-slate-800/50 p-3 rounded-lg">
                        {report.description}
                      </p>
                    </div>
                  )}

                  {report.admin_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Note Admin:</h4>
                      <p className="text-gray-300 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20">
                        {report.admin_notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <div className="text-sm text-gray-400">
                      <p>Creata: {formatDate(report.created_at)}</p>
                      {report.resolved_at && (
                        <p>Risolta: {formatDate(report.resolved_at)}</p>
                      )}
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                              onClick={() => {
                                setSelectedReport(report);
                                setAdminNotes(report.admin_notes || '');
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Gestisci
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sardinian-card max-w-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Gestisci Segnalazione</AlertDialogTitle>
                              <AlertDialogDescription>
                                Aggiungi note e cambia lo stato della segnalazione.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">
                                  Note Admin:
                                </label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Aggiungi note sulla segnalazione..."
                                  className="bg-slate-800/50 border-slate-600 text-white"
                                  rows={3}
                                />
                              </div>
                            </div>

                            <AlertDialogFooter className="flex flex-wrap gap-2">
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <Button
                                onClick={() => handleStatusUpdate(report.id, 'reviewed')}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Marca come Revisionata
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(report.id, 'resolved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Risolvi
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(report.id, 'dismissed')}
                                variant="outline"
                                className="border-gray-500 text-gray-300 hover:bg-gray-500/10"
                              >
                                Respingi
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}