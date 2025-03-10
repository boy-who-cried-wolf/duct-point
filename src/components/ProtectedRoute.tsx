
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logInfo, logError, logWarning } from '../integrations/supabase/client';
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
  const { isAuthenticated, platformRole, isAuthReady, user } = useAuth();
  const location = useLocation();

  // Log when the protected route component evaluates permissions
  useEffect(() => {
    logInfo("ROUTE: Evaluating protected route access", { 
      path: location.pathname, 
      isAuthReady, 
      isAuthenticated,
      userRole: platformRole,
      userId: user?.id,
      requiredRole: requiredRole || 'none' 
    });
    
    if (!isAuthReady) {
      logWarning("ROUTE: Auth not ready yet for route evaluation", {
        path: location.pathname
      });
    }
  }, [location.pathname, isAuthReady, isAuthenticated, platformRole, requiredRole, user?.id]);

  // Show loading state while auth is initializing
  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verifying your access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    logInfo("ROUTE: Redirecting unauthenticated user to login", { 
      from: location.pathname,
      isAuthReady
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRequiredRole(platformRole, requiredRole)) {
    logError("ROUTE: User with insufficient role attempted access", { 
      requiredRole, 
      userRole: platformRole, 
      redirectingTo: "/dashboard",
      path: location.pathname,
      userId: user?.id
    });
    return <Navigate to="/dashboard" replace />;
  }

  // Log successful access
  logInfo("ROUTE: Access granted to protected route", {
    path: location.pathname,
    role: platformRole,
    userId: user?.id
  });

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
