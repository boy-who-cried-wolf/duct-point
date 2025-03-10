import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { User } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "sonner";
import { supabase } from "./integrations/supabase/client";
import { getUserRole, UserRole } from "./integrations/supabase/user";
import MainLayout from "./layouts/MainLayout";
import AdminDashboard from "./pages/AdminDashboard";
import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Organization from "./pages/Organization";
import Profile from "./pages/Profile";
import Transactions from "./pages/Transactions";

// Create an auth context
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

// Auth Provider Component
const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on initial load
    const getSession = async () => {
      console.log('Starting getSession...');
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Session data:', data);

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (data?.session) {
          console.log('Found active session, setting authenticated state...');
          setIsAuthenticated(true);
          setUser(data.session.user);
          console.log('Fetching user role...');
          const user_role = await getUserRole();
          console.log('User role fetched:', user_role);
          setUserRole(user_role ?? "user");
        } else {
          console.log('No active session found');
          setIsAuthenticated(false);
          setUser(null);
          setUserRole("user");
        }
      } catch (error) {
        console.error('Error in getSession:', error);
        setIsAuthenticated(false);
        setUser(null);
        setUserRole("user");
      } finally {
        console.log('Setting loading to false in getSession');
        setLoading(false);
      }
    };

    getSession();

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      setLoading(true);
      try {
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, updating state...');
          setIsAuthenticated(true);
          setUser(session.user);
          console.log('Fetching user role after sign in...');
          const user_role = await getUserRole();
          console.log('User role after sign in:', user_role);
          setUserRole(user_role ?? "user");
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, resetting state...');
          setIsAuthenticated(false);
          setUser(null);
          setUserRole("user");
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setIsAuthenticated(false);
        setUser(null);
        setUserRole("user");
      } finally {
        console.log('Setting loading to false in auth state change');
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth state listener');
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Starting login process...');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('Login successful, updating state...');
      setIsAuthenticated(true);
      setUser(data.user);
      console.log('Fetching user role after login...');
      const user_role = await getUserRole();
      console.log('User role after login:', user_role);
      setUserRole(user_role ?? "user");
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    } finally {
      console.log('Setting loading to false in login');
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
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
        throw error;
      }

      if (data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setUserRole("user");
      }
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setUserRole("user");
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

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
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  console.log(userRole)

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main App Component
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

            {/* Protected routes */}
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
              <ProtectedRoute requiredRole="admin">
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

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
