import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'

// Import pages
import Login from './pages/Login.jsx'
import Feed from './pages/Feed.jsx'

/**
 * AppRoutes - Simple router setup
 */
const AppRoutes = () => {
  return React.createElement(
    Routes,
    null,
    
    // Login route - accessible only when NOT authenticated
    React.createElement(Route, {
      path: '/login',
      element: React.createElement(
        ProtectedRoute,
        { requireAuth: false },
        React.createElement(Login)
      )
    }),
    
    // Feed route - accessible only when authenticated
    React.createElement(Route, {
      path: '/feed',
      element: React.createElement(
        ProtectedRoute,
        { requireAuth: true },
        React.createElement(Feed)
      )
    }),
    
    // Default route - redirect based on auth state
    React.createElement(Route, {
      path: '/',
      element: React.createElement(
        ProtectedRoute,
        { requireAuth: true },
        React.createElement(Navigate, { to: '/feed', replace: true })
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
