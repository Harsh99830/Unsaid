import { supabase } from './supabase';

// Posts table structure
export const Post = {
  id: 'string',
  content: 'string',
  category: 'string',
  image_url: 'string',
  image_public_id: 'string',
  author_name: 'string',
  created_at: 'string',
  likes: 'number',
  comments: 'number',
  shares: 'number'
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        content: postData.content,
        category: postData.category,
        image_url: postData.image_url,
        image_public_id: postData.image_public_id,
        author_name: postData.author_name,
        likes: 0,
        comments: 0,
        shares: 0
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
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    throw error;
  }
};

// Get posts by category
export const getPostsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts by category:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPostsByCategory:', error);
    throw error;
  }
};

// Like a post
export const likePost = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ likes: supabase.raw('likes + 1') })
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
