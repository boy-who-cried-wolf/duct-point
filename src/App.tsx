
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
  const [loading, setLoading] = useState(true);

  // Fetch user profile and set admin status
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔍 Fetching user profile for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return;
      }

      console.log("✅ User profile fetched successfully:", data);
      setIsAdmin(data?.is_admin || false);
      console.log("👑 Is admin:", data?.is_admin || false);
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      console.log("🔄 Getting session...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        setLoading(false);
        return;
      }
      
      if (data?.session) {
        console.log("🔑 Session found:", data.session.user.id);
        setIsAuthenticated(true);
        setUser(data.session.user);
        
        // Fetch user profile to check admin status
        await fetchUserProfile(data.session.user.id);
      } else {
        console.log("🚫 No session found");
      }
      
      setLoading(false);
      console.log("🚀 Auth loading complete, authenticated:", !!data?.session);
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event);
      if (event === 'SIGNED_IN' && session) {
        console.log("✅ User signed in:", session.user.id);
        setIsAuthenticated(true);
        setUser(session.user);
        
        // Fetch user profile to check admin status
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out");
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      console.log("🧹 Cleaning up auth subscription");
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("🔑 Attempting login for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Login error:", error);
      throw error;
    }

    console.log("✅ Login successful for:", email);
    setIsAuthenticated(true);
    setUser(data.user);
    
    // Fetch user profile to check admin status
    await fetchUserProfile(data.user.id);
  };

  const signup = async (email: string, password: string, fullName: string) => {
    console.log("📝 Attempting signup for:", email);
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

    if (data.user) {
      console.log("✅ Signup successful for:", email);
      setIsAuthenticated(true);
      setUser(data.user);
      
      // New users are not admins by default
      setIsAdmin(false);
    }
  };

  const logout = async () => {
    console.log("🚪 Logging out");
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
    console.log("✅ Logout complete");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        isAdmin, 
        user,
        login, 
        logout,
        signup 
      }}
    >
      {!loading ? (
        <>
          {console.log("🔄 Rendering AuthContext with auth state:", { isAuthenticated, isAdmin })}
          {children}
        </>
      ) : (
        <>
          {console.log("⏳ Auth still loading, not rendering children")}
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </>
      )}
    </AuthContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  console.log("🔒 ProtectedRoute check:", { 
    path: location.pathname, 
    isAuthenticated, 
    isAdmin, 
    requireAdmin 
  });

  if (!isAuthenticated) {
    console.log("🚫 Not authenticated, redirecting to login");
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
