
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

  // Function to fetch user role from the database
  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return 'User'; // Default role if there's an error
      }
      
      // If we found an admin role, return Admin, otherwise return User
      const role = data ? 'Admin' : 'User';
      console.log("User role retrieved from database:", role);
      return role;
    } catch (err) {
      console.error('Unexpected error when fetching user role:', err);
      return 'User'; // Default role if there's an error
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (data?.session) {
          setIsAuthenticated(true);
          setUser(data.session.user);
          
          // Fetch role from database
          const role = await fetchUserRole(data.session.user.id);
          setUserRole(role);
          console.log("Session restored - User role set to:", role);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setLoading(false);
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event);
      
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        setUser(session.user);
        
        // Fetch role from database on sign in
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
        console.log("Auth state change - User role set to:", role);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setUserRole('User');
        console.log("User signed out, role reset to User");
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
    
    // Fetch user role from database on login
    const role = await fetchUserRole(data.user.id);
    setUserRole(role);
    console.log("Login - User role set to:", role);
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

    if (data.user) {
      setIsAuthenticated(true);
      setUser(data.user);
      setUserRole("User"); // Default role for new users
      console.log("New user signed up - Default role set to: User");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setUserRole("User");
    console.log("User logged out, role reset to User");
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
  
  console.log("ProtectedRoute check - Auth:", isAuthenticated, "UserRole:", userRole, "Required:", requiredRole);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log("Access denied: User role", userRole, "doesn't match required role", requiredRole);
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
