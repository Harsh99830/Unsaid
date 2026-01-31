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
        
        // Only use cached state if user session is still valid
        // This prevents showing stale cached data
        return {
          hasChecked: false, // Always recheck on app load
          isLoading: false,
          hasUsername: null,
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

  // Check user profile exists with caching and hard timeout
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
      console.log('🔍 Checking profile for user:', userId);
      
      setProfileStateWithPersistence(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Set a hard timeout to force resolution
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.log('⚡ 1 second timeout - forcing instant response');
          const result = true; // Assume existing user has profile
          setProfileStateWithPersistence(prev => ({ 
            ...prev, 
            hasChecked: true, 
            hasUsername: result,
            isLoading: false,
            error: 'Timeout - assumed profile exists'
          }));
          resolve(result);
        }, 1000);
      });
      
      // Try the database query
      const queryPromise = (async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('username, username_locked')
            .eq('id', userId)
            .single();
            
          if (error) {
            console.log('📝 Profile check error:', error.code, error.message);
            if (error.code === 'PGRST116') {
              console.log('❌ User has no profile');
              const result = false;
              setProfileStateWithPersistence(prev => ({ 
                ...prev, 
                hasChecked: true, 
                hasUsername: result,
                isLoading: false 
              }));
              return result;
            }
            throw error;
          }

          console.log('✅ User profile found:', data);
          console.log('🔍 Profile data - username:', data.username, 'locked:', data.username_locked);
          const result = !!(data.username && data.username !== null && data.username !== '');
          console.log('🎯 Has username result:', result);
          setProfileStateWithPersistence(prev => ({ 
            ...prev, 
            hasChecked: true, 
            hasUsername: result,
            isLoading: false 
          }));
          
          return result;
          
        } catch (queryError) {
          console.log('❌ Query failed, assuming user has profile');
          const result = true; // Assume existing user has profile
          setProfileStateWithPersistence(prev => ({ 
            ...prev, 
            hasChecked: true, 
            hasUsername: result,
            isLoading: false,
            error: 'Query failed - assumed profile exists'
          }));
          return result;
        }
      })();
      
      // Race between query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);
      return result;
      
    } catch (error) {
      console.error('Unexpected error:', error);
      
      // Ultimate fallback
      const result = true;
      setProfileStateWithPersistence(prev => ({ 
        ...prev, 
        hasChecked: true, 
        hasUsername: result,
        error: error.message,
        isLoading: false 
      }));
      return result;
    }
  }, [supabase, profileState.hasChecked, profileState.error, user]);

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
        return false;
      }
      
      if (!data.user) {
        console.error('❌ No user data returned - ghost session');
        return false;
      }
      
      console.log('✅ Session verified for user:', data.user.id);
      return true;
    } catch (error) {
      console.error('❌ Session verification error:', error);
      return false;
    }
  }, [supabase]);

  // Auto logout if session becomes invalid
  const handleInvalidSession = async () => {
    console.log('🔒 Invalid session detected, logging out...');
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
    
    // Redirect to login
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

        if (event === 'SIGNED_OUT') {
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
          console.log('🔄 Processing auth event:', event, 'for user:', session.user.id);
          
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
          
          // Add timeout fallback for profile check
          const profileCheckTimeout = setTimeout(() => {
            console.log('⏰ Profile check timeout, setting loading to false');
            setLoading(false);
          }, 4000); // 4 second timeout (reduced from 5)
          
          await checkUserProfile(session.user.id);
          clearTimeout(profileCheckTimeout);
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
