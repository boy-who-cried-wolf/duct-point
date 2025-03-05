
import { useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);

  console.log("🔄 Auth provider with state:", { 
    isAuthenticated, 
    isAdmin, 
    userId: user?.id, 
    isLoading,
    profileFetched
  });

  // Fetch user profile including admin status - with improved error handling
  const fetchUserProfile = async (userId: string): Promise<boolean> => {
    console.log("🔍 Fetching user profile for:", userId);
    
    if (!userId) {
      console.log("❌ Cannot fetch profile: No user ID provided");
      return false;
    }
    
    try {
      // Explicitly log the query we're about to make
      console.log(`📊 Querying profiles table for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return false;
      }
      
      // Log the raw data returned to debug
      console.log("📊 Raw profile data received:", data);
      
      // Important: This line was potentially causing the issue by not properly evaluating data?.is_admin
      // Fix: Explicitly check the value and convert to boolean if needed
      const adminStatus = data?.is_admin === true;
      console.log("✅ User profile fetched, admin status:", adminStatus);
      setProfileFetched(true);
      return adminStatus;
    } catch (error) {
      console.error('❌ Error in profile fetch:', error);
      return false;
    }
  };

  // Refresh admin status from database - only when explicitly called
  const refreshAdminStatus = async (): Promise<void> => {
    console.log("🔄 Manually refreshing admin status");
    if (!user?.id) {
      console.log("❌ Cannot refresh admin status: No user ID");
      return;
    }
    
    setProfileFetched(false); // Force a fresh fetch
    const adminStatus = await fetchUserProfile(user.id);
    console.log("🔄 Setting isAdmin to:", adminStatus);
    setIsAdmin(adminStatus);
  };

  // Update auth state with current session - with optimization
  const updateAuthState = async (session: Session | null) => {
    console.log("🔄 Updating auth state with session:", session?.user?.id);
    
    if (!session) {
      console.log("🚪 No session, clearing auth state");
      setUser(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      setProfileFetched(false);
      setIsLoading(false);
      return;
    }
    
    // Set user and authenticated state immediately
    setUser(session.user);
    setIsAuthenticated(true);
    
    // Then fetch profile to get admin status
    console.log("🔍 Fetching fresh profile after auth state update");
    const adminStatus = await fetchUserProfile(session.user.id);
    console.log("👑 Setting isAdmin to:", adminStatus);
    setIsAdmin(adminStatus);
    
    // Only set loading to false after everything is complete
    setIsLoading(false);
  };

  // Initialize auth state on component mount - once
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log("🔄 Initializing auth state...");
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("✅ Session found during initialization");
          if (mounted) await updateAuthState(data.session);
        } else {
          console.log("ℹ️ No session found during initialization");
          if (mounted) {
            setIsAuthenticated(false);
            setUser(null);
            setIsAdmin(false);
            setProfileFetched(false);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('❌ Unexpected error in initializeAuth:', err);
        if (mounted) setIsLoading(false);
      }
    };

    // Set up auth state change listener - with cleanup
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        console.log("✅ User signed in:", session?.user?.id);
        if (mounted) {
          setProfileFetched(false); // Force profile fetch on new sign in
          await updateAuthState(session);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("🔄 Token refreshed:", session?.user?.id);
        if (mounted) await updateAuthState(session);
      } else if (event === 'SIGNED_OUT') {
        console.log("🚪 User signed out");
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          setIsAdmin(false);
          setProfileFetched(false);
          setIsLoading(false);
        }
      }
    });

    initializeAuth();

    return () => {
      console.log("🧹 Cleaning up auth subscription");
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Login function - fixed to properly handle state
  const login = async (email: string, password: string) => {
    console.log("🔑 Attempting login for:", email);
    try {
      // Set loading before making API call
      setIsLoading(true);
      setProfileFetched(false); // Reset profile fetch status
      
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
      
      // We'll let the auth listener handle the state update
      // but return the data for the component to use
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
      setProfileFetched(false); // Reset profile fetch status
      
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
      
      // Clear auth state immediately instead of waiting for the event
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      setProfileFetched(false);
      
      console.log("✅ Logout API call complete");
      setIsLoading(false);
    } catch (error: any) {
      console.error("❌ Logout exception:", error);
      toast.error(error.message || "Error during logout");
      setIsLoading(false);
    }
  };

  // Compile the context value
  const authContextValue = {
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
