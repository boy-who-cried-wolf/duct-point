
import { ReactNode, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, platformRole, logAuditEvent, isAuthReady, isAuthenticated } = useAuth();
  
  // Helper functions to check roles
  const isAdmin = platformRole === 'super_admin';
  const isStaff = platformRole === 'staff' || platformRole === 'super_admin';
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (isAuthReady && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }

    const pathname = location.pathname;
    let title = 'Points Platform';
    
    if (pathname.includes('/dashboard')) {
      title = 'Dashboard | Points Platform';
    } else if (pathname.includes('/profile')) {
      title = 'Profile | Points Platform';
    } else if (pathname.includes('/organization')) {
      title = 'Organization | Points Platform';
    } else if (pathname.includes('/admin')) {
      title = 'Admin | Points Platform';
    } else if (pathname.includes('/transactions')) {
      title = 'Transactions | Points Platform';
    } else if (pathname.includes('/courses')) {
      title = 'Courses | Points Platform';
    }
    
    document.title = title;
  }, [location, isAuthReady, isAuthenticated, navigate]);
  
  const handleLogout = async () => {
    try {
      if (user?.id) {
        await logAuditEvent('logout', 'session', user.id, {
          email: user.email
        });
      }
    } catch (error) {
      console.error('Failed to log audit event', error);
    }
    
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  // Show loading state while auth is initializing
  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar 
        userName={user?.user_metadata?.full_name || user?.email || 'User'} 
        userInitials={(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
