
import { ReactNode, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../App';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  console.log("🏠 MainLayout rendering");
  const navigate = useNavigate();
  const { logout, isAdmin, user, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    console.log("🔍 MainLayout auth check:", { 
      isAuthenticated, 
      userId: user?.id, 
      isAdmin 
    });
    
    // Small timeout to ensure state is properly hydrated
    const timer = setTimeout(() => {
      setIsReady(true);
      console.log("✅ MainLayout ready to render");
    }, 100);
    
    if (!isAuthenticated) {
      console.log("🚫 MainLayout - Not authenticated, should redirect");
      navigate('/login');
    }
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, isAdmin, navigate]);
  
  const handleLogout = () => {
    console.log("🚪 MainLayout - Logging out");
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  if (!isAuthenticated) {
    console.log("⚠️ MainLayout rendered without authentication, redirecting");
    return null; // Return null to prevent flash of content
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
        <div className="container py-6">
          {isReady ? (
            <>
              {console.log("🖥️ MainLayout rendering children")}
              {children}
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
