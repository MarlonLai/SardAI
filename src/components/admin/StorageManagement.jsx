import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useStorageUpload } from '@/hooks/useStorageUpload';
import { 
  HardDrive,
  Image,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Eye
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

export default function StorageManagement() {
  const [files, setFiles] = useState({ avatars: [], 'recipe-images': [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('avatars');
  const { toast } = useToast();
  const { deleteFile } = useStorageUpload();

  useEffect(() => {
    fetchFiles();
  }, [selectedBucket]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from(selectedBucket)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      
      setFiles(prev => ({
        ...prev,
        [selectedBucket]: data || []
      }));
    } catch (error) {
      toast({
        title: "Errore nel caricamento dei file",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileName) => {
    const result = await deleteFile(selectedBucket, fileName);
    if (result.success) {
      toast({
        title: "File eliminato",
        description: "Il file è stato eliminato con successo.",
      });
      fetchFiles();
    }
  };

  const getFileUrl = (fileName) => {
    const { data: { publicUrl } } = supabase.storage
      .from(selectedBucket)
      .getPublicUrl(fileName);
    return publicUrl;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const filteredFiles = files[selectedBucket]?.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <HardDrive className="w-6 h-6 mr-2" />
          Gestione Storage
        </h2>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedBucket}
            onChange={(e) => setSelectedBucket(e.target.value)}
            className="bg-slate-800/50 border border-slate-600 text-white rounded-md px-3 py-2"
          >
            <option value="avatars">Avatar</option>
            <option value="recipe-images">Immagini Ricette</option>
          </select>
          
          <Button
            onClick={fetchFiles}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Cerca file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="sardinian-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">File Totali</p>
                <p className="text-2xl font-bold text-white">{filteredFiles.length}</p>
              </div>
              <Image className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="sardinian-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Bucket Attivo</p>
                <p className="text-2xl font-bold text-white capitalize">{selectedBucket}</p>
              </div>
              <HardDrive className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="sardinian-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Spazio Utilizzato</p>
                <p className="text-2xl font-bold text-white">
                  {formatFileSize(
                    filteredFiles.reduce((total, file) => total + (file.metadata?.size || 0), 0)
                  )}
                </p>
              </div>
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files List */}
      <Card className="sardinian-card">
        <CardHeader>
          <CardTitle className="text-white">
            File in {selectedBucket} ({filteredFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? 'Nessun file trovato per la ricerca.' : 'Nessun file presente in questo bucket.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="p-4 font-medium">Anteprima</th>
                    <th className="p-4 font-medium">Nome File</th>
                    <th className="p-4 font-medium">Dimensione</th>
                    <th className="p-4 font-medium">Creato</th>
                    <th className="p-4 font-medium text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.name} className="border-b border-slate-700 hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex items-center justify-center">
                          <img
                            src={getFileUrl(file.name)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <Image className="w-6 h-6 text-gray-400" style={{ display: 'none' }} />
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium truncate max-w-xs">{file.name}</p>
                          <Badge className="bg-blue-500/20 text-blue-400 border-0 mt-1">
                            {file.metadata?.mimetype || 'image'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">
                        {formatFileSize(file.metadata?.size || 0)}
                      </td>
                      <td className="p-4 text-gray-300">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(getFileUrl(file.name), '_blank')}
                            className="text-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = getFileUrl(file.name);
                              link.download = file.name;
                              link.click();
                            }}
                            className="text-green-400 hover:bg-green-400/10 hover:text-green-300"
                          >
                            <Download className="w-4 h-4" />
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
                                <AlertDialogTitle>Elimina File</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare il file "{file.name}"? 
                                  Questa azione è irreversibile.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFile(file.name)}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}