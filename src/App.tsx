
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
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on initial load
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (data?.session) {
        setIsAuthenticated(true);
        setUser(data.session.user);


        // const user_role = (await getUserRole()) ?? "user";
        // setUserRole(user_role);
      }

      setLoading(false);
    };

    getSession();

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUser(session.user);
        // const user_role = (await getUserRole()) ?? "user";
        // setUserRole(user_role);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole("user");
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    setIsAuthenticated(true);
    setUser(data.user);
    const user_role = (await getUserRole()) ?? "user";
    setUserRole(user_role);
  };

  const signup = async (email: string, password: string, fullName: string) => {
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

    // After signup, the user is usually automatically signed in
    if (data.user) {
      setIsAuthenticated(true);
      setUser(data.user);
      // setUserRole("user");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setUserRole("user");
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
