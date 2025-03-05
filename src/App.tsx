
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
import { supabase } from "./integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

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

  // Add a safety timeout that will force loading to complete after 5 seconds
  // This prevents the UI from getting stuck in a loading state indefinitely
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (isLoading) {
      console.log("⏱️ Starting safety timeout for auth loading");
      timeoutId = window.setTimeout(() => {
        console.log("⚠️ Safety timeout triggered - forcing loading to complete");
        setIsLoading(false);
      }, 5000);
    }
    
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
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
          try {
            await updateAuthState(data.session.user);
            console.log("✅ Auth state updated successfully");
          } catch (err) {
            console.error('❌ Error updating auth state:', err);
          } finally {
            // Always set loading to false regardless of what happens
            setIsLoading(false);
          }
        } else {
          console.log("🚫 No session found during initialization");
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Unexpected error in initializeAuth:', err);
        setIsLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session?.user?.id);
      
      // Set loading to true at the start of the auth state change
      setIsLoading(true);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("✅ User signed in via auth listener:", session.user.id);
        try {
          await updateAuthState(session.user);
          console.log("✅ Auth state updated after sign in");
        } catch (err) {
          console.error('❌ Error updating auth state after sign in:', err);
        } finally {
          // Always set loading to false regardless of what happens
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out via auth listener");
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      } else if (session) {
        console.log("🔄 Other auth event with session:", event);
        try {
          await updateAuthState(session.user);
          console.log("✅ Auth state updated after other event");
        } catch (err) {
          console.error('❌ Error updating auth state after other event:', err);
        } finally {
          // Always set loading to false regardless of what happens
          setIsLoading(false);
        }
      } else {
        console.log("🔄 Auth event without session:", event);
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("🚫 Not authenticated, redirecting to login from:", location.pathname);
    toast.error("Please login to access this page");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log("🚫 Not admin, redirecting to dashboard");
    toast.error("Admin access required");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("✅ Access granted to:", location.pathname);
  return <>{children}</>;
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
