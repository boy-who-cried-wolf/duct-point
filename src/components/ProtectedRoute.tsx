
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logInfo } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

export const ProtectedRoute = ({ 
  requireAdmin = false, 
  requireStaff = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isStaff, isAuthReady } = useAuth();
  const location = useLocation();

  // Show loading state while auth is initializing
  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    logInfo("ROUTE: Redirecting unauthenticated user to login", { from: location.pathname });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    logInfo("ROUTE: Non-admin user attempted to access admin route", { 
      isAdmin, 
      redirectingTo: "/dashboard" 
    });
    return <Navigate to="/dashboard" replace />;
  }

  if (requireStaff && !isStaff) {
    logInfo("ROUTE: Non-staff user attempted to access staff route", { 
      isStaff, 
      redirectingTo: "/dashboard" 
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
