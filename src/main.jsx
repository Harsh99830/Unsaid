import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'

// Import pages
import Login from './pages/Login.jsx'
import VerifyOTP from './pages/VerifyOTP.jsx'
import UsernameSelection from './pages/UsernameSelection.jsx'
import Feed from './pages/Feed.jsx'
import PostDetails from './pages/PostDetails.jsx'
import CreatePost from './pages/CreatePost.jsx'
import Profile from './pages/Profile.jsx'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading, userProfile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Home route component - handles username_locked logic
const HomeRoute = ({ children }) => {
  const { user, loading, userProfile } = useAuth();
  
  console.log('HomeRoute - Full State:', { 
    loading, 
    user: user ? user.id : null, 
    userProfile: userProfile,
    username_locked: userProfile?.username_locked,
    userProfileKeys: userProfile ? Object.keys(userProfile) : null
  });
  
  if (loading) {
    console.log('HomeRoute - Still loading...');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('HomeRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has profile and username_locked === true
  console.log('HomeRoute - Checking profile:', {
    hasProfile: !!userProfile,
    username_locked: userProfile?.username_locked,
    condition: userProfile && userProfile.username_locked === true
  });
  
  if (userProfile && userProfile.username_locked === true) {
    console.log('HomeRoute - User has locked profile, showing home page');
    return children; // Show home page
  }
  
  // No profile or username_locked !== true, redirect to username selection
  console.log('HomeRoute - No locked profile, redirecting to username selection');
  console.log('HomeRoute - Reason:', !userProfile ? 'No userProfile' : `username_locked is ${userProfile.username_locked}`);
  return <Navigate to="/username-selection" replace />;
};

// Auth route component (redirect to home if already logged in)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes - redirect to home if already logged in */}
      <Route path="/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/verify-otp" element={
        <AuthRoute>
          <VerifyOTP />
        </AuthRoute>
      } />
      
      {/* Username selection - protected route */}
      <Route path="/username-selection" element={
        <ProtectedRoute>
          <UsernameSelection />
        </ProtectedRoute>
      } />
      
      {/* Home route - handles username_locked logic */}
      <Route path="/" element={
        <HomeRoute>
          <Feed />
        </HomeRoute>
      } />
      
      {/* Other protected routes */}
      <Route path="/post/:id" element={
        <ProtectedRoute>
          <PostDetails />
        </ProtectedRoute>
      } />
      <Route path="/create" element={
        <ProtectedRoute>
          <CreatePost />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
)
