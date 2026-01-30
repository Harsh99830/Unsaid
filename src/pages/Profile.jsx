import React, { useState, useEffect } from 'react';
import { Settings, Share2, Shield, Rss, Star, Calendar, MessageCircle, ArrowUp, MoreHorizontal, Plus, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../components/navigation/BottomNavigation';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth.js';
import { getUserProfile, getUserPosts, calculateUserStats } from '../services/userProfile.js';

const Profile = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileData, setProfileData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({ posts: 0, karma: 0, daysActive: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch profile data and posts
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Use current user's ID for profile viewing
        // If username param exists, we could fetch by username in the future
        const userId = user.id;
        
        // Fetch profile data
        const profile = await getUserProfile(userId);
        setProfileData(profile);
        
        // Fetch user posts
        const posts = await getUserPosts(userId);
        setUserPosts(posts);
        
        // Calculate stats
        const userStats = calculateUserStats(posts);
        setStats(userStats);
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handlePostClick = (postId) => {
    navigate('/post');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Format post data for display
  const formatPostForDisplay = (post) => {
    const timeAgo = getTimeAgo(post.created_at);
    return {
      id: post.id,
      title: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
      content: post.content,
      comments: post.comments || 0,
      upvotes: post.likes || 0,
      timestamp: timeAgo,
      category: post.category || 'General'
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white shadow-sm overflow-x-hidden">
      {/* TopAppBar */}
      <div className="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-[#e6dedb]/50">
        <button className="text-[#181311] flex size-12 shrink-0 items-center justify-start">
          <Settings size={24} />
        </button>
        <h2 className="text-[#181311] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Profile</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-transparent text-[#181311] gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0">
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* ProfileHeader */}
      <div className="flex p-6 bg-white">
        <div className="flex w-full flex-col gap-6 items-center">
          <div className="flex gap-4 flex-col items-center">
            {/* Abstract Avatar for Anonymity */}
            <div className="bg-[#ee5b2b]/10 flex items-center justify-center rounded-full min-h-32 w-32 border-4 border-[#ee5b2b]/5 shadow-inner overflow-hidden">
              <div className="w-full h-full bg-gradient-to-tr from-[#ee5b2b]/40 to-[#ee5b2b]/80 flex items-center justify-center text-white">
                <User size={48} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="text-[#181311] text-[24px] font-bold leading-tight tracking-[-0.015em] text-center">
                @{profileData?.username || 'anonymous'}
              </p>
              <p className="text-[#896b61] text-base font-medium leading-normal text-center">
                {profileData?.class_info || 'Student'} • {profileData?.major || 'University'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full px-4">
            <button className="flex-1 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-4 bg-[#f4f1f0] text-[#181311] text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="truncate">Edit Profile</span>
            </button>
            <button className="flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-[#ee5b2b]/10 text-[#ee5b2b]">
              <Shield size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ProfileStats */}
      <div className="flex flex-wrap gap-3 px-4 py-3">
        <div className="flex flex-1 min-w-[80px] flex-col gap-1 rounded-xl border border-[#e6dedb] p-4 items-center text-center bg-white">
          <p className="text-[#181311] text-2xl font-bold leading-tight">{stats.posts}</p>
          <div className="flex items-center gap-1">
            <Rss size={16} className="text-[#ee5b2b]" />
            <p className="text-[#896b61] text-xs font-semibold uppercase tracking-wider">Posts</p>
          </div>
        </div>
        <div className="flex flex-1 min-w-[80px] flex-col gap-1 rounded-xl border border-[#e6dedb] p-4 items-center text-center bg-white">
          <p className="text-[#181311] text-2xl font-bold leading-tight">{stats.karma}</p>
          <div className="flex items-center gap-1">
            <Star size={16} className="text-[#ee5b2b]" />
            <p className="text-[#896b61] text-xs font-semibold uppercase tracking-wider">Karma</p>
          </div>
        </div>
        <div className="flex flex-1 min-w-[80px] flex-col gap-1 rounded-xl border border-[#e6dedb] p-4 items-center text-center bg-white">
          <p className="text-[#181311] text-2xl font-bold leading-tight">{stats.daysActive}</p>
          <div className="flex items-center gap-1">
            <Calendar size={16} className="text-[#ee5b2b]" />
            <p className="text-[#896b61] text-xs font-semibold uppercase tracking-wider">Days Active</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs 
          tabs={[
            { 
              label: 'Posts', 
              content: (
                <div className="mt-4">
                  {userPosts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No posts yet. Start sharing your thoughts!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {userPosts.map(post => {
                        const formattedPost = formatPostForDisplay(post);
                        return (
                          <div 
                            key={post.id}
                            className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handlePostClick(post.id)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="text-[#181311] font-semibold text-base leading-tight mb-1">{formattedPost.title}</h3>
                                <p className="text-[#896b61] text-sm">{formattedPost.category} • {formattedPost.timestamp}</p>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal size={20} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <button className="flex items-center gap-1 hover:text-[#ee5b2b]">
                                <ArrowUp size={16} />
                                <span>{formattedPost.upvotes}</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-[#ee5b2b]">
                                <MessageCircle size={16} />
                                <span>{formattedPost.comments}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )
            },
            { 
              label: 'About', 
              content: (
                <div className="mt-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h3 className="text-[#181311] font-semibold text-base mb-3">About</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[#896b61] text-sm font-medium mb-1">Username</p>
                        <p className="text-[#181311] text-sm">@{profileData?.username || 'anonymous'}</p>
                      </div>
                      {profileData?.class_info && (
                        <div>
                          <p className="text-[#896b61] text-sm font-medium mb-1">Class Info</p>
                          <p className="text-[#181311] text-sm">{profileData.class_info}</p>
                        </div>
                      )}
                      {profileData?.major && (
                        <div>
                          <p className="text-[#896b61] text-sm font-medium mb-1">Major</p>
                          <p className="text-[#181311] text-sm">{profileData.major}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[#896b61] text-sm font-medium mb-1">Member Since</p>
                        <p className="text-[#181311] text-sm">
                          {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]}
          defaultTab={0}
        />
      </div>

      {/* Privacy Disclaimer */}
      <div className="p-8 pb-32 text-center opacity-60">
        <p className="text-[#896b61] text-xs">
          Your identity is hidden from other students.<br/>Only your contributions and karma are visible to you here.
        </p>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <button
          onClick={() => navigate('/create')}
          className="w-14 h-14 bg-[#ee5b2b] hover:bg-[#d64a19] text-white rounded-full shadow-lg shadow-[#ee5b2b]/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavigation />
    </div>
  );
};

export default Profile;
