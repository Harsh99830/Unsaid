import { getSupabaseClient } from '../../services/supabase';

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