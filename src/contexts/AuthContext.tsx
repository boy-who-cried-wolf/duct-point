
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
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
