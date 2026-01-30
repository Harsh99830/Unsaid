import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './hooks/useAuth.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Import pages
import Login from './pages/Login.jsx'
import VerifyOTP from './pages/VerifyOTP.jsx'
import UsernameSelection from './pages/UsernameSelection.jsx'
import Feed from './pages/Feed.jsx'
import PostDetails from './pages/PostDetails.jsx'
import CreatePost from './pages/CreatePost.jsx'
import Profile from './pages/Profile.jsx'

/**
 * AppRoutes - Clean router setup with single ProtectedRoute guard
 * Each route has clear requirements and smart routing
 */
const AppRoutes = () => {
  return React.createElement(
    Routes,
    null,
    
    // Auth routes - accessible without authentication
    React.createElement(Route, {
      path: '/login',
      element: React.createElement(
        ProtectedRoute,
        { requireAuth: false },
        React.createElement(Login)
      )
    }),
    
    React.createElement(Route, {
      path: '/verify-otp',
      element: React.createElement(
        ProtectedRoute,
        { requireAuth: false },
        React.createElement(VerifyOTP)
      )
    }),
    
    // Username Selection - ONLY for authenticated users WITHOUT username
    React.createElement(Route, {
      path: '/username-selection',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: false // Require NO username
        },
        React.createElement(UsernameSelection)
      )
    }),
    
    // Feed and protected routes - ONLY for authenticated users WITH username
    React.createElement(Route, {
      path: '/feed',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: true // Require username
        },
        React.createElement(Feed)
      )
    }),
    
    React.createElement(Route, {
      path: '/post/:id',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: true
        },
        React.createElement(PostDetails)
      )
    }),
    
    React.createElement(Route, {
      path: '/create',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: true
        },
        React.createElement(CreatePost)
      )
    }),
    
    React.createElement(Route, {
      path: '/profile/:username',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: true
        },
        React.createElement(Profile)
      )
    }),
    
    React.createElement(Route, {
      path: '/profile',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: true
        },
        React.createElement(Profile)
      )
    }),
    
    // Default route - redirect to feed (will be handled by ProtectedRoute)
    React.createElement(Route, {
      path: '/',
      element: React.createElement(
        ProtectedRoute,
        { 
          requireAuth: true, 
          requireUsername: true
        },
        React.createElement(Feed)
      )
    })
  );
};

createRoot(document.getElementById('root')).render(
  React.createElement(
    StrictMode,
    null,
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        AuthProvider,
        null,
        React.createElement(AppRoutes)
      )
    )
  )
);
