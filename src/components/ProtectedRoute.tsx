import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'staff' | 'user';
}

const ProtectedRoute = ({ children, requiredRole = 'user' }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthReady, platformRole } = useAuth();
  const location = useLocation();

  // During initial auth check, don't redirect yet
  if (!isAuthReady) {
    return null; // Or a loading spinner
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user has the required role
  if (requiredRole === 'super_admin' && platformRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'staff' && platformRole !== 'super_admin' && platformRole !== 'staff') {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has the required role
  return <>{children}</>;
};

export default ProtectedRoute;
