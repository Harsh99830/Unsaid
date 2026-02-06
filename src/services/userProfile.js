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
 * Safely creates or updates a user profile with proper error handling
 * This function prevents all "Cannot coerce the result" errors
 * 
 * @param {string} username - Desired username
 * @returns {Promise<Object>} User profile data
 */
export async function createUserProfileIfNotExists(username) {
  if (!username || username.trim().length === 0) {
    throw new Error('Username is required');
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client not initialized');
  }

  // Get the current authenticated user
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) {
    throw new Error('Authentication required. Please log in again.');
  }

  console.log('🔍 Processing profile for authenticated user:', user.id);

  try {
    // STEP 1: Check if profile exists
    const { data: existingProfile, error: selectError } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('❌ Error checking existing profile:', selectError);
      throw new Error(`Database error: ${selectError.message}`);
    }

    console.log('📋 Profile check result:', {
      exists: !!existingProfile,
      hasUsername: !!existingProfile?.username,
      isLocked: existingProfile?.username_locked
    });

    // STEP 2: Handle existing profile
    if (existingProfile) {
      if (existingProfile.username && existingProfile.username_locked) {
        console.log('✅ Profile already has locked username:', existingProfile.username);
        return existingProfile;
      }

      if (existingProfile.username && !existingProfile.username_locked) {
        console.log('⚠️ Profile has username but not locked - this should not happen');
        return existingProfile;
      }

      // Profile exists but no username - update it
      console.log('🔄 Updating existing profile with username');
      
      // Double-check that username is not locked before updating
      if (existingProfile.username_locked) {
        throw new Error('Username is already locked and cannot be changed');
      }
      
      const { error: updateError } = await client
        .from('users')
        .update({
          username: username.trim(),
          username_locked: true
        })
        .eq('id', user.id)
        .eq('username_locked', false); // Only update if not already locked

      if (updateError) {
        console.error('❌ Update failed:', updateError);
        throw new Error(`Failed to update username: ${updateError.message}`);
      }

      // Verify the update
      const { data: updatedProfile } = await client
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (updatedProfile?.username && updatedProfile?.username_locked) {
        console.log('✅ Profile updated successfully:', updatedProfile.username);
        return updatedProfile;
      } else {
        throw new Error('Update verification failed');
      }
    }

    // STEP 3: Create new profile
    console.log('➕ Creating new profile');
    
    const { error: insertError } = await client
      .from('users')
      .insert({
        id: user.id,
        username: username.trim(),
        username_locked: true
      });

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      
      if (insertError.code === '23505') {
        throw new Error('Profile already exists. Please refresh the page.');
      } else if (insertError.code === '42501') {
        throw new Error('Permission denied. Check RLS policies.');
      } else {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }
    }

    // Verify the insert
    const { data: newProfile } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (newProfile?.username && newProfile?.username_locked) {
      console.log('✅ Profile created successfully:', newProfile.username);
      return newProfile;
    } else {
      throw new Error('Insert verification failed');
    }

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
