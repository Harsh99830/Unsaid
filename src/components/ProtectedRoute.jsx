import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, loading, hasUsername, checkingUsername } = useAuth();

  // Show loading while checking auth state or username
  if (loading || checkingUsername) {
    return (
      <div className="min-h-screen bg-white text-[#181311] antialiased flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required and user is not logged in, redirect to login
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but doesn't have username, redirect to username selection
  // Only redirect if we're certain they don't have a username (not during checking)
  if (requireAuth && user && !hasUsername && window.location.pathname !== '/username-selection') {
    return <Navigate to="/username-selection" replace />;
  }

  // If auth is NOT required (login page) and user IS logged in, redirect appropriately
  if (!requireAuth && user) {
    // If user has username, go to feed, otherwise go to username selection
    return <Navigate to={hasUsername ? "/feed" : "/username-selection"} replace />;
  }

  // If user is logged in but trying to access username selection page and already has username, redirect to feed
  if (requireAuth && user && hasUsername && window.location.pathname === '/username-selection') {
    return <Navigate to="/feed" replace />;
  }

  // Otherwise, render the children
  return children;
};

export default ProtectedRoute;
