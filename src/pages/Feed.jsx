import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '../components/navigation/Header';
import PostCard from '../components/feed/PostCard';
import BottomNavigation from '../components/navigation/BottomNavigation';
import Button from '../components/ui/Button';
import { Plus, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Tabs from '../components/ui/Tabs';
import { getAllPosts, getPostsByCategory } from '../features/posts';
import CloudinaryImage from '../components/CloudinaryImage';
import { useAuth } from '../contexts/AuthProvider';

// In-memory cache for posts (Instagram-like)
const postsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache utilities
const getCacheKey = (category, cursor = null) => `${category}-${cursor || 'first'}`;
const isCacheValid = (timestamp) => Date.now() - timestamp < CACHE_TTL;

const getCachedData = (category, cursor) => {
  const key = getCacheKey(category, cursor);
  const cached = postsCache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    console.log('📋 Using cached data for:', key);
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
  console.log('💾 Cached data for:', key);
};

const clearPostsCache = () => {
  postsCache.clear();
  console.log('🗑️ Posts cache cleared');
};

const samplePosts = [
  {
    id: 1,
    author: 'Anonymous',
    timestamp: '2h ago',
    department: 'Engineering Dept',
    avatar: 'person_off',
    avatarColor: 'gray',
    content: 'Has anyone figured out the lab report for CHEM 101? I\'m completely lost on the results section. The professor\'s instructions were super vague...',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo3T1GzPITVcdbZxlrDjzbzZieCie9_mW6UiczatHpj2dgyOxPCbcNFk39nnV47pqdFTTiMui5HQargWcqHZV3999MiAbCueErEYvFJ-3Q11HV9Tno4VY0uppA2fRLZ5g1fECGurnSEk5e4DMpmyM9lxHvnqIPebrNH8e8zBkS4LtjVeO2nEKFUF5_2aWnpt3DwmEoDk0i9IoNdEPmn6PqC4o6k6iZv4VVFV0FWexigxPmR8r2sKgBCjBRhmFC6w5miwy_puN0tA63',
    likes: 24,
    comments: 8,
    shares: 2,
    isLiked: false
  },
  {
    id: 2,
    author: 'Anonymous',
    timestamp: '4h ago',
    department: 'Freshman',
    avatar: 'psychology',
    avatarColor: 'primary',
    content: 'The dining hall pizza is actually getting better this semester or am I just starving? Yesterday\'s BBQ chicken slice was actually... edible? 🍕',
    likes: 152,
    comments: 43,
    shares: 12,
    isLiked: true
  },
  {
    id: 3,
    author: 'Anonymous',
    timestamp: '6h ago',
    department: 'Main Campus',
    avatar: 'person_off',
    avatarColor: 'gray',
    content: 'Sunset from the 4th floor library is unmatched. This is your sign to take a break and look out the window.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOnHfCCjusYTOOGK1eimwUEVpesIb879S5SGU0NIPIL4hZXxWRvglfldyZQNIuaCSbOahIHzFnFr4ImAm6q_YaDSNX4kCZouetzbZXJAKDJf99TI7JkogrQcn4P4vmDoryJ3fCPgtpPVcpuzYnDWxLW-Z4U4sqv0EU_BZD3wX5OpdXk2jI294FWoevXcBZ6H0uoKWYQTtKYCLPiyu4Q1IvROwO3wr1kOGo354vVZJfap3sngJGDtCl-stESKeUP7nW81sIqK9Ix8hC',
    likes: 312,
    comments: 18,
    shares: 45,
    isLiked: false
  }
];

function App() {
  const navigate = useNavigate();
  const { user, signOut, authReady } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [engineeringPosts, setEngineeringPosts] = useState([]);
  const [freshmanPosts, setFreshmanPosts] = useState([]);
  const [clubsPosts, setClubsPosts] = useState([]);
  const [categoryPosts, setCategoryPosts] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  
  // Infinite scroll refs
  const observerRef = useRef(null);
  const loadingRef = useRef(false);

  // Instagram-like infinite scroll
  const setupInfiniteScroll = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingRef.current && !loadingMore) {
          console.log('📜 Loading more posts...');
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  // Setup infinite scroll when posts change
  useEffect(() => {
    if (posts.length > 0 || categoryPosts[activeTab]?.length > 0) {
      setupInfiniteScroll();
    }
  }, [posts, categoryPosts, activeTab, setupInfiniteScroll]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { getUserProfile } = await import('../services/userProfile.js');
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Optimized fetch posts with caching and pagination
  const fetchPosts = useCallback(async (category = 'all', cursor = null, append = false) => {
    try {
      // Check cache first (Instagram-like instant loading)
      const cachedData = getCachedData(category, cursor);
      if (cachedData && !append) {
        console.log('⚡ Serving from cache:', category);
        if (category === 'all') {
          setPosts(cachedData);
        } else {
          setCategoryPosts(prev => ({ ...prev, [category]: cachedData }));
        }
        return;
      }

      // Fetch from network only if cache miss
      console.log('🌐 Fetching from network:', category);
      
      let fetchedPosts;
      if (category === 'all') {
        fetchedPosts = await getAllPosts();
      } else {
        fetchedPosts = await getPostsByCategory(category);
      }

      // Apply cursor-based pagination
      const startIndex = cursor ? fetchedPosts.findIndex(post => post.created_at === cursor) : 0;
      const paginatedPosts = cursor ? fetchedPosts.slice(startIndex + 1) : fetchedPosts;

      // Cache the results
      setCachedData(category, cursor, paginatedPosts);

      // Update state
      if (append) {
        if (category === 'all') {
          setPosts(prev => [...prev, ...paginatedPosts]);
        } else {
          setCategoryPosts(prev => ({ 
            ...prev, 
            [category]: [...(prev[category] || []), ...paginatedPosts] 
          }));
        }
      } else {
        if (category === 'all') {
          setPosts(paginatedPosts);
        } else {
          setCategoryPosts(prev => ({ ...prev, [category]: paginatedPosts }));
        }
      }

    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch with caching
  useEffect(() => {
    if (user && authReady) {
      console.log('🚀 Initial feed fetch');
      fetchPosts('all', null, false);
      fetchPosts('Engineering', null, false);
      fetchPosts('Freshman', null, false);
      fetchPosts('Clubs', null, false);
    }
  }, [user, authReady, fetchPosts]);

  // Optimized tab change - uses cache, no unnecessary refetch
  const handleTabChange = useCallback((tab) => {
    if (activeTab === tab) return; // No change needed
    
    console.log('🔄 Tab change:', activeTab, '→', tab);
    setActiveTab(tab);
    
    // Check if data is already cached (Instagram-like instant switch)
    const cachedData = getCachedData(tab === 'all' ? 'all' : tab, null);
    if (cachedData) {
      console.log('⚡ Instant tab switch from cache:', tab);
      return; // Data already loaded, no fetch needed
    }
    
    // Only fetch if not cached
    console.log('🌐 Tab switch needs fetch:', tab);
    fetchPosts(tab === 'all' ? 'all' : tab, null, false);
  }, [activeTab, fetchPosts]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      clearPostsCache(); // Clear cache on sign out
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Format post data for PostCard component
  const formatPostForCard = (post) => {
    const timeAgo = getTimeAgo(post.created_at);
    
    // Format author name - handle missing author_name gracefully
    let displayName = post.author_name || 'Anonymous';
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
  };

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

  const tabs = [
    { 
      label: 'Home', 
      content: (
        <div className="mt-4">
          {loading && posts.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4">
              {posts.map(post => (
                <PostCard key={post.id} post={formatPostForCard(post)} />
              ))}
              {/* Infinite scroll trigger */}
              {hasMore && (
                <div 
                  ref={observerRef} 
                  className="flex justify-center py-4"
                >
                  {loadingMore ? (
                    <div className="text-gray-500">Loading more...</div>
                  ) : (
                    <div className="text-gray-400">Scroll for more</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    { 
      label: 'Engineering', 
      content: (
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : engineeringPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No Engineering posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4">
              {engineeringPosts.map(post => (
                <PostCard key={post.id} post={formatPostForCard(post)} />
              ))}
            </div>
          )}
        </div>
      )
    },
    { 
      label: 'Freshman', 
      content: (
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : freshmanPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No Freshman posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4">
              {freshmanPosts.map(post => (
                <PostCard key={post.id} post={formatPostForCard(post)} />
              ))}
            </div>
          )}
        </div>
      )
    },
    { 
      label: 'Clubs', 
      content: (
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading posts...</div>
            </div>
          ) : clubsPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No Club posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 px-4">
              {clubsPosts.map(post => (
                <PostCard key={post.id} post={formatPostForCard(post)} />
              ))}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f6f5] font-sans text-[#181311] antialiased">
      <Header 
        user={user}
        onSignOut={handleSignOut}
      />
      
      <main className="max-w-md mx-auto pb-24">
        <div className="bg-white p-4 m-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5722] rounded-full flex items-center justify-center text-white font-semibold">
              {userProfile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#181311]">{userProfile?.username || 'Loading...'}</p>
              <p className="text-sm text-gray-500">Welcome back!</p>
            </div>
          </div>
        </div>
        
        <Tabs tabs={tabs} />
      </main>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => navigate('/create')}
          className="w-14 h-14 bg-[#f45925] hover:bg-[#e64a19] text-white rounded-full shadow-lg shadow-[#f45925]/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>
      
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

export default App;
