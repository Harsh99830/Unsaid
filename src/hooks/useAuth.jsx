import React, { useState, useEffect, useContext, createContext } from 'react';
import { getSupabaseClient } from '../services/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedUserId, setFetchedUserId] = useState(null);

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    // Wait for component to fully mount
    const initTimer = setTimeout(async () => {
      if (!mounted) return;

      try {
        const client = getSupabaseClient();
        if (!client) {
          if (mounted) setLoading(false);
          return;
        }

        // Get session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
        } else {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchUserData(session.user.id);
          }
        }
        
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 100);

    // Set up auth listener
    const setupListener = () => {
      const client = getSupabaseClient();
      if (!client || !mounted) return;

      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          
          console.log('Auth state:', event);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserData(session.user.id);
          } else {
            setUserProfile(null);
          }
          
          setLoading(false);
        }
      );

      authSubscription = subscription;
    };

    setupListener();

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const fetchUserData = async (userId) => {
    // Prevent duplicate fetches - check if we already fetched this user
    if (isFetching || fetchedUserId === userId) {
      console.log('Already fetching or user data cached, skipping duplicate call for:', userId);
      return;
    }

    setIsFetching(true);
    setFetchedUserId(userId);
    
    try {
      console.log('Fetching user data from public.users for:', userId);
      
      const client = getSupabaseClient();
      if (!client) return;
      
      const { data, error } = await client
        .from('users')
        .select('id, username, username_locked, avatar_url, bio, posts_count, likes_given_count, comments_count, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        console.log('Fetch error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        // If table doesn't exist, show clear error
        if (error.code === '42P01') {
          console.error('USERS TABLE DOES NOT EXIST! Please create the users table in Supabase.');
        } else if (error.code === '42501') {
          console.error('RLS PERMISSION ERROR! Please check Row Level Security policies.');
        } else {
          console.error('Database error:', error.message);
        }
        // Reset cache on error to allow retry
        setFetchedUserId(null);
        return;
      }

      // Handle case where no user profile exists yet
      if (data) {
        setUserProfile(data);
        console.log('✅ User profile found:', {
          id: data.id,
          username: data.username,
          username_locked: data.username_locked,
          avatar_url: data.avatar_url,
          bio: data.bio,
          posts_count: data.posts_count,
          likes_given_count: data.likes_given_count,
          comments_count: data.comments_count,
          created_at: data.created_at
        });
        console.log('🎉 SUCCESS! User authenticated with profile:', data.username);
      } else {
        console.log('ℹ️ No user profile found for user:', userId);
        setUserProfile(null);
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Reset cache on error to allow retry
      setFetchedUserId(null);
    } finally {
      setIsFetching(false);
    }
  };

  // Add function to show all users for debugging
  const fetchAllUsers = async () => {
    try {
      console.log('Fetching all users from database...');
      const client = getSupabaseClient();
      if (!client) return;
      
      const { data, error } = await client
        .from('users')
        .select(`
          id,
          username,
          username_locked,
          avatar_url,
          bio,
          posts_count,
          likes_given_count,
          comments_count,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        return;
      }

      console.log('All users in database:', data);
      console.log(`Total users: ${data?.length || 0}`);
      
      return data;
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

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

  const createUserProfile = async (userId, username) => {
    try {
      // Check if users table exists and is accessible
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase client not initialized');
      
      const { data: testCheck, error: testError } = await client
        .from('users')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Users table error:', testError);
        throw new Error('Database configuration error. Please check Supabase setup.');
      }

      const { data, error } = await client
        .from('users')
        .insert([
          {
            id: userId,
            username: username,
            username_locked: true
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Create user profile error:', error);
        if (error.code === '23505') {
          throw new Error('Username already taken. Please choose another.');
        } else if (error.code === '42501') {
          throw new Error('Permission denied. Check RLS policies.');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      setUserProfile(data);
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInWithEmail,
    signOut,
    createUserProfile,
    fetchUserData,
    fetchAllUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}