import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { SkeletonLoader } from '@/components/SkeletonLoader';

// Lazy load heavy components
export const LazyAdminPage = lazy(() => import('@/pages/AdminPage.jsx'));
export const LazySubscriptionPage = lazy(() => import('@/pages/SubscriptionPage.jsx'));
export const LazyPremiumFeaturesPage = lazy(() => import('@/pages/PremiumFeaturesPage.jsx'));
export const LazyProfilePage = lazy(() => import('@/pages/ProfilePage.jsx'));
export const LazyChatPage = lazy(() => import('@/pages/ChatPage.jsx'));

// Lazy load admin components
export const LazyAdminStats = lazy(() => import('@/components/admin/AdminStats.jsx'));
export const LazyUserManagementPanel = lazy(() => import('@/components/admin/UserManagementPanel.jsx'));
export const LazyReportsPanel = lazy(() => import('@/components/admin/ReportsPanel.jsx'));
export const LazyStorageManagement = lazy(() => import('@/components/admin/StorageManagement.jsx'));
export const LazyDatabaseManagement = lazy(() => import('@/components/admin/DatabaseManagement.jsx'));
export const LazySystemLogsPanel = lazy(() => import('@/components/admin/SystemLogsPanel.jsx'));

// Wrapper component with loading fallback
export const LazyWrapper = ({ 
  children, 
  fallback = <LoadingSpinner size="lg" text="Caricamento componente..." fullScreen={false} /> 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Optimized wrappers for different loading scenarios
export const LazyPageWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner size="xl" text="Caricamento pagina..." fullScreen={true} />}>
    {children}
  </Suspense>
);

export const LazyAdminWrapper = ({ children }) => (
  <Suspense fallback={<SkeletonLoader />}>
    {children}
  </Suspense>
);