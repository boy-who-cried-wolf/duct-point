
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Organization from "./pages/Organization";
import AdminDashboard from "./pages/AdminDashboard";
import Transactions from "./pages/Transactions";
import Courses from "./pages/Courses";
import NotFound from "./pages/NotFound";
import { ReactNode } from "react";
import { toast } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

// Simplified ProtectedRoute - only checks at route level, not component level
const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  console.log("🔒 ProtectedRoute check:", { 
    path: location.pathname, 
    isAuthenticated, 
    isAdmin, 
    requireAdmin,
    isLoading
  });
  
  // Show simple loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("🚫 Not authenticated, redirecting to login from:", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if not admin but admin required
  if (requireAdmin && !isAdmin) {
    console.log("🚫 Not admin, redirecting to dashboard from:", location.pathname);
    toast.error("Admin access required");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("✅ Access granted to:", location.pathname);
  return <>{children}</>;
};

// Improved root route handler with better logging
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log("🔄 Root redirect check:", { 
    isAuthenticated, 
    isLoading, 
    path: "/"
  });
  
  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }
  
  // Redirect based on auth status
  if (isAuthenticated) {
    console.log("✅ Authenticated at root, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log("🔑 Not authenticated at root, redirecting to login");
    return <Navigate to="/login" replace />;
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log("🔄 App component rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Root route redirects based on auth status */}
              <Route path="/" element={<RootRedirect />} />
              
              {/* Login route is NOT protected - accessible to everyone */}
              <Route path="/login" element={<Login />} />
              
              {/* All other routes are protected and require authentication */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Profile />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/organization" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Organization />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <MainLayout>
                    <AdminDashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Transactions />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/courses" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Courses />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
