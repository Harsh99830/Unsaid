import React, { useState } from 'react';
import { Settings, Share2, Shield, Rss, Star, Calendar, MessageCircle, ArrowUp, MoreHorizontal, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');

  const profileData = {
    username: '@mystic_owl_42',
    classInfo: 'Class of \'25 • Computer Science',
    posts: 24,
    karma: '1.2k',
    daysActive: 15
  };

  const userPosts = [
    {
      id: 1,
      title: 'Anyone else struggling with the Physics midterms?',
      comments: 12,
      upvotes: 45,
      timestamp: '2h ago',
      category: 'Study Group'
    },
    {
      id: 2,
      title: 'Best coffee spot near North Campus that stays open late?',
      comments: 34,
      upvotes: 128,
      timestamp: '5h ago',
      category: 'Student Life'
    },
    {
      id: 3,
      title: 'To whoever returned my AirPods at the Library: You\'re a legend!',
      comments: 8,
      upvotes: 210,
      timestamp: '1d ago',
      category: 'Confessions'
    }
  ];

  const handlePostClick = (postId) => {
    navigate('/post');
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="relative mx-auto max-w-[480px] min-h-screen bg-white shadow-sm overflow-x-hidden">
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
              <p className="text-[#181311] text-[24px] font-bold leading-tight tracking-[-0.015em] text-center">{profileData.username}</p>
              <p className="text-[#896b61] text-base font-medium leading-normal text-center">{profileData.classInfo}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full max-w-[480px]">
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
        <div className="flex min-w-[100px] flex-1 basis-[fit-content] flex-col gap-1 rounded-xl border border-[#e6dedb] p-4 items-center text-center bg-white">
          <p className="text-[#181311] text-2xl font-bold leading-tight">{profileData.posts}</p>
          <div className="flex items-center gap-1">
            <Rss size={16} className="text-[#ee5b2b]" />
            <p className="text-[#896b61] text-xs font-semibold uppercase tracking-wider">Posts</p>
          </div>
        </div>
        <div className="flex min-w-[100px] flex-1 basis-[fit-content] flex-col gap-1 rounded-xl border border-[#e6dedb] p-4 items-center text-center bg-white">
          <p className="text-[#181311] text-2xl font-bold leading-tight">{profileData.karma}</p>
          <div className="flex items-center gap-1">
            <Star size={16} className="text-[#ee5b2b]" />
            <p className="text-[#896b61] text-xs font-semibold uppercase tracking-wider">Karma</p>
          </div>
        </div>
        <div className="flex min-w-[100px] flex-1 basis-[fit-content] flex-col gap-1 rounded-xl border border-[#e6dedb] p-4 items-center text-center bg-white">
          <p className="text-[#181311] text-2xl font-bold leading-tight">{profileData.daysActive}</p>
          <div className="flex items-center gap-1">
            <Calendar size={16} className="text-[#ee5b2b]" />
            <p className="text-[#896b61] text-xs font-semibold uppercase tracking-wider">Days Active</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <div className="flex border-b border-[#e6dedb] px-4 justify-between">
          <button 
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 ${
              activeTab === 'posts' 
                ? 'border-[#ee5b2b] text-[#ee5b2b]' 
                : 'border-b-transparent text-[#896b61]'
            }`}
            onClick={() => handleTabClick('posts')}
          >
            <p className="text-sm font-bold leading-normal tracking-[0.015em]">My Posts</p>
          </button>
          <button 
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 ${
              activeTab === 'saved' 
                ? 'border-[#ee5b2b] text-[#ee5b2b]' 
                : 'border-b-transparent text-[#896b61]'
            }`}
            onClick={() => handleTabClick('saved')}
          >
            <p className="text-sm font-bold leading-normal tracking-[0.015em]">Saved</p>
          </button>
          <button 
            className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 flex-1 ${
              activeTab === 'replies' 
                ? 'border-[#ee5b2b] text-[#ee5b2b]' 
                : 'border-b-transparent text-[#896b61]'
            }`}
            onClick={() => handleTabClick('replies')}
          >
            <p className="text-sm font-bold leading-normal tracking-[0.015em]">Replies</p>
          </button>
        </div>
      </div>

      {/* Post List */}
      <div className="flex flex-col">
        {userPosts.map((post) => (
          <div 
            key={post.id}
            className="group flex gap-4 bg-white px-4 py-5 justify-between border-b border-[#f4f1f0] active:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => handlePostClick(post.id)}
          >
            <div className="flex flex-1 flex-col justify-center gap-1">
              <p className="text-[#181311] text-base font-semibold leading-normal">{post.title}</p>
              <div className="flex items-center gap-3">
                <p className="text-[#896b61] text-xs font-medium flex items-center gap-1">
                  <MessageCircle size={14} /> {post.comments} comments
                </p>
                <p className="text-[#896b61] text-xs font-medium flex items-center gap-1">
                  <ArrowUp size={14} /> {post.upvotes} upvotes
                </p>
              </div>
              <p className="text-[#896b61] text-xs mt-1">{post.timestamp} • <span className="text-[#ee5b2b] font-medium">{post.category}</span></p>
            </div>
            <div className="shrink-0 flex items-center">
              <button 
                className="p-2 rounded-full hover:bg-gray-100 text-[#896b61]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy Disclaimer */}
      <div className="p-8 pb-32 text-center opacity-60">
        <p className="text-[#896b61] text-xs">
          Your identity is hidden from other students.<br/>Only your contributions and karma are visible to you here.
        </p>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button 
          className="flex items-center justify-center size-14 rounded-full bg-[#ee5b2b] text-white shadow-lg shadow-[#ee5b2b]/30 hover:scale-105 active:scale-95 transition-transform"
          onClick={() => navigate('/create')}
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
