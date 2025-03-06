
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
import { supabase, logAuth, logError, logSuccess } from "./integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string;
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
  const [userRole, setUserRole] = useState("User");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        logAuth("AUTH: Checking session", {});
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logError("AUTH: Error getting session", error);
          setLoading(false);
          return;
        }
        
        if (data?.session) {
          setIsAuthenticated(true);
          setUser(data.session.user);
          
          // Check if user is admin
          const isAdmin = data.session.user.email?.includes("admin") ? true : false;
          setUserRole(isAdmin ? "Admin" : "User");
          
          logSuccess("AUTH: User authenticated", {
            user: data.session.user.email,
            role: isAdmin ? "Admin" : "User",
            id: data.session.user.id
          });
        } else {
          logAuth("AUTH: No active session found", {});
        }
      } catch (error) {
        logError("AUTH: Unexpected error in session check", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      logAuth("AUTH: Auth state changed", { event });
      
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUser(session.user);
        const isAdmin = session.user.email?.includes("admin") ? true : false;
        setUserRole(isAdmin ? "Admin" : "User");
        
        logSuccess("AUTH: User signed in", {
          user: session.user.email,
          role: isAdmin ? "Admin" : "User",
          id: session.user.id
        });
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole("User");
        logAuth("AUTH: User signed out", {});
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      logAuth("AUTH: Attempting login", { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logError("AUTH: Login failed", error);
        throw error;
      }

      setIsAuthenticated(true);
      setUser(data.user);
      
      const isAdmin = email.includes("admin") ? true : false;
      setUserRole(isAdmin ? "Admin" : "User");
      
      logSuccess("AUTH: Login successful", {
        user: data.user?.email,
        role: isAdmin ? "Admin" : "User",
        id: data.user?.id
      });
    } catch (error) {
      logError("AUTH: Login error", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      logAuth("AUTH: Attempting signup", { email, fullName });
      
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
        logError("AUTH: Signup failed", error);
        throw error;
      }

      if (data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setUserRole("User");
        
        logSuccess("AUTH: Signup successful", {
          user: data.user.email,
          role: "User",
          id: data.user.id
        });
      }
    } catch (error) {
      logError("AUTH: Signup error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      logAuth("AUTH: Attempting logout", {});
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setUserRole("User");
      logSuccess("AUTH: Logout successful", {});
    } catch (error) {
      logError("AUTH: Logout error", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        userRole, 
        user,
        login, 
        logout,
        signup 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
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
              <MainLayout>
                <Dashboard />
              </MainLayout>
            } />
            
            <Route path="/profile" element={
              <MainLayout>
                <Profile />
              </MainLayout>
            } />
            
            <Route path="/organization" element={
              <MainLayout>
                <Organization />
              </MainLayout>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="Admin">
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <MainLayout>
                <Transactions />
              </MainLayout>
            } />
            
            <Route path="/courses" element={
              <MainLayout>
                <Courses />
              </MainLayout>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
