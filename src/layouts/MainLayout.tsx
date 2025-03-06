import { ReactNode, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, isStaff, user, platformRole, logAuditEvent } = useAuth();
  
  useEffect(() => {
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
  }, [location]);
  
  const handleLogout = async () => {
    try {
      await logAuditEvent('logout', 'session', user?.id || '', {
        email: user?.email
      });
    } catch (error) {
      console.error('Failed to log audit event', error);
    }
    
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
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
