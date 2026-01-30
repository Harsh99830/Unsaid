import React, { useState, useEffect } from 'react';
import { User, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth.js';
import { generateUsername } from '../hooks/usernameGenerator';
import { createUserProfileIfNotExists, checkUserHasUsername } from '../services/userProfile';

const UsernameSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Only get user, no profile functions
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generateUsernames();
  }, []);

  const generateUsernames = async () => {
    setIsGenerating(true);
    try {
      const newUsernames = [];
      for (let i = 0; i < 3; i++) {
        newUsernames.push(generateUsername());
      }
      setUsernames(newUsernames);
    } catch (err) {
      setError('Failed to generate usernames. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUsernameSelect = (username) => {
    setSelectedUsername(username);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUsername.trim() || !user) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('Creating profile for user:', user.id, 'with username:', selectedUsername);
      
      // Use the safe profile creation function
      const profile = await createUserProfileIfNotExists(user, selectedUsername);
      
      console.log('✅ Profile creation successful:', profile.username);
      
      // Show success message and redirect to feed
      setError('');
      
      // Create success message element
      const successDiv = document.createElement('div');
      successDiv.className = 'bg-green-50 p-4 rounded-2xl flex gap-3 items-start border border-green-100 mb-4';
      successDiv.innerHTML = `
        <svg class="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <p class="text-sm leading-relaxed text-green-600">Account created successfully! Welcome to Unsaid! 🎉</p>
      `;
      
      // Insert success message before the form
      const form = document.querySelector('form');
      if (form && form.parentNode) {
        form.parentNode.insertBefore(successDiv, form);
        
        // Redirect to feed after showing success message
        setTimeout(() => {
          // Force a page reload to refresh auth state
          window.location.href = '/feed';
        }, 2000);
      } else {
        // Fallback: redirect immediately if form not found
        window.location.href = '/feed';
      }
    } catch (err) {
      console.error('Username selection error:', err);
      setError(err.message || 'Failed to save username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setSelectedUsername('');
    generateUsernames();
  };

  return (
    <div className="bg-white text-[#181311] antialiased min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-8 w-full max-w-md mx-auto relative">
        {/* Logo and Title */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <div className="bg-[#FF5722]/10 p-4 rounded-2xl mb-2">
            <User size={40} className="text-[#FF5722]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#181311]">Choose Your Identity</h1>
          <p className="text-gray-500 font-medium">Select an anonymous username</p>
        </div>

        {/* Username Selection */}
        <div className="w-full space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Available Usernames
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isGenerating}
                className="text-gray-500 hover:text-[#FF5722]"
              >
                <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
                Refresh
              </Button>
            </div>

            <div className="grid gap-3">
              {usernames.map((username, index) => (
                <button
                  key={index}
                  onClick={() => handleUsernameSelect(username)}
                  disabled={isGenerating}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                    selectedUsername === username
                      ? 'border-[#FF5722] bg-[#FF5722]/5 text-[#FF5722] font-semibold'
                      : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-100/50'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedUsername === username ? 'bg-[#FF5722] text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {selectedUsername === username && <Sparkles size={16} />}
                      </div>
                      <span className="font-medium">{username}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!selectedUsername || isGenerating}
            onClick={handleSubmit}
            className="w-full"
          >
            Continue with {selectedUsername || 'selected username'}
            <ArrowRight size={20} />
          </Button>

          {error && (
            <div className="bg-red-50 p-4 rounded-2xl flex gap-3 items-start border border-red-100">
              <Sparkles size={20} className="text-red-500 shrink-0" />
              <p className="text-sm leading-relaxed text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-2xl flex gap-3 items-start border border-gray-100">
            <User size={20} className="text-[#FF5722] shrink-0" />
            <p className="text-sm leading-relaxed text-gray-600">
              Your username will be locked once selected. Choose wisely as it cannot be changed later.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-8 w-full max-w-md mx-auto text-center mt-auto">
        <p className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Anonymous Identity</p>
      </footer>
    </div>
  );
};

export default UsernameSelection;
