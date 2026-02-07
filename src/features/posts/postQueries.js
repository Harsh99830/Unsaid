import { getSupabaseClient } from '../../services/supabase';

// Get all posts
export const getAllPosts = async () => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.log('❌ No Supabase client found');
      return [];
    }
    
    console.log('🔍 Starting getAllPosts query...');
    console.log('🔍 Supabase client auth state:', client.auth.getSession());
    
    // First try a simple query without any JOIN
    console.log('🔄 Testing simple query without JOIN...');
    const { data: simpleData, error: simpleError } = await client
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('🔍 Simple query result:', { data: simpleData?.length || 0, error: simpleError?.message });
    
    if (simpleData && simpleData.length > 0) {
      console.log('✅ Simple query worked, data:', simpleData[0]);
      // Transform data without username for now
      const transformedData = simpleData.map(post => ({
        ...post,
        author_name: 'Anonymous' // Will fix username later
      }));
      return transformedData;
    }
    
    // If simple query doesn't work, try the JOIN
    console.log('🔄 Trying JOIN query...');
    const { data, error } = await client
      .from('posts')
      .select(`
        *,
        users!inner(username)
      `)
      .order('created_at', { ascending: false });

    console.log('🔍 Query result:', { data: data?.length || 0, error: error?.message });

    // If the inner join fails, try a different approach
    if (error && error.message?.includes('foreign key constraint')) {
      console.log('🔄 Inner join failed, trying left join...');
      const { data: data2, error: error2 } = await client
        .from('posts')
        .select(`
          *,
          users(username)
        `)
        .order('created_at', { ascending: false });
      
      console.log('🔍 Left join result:', { data: data2?.length || 0, error: error2?.message });
      
      if (!error2) {
        data = data2;
        error = null;
      }
    }

    // If all joins fail, try just posts without username
    if (error) {
      console.log('🔄 All joins failed, trying posts only...');
      const { data: data3, error: error3 } = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('🔍 Posts only result:', { data: data3?.length || 0, error: error3?.message });
      
      if (!error3) {
        data = data3;
        error = null;
      }
    }

    if (error) {
      console.error('Error fetching posts:', error);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Check if posts table doesn't exist
      if (error.code === '42P01') {
        console.error('POSTS TABLE DOES NOT EXIST! Please create posts table in Supabase.');
        return []; // Return empty array instead of throwing
      }
      
      // Check if it's a permission issue
      if (error.code === '42501') {
        console.error('PERMISSION DENIED! RLS policies are blocking access.');
        return []; // Return empty array instead of throwing
      }
      
      throw error;
    }

    console.log('📊 Posts fetched:', data?.length || 0, 'posts');
    console.log('📝 Sample post data:', data?.[0]);

    // Transform data to include author_name from joined username
    const transformedData = data?.map(post => ({
      ...post,
      author_name: post.users?.username || post.username || 'Anonymous'
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
    
    console.log('🔍 Starting getPostsByCategory query for:', category);
    
    const { data, error } = await client
      .from('posts')
      .select(`
        *,
        users!inner(username)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false });

    console.log('🔍 Category query result:', { data: data?.length || 0, error: error?.message });

    // If the inner join fails, try a different approach
    if (error && error.message?.includes('foreign key constraint')) {
      console.log('🔄 Category inner join failed, trying left join...');
      const { data: data2, error: error2 } = await client
        .from('posts')
        .select(`
          *,
          users(username)
        `)
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      console.log('🔍 Category left join result:', { data: data2?.length || 0, error: error2?.message });
      
      if (!error2) {
        data = data2;
        error = null;
      }
    }

    // If all joins fail, try just posts without username
    if (error) {
      console.log('🔄 Category all joins failed, trying posts only...');
      const { data: data3, error: error3 } = await client
        .from('posts')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });
      
      console.log('🔍 Category posts only result:', { data: data3?.length || 0, error: error3?.message });
      
      if (!error3) {
        data = data3;
        error = null;
      }
    }

    if (error) {
      console.error('Error fetching posts by category:', error);
      throw error;
    }

    console.log('📊 ' + category + ' posts fetched:', data?.length || 0, 'posts');

    // Transform data to include author_name from joined username
    const transformedData = data?.map(post => ({
      ...post,
      author_name: post.users?.username || post.username || 'Anonymous'
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error in getPostsByCategory:', error);
    throw error;
  }
};