
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import ChatPage from '@/pages/ChatPage';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import SubscriptionPage from '@/pages/SubscriptionPage.jsx';
import AdminPage from '@/pages/AdminPage.jsx';
import AdminRoute from '@/components/AdminRoute';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import GdprPage from '@/pages/GdprPage.jsx';
import TermsPage from '@/pages/TermsPage.jsx';
import PrivacyPage from '@/pages/PrivacyPage.jsx';
import ErrorPage from '@/pages/auth/ErrorPage.jsx';
import SuccessPage from '@/pages/auth/SuccessPage.jsx';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage.jsx';
import ResendConfirmationPage from '@/pages/auth/ResendConfirmationPage.jsx';
import CallbackPage from '@/pages/auth/CallbackPage.jsx';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Helmet>
          <title>SardAI - Assistente Virtuale Sardo</title>
          <meta name="description" content="L'assistente virtuale che parla sardo. Scopri la cultura sarda attraverso l'intelligenza artificiale con modalità gratuita e premium." />
          <meta name="keywords" content="sardegna, sardo, AI, assistente virtuale, chatbot, cultura sarda, logudorese, campidanese" />
          <meta property="og:title" content="SardAI - Assistente Virtuale Sardo" />
          <meta property="og:description" content="L'assistente virtuale che parla sardo. Scopri la cultura sarda attraverso l'intelligenza artificiale." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://sardai.tech" />
        </Helmet>
        
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/gdpr" element={<GdprPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              
              {/* Auth Routes */}
              <Route path="/auth/error" element={<ErrorPage />} />
              <Route path="/auth/success" element={<SuccessPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/resend-confirmation" element={<ResendConfirmationPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />
              <Route path="/auth/confirm" element={<CallbackPage />} />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subscription" 
                element={
                  <ProtectedRoute>
                    <SubscriptionPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
        
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
