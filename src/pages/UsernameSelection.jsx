import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

// Random username generator
const generateRandomUsername = () => {
  const adjectives = ['Silent', 'Hidden', 'Anonymous', 'Secret', 'Mystery', 'Quiet', 'Shadow', 'Whisper', 'Ghost', 'Phantom'];
  const nouns = ['Thinker', 'Writer', 'Observer', 'Speaker', 'Dreamer', 'Creator', 'Explorer', 'Wanderer', 'Seeker', 'Traveler'];
  const numbers = Math.floor(Math.random() * 999) + 1;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
};

const UsernameSelection = () => {
  const [usernames, setUsernames] = useState([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, saveUsername } = useAuth();

  useEffect(() => {
    // Generate 3 random usernames
    const generatedUsernames = [
      generateRandomUsername(),
      generateRandomUsername(),
      generateRandomUsername()
    ];
    setUsernames(generatedUsernames);
  }, []);

  const handleUsernameSelect = async (username) => {
    if (isSaving) return;
    
    setSelectedUsername(username);
    setIsSaving(true);
    setError('');

    try {
      // Save username using AuthProvider method
      const result = await saveUsername(user.id, username);
      
      if (result.success) {
        // Redirect to feed after successful save
        navigate('/feed');
      } else {
        setError(result.error || 'Failed to save username');
      }
    } catch (error) {
      console.error('Error saving username:', error);
      setError('Failed to save username. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#181311] antialiased flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center px-8 w-full max-w-md mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#181311] mb-8">
          Choose Your Username
        </h1>
        
        <div className="w-full space-y-4">
          {usernames.map((username, index) => (
            <div
              key={index}
              onClick={() => !isSaving && handleUsernameSelect(username)}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedUsername === username
                  ? 'border-[#FF5722] bg-[#FF5722]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="font-semibold text-[#181311] text-lg">{username}</p>
              {selectedUsername === username && (
                <p className="text-sm text-[#FF5722] mt-1">Selected</p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mt-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isSaving && (
          <div className="text-center mt-6">
            <div className="w-6 h-6 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Saving username...</p>
          </div>
        )}

        {selectedUsername && !isSaving && (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-6">
            <p className="text-sm text-gray-600 text-center">
              Username <span className="font-semibold">{selectedUsername}</span> selected! Click again to confirm.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default UsernameSelection;
