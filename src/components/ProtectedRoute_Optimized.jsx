import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider_Optimized';

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
    return React.createElement(Navigate, { to: redirectTo, replace: true });
  }

  // 3. USERNAME CHECK - Non-blocking logic
  if (user && requireUsername !== null) {
    // If profile is still being checked, allow rendering with optimistic UI
    if (!profileChecked && hasUsername === null) {
      console.log('⚡ ProtectedRoute: Profile checking, allowing optimistic render for:', currentPath);
      
      // Optimistic routing based on requirement
      if (requireUsername) {
        // Optimistically assume user needs username selection
        console.log('📝 ProtectedRoute: Optimistic - redirecting to username selection');
        return React.createElement(Navigate, { to: '/username-selection', replace: true });
      } else {
        // Optimistically allow access (will be corrected if wrong)
        console.log('✅ ProtectedRoute: Optimistic - allowing access');
        return children;
      }
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
