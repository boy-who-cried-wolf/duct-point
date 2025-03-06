
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logInfo } from '../integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requireAdmin?: boolean;
  requireStaff?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAdmin = false, 
  requireStaff = false 
}: ProtectedRouteProps) => {
  const { isAuthenticated, userRole, isAdmin, isStaff } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    logInfo("ROUTE: Redirecting unauthenticated user to login", { from: location.pathname });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    logInfo("ROUTE: Non-admin user attempted to access admin route", { 
      userRole, 
      isAdmin, 
      redirectingTo: "/dashboard" 
    });
    return <Navigate to="/dashboard" replace />;
  }

  if (requireStaff && !isStaff) {
    logInfo("ROUTE: Non-staff user attempted to access staff route", { 
      userRole, 
      isStaff, 
      redirectingTo: "/dashboard" 
    });
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    logInfo("ROUTE: User with incorrect role attempted access", { 
      requiredRole, 
      userRole, 
      redirectingTo: "/dashboard" 
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
