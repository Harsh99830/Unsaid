import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../services/supabase';

const UsernameSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify auth user exists on component mount
  useEffect(() => {
    const verifyUser = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // User is authenticated, continue to username check

      // Check if user already has username
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.username) {
          // User already has username, redirect to feed
          navigate('/feed');
        }
      } catch (err) {
        // User doesn't have profile yet, continue
      }
    };

    verifyUser();
  }, [user, navigate]);

  const validateUsername = (username) => {
    if (!username || username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    if (username.length > 20) {
      return 'Username must be less than 20 characters';
    }
    return null;
  };

  const checkUsernameAvailability = async (username) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      return !error && !data;
    } catch (err) {
      // Error means username is available (no row found)
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to set a username');
      return;
    }

    // Validate username
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // User is authenticated, proceed with username creation

      // Check username availability
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setError('Username is already taken');
        setIsLoading(false);
        return;
      }

      // Create user profile with atomic operation
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: username,
          username_locked: true
        })
        .select()
        .single();

      if (error) {
        // Handle foreign key violation specifically
        if (error.code === '23503') {
          setError('Your session has expired. Please log in again.');
          navigate('/login');
          return;
        }
        throw error;
      }

      console.log('✅ Profile created successfully:', data.username);
      setSuccess(true);

      // Show success message and redirect
      setTimeout(() => {
        navigate('/feed');
      }, 2000);

    } catch (err) {
      console.error('Username selection error:', err);
      
      if (err.code === '23503') {
        setError('Authentication error. Please log in again.');
        navigate('/login');
      } else {
        setError(err.message || 'Failed to save username. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Created Successfully!
          </h2>
          <p className="text-gray-600">
            Welcome to the platform! Redirecting to your feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Username
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This will be your unique identity on the platform
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter username"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !username}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsernameSelection;
