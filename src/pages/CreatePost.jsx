import React, { useState } from 'react';
import { ArrowLeft, X, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the post data to your backend
    console.log('Post created:', { content, category, image: imagePreview });
    // Navigate back to home after creating post
    navigate('/');
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center px-4 h-16 justify-between max-w-md mx-auto">
          <button 
            className="text-gray-600 flex items-center gap-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Cancel</span>
          </button>
          <h1 className="text-lg font-semibold text-[#181311]">Create Post</h1>
          <button 
            className="text-[#f45925] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Post
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#f45925]/10 flex items-center justify-center">
              <span className="text-[#f45925] font-bold text-sm">AN</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181311]">Anonymous</p>
              <p className="text-xs text-gray-500">Posting publicly</p>
            </div>
          </div>

          {/* Text Content */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts anonymously..."
              className="w-full min-h-[120px] resize-none border-none outline-none text-[#181311] placeholder-gray-400"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-400 mt-2">
              {content.length}/500
            </div>
          </div>

          {/* Category Input */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <label className="text-sm font-semibold text-[#181311] block mb-3">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter a category (e.g., Study Tips, Campus Life, Engineering)"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f45925]/50 focus:border-transparent text-[#181311] placeholder-gray-400"
              maxLength={30}
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {category.length}/30
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <label className="text-sm font-semibold text-[#181311] block mb-3">Add Image (Optional)</label>
            
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <ImageIcon size={24} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Click to upload image</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Post Guidelines */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Community Guidelines</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Be respectful and constructive</li>
              <li>• No personal attacks or harassment</li>
              <li>• Stay on topic for the selected category</li>
              <li>• No spam or promotional content</li>
            </ul>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreatePost;
