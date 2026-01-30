import { getSupabaseClient } from './supabase';

/**
 * Fetch user profile data from Supabase users table
 * @param {string} userId - User ID from auth.users
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
}

/**
 * Fetch user's posts from Supabase posts table
 * @param {string} userId - User ID from auth.users
 * @returns {Promise<Array>} Array of user's posts
 */
export async function getUserPosts(userId) {
  if (!userId) {
    return [];
  }

  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  try {
    const { data, error } = await client
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      
      // Check if posts table doesn't exist
      if (error.code === '42P01') {
        console.error('POSTS TABLE DOES NOT EXIST! Please create the posts table in Supabase.');
        return []; // Return empty array instead of throwing
      }
      
      return []; // Return empty array on error to prevent app crash
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    return []; // Return empty array on error to prevent app crash
  }
}

/**
 * Calculate user statistics from posts data
 * @param {Array} posts - Array of user's posts
 * @returns {Object} User statistics
 */
export function calculateUserStats(posts) {
  if (!posts || !Array.isArray(posts)) {
    return {
      posts: 0,
      karma: 0,
      daysActive: 0
    };
  }

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
  const totalKarma = totalLikes + totalComments;
  
  // Calculate days active (from first post to now)
  let daysActive = 0;
  if (posts.length > 0) {
    const oldestPost = posts.reduce((oldest, post) => {
      return new Date(post.created_at) < new Date(oldest.created_at) ? post : oldest;
    });
    const firstPostDate = new Date(oldestPost.created_at);
    const today = new Date();
    const diffTime = Math.abs(today - firstPostDate);
    daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    posts: posts.length,
    karma: totalKarma > 1000 ? `${(totalKarma / 1000).toFixed(1)}k` : totalKarma.toString(),
    daysActive: daysActive || 1 // At least 1 day if they have posts
  };
}

/**
 * Safely creates a user profile if it doesn't exist
 * This function prevents duplicate inserts and handles race conditions
 * 
 * @param {Object} user - Supabase auth user object
 * @param {string} username - Desired username
 * @returns {Promise<Object>} User profile data
 */
export async function createUserProfileIfNotExists(user, username) {
  if (!user || !user.id) {
    throw new Error('Valid user object is required');
  }

  if (!username || username.trim().length === 0) {
    throw new Error('Username is required');
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  // Validate that the user actually exists in auth.users
  try {
    const { data: authUser, error: authError } = await client.auth.getUser(user.id);
    if (authError || !authUser.user) {
      // Try to refresh the session and get current user
      console.log('⚠️ User not found, attempting to refresh session...');
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      
      if (sessionError || !sessionData.session?.user) {
        throw new Error('User not found in authentication system. Please log in again.');
      }
      
      // Use the refreshed user
      user = sessionData.session.user;
      console.log('✅ Session refreshed, using user:', user.id);
    }
  } catch (error) {
    throw new Error('Authentication verification failed. Please log in again.');
  }

  try {
    console.log('🔍 Checking if profile exists for user:', user.id);

    // STEP 1: First, try to SELECT existing profile
    const { data: existingProfile, error: selectError } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking existing profile:', selectError);
      throw new Error(`Database error: ${selectError.message}`);
    }

    // STEP 2: If profile exists, check if it has a username
    if (existingProfile) {
      if (existingProfile.username) {
        console.log('✅ Profile with username already exists:', existingProfile.username);
        return existingProfile;
      } else {
        console.log('⚠️ Profile exists but has no username, treating as new profile');
        // Profile exists but no username - we'll update it
      }
    }

    // STEP 3: Create or UPDATE profile
    console.log('📝 Creating/updating profile for user:', user.id, 'with username:', username);

    let profileData;
    let profileError;

    if (existingProfile) {
      // UPDATE existing profile that has no username
      console.log('� Updating existing profile with username');
      const { data, error } = await client
        .from('users')
        .update({
          username: username.trim(),
          username_locked: true
        })
        .eq('id', user.id)
        .select()
        .single();
      
      profileData = data;
      profileError = error;
    } else {
      // INSERT new profile
      console.log('➕ Creating new profile');
      const { data, error } = await client
        .from('users')
        .insert([
          {
            id: user.id,
            username: username.trim(),
            username_locked: true
          }
        ])
        .select()
        .single();
      
      profileData = data;
      profileError = error;
    }

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      
      // Handle specific errors
      if (profileError.code === '23505') {
        if (profileError.message.includes('users_pkey')) {
          // Race condition: Another request created the profile
          // Fetch it again and return
          console.log('🔄 Race condition detected, fetching profile again...');
          const { data: raceProfile } = await client
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (raceProfile) {
            console.log('✅ Profile found after race condition:', raceProfile.username);
            return raceProfile;
          }
        } else if (profileError.message.includes('username')) {
          throw new Error('Username already taken. Please choose another.');
        } else {
          throw new Error('Profile already exists. Please try refreshing the page.');
        }
      } else if (profileError.code === '42501') {
        throw new Error('Permission denied. Check RLS policies.');
      } else {
        throw new Error(`Database error: ${profileError.message}`);
      }
    }

    console.log('🎉 Profile created/updated successfully:', profileData.username);
    return profileData;

  } catch (error) {
    console.error('❌ Error in createUserProfileIfNotExists:', error);
    throw error;
  }
}

/**
 * Checks if a user has a username set
 * @param {string} userId - User ID from auth.users
 * @returns {Promise<boolean>} True if user has username set and locked
 */
export async function checkUserHasUsername(userId) {
  if (!userId) {
    console.log('❌ checkUserHasUsername: No userId provided');
    return false;
  }

  const client = getSupabaseClient();
  if (!client) {
    console.log('❌ checkUserHasUsername: Supabase client not initialized');
    return false;
  }

  try {
    console.log('🔍 checkUserHasUsername: Checking username for user:', userId);
    
    // First, quickly test if the users table exists
    try {
      const { data: tableTest, error: tableError } = await client
        .from('users')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        console.log('❌ checkUserHasUsername: users table does not exist');
        return false;
      }
    } catch (testError) {
      console.log('❌ checkUserHasUsername: Error testing users table:', testError);
      return false;
    }
    
    // Add a timeout to the database query
    const queryPromise = client
      .from('users')
      .select('username, username_locked')
      .eq('id', userId)
      .maybeSingle();

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 3000)
    );

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('❌ checkUserHasUsername: Database error:', error);
      return false;
    }

    console.log('🔍 checkUserHasUsername: Query result:', data);
    console.log('🔍 checkUserHasUsername: Data details:', {
      data: data,
      username: data?.username,
      username_locked: data?.username_locked,
      usernameType: typeof data?.username,
      usernameLockedType: typeof data?.username_locked,
      hasUsername: !!(data && data.username && data.username_locked === true)
    });
    
    // More robust check - handle null, undefined, empty string, etc.
    const hasUsername = !!(
      data && 
      data.username && 
      data.username !== null && 
      data.username !== undefined && 
      data.username !== '' && 
      data.username_locked === true
    );
    
    console.log('🔍 checkUserHasUsername: Final has username?', hasUsername);
    return hasUsername;
  } catch (error) {
    console.error('❌ checkUserHasUsername: Exception:', error);
    if (error.message === 'Database query timeout') {
      console.log('⚠️ Database query timed out, assuming no username');
    }
    return false;
  }
}
