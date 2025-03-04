
import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // In a real app, we would clear the auth token here
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar 
        userName="John Doe" 
        userInitials="JD" 
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
