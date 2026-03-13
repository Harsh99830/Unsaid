import React, { useState } from 'react';
import { Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

const samplePosts = [
  {
    id: 1,
    author: 'Anonymous',
    timestamp: '2h ago',
    department: 'Engineering Dept',
    content: 'Has anyone figured out the lab report for CHEM 101? I\'m completely lost on the results section.',
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
    content: 'The dining hall pizza is actually getting better this semester or am I just starving?',
    likes: 152,
    comments: 43,
    shares: 12,
    isLiked: true
  }
];

function Feed() {
  const navigate = useNavigate();
  const { user, signOut, username } = useAuth();
  const [posts] = useState(samplePosts);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f5] font-sans text-[#181311] antialiased">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#181311]">Unsaid</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF5722] rounded-full"></div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-[#FF5722] transition-colors"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-md mx-auto pb-24">
        {/* Welcome Card */}
        <div className="bg-white p-4 m-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF5722] rounded-full flex items-center justify-center text-white font-semibold">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="font-semibold text-[#181311]">Hello {username || 'User'}</p>
              <p className="text-sm text-gray-500">Welcome back!</p>
            </div>
          </div>
        </div>
        
        {/* Posts */}
        <div className="px-4 space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <p className="font-semibold text-sm">{post.author}</p>
                    <p className="text-xs text-gray-500">{post.timestamp} • {post.department}</p>
                  </div>
                </div>
              </div>
              
              {/* Post Content */}
              <p className="text-sm text-gray-700 mb-3">{post.content}</p>
              
              {/* Post Actions */}
              <div className="flex items-center gap-6 text-gray-500">
                <button className="flex items-center gap-1 text-sm hover:text-[#FF5722]">
                  <span>{post.isLiked ? '❤️' : '🤍'}</span> {post.likes}
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-[#FF5722]">
                  <span>💬</span> {post.comments}
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-[#FF5722]">
                  <span>🔄</span> {post.shares}
                </button>
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
}

export default Feed;
