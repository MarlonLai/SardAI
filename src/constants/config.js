// Application configuration constants

export const APP_CONFIG = {
  name: 'SardAI',
  version: '1.0.0',
  author: 'SardAI Team',
  email: 'info@sardai.tech',
  website: 'https://sardai.tech',
  
  // Feature flags
  features: {
    chat: true,
    premium: true,
    admin: true,
    analytics: false,
    notifications: false,
    fileUpload: true,
    voiceChat: false, // Future feature
    videoCall: false, // Future feature
  },
  
  // Limits and quotas
  limits: {
    freeMessages: 5,
    trialDays: 7,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxMessageLength: 4000,
    maxSessionTitle: 100,
  },
  
  // UI Configuration
  ui: {
    animationDuration: 0.3,
    toastDuration: 5000,
    autoRedirectDelay: 5000,
    debounceDelay: 300,
  }
};

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  chat: '/chat',
  profile: '/profile',
  subscription: '/subscription',
  admin: '/admin',
  features: '/features',
  terms: '/terms',
  privacy: '/privacy',
  gdpr: '/gdpr',
};

export const STORAGE_KEYS = {
  authToken: 'sardai_auth_token',
  userPreferences: 'sardai_user_preferences',
  chatDrafts: 'sardai_chat_drafts',
  theme: 'sardai_theme',
};