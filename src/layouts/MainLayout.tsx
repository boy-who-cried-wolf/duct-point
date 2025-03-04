
import { ReactNode, useEffect } from 'react';
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
  
  useEffect(() => {
    console.log("🔍 MainLayout auth check:", { 
      isAuthenticated, 
      userId: user?.id, 
      isAdmin 
    });
    
    if (!isAuthenticated) {
      console.log("🚫 MainLayout - Not authenticated, should redirect");
    }
  }, [isAuthenticated, user, isAdmin]);
  
  const handleLogout = () => {
    console.log("🚪 MainLayout - Logging out");
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  if (!isAuthenticated) {
    console.log("⚠️ MainLayout rendered without authentication");
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
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
