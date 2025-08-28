import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  LazyWrapper, 
  LazyPageWrapper, 
  LazyChatPage,
  LazyAdminPage, 
  LazySubscriptionPage,
  LazyPremiumFeaturesPage,
  LazyProfilePage
} from '@/components/optimized/LazyComponents';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
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
import CheckoutSuccessPage from '@/pages/stripe/CheckoutSuccessPage.jsx';
import CheckoutCancelPage from '@/pages/stripe/CheckoutCancelPage.jsx';
import PaymentProcessingPage from '@/pages/stripe/PaymentProcessingPage.jsx';
import PaymentErrorPage from '@/pages/stripe/PaymentErrorPage.jsx';
import SubscriptionManagePage from '@/pages/stripe/SubscriptionManagePage.jsx';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer.jsx';
import OfflineNotice from '@/components/OfflineNotice';

const App = React.memo(() => {
  return (
    <ErrorBoundary showDetails={false}>
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
            <OfflineNotice />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/gdpr" element={<GdprPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/features" element={
                  <LazyPageWrapper>
                    <LazyPremiumFeaturesPage />
                  </LazyPageWrapper>
                } />
                
                {/* Auth Routes */}
                <Route path="/auth/error" element={<ErrorPage />} />
                <Route path="/auth/success" element={<SuccessPage />} />
                <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/resend-confirmation" element={<ResendConfirmationPage />} />
                <Route path="/auth/callback" element={<CallbackPage />} />
                <Route path="/auth/confirm" element={<CallbackPage />} />
                
                {/* Stripe Routes */}
                <Route path="/stripe/success" element={<CheckoutSuccessPage />} />
                <Route path="/stripe/cancel" element={<CheckoutCancelPage />} />
                <Route path="/stripe/processing" element={<PaymentProcessingPage />} />
                <Route path="/stripe/error" element={<PaymentErrorPage />} />
                <Route 
                  path="/stripe/manage" 
                  element={
                    <ProtectedRoute>
                      <SubscriptionManagePage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <LazyPageWrapper>
                        <LazyChatPage />
                      </LazyPageWrapper>
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
                      <LazyPageWrapper>
                        <LazyProfilePage />
                      </LazyPageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/subscription" 
                  element={
                    <ProtectedRoute>
                      <LazyPageWrapper>
                        <LazySubscriptionPage />
                      </LazyPageWrapper>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin"
                  element={
                    <AdminRoute>
                      <LazyPageWrapper>
                        <LazyAdminPage />
                      </LazyPageWrapper>
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
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
