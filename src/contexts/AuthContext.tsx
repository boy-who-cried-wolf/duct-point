
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, logAuth, logError, logSuccess, logInfo } from "../integrations/supabase/client";
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordConfirmationEmail } from "../integrations/email-service";

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  userRole: string;
  platformRole: 'super_admin' | 'staff' | 'user' | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  logAuditEvent: (action: string, entityType: string, entityId: string, details?: any) => Promise<void>;
  isAuthReady: boolean;
  requestPasswordReset: (email: string) => Promise<void>;
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
  const [isStaff, setIsStaff] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [platformRole, setPlatformRole] = useState<'super_admin' | 'staff' | 'user' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const fetchUserPlatformRole = async (userId: string) => {
    try {
      logAuth("AUTH: Fetching user platform role", { userId });
      
      // Try to use the secure function first
      const { data: roleData, error: roleError } = await supabase.rpc('get_user_platform_role_direct', {
        user_uuid: userId
      });
      
      if (!roleError && roleData) {
        logSuccess("AUTH: User platform role fetched via RPC", { role: roleData });
        return roleData as 'super_admin' | 'staff' | 'user';
      }
      
      // Fallback to direct query if RPC fails
      const { data, error } = await supabase
        .from('user_platform_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        logError("AUTH: Error fetching platform role", error);
        return null;
      }
      
      if (data && data.role) {
        logSuccess("AUTH: User platform role fetched", { role: data.role });
        return data.role as 'super_admin' | 'staff' | 'user';
      }
      
      // Default to 'user' if no role found
      return 'user' as const;
    } catch (error) {
      logError("AUTH: Error in fetchUserPlatformRole", error);
      return null;
    }
  };

  const logAuditEvent = async (action: string, entityType: string, entityId: string, details?: any) => {
    try {
      if (!isAuthenticated) {
        logError("AUDIT: Cannot log audit event when not authenticated", {});
        return;
      }
      
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          action,
          entity_type: entityType,
          entity_id: entityId,
          details: details ? details : null
        });
      
      if (error) {
        logError("AUDIT: Failed to log event", { error, action, entityType });
      } else {
        logInfo("AUDIT: Logged event", { action, entityType, entityId });
      }
    } catch (error) {
      logError("AUDIT: Error logging event", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const getSession = async () => {
      try {
        logAuth("AUTH: Checking session", {});
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logError("AUTH: Error getting session", error);
          if (mounted) {
            setLoading(false);
            setIsAuthReady(true);
          }
          return;
        }
        
        if (data?.session) {
          if (mounted) {
            setIsAuthenticated(true);
            setUser(data.session.user);
          }
          
          const role = await fetchUserPlatformRole(data.session.user.id);
          
          if (role) {
            if (mounted) {
              setPlatformRole(role);
              setIsAdmin(role === 'super_admin');
              setIsStaff(role === 'staff' || role === 'super_admin');
              setUserRole(role === 'super_admin' ? "Admin" : role === 'staff' ? "Staff" : "User");
            }
          } else {
            // Default to regular user if no role is found
            if (mounted) {
              setPlatformRole('user');
              setUserRole("User");
            }
          }
          
          logSuccess("AUTH: User authenticated", {
            user: data.session.user.email,
            role: platformRole,
            id: data.session.user.id
          });
        } else {
          logAuth("AUTH: No active session found", {});
        }
      } catch (error) {
        logError("AUTH: Unexpected error in session check", error);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsAuthReady(true);
        }
      }
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      logAuth("AUTH: Auth state changed", { event });
      
      if (event === 'SIGNED_IN' && session) {
        if (mounted) {
          setIsAuthenticated(true);
          setUser(session.user);
        }
        
        const role = await fetchUserPlatformRole(session.user.id);
        
        if (role) {
          if (mounted) {
            setPlatformRole(role);
            setIsAdmin(role === 'super_admin');
            setIsStaff(role === 'staff' || role === 'super_admin');
            setUserRole(role === 'super_admin' ? "Admin" : role === 'staff' ? "Staff" : "User");
          }
          
          logSuccess("AUTH: User signed in", {
            user: session.user.email,
            role: role,
            id: session.user.id
          });
        } else {
          // Default to regular user if no role is found
          if (mounted) {
            setPlatformRole('user');
            setUserRole("User");
          }
          
          logSuccess("AUTH: User signed in", {
            user: session.user.email,
            role: 'user',
            id: session.user.id
          });
        }
        
        if (mounted) {
          setIsAuthReady(true);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          setIsAdmin(false);
          setIsStaff(false);
          setPlatformRole(null);
          setUserRole("User");
          setIsAuthReady(true);
        }
        logAuth("AUTH: User signed out", {});
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Add new function for password reset
  const requestPasswordReset = async (email: string) => {
    try {
      logAuth("AUTH: Requesting password reset", { email });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        logError("AUTH: Password reset request failed", error);
        throw error;
      }
      
      // Send password reset email via Loop.so
      await sendPasswordResetEmail(email, { resetLink: `${window.location.origin}/reset-password` });
      
      logSuccess("AUTH: Password reset email sent", { email });
    } catch (error) {
      logError("AUTH: Password reset request error", error);
      throw error;
    }
  };

  // Update the login function
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
      
      const role = await fetchUserPlatformRole(data.user.id);
      
      if (role) {
        setPlatformRole(role);
        setIsAdmin(role === 'super_admin');
        setIsStaff(role === 'staff' || role === 'super_admin');
        setUserRole(role === 'super_admin' ? "Admin" : role === 'staff' ? "Staff" : "User");
        
        logSuccess("AUTH: Login successful", {
          user: data.user?.email,
          role: role,
          id: data.user?.id
        });
      } else {
        // Default to regular user if no role is found
        setPlatformRole('user');
        setUserRole("User");
        
        logSuccess("AUTH: Login successful", {
          user: data.user?.email,
          role: 'user',
          id: data.user?.id
        });
      }
    } catch (error) {
      logError("AUTH: Login error", error);
      throw error;
    }
  };

  // Update the signup function to not rely on is_admin
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
        setPlatformRole('user');
        setUserRole("User");
        
        // Send welcome email
        await sendWelcomeEmail(data.user, { fullName });
        
        logSuccess("AUTH: Signup successful", {
          user: data.user.email,
          role: "user",
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
      setIsAdmin(false);
      setIsStaff(false);
      setPlatformRole(null);
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
        isAdmin,
        isStaff,
        userRole, 
        platformRole,
        user,
        login, 
        logout,
        signup,
        logAuditEvent,
        isAuthReady,
        requestPasswordReset
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
