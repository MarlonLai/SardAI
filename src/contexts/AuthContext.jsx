import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = useCallback(async (user) => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const profileData = await getProfile(session.user);
        setProfile(profileData);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await getProfile(session.user);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [getProfile]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error: error?.message };
  };

  const register = async ({ name, email, password }) => {
    // First create the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?type=signup&next=/dashboard`,
        data: {
          full_name: name
        }
      }
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Check if user needs email confirmation
    if (data.user && !data.session) {
      return { success: true, needsConfirmation: true };
    }
    
    return { success: true, needsConfirmation: false };
  };

  const resendConfirmationEmail = async (email) => {
    const { data, error } = await supabase.functions.invoke('custom-email-handler', {
      body: {
        type: 'resend_confirmation',
        email,
        redirectTo: `${window.location.origin}/auth/confirm?type=signup&next=/dashboard`
      }
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'User not logged in' };

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setProfile(data);
    return { success: true };
  };

  const upgradeToPremium = async () => {
    return updateProfile({ is_premium: true });
  };

  const sendPasswordResetEmail = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    });
    return { success: !error, error: error?.message };
  };

  const value = {
    user,
    profile,
    loading,
    login,
    register,
    resendConfirmationEmail,
    logout,
    updateProfile,
    upgradeToPremium,
    sendPasswordResetEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};