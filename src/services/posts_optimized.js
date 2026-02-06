import { getSupabaseClient } from './supabase';

// Posts table structure
export const Post = {
  id: 'string',
  content: 'string',
  category: 'string',
  image_url: 'string',
  image_public_id: 'string',
  user_id: 'string',
  created_at: 'string',
  likes_count: 'number',
  comments_count: 'number',
  shares_count: 'number'
};

// In-memory cache for posts
const postsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache utilities
const getCacheKey = (category, cursor) => `${category}-${cursor || 'first'}`;
const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_TTL;

const getCachedData = (category, cursor) => {
  const key = getCacheKey(category, cursor);
  const cached = postsCache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('📋 Using cached posts for:', key);
    return cached.data;
  }
  return null;
};

const setCachedData = (category, cursor, data) => {
  const key = getCacheKey(category, cursor);
  postsCache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log('💾 Cached posts for:', key);
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client
      .from('posts')
      .insert([{
        content: postData.content,
        category: postData.category,
        image_url: postData.image_url,
        image_public_id: postData.image_public_id,
        user_id: postData.user_id,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0
      }])
      .select();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    console.log('Post created successfully:', data);
    
    // Invalidate cache for this category
    const category = postData.category || 'all';
    postsCache.delete(getCacheKey(category, 'first'));
    postsCache.delete(getCacheKey(category, data[0]?.created_at));
    
    return data[0];
  } catch (error) {
    console.error('Error in createPost:', error);
    throw error;
  }
};

// Cursor-based pagination for posts
export const getPostsPaginated = async (category = 'all', cursor = null, limit = 10) => {
  try {
    const client = getSupabaseClient();
    if (!client) return { data: [], hasMore: false, nextCursor: null };

    // Check cache first
    const cachedData = getCachedData(category, cursor);
    if (cachedData) {
      return cachedData;
    }

    let query = client
      .from('posts')
      .select('*, users!inner(username)')
      .order('created_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Apply category filter if not 'all'
    if (category !== 'all') {
      query = query.eq('category', category);
    }

    // Apply cursor for pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      
      if (error.code === '42P01') {
        console.error('POSTS TABLE DOES NOT EXIST! Please create posts table in Supabase.');
        return { data: [], hasMore: false, nextCursor: null };
      }
      
      throw error;
    }

    // Determine if there are more posts
    const hasMore = data.length > limit;
    const posts = hasMore ? data.slice(0, -1) : data; // Remove the extra item
    const nextCursor = posts.length > 0 ? posts[posts.length - 1].created_at : null;

    // Transform data to include author_name from joined username
    const transformedData = posts.map(post => ({
      ...post,
      author_name: post.users?.username || 'Anonymous'
    }));

    const result = {
      data: transformedData,
      hasMore,
      nextCursor
    };

    // Cache the result
    setCachedData(category, cursor, result);

    console.log('📊 Posts fetched:', {
      category,
      cursor,
      count: transformedData.length,
      hasMore,
      nextCursor
    });

    return result;
  } catch (error) {
    console.error('Error in getPostsPaginated:', error);
    return { data: [], hasMore: false, nextCursor: null };
  }
};

// Legacy functions for backward compatibility
export const getAllPosts = async () => {
  const result = await getPostsPaginated('all', null, 50); // Get more for initial load
  return result.data;
};

export const getPostsByCategory = async (category) => {
  const result = await getPostsPaginated(category, null, 50); // Get more for initial load
  return result.data;
};

// Like a post
export const likePost = async (postId) => {
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client
      .from('posts')
      .update({ likes_count: client.raw('likes_count + 1') })
      .eq('id', postId)
      .select();

    if (error) {
      console.error('Error liking post:', error);
      throw error;
    }

    // Invalidate all caches since likes count changed
    postsCache.clear();
    console.log('🗑️ Cleared all posts cache due to like update');

    return data[0];
  } catch (error) {
    console.error('Error in likePost:', error);
    throw error;
  }
};

// Clear cache utility
export const clearPostsCache = () => {
  postsCache.clear();
  console.log('🗑️ Posts cache cleared');
};

// Get cache stats for debugging
export const getCacheStats = () => {
  const stats = {
    size: postsCache.size,
    keys: Array.from(postsCache.keys()),
    entries: Array.from(postsCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp,
      valid: isCacheValid(value.timestamp)
    }))
  };
  
  console.log('📊 Cache stats:', stats);
  return stats;
};
