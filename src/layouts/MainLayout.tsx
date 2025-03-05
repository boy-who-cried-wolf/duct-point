import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth';

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
    user
  } = useAuth();
  
  console.log("🏠 MainLayout user:", { 
    userId: user?.id, 
    userMetadata: user?.user_metadata,
    isAdmin
  });
  
  const handleLogout = () => {
    console.log("🚪 MainLayout - Logging out");
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // No more authentication checks here - we're handling those at the route level
  // This component can now assume it only renders for authenticated users

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
