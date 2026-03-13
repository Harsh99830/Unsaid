import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  // All auth state in a single object so it updates atomically in one setState call.
  // This eliminates every possible intermediate render where e.g. user is set but hasUsername is not yet.
  const [authState, setAuthState] = useState({
    user: null,
    session: null,
    hasUsername: false,
    username: null,
    initializing: true, // stays true until FIRST full resolution
  });

  const supabase = getSupabaseClient();
  // Ref so the onAuthStateChange handler can check if bootstrap already ran,
  // without needing it in the dependency array.
  const bootstrapped = useRef(false);

  const fetchUsername = async (userId) => {
    if (!supabase) return { hasUsername: false, username: null };
    try {
      const { data, error } = await Promise.race([
        supabase.from('users').select('username').eq('id', userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      if (error && error.code !== 'PGRST116') {
        console.error('fetchUsername error:', error);
        return { hasUsername: false, username: null };
      }
      return data?.username
        ? { hasUsername: true, username: data.username }
        : { hasUsername: false, username: null };
    } catch (err) {
      console.error('fetchUsername failed:', err.message);
      return { hasUsername: false, username: null };
    }
  };

  useEffect(() => {
    if (!supabase) {
      setAuthState(s => ({ ...s, initializing: false }));
      return;
    }

    let mounted = true;

    // Step 1: Explicitly call getSession() to get the current session.
    // Step 2: If there's a user, fetch their username.
    // Step 3: Set ALL state at once in a single setAuthState call.
    // Step 4: Only then set bootstrapped = true and release the gate.
    //
    // The onAuthStateChange listener is IGNORED until bootstrapped = true,
    // so there's zero chance of it interfering with the initial load.
    const bootstrap = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.error('getSession error:', error);
          if (mounted) {
            bootstrapped.current = true;
            setAuthState({ user: null, session: null, hasUsername: false, username: null, initializing: false });
          }
          return;
        }

        if (session?.user) {
          const result = await fetchUsername(session.user.id);
          if (!mounted) return;
          bootstrapped.current = true;
          // Single atomic state update — no intermediate renders possible
          setAuthState({
            user: session.user,
            session,
            hasUsername: result.hasUsername,
            username: result.username,
            initializing: false,
          });
        } else {
          bootstrapped.current = true;
          setAuthState({ user: null, session: null, hasUsername: false, username: null, initializing: false });
        }
      } catch (err) {
        console.error('Bootstrap error:', err);
        if (mounted) {
          bootstrapped.current = true;
          setAuthState({ user: null, session: null, hasUsername: false, username: null, initializing: false });
        }
      }
    };

    bootstrap();

    // This listener only handles changes AFTER bootstrap (token refresh, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        // Ignore all events until bootstrap has finished
        if (!bootstrapped.current) return;

        console.log('Post-bootstrap auth event:', event);

        if (event === 'SIGNED_IN' && newSession?.user) {
          const result = await fetchUsername(newSession.user.id);
          if (!mounted) return;
          setAuthState({
            user: newSession.user,
            session: newSession,
            hasUsername: result.hasUsername,
            username: result.username,
            initializing: false,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({ user: null, session: null, hasUsername: false, username: null, initializing: false });
        } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
          setAuthState(s => ({ ...s, user: newSession.user, session: newSession }));
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          setAuthState(s => ({ ...s, user: newSession.user, session: newSession }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const saveUsername = async (userId, selectedUsername) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({ id: userId, username: selectedUsername, created_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      setAuthState(s => ({ ...s, hasUsername: true, username: selectedUsername }));
      return { success: true, data };
    } catch (error) {
      console.error('saveUsername error:', error);
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signInWithEmail = async (email) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      // onAuthStateChange SIGNED_OUT will clean up state
    } catch (error) {
      console.error('signOut error:', error);
    }
  };

  // Destructure for clean context value
  const { user, session, hasUsername, username, initializing } = authState;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      initializing,
      hasUsername,
      username,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      saveUsername,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
