import { useState, useEffect, useCallback } from 'react';
import { getAllPosts, getPostsByCategory } from './postQueries';

// React hook for posts state management
export const usePosts = (category = 'all', initialLimit = 10) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  // Fetch posts function
  const fetchPosts = useCallback(async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      let fetchedPosts;
      if (category === 'all') {
        fetchedPosts = await getAllPosts();
      } else {
        fetchedPosts = await getPostsByCategory(category);
      }

      // Apply pagination
      const startIndex = append ? page * initialLimit : 0;
      const endIndex = startIndex + initialLimit;
      const paginatedPosts = fetchedPosts.slice(startIndex, endIndex);

      // Update state
      if (append) {
        setPosts(prev => [...prev, ...paginatedPosts]);
        setPage(prev => prev + 1);
      } else {
        setPosts(paginatedPosts);
        setPage(1);
      }

      // Check if there are more posts
      setHasMore(endIndex < fetchedPosts.length);

    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, page, initialLimit]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(true);
    }
  }, [fetchPosts, loadingMore, hasMore]);

  // Refresh function
  const refresh = useCallback(() => {
    setPage(0);
    fetchPosts(false);
  }, [fetchPosts]);

  // Reset for category change
  const resetForCategory = useCallback(() => {
    setPosts([]);
    setPage(0);
    setLoading(true);
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPosts(false);
  }, [category]); // Re-fetch when category changes

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    resetForCategory
  };
};