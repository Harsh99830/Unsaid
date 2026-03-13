import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

/**
 * AuthCallback - Landing page after Google OAuth redirect.
 * Supabase parses the token from the URL hash and fires onAuthStateChange.
 * We wait for initializing to finish, then route appropriately.
 */
const AuthCallback = () => {
  const { user, initializing, hasUsername } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializing) return;

    if (user) {
      navigate(hasUsername ? '/feed' : '/username-selection', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [user, initializing, hasUsername, navigate]);

  return (
    <div className="min-h-screen bg-white text-[#181311] antialiased flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
