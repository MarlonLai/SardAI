
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Privacy Policy - SardAI</title>
        <meta name="description" content="Leggi la nostra informativa sulla privacy per capire come gestiamo i tuoi dati su SardAI." />
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
              <Lock className="w-6 h-6 mr-2" />
              Privacy Policy
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
                  Informativa sulla Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-6 prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300">
                <p>Ultimo aggiornamento: 09 Luglio 2025</p>
                
                <p>
                  Questa Privacy Policy descrive come SardAI.tech ("noi", "ci" o "nostro") raccoglie, utilizza e condivide le informazioni su di te quando utilizzi il nostro sito web e i nostri servizi (collettivamente, il "Servizio").
                </p>

                <h2>1. Informazioni che Raccogliamo</h2>
                <p>
                  Raccogliamo informazioni che ci fornisci direttamente, come quando crei un account, aggiorni il tuo profilo o comunichi con noi. Queste informazioni possono includere il tuo nome, email e immagine del profilo. Raccogliamo anche informazioni automaticamente quando utilizzi il Servizio, come le tue interazioni con i chatbot e i dati tecnici del tuo dispositivo.
                </p>

                <h2>2. Come Utilizziamo le Tue Informazioni</h2>
                <p>
                  Utilizziamo le tue informazioni per:
                  <ul>
                    <li>Fornire e personalizzare il nostro Servizio.</li>
                    <li>Analizzare e migliorare il Servizio, inclusa l'accuratezza dei nostri modelli di intelligenza artificiale.</li>
                    <li>Comunicare con te, rispondere alle tue richieste e inviarti aggiornamenti.</li>
                    <li>Proteggere la sicurezza e l'integrità del nostro Servizio.</li>
                  </ul>
                </p>

                <h2>3. Condivisione delle Informazioni</h2>
                <p>
                  Non condividiamo le tue informazioni personali con terze parti, ad eccezione dei seguenti casi:
                  <ul>
                    <li>Con fornitori di servizi che lavorano per nostro conto (es. Supabase per il backend, OpenAI per l'elaborazione del linguaggio).</li>
                    <li>Se richiesto dalla legge o per proteggere i nostri diritti legali.</li>
                    <li>Con il tuo consenso esplicito.</li>
                  </ul>
                </p>

                <h2>4. Sicurezza dei Dati</h2>
                <p>
                  Adottiamo misure di sicurezza tecniche e organizzative ragionevoli per proteggere le tue informazioni da accessi non autorizzati, perdita o uso improprio. Tuttavia, nessun sistema di sicurezza è impenetrabile.
                </p>

                <h2>5. Cookie</h2>
                <p>
                  Utilizziamo i cookie e tecnologie simili per gestire le sessioni utente e migliorare l'esperienza sul nostro sito. Puoi controllare l'uso dei cookie attraverso le impostazioni del tuo browser.
                </p>

                <h2>6. Contatti</h2>
                <p>
                  Se hai domande su questa Privacy Policy, puoi contattarci all'indirizzo: <a href="mailto:info@sardai.tech">info@sardai.tech</a>.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
