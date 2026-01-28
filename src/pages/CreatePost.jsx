import React, { useState } from 'react';
import { ArrowLeft, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../services/cloudinary';
import Button from '../components/ui/Button';

const CreatePost = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      setIsUploading(true);
      try {
        const result = await uploadImage(file);
        setUploadedImage(result);
        console.log('Image uploaded successfully:', result);
      } catch (error) {
        console.error('Upload failed:', error);
        // Remove preview if upload failed
        setImagePreview(null);
        alert('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    // Prepare post data
    const postData = {
      content: content.trim(),
      category: category.trim(),
      image: uploadedImage,
      timestamp: new Date().toISOString()
    };

    console.log('Post created:', postData);
    
    // Here you would typically send the post data to your backend
    // For now, we'll just log it and navigate back
    
    // Navigate back to home after creating post
    navigate('/');
  };

  const removeImage = () => {
    setImagePreview(null);
    setUploadedImage(null);
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
          <Button 
            variant="primary"
            onClick={handleSubmit}
            disabled={!content.trim() || isUploading}
          >
            Post
          </Button>
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
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-white flex items-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      <span>Uploading...</span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                  disabled={isUploading}
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
                  disabled={isUploading}
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
