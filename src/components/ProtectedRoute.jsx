import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

/**
 * Optimized ProtectedRoute - INSTANT rendering
 * NO blocking loaders, NO auth verification loops
 * Single source of truth from authReady state
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireUsername = null, // null = don't check, true = require username, false = require no username
  redirectTo = '/login'
}) => {
  const { user, authReady, hasUsername, profileChecked } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // 1. INSTANT AUTH CHECK - Only block if auth is NOT ready (max 300ms)
  if (!authReady) {
    console.log('⚡ ProtectedRoute: Auth not ready, showing minimal loader for:', currentPath);
    return React.createElement(
      'div',
      { className: 'min-h-screen bg-white flex items-center justify-center' },
      React.createElement(
        'div',
        { className: 'w-6 h-6 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin' }
      )
    );
  }

  // 2. AUTH CHECK - Immediate redirect if not authenticated
  if (requireAuth && !user) {
    console.log('🔒 ProtectedRoute: No auth, redirecting from', currentPath, 'to', redirectTo);
    console.log('🔍 Auth state debug:', { user: !!user, authReady, hasUsername, profileChecked });
    return React.createElement(Navigate, { to: redirectTo, replace: true });
  }

  // 3. USERNAME CHECK - Non-blocking logic
  if (user && requireUsername !== null) {
    // If profile is still being checked, show minimal loader instead of optimistic routing
    if (!profileChecked && hasUsername === null) {
      console.log('⚡ ProtectedRoute: Profile checking, showing minimal loader for:', currentPath);
      return React.createElement(
        'div',
        { className: 'min-h-screen bg-white flex items-center justify-center' },
        React.createElement(
          'div',
          { className: 'w-6 h-6 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin' }
        )
      );
    }

    console.log('🎯 ProtectedRoute: Final route decision for path:', currentPath, 'hasUsername:', hasUsername, 'requireUsername:', requireUsername);

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

  // 4. ALL CHECKS PASSED - Render children immediately
  console.log('✅ ProtectedRoute: Access granted, rendering children for path:', currentPath);
  return children;
};

export default ProtectedRoute;
