import React, { useState, useEffect, useContext, createContext, useRef } from 'react';
import { getSupabaseClient } from '../services/supabase';
import { checkUserHasUsername } from '../services/userProfile.js';

const AuthContext = createContext();

/**
 * AuthProvider - Single source of truth for auth and profile state
 * Profile is checked ONCE per session and cached globally
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUsername, setHasUsername] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Prevent duplicate profile checks
  const profileCheckRef = useRef(false);

  /**
   * Check profile ONCE per session - prevents multiple API calls
   */
  const checkProfileOnce = async (userId) => {
    if (profileCheckRef.current) {
      console.log('🔄 Using cached profile result:', hasUsername);
      return hasUsername;
    }

    if (!userId) {
      console.log('❌ No userId provided for profile check');
      setProfileLoading(false);
      return false;
    }

    console.log('🔍 Checking profile ONCE for user:', userId);
    profileCheckRef.current = true;
    setProfileLoading(true);

    try {
      const usernameExists = await checkUserHasUsername(userId);
      console.log('🔍 Profile check result:', usernameExists);
      console.log('🔍 Setting hasUsername to:', usernameExists);
      setHasUsername(usernameExists);
      return usernameExists;
    } catch (error) {
      console.error('❌ Profile check failed:', error);
      console.log('🔍 Setting hasUsername to false due to error');
      setHasUsername(false);
      return false;
    } finally {
      console.log('🔍 Profile check completed, setting loading to false');
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    // Initialize auth state on component mount
    const initializeAuth = async () => {
      try {
        const client = getSupabaseClient();
        if (!client) {
          console.error('Supabase client not initialized');
          if (mounted) setLoading(false);
          return;
        }

        // Get current user session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setUser(session?.user ?? null);
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Set up auth state change listener
    const setupAuthListener = () => {
      const client = getSupabaseClient();
      if (!client || !mounted) return;

      const { data: { subscription } } = client.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state changed:', event);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Reset profile state when user changes
          if (event === 'SIGNED_OUT') {
            console.log('🔐 User signed out, resetting profile state');
            profileCheckRef.current = false;
            setHasUsername(null);
            setProfileLoading(false);
          } else if (event === 'SIGNED_IN') {
            console.log('🔐 User signed in, profile will be checked');
            // Don't reset profile state on sign in - let useEffect handle it
          }
        }
      );

      authSubscription = subscription;
    };

    initializeAuth();
    setupAuthListener();

    // Cleanup function
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Auto-check profile when user becomes available
  useEffect(() => {
    if (user && !profileCheckRef.current) {
      checkProfileOnce(user.id);
    }
  }, [user]);

  // Derived state
  const isLoggedIn = !!user;

  // Auth functions only
  const signInWithEmail = async (email) => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    hasUsername,
    profileLoading,
    checkProfileOnce,
    signInWithEmail,
    signOut
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

/**
 * Custom hook to access authentication state and profile checker
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}