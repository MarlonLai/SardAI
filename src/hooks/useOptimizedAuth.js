import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedAuth = () => {
  const authContext = useAuth();
  
  // Memoize expensive computations
  const userPermissions = useMemo(() => {
    if (!authContext.profile) return { isAdmin: false, isPremium: false };
    
    return {
      isAdmin: authContext.profile.role === 'admin',
      isPremium: authContext.profile.is_premium || authContext.profile.role === 'admin',
      canManageUsers: authContext.profile.role === 'admin',
      canAccessPremium: authContext.profile.is_premium || authContext.profile.role === 'admin'
    };
  }, [authContext.profile]);

  const userDisplayInfo = useMemo(() => {
    if (!authContext.user || !authContext.profile) return null;
    
    return {
      name: authContext.profile.full_name,
      email: authContext.user.email,
      avatarUrl: authContext.profile.avatar_url,
      initials: authContext.profile.full_name?.charAt(0)?.toUpperCase() || 'U',
      memberSince: authContext.user.created_at ? new Date(authContext.user.created_at) : null,
      planType: userPermissions.isAdmin ? 'admin' : userPermissions.isPremium ? 'premium' : 'free'
    };
  }, [authContext.user, authContext.profile, userPermissions]);

  // Optimized callbacks
  const handleLogout = useCallback(async () => {
    try {
      await authContext.logout();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [authContext.logout]);

  const handleUpdateProfile = useCallback(async (updates) => {
    try {
      const result = await authContext.updateProfile(updates);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [authContext.updateProfile]);

  return {
    ...authContext,
    permissions: userPermissions,
    displayInfo: userDisplayInfo,
    optimizedLogout: handleLogout,
    optimizedUpdateProfile: handleUpdateProfile
  };
};