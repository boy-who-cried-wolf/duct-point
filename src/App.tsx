
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
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("🔄 Auth provider rendering with state:", { 
    isAuthenticated, 
    isAdmin, 
    userId: user?.id, 
    isLoading 
  });

  const updateAuthState = async (currentUser: User | null) => {
    console.log("🔄 Updating auth state with user:", currentUser?.id);
    
    if (!currentUser) {
      console.log("🚫 No current user, setting not authenticated");
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      return;
    }
    
    setUser(currentUser);
    setIsAuthenticated(true);
    
    try {
      console.log("🔍 Fetching user profile for:", currentUser.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        setIsAdmin(false);
      } else {
        console.log("✅ User profile fetched:", data);
        setIsAdmin(data?.is_admin || false);
      }
    } catch (error) {
      console.error('❌ Error in profile fetch:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set a shorter timeout for auth loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("⏱️ Auth loading timeout reached - forcing completion");
        setIsLoading(false);
      }
    }, 2000); // Reduced from 3000ms to 2000ms

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("🔄 Initializing auth state...");
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session) {
          console.log("🔑 Session found during initialization:", data.session.user.id);
          await updateAuthState(data.session.user);
        } else {
          console.log("🚫 No session found during initialization");
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        console.error('❌ Unexpected error in initializeAuth:', err);
      } finally {
        setIsLoading(false);
        console.log("✅ Auth initialization complete");
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("✅ User signed in via auth listener:", session.user.id);
        await updateAuthState(session.user);
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log("🚪 User signed out via auth listener");
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      } else if (session) {
        console.log("🔄 Other auth event with session:", event);
        await updateAuthState(session.user);
      }
      
      setIsLoading(false);
    });

    initializeAuth();

    return () => {
      console.log("🧹 Cleaning up auth subscription");
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("🔑 Attempting login for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Login error:", error);
        throw error;
      }

      console.log("✅ Login API call successful for:", email);
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("❌ Login exception:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    console.log("📝 Attempting signup for:", email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("❌ Signup error:", error);
        throw error;
      }

      console.log("✅ Signup API call successful for:", email);
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("❌ Signup exception:", error);
      throw error;
    }
  };

  const logout = async () => {
    console.log("🚪 Logging out");
    try {
      await supabase.auth.signOut();
      console.log("✅ Logout API call complete");
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const authContextValue = {
    isAuthenticated, 
    isAdmin, 
    user,
    isLoading,
    login, 
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

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

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("🚫 Not authenticated, redirecting to login from:", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log("🚫 Not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("✅ Access granted to:", location.pathname);
  return <>{children}</>;
};

const queryClient = new QueryClient();

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
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              
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
