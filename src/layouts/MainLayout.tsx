
import { ReactNode, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, platformRole, logAuditEvent, isAuthReady, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Helper functions to check roles
  const isAdmin = platformRole === 'super_admin';
  const isStaff = platformRole === 'staff' || platformRole === 'super_admin';
  
  useEffect(() => {
    // Clear any previous errors
    setError(null);
    
    console.log("MainLayout: Auth state changed", { 
      isAuthReady, 
      isAuthenticated, 
      platformRole, 
      pathname: location.pathname 
    });
    
    // Redirect to login if not authenticated
    if (isAuthReady && !isAuthenticated) {
      console.log("MainLayout: Redirecting to login because user is not authenticated");
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
  }, [location, isAuthReady, isAuthenticated, navigate, platformRole]);
  
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
  
  // Show better loading state while auth is initializing
  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your account...</p>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4 text-center max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Reload Application
        </button>
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
