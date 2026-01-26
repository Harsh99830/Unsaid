import React from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ post, onLike, onComment, onShare }) => {
  const navigate = useNavigate();

  const getAvatarClass = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-[#f45925]/10';
      case 'gray':
      default:
        return 'bg-gray-100';
    }
  };

  const getAvatarIconClass = (color) => {
    switch (color) {
      case 'primary':
        return 'text-[#f45925]';
      case 'gray':
      default:
        return 'text-gray-400';
    }
  };

  const getAvatarIcon = (avatar) => {
    return <User size={20} />;
  };

  return (
    <article 
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/post')}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`size-10 rounded-full ${getAvatarClass(post.avatarColor)} flex items-center justify-center`}>
            <span className={`${getAvatarIconClass(post.avatarColor)}`}>
              {getAvatarIcon(post.avatar)}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#181311]">{post.author}</p>
            <p className="text-xs text-[#8a6b60]">{post.timestamp} • {post.department}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-[#334155] leading-relaxed text-[15px]">
            {post.content}
          </p>
          
          {post.image && (
            <div 
              className="w-full h-48 bg-center bg-no-repeat bg-cover rounded-xl"
              style={{ backgroundImage: `url("${post.image}")` }}
              alt={post.alt || "Post image"}
            />
          )}
        </div>
      </div>
      
      <div className="px-2 py-2 border-t border-gray-50 flex items-center justify-between">
        <div className="flex gap-1">
          <button 
            className={`flex items-center gap-2 px-3 py-2 transition-colors ${
              post.isLiked ? 'text-[#f45925]' : 'text-gray-500 hover:text-[#f45925]'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onLike && onLike(post.id);
            }}
          >
            <span className={`${post.isLiked ? 'text-[#f45925]' : 'text-gray-500'}`}>
              {post.isLiked ? <Heart size={22} fill="currentColor" /> : <Heart size={22} />}
            </span>
            <span className="text-sm font-semibold">{post.likes}</span>
          </button>
          
          <button 
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-[#f45925] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onComment && onComment(post.id);
            }}
          >
            <span className="text-gray-500">
              <MessageCircle size={22} />
            </span>
            <span className="text-sm font-semibold">{post.comments}</span>
          </button>
          
          <button 
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-[#f45925] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onShare && onShare(post.id);
            }}
          >
            <span className="text-gray-500">
              <Share2 size={22} />
            </span>
            <span className="text-sm font-semibold">{post.shares}</span>
          </button>
        </div>
        
        <button 
          className="p-2 text-gray-400"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>
    </article>
  );
};

export default PostCard;
