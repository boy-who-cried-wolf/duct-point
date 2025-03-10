
import { ReactNode, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const [error] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
  };
  
  // Error state is kept for compatibility but will never be triggered
  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4">
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
