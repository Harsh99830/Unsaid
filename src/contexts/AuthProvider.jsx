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
  const [loading, setLoading] = useState(true);

  // Initialize profile state from localStorage if available
  const getInitialProfileState = () => {
    try {
      const cached = localStorage.getItem('auth-profile-state');
      if (cached && cached !== 'undefined') {
        const parsed = JSON.parse(cached);
        console.log('📋 Loaded profile state from localStorage:', parsed);
        
        // Check if this is a new user without username
        const isNewUser = localStorage.getItem('auth-new-signup') === 'true';
        
        if (isNewUser && parsed.hasUsername === false) {
          console.log('🆕 New user detected from cache - ensuring no username state');
          return {
            hasChecked: true,
            isLoading: false,
            hasUsername: false,
            error: null
          };
        }
        
        // Always recheck on app load to ensure fresh data
        // But we can use the cached hasUsername value temporarily
        return {
          hasChecked: false, // Always recheck on app load
          isLoading: false,
          hasUsername: parsed.hasUsername || null, // Use cached value temporarily
          error: null
        };
      }
    } catch (error) {
      console.error('Error loading profile state from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('auth-profile-state');
      } catch (clearError) {
        console.error('Error clearing corrupted localStorage:', clearError);
      }
    }
    return {
      hasChecked: false,
      isLoading: false,
      hasUsername: null,
      error: null
    };
  };

  const [profileState, setProfileState] = useState(getInitialProfileState());

  // Enhanced profile state setter with selective localStorage persistence
  const setProfileStateWithPersistence = (newState) => {
    console.log('💾 Setting profile state:', newState);
    setProfileState(newState);
    
    // Only cache to localStorage if we have a definitive result
    // Don't cache loading states or errors
    if (newState.hasChecked && !newState.isLoading && !newState.error) {
      try {
        localStorage.setItem('auth-profile-state', JSON.stringify(newState));
        console.log('💾 Saved definitive profile state to localStorage:', newState);
      } catch (error) {
        console.error('Error saving profile state to localStorage:', error);
      }
    } else {
      console.log('📝 Profile state not cached (loading/error/unchecked):', newState);
    }
  };

  // Clear profile state cache
  const clearProfileStateCache = () => {
    try {
      localStorage.removeItem('auth-profile-state');
      console.log('🗑️ Cleared profile state cache');
    } catch (error) {
      console.error('Error clearing profile state cache:', error);
    }
  };

  const supabase = getSupabaseClient();

  // Check user profile exists with caching and smart new user detection
  const checkUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfileStateWithPersistence(prev => ({ ...prev, hasChecked: true, hasUsername: false }));
      return false;
    }

    // Return cached result if already checked AND user is the same
    if (profileState.hasChecked && !profileState.error && user && user.id === userId) {
      console.log('📋 Using cached profile result:', profileState.hasUsername);
      return profileState.hasUsername;
    }

    // CRITICAL: Check if this is a new signup BEFORE doing any profile checks
    const isNewSignup = localStorage.getItem('auth-new-signup') === 'true';
    if (isNewSignup) {
      console.log('🆔 New signup flag detected - immediately setting no profile');
      setProfileStateWithPersistence(prev => ({ 
        ...prev, 
        hasChecked: true, 
        hasUsername: false,
        isLoading: false 
      }));
      localStorage.removeItem('auth-new-signup'); // Clear the flag
      return false;
    }

    // If user changed, reset profile state and recheck
    if (profileState.hasChecked && (!user || user.id !== userId)) {
      console.log('🔄 User changed, resetting profile state');
      setProfileStateWithPersistence({
        hasChecked: false,
        isLoading: false,
        hasUsername: null,
        error: null
      });
    }

    // Simple and direct approach - no complex timeouts
    try {
      // Check for new signup flag first
      const isNewSignup = localStorage.getItem('auth-new-signup') === 'true';
      console.log('🆕 New signup flag in localStorage:', isNewSignup);

      // If new signup flag is set, immediately set state to no username
      if (isNewSignup) {
        console.log('🆕 New signup detected, immediately setting no username');
        setProfileStateWithPersistence(prev => ({ 
          ...prev, 
          hasChecked: true, 
          hasUsername: false,
          isLoading: false,
          error: null
        }));
        
        // Don't clear the new signup flag yet - keep it until user sets username
        console.log('🆕 Keeping new signup flag until username is set');
        
        return false;
      }

      // Create promises with different timeouts
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile check timeout')), 5000);
      });
      
      const hardTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('HARD_TIMEOUT')), 10000);
      });

      // Database query
      const profilePromise = supabase
        .from('users')
        .select('username, username_locked')
        .eq('id', userId)
        .single();

      // Wait for the database query with timeout
      const { data, error } = await Promise.race([profilePromise, timeoutPromise, hardTimeout]);

      if (error) {
        console.log('📝 Profile check error:', error.code, error.message);
        if (error.code === 'PGRST116') {
          // No rows returned - user doesn't have a profile
          console.log('❌ User has no profile');
          const result = false;
          setProfileStateWithPersistence(prev => ({ 
            ...prev, 
            hasChecked: true, 
            hasUsername: result,
            isLoading: false,
            error: null
          }));
          return result;
        } else {
          // Other error - treat as no profile for safety
          console.log('❌ Profile check failed, assuming no profile');
          const result = false;
          setProfileStateWithPersistence(prev => ({ 
            ...prev, 
            hasChecked: true, 
            hasUsername: result,
            isLoading: false,
            error: error.message
          }));
          return result;
        }
      } else {
        console.log('✅ User profile found:', data);
        console.log('🔍 Profile data - username:', data.username, 'locked:', data.username_locked);
        const result = !!(data.username && data.username !== null && data.username !== '');
        console.log('🎯 Has username result:', result);
        
        // If user now has a username, clear the new signup flag
        if (result) {
          const isNewSignup = localStorage.getItem('auth-new-signup') === 'true';
          if (isNewSignup) {
            localStorage.removeItem('auth-new-signup');
            console.log('🗑️ Cleared new signup flag - user now has username');
          }
        }
        
        setProfileStateWithPersistence(prev => ({ 
          ...prev, 
          hasChecked: true, 
          hasUsername: result,
          isLoading: false,
          error: null
        }));
        return result;
      }

    } catch (error) {
      console.log('📝 Profile check caught error:', error.message);
      
      // Handle timeout errors
      if (error.message === 'Profile check timeout' || error.message === 'HARD_TIMEOUT') {
        console.log('⏰ Profile check timed out, assuming no username');
        const result = false;
        setProfileStateWithPersistence(prev => ({ 
          ...prev, 
          hasChecked: true, 
          hasUsername: result,
          isLoading: false,
          error: 'Timeout - assuming no username'
        }));
        return result;
      } else {
        console.log('❌ Profile check failed:', error);
        setProfileStateWithPersistence(prev => ({ 
          ...prev, 
          hasChecked: true, 
          hasUsername: false, // Assume no username on any error
          isLoading: false,
          error: error.message
        }));
        return false;
      }
    }
  }, [profileState.hasChecked, profileState.isLoading, profileState.error]);

  // Verify session is valid by making a real API call
  const verifySession = useCallback(async (session) => {
    if (!session?.user) {
      return false;
    }

    try {
      console.log('🔍 Verifying session for user:', session.user.id);
      
      // Make an actual API call to verify the session
      const { data, error } = await supabase.auth.getUser(session.access_token);
      
      if (error) {
        console.error('❌ Session verification failed:', error.message);
        
        // If it's a 403 error or user doesn't exist, the session is definitely invalid
        if (error.message.includes('403') || error.message.includes('does not exist')) {
          console.log('🔑 Session appears to be invalid or expired - user deleted from Supabase');
          return false;
        }
        
        // For other errors, try a more lenient check
        console.log('⚠️ Session verification error, trying lenient check');
        
        // Check if we have a basic session structure
        if (session.access_token && session.user?.id) {
          console.log('✅ Session structure looks valid despite verification error');
          return true;
        }
        
        return false;
      }
      
      console.log('✅ Session verified for user:', data.user.id);
      return true;
    } catch (error) {
      console.error('❌ Session verification error:', error);
      
      // For network errors or other issues, be more lenient
      if (session.access_token && session.user?.id) {
        console.log('✅ Session structure looks valid despite error');
        return true;
      }
      
      return false;
    }
  }, [supabase]);

  // Auto logout if session becomes invalid
  const handleInvalidSession = async () => {
    console.log(' Invalid session detected, clearing session immediately...');
    
    // Just clear everything and redirect - no complex logic
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    
    // Clear all state
    setUser(null);
    setSession(null);
    setProfileStateWithPersistence({
      hasChecked: false,
      isLoading: false,
      hasUsername: null,
      error: null
    });
    
    // Clear localStorage
    try {
      localStorage.removeItem('auth-new-signup');
      localStorage.removeItem('auth-profile-state');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Simple redirect
    console.log('🔄 Redirecting to login...');
    window.location.href = '/login';
  };

  // Global auth state listener
  useEffect(() => {
    let mounted = true;
    console.log('🚀 AuthProvider initializing...');

    const initializeAuth = async () => {
      try {
        console.log('🔍 Getting initial session...');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('📋 Initial session result:', session?.user?.id ? 'User found' : 'No user');

        if (session?.user) {
          // CRITICAL: Verify the session is valid on initialization
          const isValidSession = await verifySession(session);
          
          if (!isValidSession) {
            console.log('❌ Initial session is invalid, clearing...');
            await handleInvalidSession();
            setLoading(false);
            return;
          }

          setUser(session.user);
          setSession(session);
          
          // Check user profile
          await checkUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('✅ AuthProvider initialization complete');
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.id);
        console.log('🔍 New signup flag check:', localStorage.getItem('auth-new-signup'));
        console.log('🔍 Current profile state:', profileState);

        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setSession(null);
          clearProfileStateCache();
          setProfileStateWithPersistence({
            hasChecked: false,
            isLoading: false,
            hasUsername: null,
            error: null
          });
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed, verify session is still valid
          if (session?.user) {
            console.log('🔄 Token refreshed for user:', session.user.id);
            const isValidSession = await verifySession(session);
            if (isValidSession) {
              setUser(session.user);
              setSession(session);
            } else {
              await handleInvalidSession();
              return;
            }
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          // This handles SIGNED_IN and other events with valid session
          console.log('🔄 Processing auth event:', event, 'for user:', session.user.id);
          console.log('📧 User email from session:', session.user.email);
          console.log('👤 Full user object:', session.user);
          
          // CRITICAL: Check for new signup flag BEFORE any session verification
          const isNewSignup = localStorage.getItem('auth-new-signup') === 'true';
          console.log('🆔 New signup flag in SIGNED_IN:', isNewSignup);
          
          if (isNewSignup) {
            console.log('🆔 New signup detected in SIGNED_IN - setting no profile immediately');
            setUser(session.user);
            setSession(session);
            setProfileStateWithPersistence({
              hasChecked: true,
              isLoading: false,
              hasUsername: false,
              error: null
            });
            
            // Don't clear the new signup flag yet - keep it until user sets username
            console.log('🆕 Keeping new signup flag in auth state listener until username is set');
            
            setLoading(false);
            return;
          }
          
          // CRITICAL: Verify session is valid to prevent ghost sessions
          const isValidSession = await verifySession(session);
          
          if (!isValidSession) {
            console.log('❌ Auth session is invalid, logging out');
            await handleInvalidSession();
            return;
          }

          console.log('✅ Auth session verified, setting user state');
          setUser(session.user);
          setSession(session);
          await checkUserProfile(session.user.id);
        } else if (session?.user) {
          // This handles other events with valid session
          console.log('🔄 Processing other auth event:', event, 'for user:', session.user.id);
          
          // CRITICAL: Verify session is valid to prevent ghost sessions
          const isValidSession = await verifySession(session);
          
          if (!isValidSession) {
            console.log('❌ Auth session is invalid, logging out');
            await handleInvalidSession();
            return;
          }

          console.log('✅ Auth session verified, setting user state');
          setUser(session.user);
          setSession(session);
          await checkUserProfile(session.user.id);
        }

        setLoading(false);
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
      clearProfileStateCache();
      setProfileStateWithPersistence({
        hasChecked: false,
        isLoading: false,
        hasUsername: null,
        error: null
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    profileState,
    hasUsername: profileState.hasUsername,
    profileLoading: profileState.isLoading,
    signInWithEmail,
    signOut,
    checkUserProfile,
    verifySession,
    handleInvalidSession
  };

  // Debug: Log user object changes
  useEffect(() => {
    if (user) {
      console.log('👤 User object updated:', {
        id: user.id,
        email: user.email,
        hasEmail: !!user.email,
        userMetadata: user.user_metadata
      });
    } else {
      console.log('👤 User object cleared');
    }
  }, [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
