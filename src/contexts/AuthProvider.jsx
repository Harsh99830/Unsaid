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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profileState, setProfileState] = useState({
    hasChecked: false,
    isLoading: false,
    hasUsername: null,
    error: null
  });

  const supabase = getSupabaseClient();

  // Check if user profile exists
  const checkUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfileState(prev => ({ ...prev, hasChecked: true, hasUsername: false }));
      return false;
    }

    try {
      console.log('🔍 Checking profile for user:', userId);
      setProfileState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Add timeout to prevent long hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile check timeout')), 3000); // 3 second timeout
      });
      
      const profilePromise = supabase
        .from('users')
        .select('username, username_locked')
        .eq('id', userId)
        .single();

      // Race between profile check and timeout
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        console.log('📝 Profile check error:', error.code, error.message);
        if (error.code === 'PGRST116') {
          // No rows returned - user doesn't have a profile
          console.log('❌ User has no profile');
          setProfileState(prev => ({ 
            ...prev, 
            hasChecked: true, 
            hasUsername: false,
            isLoading: false 
          }));
          return false;
        }
        throw error;
      }

      console.log('✅ User profile found:', data.username);
      setProfileState(prev => ({ 
        ...prev, 
        hasChecked: true, 
        hasUsername: !!data.username,
        isLoading: false 
      }));
      
      return !!data.username;
    } catch (error) {
      console.error('Error checking user profile:', error);
      
      // Handle timeout specifically
      if (error.message === 'Profile check timeout') {
        console.log('⏰ Profile check timed out, assuming no profile');
        setProfileState(prev => ({ 
          ...prev, 
          hasChecked: true, 
          hasUsername: false,
          isLoading: false 
        }));
        return false;
      }
      
      setProfileState(prev => ({ 
        ...prev, 
        hasChecked: true, 
        hasUsername: false,
        error: error.message,
        isLoading: false 
      }));
      return false;
    }
  }, [supabase]);

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
    setProfileState({
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
          setProfileState({
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
        } else if (session?.user) {
          // This handles SIGNED_IN and other events with valid session
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
      setProfileState({
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
