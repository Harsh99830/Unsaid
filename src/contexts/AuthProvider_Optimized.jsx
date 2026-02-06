import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabase';
import { checkUserHasUsername } from '../services/userProfile';
import { useToast } from '../components/ui/Toast';

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
  const [hasUsername, setHasUsername] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  
  const { addToast, ToastContainer } = useToast();
  const supabase = getSupabaseClient();

  // Session persistence flags
  const getSessionFlags = () => {
    try {
      return {
        hasShownLoginToast: sessionStorage.getItem('auth-login-toast-shown') === 'true',
        hasShownAccountCreated: localStorage.getItem('auth-account-created-shown') === 'true',
        currentSessionId: sessionStorage.getItem('auth-session-id')
      };
    } catch (error) {
      return { hasShownLoginToast: false, hasShownAccountCreated: false, currentSessionId: null };
    }
  };

  const setSessionFlags = (flags) => {
    try {
      if (flags.hasShownLoginToast !== undefined) {
        sessionStorage.setItem('auth-login-toast-shown', flags.hasShownLoginToast.toString());
      }
      if (flags.hasShownAccountCreated !== undefined) {
        localStorage.setItem('auth-account-created-shown', flags.hasShownAccountCreated.toString());
      }
      if (flags.currentSessionId !== undefined) {
        sessionStorage.setItem('auth-session-id', flags.currentSessionId);
      }
    } catch (error) {
      console.error('Error setting session flags:', error);
    }
  };

  // Optimized username check - runs only once per session
  const checkUserProfile = useCallback(async (userId, isNewUser = false) => {
    if (!userId) {
      setHasUsername(false);
      setProfileChecked(true);
      return false;
    }

    // Return cached result immediately if already checked
    if (profileChecked && !isNewUser) {
      return hasUsername;
    }

    // Run username check in background (non-blocking)
    try {
      const usernameExists = await checkUserHasUsername(userId);
      setHasUsername(usernameExists);
      setProfileChecked(true);
      
      // Handle new user completion
      if (usernameExists && isNewUser) {
        localStorage.removeItem('auth-new-user');
        setSessionFlags({ hasShownAccountCreated: true });
      }
      
      return usernameExists;
    } catch (error) {
      console.error('❌ Profile check failed:', error);
      setHasUsername(false);
      setProfileChecked(true);
      return false;
    }
  }, [profileChecked, hasUsername]);

  // Optimized toast logic
  const showAuthToast = useCallback((isNewUser, isNewSession) => {
    const flags = getSessionFlags();
    
    if (!isNewUser && isNewSession && !flags.hasShownLoginToast) {
      addToast('Login successful 👋', 'login', 3000);
      setSessionFlags({ hasShownLoginToast: true });
    }
  }, [addToast]);

  // SINGLE SOURCE AUTH INITIALIZATION
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // SINGLE getSession() call - no verification loops
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          // Trust the session - no extra verification
          console.log('📋 Session found, setting auth state immediately');
          setUser(session.user);
          setSession(session);
          setSessionFlags({ currentSessionId: session.user.id });
          
          // Check if this is a new user
          const isNewUser = localStorage.getItem('auth-new-user') === 'true';
          const flags = getSessionFlags();
          const isNewSession = flags.currentSessionId !== session.user.id;
          
          // Start username check in background (non-blocking)
          checkUserProfile(session.user.id, isNewUser);
          showAuthToast(isNewUser, isNewSession);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Mark auth as ready immediately - don't wait for username check
        if (mounted) {
          setAuthReady(true);
          console.log('✅ Auth ready - UI can render immediately');
        }
      }
    };

    initializeAuth();

    // SINGLE auth state listener - no redundant calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setHasUsername(null);
          setProfileChecked(false);
          
          // Clear session flags
          try {
            sessionStorage.removeItem('auth-login-toast-shown');
            sessionStorage.removeItem('auth-session-id');
          } catch (error) {
            console.error('Error clearing session flags:', error);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Trust the session - set state immediately
          const isNewUser = localStorage.getItem('auth-new-user') === 'true';
          
          setUser(session.user);
          setSession(session);
          setSessionFlags({ currentSessionId: session.user.id });
          
          // Background username check
          checkUserProfile(session.user.id, isNewUser);
          showAuthToast(isNewUser, true);
        }
        
        // Auth is always ready after state change
        setAuthReady(true);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signInWithEmail = async (email) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;
      
      // Set new user flag
      localStorage.setItem('auth-new-user', 'true');
      
      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setHasUsername(null);
      setProfileChecked(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    authReady, // Replaces multiple loading states
    hasUsername,
    profileChecked,
    signInWithEmail,
    signOut,
    checkUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
};
