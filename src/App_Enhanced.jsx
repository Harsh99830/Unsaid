import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';
import UsernameSelection from './pages/UsernameSelection_Enhanced';
import Feed from './pages/Feed';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/verify-otp" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <VerifyOTP />
                </ProtectedRoute>
              } 
            />

            {/* Username selection - requires auth but no username */}
            <Route 
              path="/username-selection" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  requireUsername={false}
                >
                  <UsernameSelection />
                </ProtectedRoute>
              } 
            />

            {/* Protected routes - require auth and username */}
            <Route 
              path="/feed" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  requireUsername={true}
                >
                  <Feed />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  requireUsername={true}
                >
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Default redirect */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute 
                  requireAuth={true} 
                  requireUsername={true}
                >
                  <Navigate to="/feed" replace />
                </ProtectedRoute>
              } 
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
