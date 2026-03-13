import { getSupabaseClient } from './supabase.js';

// Get user profile data
export const getUserProfile = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

// Get user posts
export const getUserPosts = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserPosts:', error);
    return [];
  }
};

// Calculate user statistics
export const calculateUserStats = (posts) => {
  if (!posts || !Array.isArray(posts)) {
    return { posts: 0, karma: 0, daysActive: 0 };
  }

  const totalPosts = posts.length;
  const totalKarma = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
  
  // Calculate days active (unique days with posts)
  const uniqueDays = new Set(
    posts.map(post => post.created_at?.split('T')[0]).filter(Boolean)
  );
  const daysActive = uniqueDays.size;

  return {
    posts: totalPosts,
    karma: totalKarma,
    daysActive: daysActive
  };
};
