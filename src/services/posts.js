import { getSupabaseClient } from './supabase';

// Posts table structure
export const Post = {
  id: 'string',
  content: 'string',
  category: 'string',
  image_url: 'string',
  image_public_id: 'string',
  user_id: 'string', // Changed from author_id to match database schema
  created_at: 'string',
  likes_count: 'number', // Changed from likes to match database schema
  comments_count: 'number', // Changed from comments to match database schema
  shares_count: 'number' // Changed from shares to match database schema
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
        user_id: postData.user_id, // Changed from author_id
        likes_count: 0, // Changed from likes
        comments_count: 0, // Changed from comments
        shares_count: 0 // Changed from shares
      }])
      .select();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    console.log('Post created successfully:', data);
    return data[0];
  } catch (error) {
    console.error('Error in createPost:', error);
    throw error;
  }
};

// Get all posts
export const getAllPosts = async () => {
  try {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('posts')
      .select('*, users!inner(username)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      
      // Check if posts table doesn't exist
      if (error.code === '42P01') {
        console.error('POSTS TABLE DOES NOT EXIST! Please create posts table in Supabase.');
        return []; // Return empty array instead of throwing
      }
      
      throw error;
    }

    console.log('📊 Posts fetched:', data?.length || 0, 'posts');
    console.log('📝 Sample post data:', data?.[0]);

    // Transform data to include author_name from joined username
    const transformedData = data?.map(post => ({
      ...post,
      author_name: post.users?.username || 'Anonymous'
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    return []; // Return empty array on error to prevent app crash
  }
};

// Get posts by category
export const getPostsByCategory = async (category) => {
  try {
    const client = getSupabaseClient();
    if (!client) return [];
    
    const { data, error } = await client
      .from('posts')
      .select('*, users!inner(username)')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts by category:', error);
      throw error;
    }

    console.log('📊 ' + category + ' posts fetched:', data?.length || 0, 'posts');

    // Transform data to include author_name from joined username
    const transformedData = data?.map(post => ({
      ...post,
      author_name: post.users?.username || 'Anonymous'
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error in getPostsByCategory:', error);
    throw error;
  }
};

// Like a post
export const likePost = async (postId) => {
  try {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not initialized');
    
    const { data, error } = await client
      .from('posts')
      .update({ likes_count: client.raw('likes_count + 1') }) // Changed from likes to likes_count
      .eq('id', postId)
      .select();

    if (error) {
      console.error('Error liking post:', error);
      throw error;
    }

    return data[0];
  } catch (error) {
    console.error('Error in likePost:', error);
    throw error;
  }
};
