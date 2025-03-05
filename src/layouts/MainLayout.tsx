
import { ReactNode, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({
  children
}: MainLayoutProps) => {
  console.log("🏠 MainLayout rendering");
  const navigate = useNavigate();
  const {
    logout,
    isAdmin,
    user,
    isLoading,
    isAuthenticated
  } = useAuth();
  
  console.log("🏠 MainLayout auth state:", { 
    isAuthenticated,
    isAdmin, 
    userId: user?.id, 
    isLoading,
    userMetadata: user?.user_metadata
  });
  
  // Add a safety check - if not authenticated and not loading, redirect to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("🚫 MainLayout - Not authenticated, redirecting to login");
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  const handleLogout = () => {
    console.log("🚪 MainLayout - Logging out");
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Show loading state if auth is still loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar 
        userName={user?.user_metadata?.full_name || user?.email || 'User'} 
        userInitials={(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()} 
        onLogout={handleLogout} 
        isAdmin={isAdmin} 
      />
      <main className="flex-1">
        <div className="container py-6 px-4 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
