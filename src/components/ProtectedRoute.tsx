
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'staff' | 'user';
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Allow access to all routes regardless of role
  return <>{children}</>;
};

export default ProtectedRoute;
