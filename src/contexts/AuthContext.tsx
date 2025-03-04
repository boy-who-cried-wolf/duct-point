
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return 'User'; // Default role if there's an error
      }
      
      // Check if user has admin role
      const isAdmin = userRoles?.some(role => role.role === 'admin');
      console.log('User roles from database:', userRoles);
      console.log('Is admin?', isAdmin);
      
      return isAdmin ? 'Admin' : 'User';
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return 'User';
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
          console.log("User role set to:", role);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error in getSession:', error);
        setLoading(false);
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
          setUser(session.user);
          
          // Fetch role from database
          const role = await fetchUserRole(session.user.id);
          setUserRole(role);
          console.log("Auth state change - User role:", role);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          setUserRole("User");
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setIsAuthenticated(true);
      setUser(data.user);
      
      // Fetch role from database
      const role = await fetchUserRole(data.user.id);
      setUserRole(role);
      console.log("After login - User role:", role);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
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
        
        // New users get 'User' role by default (will be set by trigger)
        setUserRole("User");
      }
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setUserRole("User");
    } catch (error) {
      console.error('Error during logout:', error);
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
