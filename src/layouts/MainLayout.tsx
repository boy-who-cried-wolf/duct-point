import { ReactNode, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout, platformRole } = useAuth();
  const [error] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
  };
  
  // Helper functions to check roles
  const isAdmin = platformRole === 'super_admin';
  const isStaff = platformRole === 'staff' || platformRole === 'super_admin';
  
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
    <div className="flex min-h-screen flex-col w-full max-w-none">
      <AdminSidebar 
        userName={user?.user_metadata?.full_name || user?.email || 'User'} 
        userInitials={(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
        userAvatarUrl={user?.user_metadata?.avatar_url}
        isAdmin={isAdmin}
        isStaff={isStaff}
        onLogout={handleLogout}
      />
      <main className="flex-1 py-10 lg:pl-72 w-full max-w-none">
        <div className="px-4 w-full max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
