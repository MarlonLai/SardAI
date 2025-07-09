
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function GdprPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Informativa GDPR - SardAI</title>
        <meta name="description" content="Informativa sul trattamento dei dati personali ai sensi del GDPR per SardAI." />
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
              <ShieldCheck className="w-6 h-6 mr-2" />
              Informativa GDPR
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
                  Informativa sul Trattamento dei Dati Personali
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-6 prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300">
                <p>Ultimo aggiornamento: 09 Luglio 2025</p>
                
                <p>
                  Benvenuto su SardAI.tech. La tua privacy è importante per noi. Questa informativa descrive quali dati personali raccogliamo e come li utilizziamo, in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR).
                </p>

                <h2>1. Titolare del Trattamento</h2>
                <p>
                  Il titolare del trattamento dei dati è SardAI.tech, contattabile all'indirizzo email: <a href="mailto:info@sardai.tech">info@sardai.tech</a>.
                </p>

                <h2>2. Dati Personali Raccolti</h2>
                <p>
                  Raccogliamo i seguenti dati:
                  <ul>
                    <li><strong>Dati forniti dall'utente:</strong> Nome, indirizzo email, password (crittografata), immagine del profilo.</li>
                    <li><strong>Dati di utilizzo:</strong> Informazioni su come utilizzi il nostro servizio, incluse le interazioni con i chatbot. Le conversazioni sono salvate per migliorare il servizio.</li>
                    <li><strong>Dati tecnici:</strong> Indirizzo IP, tipo di browser, informazioni sul dispositivo.</li>
                  </ul>
                </p>

                <h2>3. Finalità del Trattamento</h2>
                <p>
                  Utilizziamo i tuoi dati per:
                  <ul>
                    <li>Fornire, mantenere e migliorare il servizio.</li>
                    <li>Gestire il tuo account e l'abbonamento.</li>
                    <li>Comunicare con te per assistenza o aggiornamenti.</li>
                    <li>Garantire la sicurezza della piattaforma.</li>
                    <li>Adempiere agli obblighi di legge.</li>
                  </ul>
                </p>

                <h2>4. Base Giuridica del Trattamento</h2>
                <p>
                  Trattiamo i tuoi dati sulla base del consenso da te fornito al momento della registrazione, per l'esecuzione di un contratto (fornitura del servizio) e per legittimo interesse (miglioramento del servizio e sicurezza).
                </p>

                <h2>5. Diritti dell'Interessato</h2>
                <p>
                  In qualità di utente, hai il diritto di:
                  <ul>
                    <li>Accedere ai tuoi dati personali.</li>
                    <li>Richiedere la rettifica o la cancellazione dei dati.</li>
                    <li>Limitare o opporti al trattamento.</li>
                    <li>Richiedere la portabilità dei dati.</li>
                    <li>Revocare il consenso in qualsiasi momento.</li>
                    <li>Proporre reclamo a un'autorità di controllo.</li>
                  </ul>
                  Per esercitare i tuoi diritti, puoi contattarci a <a href="mailto:info@sardai.tech">info@sardai.tech</a>.
                </p>

                <h2>6. Conservazione dei Dati</h2>
                <p>
                  Conserviamo i tuoi dati personali per il tempo strettamente necessario a conseguire gli scopi per cui sono stati raccolti e per adempiere agli obblighi legali.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
