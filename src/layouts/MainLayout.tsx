
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../App';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const { logout, isAdmin, isStaff, user, platformRole, logAuditEvent } = useAuth();
  
  const handleLogout = async () => {
    // Log audit event
    try {
      await logAuditEvent('logout', 'session', user?.id || '', {
        email: user?.email
      });
    } catch (error) {
      // Continue with logout even if audit logging fails
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
