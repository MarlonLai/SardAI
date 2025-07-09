import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles } from 'lucide-react';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          navigate(`/auth/error?message=${encodeURIComponent(errorDescription || error)}`);
          return;
        }

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            navigate(`/auth/error?message=${encodeURIComponent(exchangeError.message)}`);
            return;
          }

          if (data.session) {
            setStatus('success');
            toast({
              title: "Accesso effettuato! 🎉",
              description: "Benvenuto in SardAI!"
            });
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            navigate('/auth/error?message=No+session+created');
          }
        } else {
          navigate('/auth/error?message=No+authorization+code+received');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate(`/auth/error?message=${encodeURIComponent(error.message)}`);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  return (
    <>
      <Helmet>
        <title>Autenticazione - SardAI</title>
        <meta name="description" content="Completamento autenticazione..." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 sardinian-gradient rounded-lg flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">SardAI</span>
          </div>

          {status === 'processing' && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-white text-lg">Completamento autenticazione...</p>
              <p className="text-gray-400">Attendere prego</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white text-lg">Autenticazione completata!</p>
              <p className="text-gray-400">Reindirizzamento in corso...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}