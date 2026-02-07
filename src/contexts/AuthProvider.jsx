import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabase';
import { checkUserHasUsername } from '../services/userProfile';

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
  const [authInitialized, setAuthInitialized] = useState(false);

  const supabase = getSupabaseClient();

  // Session persistence flags
  const getSessionFlags = () => {
    try {
      return {
        currentSessionId: sessionStorage.getItem('auth-session-id'),
        lastAuthCheck: localStorage.getItem('auth-last-check')
      };
    } catch (error) {
      return { currentSessionId: null, lastAuthCheck: null };
    }
  };

  // Get cached username result
  const getUsernameCache = (userId) => {
    try {
      const cacheKey = `username-cache-${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { hasUsername, timestamp } = JSON.parse(cached);
        // Cache is valid for 1 hour
        if (Date.now() - timestamp < 3600000) {
          console.log('📋 Using cached username result:', hasUsername);
          return hasUsername;
        }
      }
    } catch (error) {
      console.error('Error getting username cache:', error);
    }
    return null;
  };

  // Set username cache
  const setUsernameCache = (userId, hasUsername) => {
    try {
      const cacheKey = `username-cache-${userId}`;
      const cacheData = {
        hasUsername,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Cached username result:', hasUsername);
    } catch (error) {
      console.error('Error setting username cache:', error);
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
      if (flags.lastAuthCheck !== undefined) {
        localStorage.setItem('auth-last-check', flags.lastAuthCheck.toString());
      }
    } catch (error) {
      console.error('Error setting session flags:', error);
    }
  };

  // Optimized username check - runs only once per session with localStorage cache
  const checkUserProfile = useCallback(async (userId, isNewUser = false) => {
    if (!userId) {
      setHasUsername(false);
      setProfileChecked(true);
      return false;
    }

    // Check localStorage cache first for instant results
    const cachedResult = getUsernameCache(userId);
    if (cachedResult !== null && !isNewUser) {
      setHasUsername(cachedResult);
      setProfileChecked(true);
      return cachedResult;
    }

    // Return cached result immediately if already checked in this session
    if (profileChecked && !isNewUser) {
      return hasUsername;
    }

    // Run username check in background (non-blocking)
    try {
      const usernameExists = await checkUserHasUsername(userId);
      setHasUsername(usernameExists);
      setProfileChecked(true);

      // Cache the result for future refreshes
      setUsernameCache(userId, usernameExists);

      // Handle new user completion
      if (usernameExists && isNewUser) {
        localStorage.removeItem('auth-new-user');
        setSessionFlags({ hasShownAccountCreated: true });
        console.log('✅ New user completed profile, cache updated');
      }

      return usernameExists;
    } catch (error) {
      console.error('❌ Profile check failed:', error);
      setHasUsername(false);
      setProfileChecked(true);
      // Cache the negative result too
      setUsernameCache(userId, false);
      return false;
    }
  }, [profileChecked, hasUsername]);

  // SINGLE SOURCE AUTH INITIALIZATION - Runs only once per app load
  useEffect(() => {
    // Prevent multiple initializations on tab switches
    if (authInitialized) {
      console.log('🚫 Auth already initialized, skipping...');
      return;
    }

    let mounted = true;
    const now = Date.now();
    const flags = getSessionFlags();

    // Skip auth check if checked within last 5 minutes AND we already have a user session
    // This prevents tab-switch re-checks but still allows refresh to restore session
    if (flags.lastAuthCheck && (now - parseInt(flags.lastAuthCheck)) < 300000 && user) {
      console.log('⚡ Auth checked recently and user exists, using cached state');
      setAuthReady(true);
      setAuthInitialized(true);
      return;
    } else if (flags.lastAuthCheck && (now - parseInt(flags.lastAuthCheck)) < 300000 && !user) {
      console.log('🔄 Page refresh detected, checking session to restore auth...');
    }

    const initializeAuth = async () => {
      try {
        // SINGLE getSession() call - no verification loops
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          // Trust the session - no extra verification
          console.log('📋 Session found on init, setting auth state immediately');
          console.log('🔍 Session user:', session.user.id);
          setUser(session.user);
          setSession(session);
          setSessionFlags({
            currentSessionId: session.user.id,
            lastAuthCheck: now.toString()
          });

          // Check if this is a new user
          const isNewUser = localStorage.getItem('auth-new-user') === 'true';
          const isNewSession = flags.currentSessionId !== session.user.id;

          // Start username check in background (non-blocking)
          checkUserProfile(session.user.id, isNewUser);
        } else {
          // No session - mark as ready
          setAuthReady(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Mark auth as ready immediately - don't wait for username check
        if (mounted) {
          setAuthReady(true);
          setAuthInitialized(true);
          console.log('✅ Auth ready - UI can render immediately');
        }
      }
    };

    initializeAuth();

    // SINGLE auth state listener - no redundant calls
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state change:', event, 'session exists:', !!session?.user);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setHasUsername(null);
          setProfileChecked(false);
          setAuthInitialized(false);

          // Clear session flags
          try {
            sessionStorage.removeItem('auth-session-id');
            localStorage.removeItem('auth-last-check');
          } catch (error) {
            console.error('Error clearing session flags:', error);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔍 SIGNED_IN event received, checking user condition...');
          console.log('🔍 Current user state:', { currentUser: !!user, currentUserId: user?.id, newUserId: session.user.id });
          
          // Only process if different user (prevents duplicate processing)
          if (!user || user.id !== session.user.id) {
            console.log('🆕 New user signed in, updating state...');
            setUser(session.user);
            setSession(session);
            setSessionFlags({
              currentSessionId: session.user.id,
              lastAuthCheck: Date.now().toString()
            });

            const isNewUser = localStorage.getItem('auth-new-user') === 'true';
            await checkUserProfile(session.user.id, isNewUser);
            showAuthToast(isNewUser, true);
          } else {
            console.log('🔄 Same user already signed in, skipping update');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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
      
      // Clear username cache before clearing user state
      if (user?.id) {
        localStorage.removeItem(`username-cache-${user.id}`);
      }
      
      setUser(null);
      setSession(null);
      setHasUsername(null);
      setProfileChecked(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Manual session refresh function
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔄 Manually refreshing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
      
      if (session?.user) {
        console.log('✅ Session refreshed, updating auth state...');
        setUser(session.user);
        setSession(session);
        setSessionFlags({
          currentSessionId: session.user.id,
          lastAuthCheck: Date.now().toString()
        });
        
        const isNewUser = localStorage.getItem('auth-new-user') === 'true';
        await checkUserProfile(session.user.id, isNewUser);
        
        return session;
      } else {
        console.log('❌ No session found during refresh');
        return null;
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }, [checkUserProfile]);

  const value = {
    user,
    session,
    authReady, // Replaces multiple loading states
    hasUsername,
    profileChecked,
    signInWithEmail,
    signOut,
    checkUserProfile,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
