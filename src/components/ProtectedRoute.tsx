
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'staff' | 'user';
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Removed all authentication checks - allowing free access to all routes
  return <>{children}</>;
};

export default ProtectedRoute;
