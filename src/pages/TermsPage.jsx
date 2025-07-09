
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Condizioni di Utilizzo - SardAI</title>
        <meta name="description" content="Leggi i termini e le condizioni di utilizzo del servizio SardAI." />
      </Helmet>

      <div className="min-h-screen sardinian-pattern">
        <header className="glass-effect border-b border-white/10 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna Indietro
            </Button>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Condizioni di Utilizzo
            </h1>
            <div className="w-32"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="sardinian-card">
              <CardHeader>
                <CardTitle className="text-3xl text-white">
                  Termini e Condizioni del Servizio
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-6 prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300">
                <p>Ultimo aggiornamento: 09 Luglio 2025</p>
                
                <p>
                  Accedendo e utilizzando SardAI.tech ("Servizio"), accetti di essere vincolato dai seguenti termini e condizioni ("Condizioni di Utilizzo"). Se non sei d'accordo con una qualsiasi parte dei termini, non puoi accedere al Servizio.
                </p>

                <h2>1. Utilizzo del Servizio</h2>
                <p>
                  Ti impegni a utilizzare il Servizio in modo responsabile e legale. È vietato utilizzare il Servizio per scopi illegali, molesti, diffamatori o che violino i diritti di terzi. Non è consentito tentare di decodificare, decompilare o accedere in modo non autorizzato ai nostri sistemi.
                </p>

                <h2>2. Account Utente</h2>
                <p>
                  Sei responsabile della salvaguardia della password che utilizzi per accedere al Servizio e di qualsiasi attività o azione sotto la tua password. Ti impegni a notificarci immediatamente qualsiasi violazione della sicurezza o uso non autorizzato del tuo account.
                </p>

                <h2>3. Abbonamenti e Pagamenti</h2>
                <p>
                  Alcune parti del Servizio sono disponibili solo con un abbonamento a pagamento ("Premium"). I pagamenti verranno fatturati su base ricorrente. Puoi annullare il tuo abbonamento in qualsiasi momento dal tuo pannello profilo. La cancellazione avrà effetto alla fine del ciclo di fatturazione corrente.
                </p>

                <h2>4. Proprietà Intellettuale</h2>
                <p>
                  Il Servizio e i suoi contenuti originali, le caratteristiche e le funzionalità sono e rimarranno di proprietà esclusiva di SardAI.tech e dei suoi licenziatari. Il nostro marchio non può essere utilizzato in relazione a nessun prodotto o servizio senza il previo consenso scritto.
                </p>

                <h2>5. Limitazione di Responsabilità</h2>
                <p>
                  Il Servizio è fornito "così com'è". In nessun caso SardAI.tech sarà responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall'uso del Servizio. Le risposte fornite dai chatbot sono generate da un'intelligenza artificiale e potrebbero non essere sempre accurate o complete.
                </p>

                <h2>6. Modifiche ai Termini</h2>
                <p>
                  Ci riserviamo il diritto, a nostra esclusiva discrezione, di modificare o sostituire questi Termini in qualsiasi momento. Ti informeremo di eventuali modifiche pubblicando i nuovi termini su questa pagina.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
