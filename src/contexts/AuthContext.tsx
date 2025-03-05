
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    data: {
      user: User | null;
      session: Session | null;
    } | null;
    error: Error | null;
  }>;
  signup: (email: string, password: string, fullName: string) => Promise<{
    data: {
      user: User | null;
      session: Session | null;
    } | null;
    error: Error | null;
  }>;
  logout: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("🔄 Auth provider rendering with state:", { 
    isAuthenticated, 
    isAdmin, 
    userId: user?.id, 
    isLoading
  });

  // Fetch user profile including admin status
  const fetchUserProfile = async (userId: string): Promise<boolean> => {
    console.log("🔍 Fetching user profile for:", userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return false;
      }
      
      const adminStatus = data?.is_admin || false;
      console.log("✅ User profile fetched, admin status:", adminStatus);
      return adminStatus;
    } catch (error) {
      console.error('❌ Error in profile fetch:', error);
      return false;
    }
  };

  // Refresh admin status from database
  const refreshAdminStatus = async (): Promise<void> => {
    console.log("🔄 Manually refreshing admin status");
    if (!user?.id) {
      console.log("❌ Cannot refresh admin status: No user ID");
      return;
    }
    
    setIsLoading(true);
    const adminStatus = await fetchUserProfile(user.id);
    console.log("🔄 Setting isAdmin to:", adminStatus);
    setIsAdmin(adminStatus);
    setIsLoading(false);
  };

  // Update auth state with current session
  const updateAuthState = async (session: Session | null) => {
    console.log("🔄 Updating auth state with session:", session?.user?.id);
    
    setIsLoading(true);
    
    if (!session) {
      console.log("🚪 No session, clearing auth state");
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    
    setUser(session.user);
    setIsAuthenticated(true);
    
    const adminStatus = await fetchUserProfile(session.user.id);
    console.log("👑 Setting isAdmin to:", adminStatus);
    setIsAdmin(adminStatus);
    
    setIsLoading(false);
  };

  // Initialize auth state on component mount
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
        
        if (data.session) {
          console.log("✅ Session found during initialization");
          await updateAuthState(data.session);
        } else {
          console.log("ℹ️ No session found during initialization");
          setIsAuthenticated(false);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Unexpected error in initializeAuth:', err);
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log("✅ User signed in or token refreshed:", session?.user?.id);
        await updateAuthState(session);
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out");
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

  // Login function
  const login = async (email: string, password: string) => {
    console.log("🔑 Attempting login for:", email);
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Login error:", error);
        toast.error(error.message);
        setIsLoading(false);
        return { data: null, error };
      }

      console.log("✅ Login API call successful for:", email);
      return { data, error: null };
    } catch (error: any) {
      console.error("❌ Login exception:", error);
      setIsLoading(false);
      return { data: null, error };
    }
  };

  // Signup function
  const signup = async (email: string, password: string, fullName: string) => {
    console.log("📝 Attempting signup for:", email);
    try {
      setIsLoading(true);
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
        toast.error(error.message);
        setIsLoading(false);
        return { data: null, error };
      }

      console.log("✅ Signup API call successful for:", email);
      return { data, error: null };
    } catch (error: any) {
      console.error("❌ Signup exception:", error);
      setIsLoading(false);
      return { data: null, error };
    }
  };

  // Logout function
  const logout = async () => {
    console.log("🚪 Logging out");
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Logout error:", error);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      
      console.log("✅ Logout API call complete");
    } catch (error: any) {
      console.error("❌ Logout exception:", error);
      toast.error(error.message || "Error during logout");
      setIsLoading(false);
    }
  };

  // Compile the context value
  const authContextValue: AuthContextType = {
    isAuthenticated, 
    isAdmin, 
    user,
    isLoading,
    login, 
    logout,
    signup,
    refreshAdminStatus
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
