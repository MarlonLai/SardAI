import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((error, customMessage = null) => {
    console.error('Error occurred:', error);
    
    let message = customMessage || 'Si è verificato un errore imprevisto';
    let title = 'Errore';

    // Handle specific error types
    if (error.message) {
      if (error.message.includes('Network')) {
        title = 'Errore di Connessione';
        message = 'Controlla la tua connessione internet e riprova';
      } else if (error.message.includes('Authentication')) {
        title = 'Errore di Autenticazione';
        message = 'Sessione scaduta. Effettua nuovamente l\'accesso';
      } else if (error.message.includes('Permission')) {
        title = 'Accesso Negato';
        message = 'Non hai i permessi per eseguire questa azione';
      } else {
        message = error.message;
      }
    }

    toast({
      title,
      description: message,
      variant: "destructive",
    });

    // Return error details for further handling
    return {
      type: title,
      message,
      original: error
    };
  }, [toast]);

  const handleAsyncError = useCallback((asyncFn) => {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        handleError(error);
        throw error; // Re-throw to allow caller to handle if needed
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};