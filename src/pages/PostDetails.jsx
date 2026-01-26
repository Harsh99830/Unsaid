import React from 'react';
import { ArrowLeft, MoreHorizontal, ArrowUp, ArrowDown, MessageCircle, Share2, ThumbsUp, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PostDetail = () => {
  const navigate = useNavigate();

  const post = {
    id: 1,
    author: 'Anonymous Squirrel',
    timestamp: '2h ago',
    department: 'Campus Life',
    avatar: 'OP',
    avatarColor: 'primary',
    content: 'Does anyone know if the library is open late during finals week? 📚 I need a quiet place to study away from my roommate\'s gaming.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdnKjxtvSZ6TL7lKVzZOj3DjJXYEq6BH_-z_hjm-pAb9o3Jirx_OvrKYI0viAKVG5Nxmbm0Ju9hUlSvznoRPdat-Yi2mZIRZTrV4e-9xvqX8_wRWwJBoHdwIA-iS5E3onXWx9x7PXrTDw_qmqyjAHvVz8FbahVCqajvz_FOL8s0bJTB3SaT4zUOZd1y0ur7P8wcYhJmtE2zt7q2xRlxF14hRiYUVIoejzYB-VvYwYNiLmGND9-oXNTBm4Ct9sqG0qdj-B8-YSsnUFE',
    upvotes: 142,
    downvotes: 0,
    comments: 12
  };

  const comments = [
    {
      id: 1,
      author: 'QuietOwl',
      timestamp: '1h ago',
      avatar: 'person_4',
      avatarColor: 'blue',
      content: 'I heard they\'re keeping the 1st floor open 24/7 starting Monday! They usually do it every finals season.',
      likes: 15,
      isOP: false,
      replies: [
        {
          id: 11,
          author: 'OP',
          timestamp: '45m ago',
          avatar: 'person_2',
          avatarColor: 'orange',
          content: 'Life saver! Do you know if the cafe is open too?',
          likes: 2,
          isOP: true
        }
      ]
    },
    {
      id: 2,
      author: 'StudyHarder',
      timestamp: '22m ago',
      avatar: 'person_3',
      avatarColor: 'green',
      content: 'Check the engineering building too. 3rd floor is usually dead silent.',
      likes: 8,
      isOP: false,
      replies: []
    }
  ];

  const getAvatarClass = (color) => {
    const colorMap = {
      'primary': 'bg-[#ec6d13]/20 text-[#ec6d13]',
      'blue': 'bg-blue-100 text-blue-600',
      'orange': 'bg-orange-100 text-orange-600',
      'green': 'bg-green-100 text-green-600'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600';
  };

  const getAvatarIcon = (avatar) => {
    const iconMap = {
      'person_4': '👨‍🎓',
      'person_2': '👩‍🎓',
      'person_3': '🧑‍🎓'
    };
    return iconMap[avatar] || '👤';
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white overflow-x-hidden max-w-md mx-auto">
      {/* TopAppBar */}
      <nav className="sticky top-0 z-30 flex items-center bg-white/90 backdrop-blur-md p-4 justify-between border-b border-gray-100">
        <button 
          className="text-[#181411] flex size-10 shrink-0 items-center justify-center cursor-pointer"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#181411] text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-2">Post</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-xl h-10 w-10 bg-transparent text-[#181411]">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </nav>

      {/* Main Post Card */}
      <main className="flex-1 pb-24">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col items-stretch justify-start">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-full ${getAvatarClass(post.avatarColor)} flex items-center justify-center font-bold text-xs`}>
                {post.avatar}
              </div>
              <div className="flex flex-col">
                <span className="text-[#181411] text-sm font-bold">{post.author}</span>
                <span className="text-[#897261] text-xs">{post.timestamp} • Posted in {post.department}</span>
              </div>
            </div>
            
            <p className="text-[#181411] text-xl font-bold leading-tight tracking-[-0.015em] mb-4">
              {post.content}
            </p>
            
            <div className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl mb-4" 
                 style={{ backgroundImage: `url("${post.image}")` }}>
            </div>

            {/* ReactionBar */}
            <div className="flex flex-wrap gap-4 py-2 border-y border-gray-50">
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#f8f7f6] rounded-full">
                <ArrowUp size={16} className="text-[#ec6d13]" fill="currentColor" />
                <p className="text-[#181411] text-[13px] font-bold">{post.upvotes}</p>
              </div>
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#f8f7f6] rounded-full">
                <ArrowDown size={16} className="text-[#897261]" />
              </div>
              <div className="flex items-center justify-center gap-2 px-3 py-1.5">
                <MessageCircle size={16} className="text-[#897261]" />
                <p className="text-[#897261] text-[13px] font-bold">{post.comments}</p>
              </div>
              <div className="flex items-center justify-center gap-2 px-3 py-1.5 ml-auto">
                <Share2 size={16} className="text-[#897261]" />
              </div>
            </div>
          </div>
        </div>

        {/* SectionHeader */}
        <div className="bg-[#f8f7f6] px-4 py-3">
          <h3 className="text-[#181411] text-sm font-bold uppercase tracking-wider">Comments</h3>
        </div>

        {/* Comments Thread */}
        <div className="flex flex-col">
          {comments.map((comment) => (
            <div key={comment.id} className={comment.id !== 1 ? "border-t border-gray-50" : ""}>
              <div className="relative">
                <div className="flex w-full flex-row items-start justify-start gap-3 p-4">
                  <div className={`rounded-full w-10 h-10 shrink-0 flex items-center justify-center ${getAvatarClass(comment.avatarColor)}`}>
                    <span className="text-base">{getAvatarIcon(comment.avatar)}</span>
                  </div>
                  <div className="flex h-full flex-1 flex-col items-start justify-start">
                    <div className="flex w-full flex-row items-center justify-start gap-x-2">
                      <p className="text-[#181411] text-sm font-bold">
                        {comment.author}
                        {comment.isOP && <span className="ml-1 text-xs text-[#ec6d13]">(OP)</span>}
                      </p>
                      <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                      <p className="text-[#897261] text-xs">{comment.timestamp}</p>
                    </div>
                    <p className="text-[#181411] text-sm font-normal leading-normal mt-1">
                      {comment.content}
                    </p>
                    <div className="flex w-full flex-row items-center justify-start gap-6 pt-3">
                      <div className="flex items-center gap-1">
                        <ThumbsUp size={16} className="text-[#897261]" />
                        <p className="text-[#897261] text-xs font-medium">{comment.likes}</p>
                      </div>
                      <button className="text-[#897261] text-xs font-bold uppercase tracking-tight">Reply</button>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <>
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex w-full flex-row items-start justify-start gap-3 p-4 pl-12">
                        <div className={`rounded-full w-8 h-8 shrink-0 flex items-center justify-center ${getAvatarClass(reply.avatarColor)}`}>
                          <span className="text-sm">{getAvatarIcon(reply.avatar)}</span>
                        </div>
                        <div className="flex h-full flex-1 flex-col items-start justify-start">
                          <div className="flex w-full flex-row items-center justify-start gap-x-2">
                            <p className="text-[#181411] text-xs font-bold">
                              {reply.author}
                              {reply.isOP && <span className="ml-1 text-xs text-[#ec6d13]">(OP)</span>}
                            </p>
                            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                            <p className="text-[#897261] text-[10px]">{reply.timestamp}</p>
                          </div>
                          <p className="text-[#181411] text-sm font-normal leading-normal mt-1">
                            {reply.content}
                          </p>
                          <div className="flex w-full flex-row items-center justify-start gap-6 pt-3">
                            <div className="flex items-center gap-1">
                              <ThumbsUp size={16} className="text-[#897261]" />
                              <p className="text-[#897261] text-xs font-medium">{reply.likes}</p>
                            </div>
                            <button className="text-[#897261] text-xs font-bold uppercase tracking-tight">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Elevated Comment Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-4 pb-8 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-gray-100">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              className="w-full bg-[#f8f7f6] border-none rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-[#ec6d13]/50 text-[#181411] placeholder:text-[#897261]" 
              placeholder="Reply anonymously..." 
              type="text"
            />
          </div>
          <button className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ec6d13] text-white shadow-lg shadow-[#ec6d13]/20 transition-transform active:scale-95">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
