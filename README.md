# SardAI 🏝️
Il chatbot che parla più di tua nonna - Assistente Virtuale Sardo con Personalità Autentica

## 🌟 Caratteristiche Principali

- 💬 **Chat Intelligente**: Conversazioni in italiano con personalità sarda autentica
- 👑 **Modalità Premium**: Chat in lingua sarda (logudorese, campidanese)
- 🎭 **Personalità Unica**: Ironia, calore e saggezza popolare sarda
- 📱 **Responsive Design**: Ottimizzato per tutti i dispositivi
- 🔐 **Sicurezza**: Autenticazione robusta e privacy GDPR compliant
- 💰 **Pagamenti**: Integrazione Stripe per abbonamenti Premium

## 🚀 Tech Stack

### Frontend
- **React 18** con Hooks e Context API
- **Vite** per build e sviluppo veloce
- **Tailwind CSS** per styling
- **Framer Motion** per animazioni
- **Lucide React** per icone
- **React Router** per navigazione

### Backend & Database
- **Supabase** per backend-as-a-service
- **PostgreSQL** database con Row Level Security
- **Supabase Auth** per autenticazione
- **Supabase Edge Functions** per API serverless

### Integrazioni
- **OpenAI GPT-4** per chat AI
- **Stripe** per pagamenti e abbonamenti
- **React Helmet** per SEO

## 🏗️ Architettura

```
src/
├── components/          # Componenti riutilizzabili
│   ├── ui/             # UI componenti base (shadcn/ui)
│   ├── chat/           # Componenti chat
│   └── admin/          # Pannelli amministrazione
├── pages/              # Pagine dell'applicazione
├── contexts/           # Context providers (Auth, etc.)
├── hooks/              # Custom hooks
├── lib/                # Utilità e configurazioni
├── utils/              # Funzioni helper
└── constants/          # Costanti dell'applicazione
```

## 💾 Database Schema

### Tabelle Principali
- `profiles` - Profili utenti
- `user_subscriptions` - Gestione abbonamenti
- `chat_sessions` - Sessioni di chat
- `chat_messages` - Messaggi delle chat
- `user_reports` - Sistema segnalazioni
- `admin_logs` - Log azioni amministrative

### Stripe Integration
- `stripe_customers` - Clienti Stripe
- `stripe_subscriptions` - Abbonamenti
- `stripe_orders` - Ordini

## 🛡️ Sicurezza

- **Row Level Security (RLS)** su tutte le tabelle
- **Policies** per controllo accesso granulare
- **Validazione input** lato client e server
- **Sanitizzazione** contenuti utente
- **Rate limiting** per API
- **GDPR compliance** completo

## 🔧 Funzionalità Implementate

### Autenticazione
- ✅ Registrazione con conferma email
- ✅ Login/logout
- ✅ Reset password
- ✅ Profili utente con avatar

### Chat System
- ✅ Chat gratuita (5 msg/giorno)
- ✅ Chat Premium (illimitata, lingua sarda)
- ✅ Sessioni multiple
- ✅ Streaming responses
- ✅ Memoria conversazioni

### Pagamenti
- ✅ Checkout Stripe
- ✅ Gestione abbonamenti
- ✅ Webhook processing
- ✅ Portal cliente

### Amministrazione
- ✅ Pannello admin completo
- ✅ Gestione utenti
- ✅ Statistiche
- ✅ Sistema segnalazioni
- ✅ Log di sistema

## 🚀 Setup e Sviluppo

### Prerequisiti
- Node.js 18+
- Account Supabase
- Account OpenAI
- Account Stripe

### Installazione
```bash
# Clona il repository
git clone <repo-url>
cd sardai-web-app

# Installa dipendenze
npm install

# Configura variabili ambiente
cp .env.example .env

# Avvia sviluppo
npm run dev
```

### Variabili Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## 📝 Scripts Disponibili

```bash
npm run dev          # Avvia sviluppo
npm run build        # Build produzione
npm run preview      # Anteprima build
npm run lint         # ESLint check
npm run deploy       # Deploy (se configurato)
```

## 🎨 Personalizzazione

### Colori e Tema
Il tema è definito in `src/index.css` con variabili CSS custom per:
- Colori primari (blu Sardegna)
- Gradients personalizzati
- Effetti glass morphism
- Animazioni custom

### Componenti UI
Basato su **shadcn/ui** per consistenza e accessibilità.

## 🔮 Funzionalità Future

### In Sviluppo
- 📊 Analytics avanzati
- 🔔 Sistema notifiche push
- 📱 App mobile (React Native)
- 🎙️ Chat vocale
- 📹 Video chiamate

### Pianificate
- 🤖 Multi-modal AI (immagini, audio)
- 🌍 Internazionalizzazione
- 📚 Knowledge base estesa
- 🎯 Targeting geografico
- 🏆 Sistema achievements

## 🐛 Debug e Monitoring

### Error Tracking
- Error Boundary per gestione errori React
- Console logging strutturato
- Toast notifications per feedback utente

### Performance
- Lazy loading componenti
- Memorizzazione hook
- Ottimizzazione bundle

## 🤝 Contributi

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambiamenti (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

## 📄 Licenza

Copyright 2025 SardAI Team. Tutti i diritti riservati.

## 📞 Supporto

- 📧 Email: info@sardai.tech
- 🐛 Bug Reports: GitHub Issues
- 💬 Chat: Dashboard SardAI

---

*Fatto con ❤️ in Sardegna*