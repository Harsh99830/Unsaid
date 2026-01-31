import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

/**
 * ProtectedRoute - Pure, declarative route guard
 * NO useEffect, NO navigate() calls, NO side effects
 * Single source of truth from useAuth
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireUsername = null, // null = don't check, true = require username, false = require no username
  redirectTo = '/login'
}) => {
  const { user, loading, hasUsername, profileLoading } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // 1. LOADING STATE - Show loader while checking auth
  if (loading) {
    console.log('⏳ ProtectedRoute: Auth loading for path:', currentPath);
    return React.createElement(
      'div',
      { className: 'min-h-screen bg-white flex items-center justify-center' },
      React.createElement(
        'div',
        { className: 'text-center' },
        React.createElement(
          'div',
          { className: 'w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4' }
        ),
        React.createElement('p', { className: 'text-gray-500' }, 'Authenticating...')
      )
    );
  }

  // 2. AUTH CHECK - Return redirect if not authenticated
  if (requireAuth && !user) {
    console.log('🔒 ProtectedRoute: No auth, redirecting from', currentPath, 'to', redirectTo);
    return React.createElement(Navigate, { to: redirectTo, replace: true });
  }

  // 3. USERNAME CHECK - Handle username requirements
  if (user && requireUsername !== null) {
    // If profile is still loading, show loader
    if (profileLoading || hasUsername === null) {
      console.log('⏳ ProtectedRoute: Profile loading for path:', currentPath);
      return React.createElement(
        'div',
        { className: 'min-h-screen bg-white flex items-center justify-center' },
        React.createElement(
          'div',
          { className: 'text-center' },
          React.createElement(
            'div',
            { className: 'w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin mx-auto mb-4' }
          ),
          React.createElement('p', { className: 'text-gray-500' }, 'Checking profile...')
        )
      );
    }

    console.log('🎯 ProtectedRoute: Route decision for path:', currentPath, 'hasUsername:', hasUsername, 'requireUsername:', requireUsername);

    // Route-specific requirements
    if (requireUsername && !hasUsername) {
      console.log('📝 ProtectedRoute: Username required but missing, redirecting to /username-selection');
      return React.createElement(Navigate, { to: '/username-selection', replace: true });
    }

    if (!requireUsername && hasUsername) {
      console.log('✅ ProtectedRoute: Username exists but not allowed, redirecting to /feed');
      return React.createElement(Navigate, { to: '/feed', replace: true });
    }
  }

  // 4. ALL CHECKS PASSED - Render children
  console.log('✅ ProtectedRoute: Access granted, rendering children for path:', currentPath);
  return children;
};

export default ProtectedRoute;
