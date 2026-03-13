import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

const Spinner = () => (
  <div className="min-h-screen bg-white text-[#181311] antialiased flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#FF5722] border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, initializing, hasUsername } = useAuth();
  const { pathname } = useLocation();

  // The single gate. Nothing renders — no redirects, no page, nothing —
  // until the full session + username bootstrap is complete.
  if (initializing) return <Spinner />;

  // Not logged in → login
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, on a public-only route (e.g. /login) → redirect based on username status
  if (!requireAuth && user) {
    return <Navigate to={hasUsername ? '/feed' : '/username-selection'} replace />;
  }

  // Logged in, no username → can ONLY be on /username-selection
  if (requireAuth && user && !hasUsername && pathname !== '/username-selection') {
    return <Navigate to="/username-selection" replace />;
  }

  // Logged in, has username, no reason to be on /username-selection
  if (requireAuth && user && hasUsername && pathname === '/username-selection') {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

export default ProtectedRoute;
