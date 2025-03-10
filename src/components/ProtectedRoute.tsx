
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logInfo } from '../integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type PlatformRole = 'super_admin' | 'staff' | 'user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: PlatformRole;
}

const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) => {
  const { isAuthenticated, platformRole, isAuthReady } = useAuth();
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

  if (requiredRole && !hasRequiredRole(platformRole, requiredRole)) {
    logInfo("ROUTE: User with insufficient role attempted access", { 
      requiredRole, 
      userRole: platformRole, 
      redirectingTo: "/dashboard" 
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Helper function to check if a user has the required role based on role hierarchy
function hasRequiredRole(userRole: PlatformRole | null, requiredRole: PlatformRole): boolean {
  if (!userRole) return false;
  
  // Direct role match
  if (userRole === requiredRole) return true;
  
  // Role hierarchy: super_admin > staff > user
  if (requiredRole === 'user') {
    // Any role can access user-level resources
    return true;
  }
  
  if (requiredRole === 'staff') {
    // Only staff and super_admin can access staff-level resources
    return userRole === 'staff' || userRole === 'super_admin';
  }
  
  // For super_admin resources, only super_admin can access
  return userRole === 'super_admin';
}

export default ProtectedRoute;
