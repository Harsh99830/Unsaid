import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAllPosts, getPostsByCategory } from '../services/posts';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../contexts/AuthProvider';

// In-memory cache for posts
const postsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [engineeringPosts, setEngineeringPosts] = useState([]);
  const [freshmanPosts, setFreshmanPosts] = useState([]);
  const [clubsPosts, setClubsPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
  
  const { user } = useAuth();
  
  // Pagination refs
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);

  // Cache utilities
  const getCacheKey = (category, page) => `${category}-${page}`;
  
  const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_TTL;
  
  const getCachedData = (category, page) => {
    const key = getCacheKey(category, page);
    const cached = postsCache.get(key);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('📋 Using cached data for:', key);
      return cached.data;
    }
    return null;
  };
  
  const setCachedData = (category, page, data) => {
    const key = getCacheKey(category, page);
    postsCache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 Cached data for:', key);
  };

  // Format post data for PostCard component
  const formatPostForCard = useCallback((post) => {
    const timeAgo = getTimeAgo(post.created_at);
    
    // Format author name - handle missing author_name gracefully
    let displayName = post.users?.username || 'Anonymous';
    if (displayName && displayName.includes('@')) {
      displayName = displayName.split('@')[0];
    }
    
    return {
      id: post.id,
      author: displayName,
      timestamp: timeAgo,
      department: post.category,
      avatar: 'person_off',
      avatarColor: 'gray',
      content: post.content,
      image: post.image_url,
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      shares: post.shares_count || 0,
      isLiked: false
    };
  }, []);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Optimized fetch with pagination and caching
  const fetchPosts = useCallback(async (category = 'all', page = 0, append = false) => {
    // Prevent duplicate requests
    if (loadingRef.current && !append) return;
    
    const cacheKey = getCacheKey(category, page);
    
    // Check cache first
    const cachedData = getCachedData(category, page);
    if (cachedData && !append) {
      console.log('⚡ Serving from cache:', category, page);
      
      if (category === 'all') {
        setPosts(cachedData.map(formatPostForCard));
      } else if (category === 'Engineering') {
        setEngineeringPosts(cachedData.map(formatPostForCard));
      } else if (category === 'Freshman') {
        setFreshmanPosts(cachedData.map(formatPostForCard));
      } else if (category === 'Clubs') {
        setClubsPosts(cachedData.map(formatPostForCard));
      }
      
      setHasMore(cachedData.length === 10); // Assume 10 is page size
      return;
    }

    try {
      loadingRef.current = true;
      
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let data;
      if (category === 'all') {
        data = await getAllPosts();
      } else {
        data = await getPostsByCategory(category);
      }

      // Apply pagination (simulate cursor-based)
      const pageSize = 10;
      const startIndex = page * pageSize;
      const paginatedData = data.slice(startIndex, startIndex + pageSize);
      
      // Cache the results
      setCachedData(category, page, paginatedData);
      
      const formattedPosts = paginatedData.map(formatPostForCard);
      
      if (append) {
        // Append for infinite scroll
        if (category === 'all') {
          setPosts(prev => [...prev, ...formattedPosts]);
        } else if (category === 'Engineering') {
          setEngineeringPosts(prev => [...prev, ...formattedPosts]);
        } else if (category === 'Freshman') {
          setFreshmanPosts(prev => [...prev, ...formattedPosts]);
        } else if (category === 'Clubs') {
          setClubsPosts(prev => [...prev, ...formattedPosts]);
        }
      } else {
        // Replace for initial load or tab switch
        if (category === 'all') {
          setPosts(formattedPosts);
        } else if (category === 'Engineering') {
          setEngineeringPosts(formattedPosts);
        } else if (category === 'Freshman') {
          setFreshmanPosts(formattedPosts);
        } else if (category === 'Clubs') {
          setClubsPosts(formattedPosts);
        }
      }

      setHasMore(paginatedData.length === pageSize);
      pageRef.current = page + 1;
      
      console.log('📊 Feed fetch results:', {
        category,
        page,
        total: data.length,
        paginated: paginatedData.length,
        hasMore: paginatedData.length === pageSize
      });
      
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [formatPostForCard]);

  // Infinite scroll observer
  const setupInfiniteScroll = useCallback(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !loadingMore) {
            console.log('📜 Loading more posts...');
            fetchPosts(activeTab, pageRef.current, true);
          }
        },
        { threshold: 0.1 }
      );
    }

    // Observe the load more trigger
    const trigger = document.getElementById('load-more-trigger');
    if (trigger) {
      observerRef.current.observe(trigger);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, activeTab, fetchPosts]);

  // Tab change handler
  const handleTabChange = useCallback((tab) => {
    if (activeTab === tab) return; // No change needed
    
    console.log('🔄 Tab change:', activeTab, '->', tab);
    setActiveTab(tab);
    pageRef.current = 0; // Reset pagination
    
    // Fetch new tab data (will use cache if available)
    fetchPosts(tab, 0, false);
  }, [activeTab, fetchPosts]);

  // Initial load
  useEffect(() => {
    console.log('🚀 Feed component mounted');
    fetchPosts('all', 0, false);
  }, [fetchPosts]);

  // Setup infinite scroll
  useEffect(() => {
    const cleanup = setupInfiniteScroll();
    return cleanup;
  }, [setupInfiniteScroll]);

  // Memoized current posts based on active tab
  const currentPosts = useMemo(() => {
    switch (activeTab) {
      case 'Engineering':
        return engineeringPosts;
      case 'Freshman':
        return freshmanPosts;
      case 'Clubs':
        return clubsPosts;
      default:
        return posts;
    }
  }, [activeTab, posts, engineeringPosts, freshmanPosts, clubsPosts]);

  if (loading && currentPosts.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {['all', 'Engineering', 'Freshman', 'Clubs'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-[#FF5722] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              {tab === 'all' ? '🔥 All' : `📚 ${tab}`}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {currentPosts.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No posts yet</div>
              <div className="text-gray-400">Be the first to share something!</div>
            </div>
          ) : (
            currentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !loadingMore && (
          <div id="load-more-trigger" className="h-10">
            {/* This element will be observed for infinite scroll */}
          </div>
        )}

        {/* End of Posts */}
        {!hasMore && currentPosts.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            You've reached the end! 🎉
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
