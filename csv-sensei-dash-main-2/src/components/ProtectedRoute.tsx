import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAuth = false }) => {
  const { isLoggedIn } = useAuth();

  // If auth is required and user is not logged in, redirect to login
  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // If user is logged in and trying to access login page, redirect to demo
  if (isLoggedIn && window.location.pathname === '/') {
    return <Navigate to="/demo" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
