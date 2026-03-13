import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState(false);
  const [username, setUsername] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const supabase = getSupabaseClient();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if supabase client is available
        if (!supabase) {
          console.error('Supabase client not initialized');
          setAuthReady(true);
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          console.log('Session found:', session.user.id);
          setUser(session.user);
          setSession(session);
          
          // Check if user has username
          await checkUserUsername(session.user.id);
        }

        setAuthReady(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthReady(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, 'session exists:', !!session?.user);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setSession(session);
          await checkUserUsername(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setHasUsername(false);
        }

        setAuthReady(true);
        setLoading(false);
      }
    ) || { data: { subscription: null } };

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Check if user has username
  const checkUserUsername = async (userId) => {
    if (!supabase) {
      console.log('Supabase not available, assuming no username');
      setHasUsername(false);
      setUsername(null);
      return;
    }
    
    setCheckingUsername(true);
    
    try {
      // Add short timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Username check timeout')), 2000);
      });

      const queryPromise = supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        setHasUsername(false);
        setUsername(null);
        return;
      }

      if (data?.username) {
        setHasUsername(true);
        setUsername(data.username);
        console.log('User has username:', data.username);
      } else {
        setHasUsername(false);
        setUsername(null);
        console.log('User does not have username');
      }
    } catch (error) {
      console.error('Username check failed:', error.message);
      // On timeout, assume no username to prevent infinite loading
      setHasUsername(false);
      setUsername(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Save user username
  const saveUsername = async (userId, selectedUsername) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          username: selectedUsername,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update the hasUsername state
      setHasUsername(true);
      setUsername(selectedUsername);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error saving username:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/feed`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with Email OTP
  const signInWithEmail = async (email) => {
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Email sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) {
      console.error('Supabase not initialized');
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    authReady,
    loading,
    hasUsername,
    username,
    checkingUsername,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    saveUsername,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
