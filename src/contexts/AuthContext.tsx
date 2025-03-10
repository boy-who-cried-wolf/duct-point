
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, logAuth, logError, logSuccess, logInfo, logWarning } from "../integrations/supabase/client";
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordConfirmationEmail } from "../integrations/email-service";

interface AuthContextType {
  isAuthenticated: boolean;
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
  const [platformRole, setPlatformRole] = useState<'super_admin' | 'staff' | 'user' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const fetchUserPlatformRole = async (userId: string) => {
    try {
      logAuth("AUTH: Fetching user platform role", { userId });
      
      const { data, error } = await supabase
        .from('user_platform_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        if (error.code === '42P17') {
          logError("AUTH: Recursion detected in role fetch, using fallback", error);
          
          // Use direct query instead of RPC to avoid type issues
          const { data: directData, error: directError } = await supabase
            .from('user_platform_roles')
            .select('role')
            .eq('user_id', userId)
            .single();
            
          if (directError) {
            logError("AUTH: Error in fallback role fetch", directError);
            return 'user';
          }
          
          if (directData) {
            logSuccess("AUTH: User platform role fetched via fallback", { role: directData.role });
            
            if (directData.role === 'super_admin' || directData.role === 'staff' || directData.role === 'user') {
              return directData.role as 'super_admin' | 'staff' | 'user';
            }
          }
          
          return 'user';
        } else {
          logError("AUTH: Error fetching platform role", error);
          return 'user';
        }
      }
      
      if (data && data.role) {
        logSuccess("AUTH: User platform role fetched", { role: data.role });
        return data.role as 'super_admin' | 'staff' | 'user';
      }
      
      logInfo("AUTH: No specific role found, defaulting to 'user'", {});
      return 'user' as 'super_admin' | 'staff' | 'user';
    } catch (error) {
      logError("AUTH: Error in fetchUserPlatformRole", error);
      return 'user';
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
    let roleCheckRetries = 0;
    const MAX_RETRIES = 3;
    
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
          
          const fetchRoleWithRetry = async () => {
            try {
              const role = await fetchUserPlatformRole(data.session.user.id);
              
              if (role && mounted) {
                setPlatformRole(role);
                
                logSuccess("AUTH: User authenticated", {
                  user: data.session.user.email,
                  role: role,
                  id: data.session.user.id
                });
              }
            } catch (error) {
              roleCheckRetries++;
              
              if (roleCheckRetries < MAX_RETRIES) {
                logWarning("AUTH: Retrying role fetch", { attempt: roleCheckRetries, max: MAX_RETRIES });
                await new Promise(resolve => setTimeout(resolve, 500 * roleCheckRetries));
                await fetchRoleWithRetry();
              } else {
                logError("AUTH: Maximum role fetch retries reached", { error });
                if (mounted) {
                  setPlatformRole('user');
                }
              }
            }
          };
          
          await fetchRoleWithRetry();
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
        
        roleCheckRetries = 0;
        
        const fetchRoleWithRetry = async () => {
          try {
            const role = await fetchUserPlatformRole(session.user.id);
            
            if (role && mounted) {
              setPlatformRole(role);
              
              logSuccess("AUTH: User signed in", {
                user: session.user.email,
                role: role,
                id: session.user.id
              });
            }
          } catch (error) {
            roleCheckRetries++;
            
            if (roleCheckRetries < MAX_RETRIES) {
              logWarning("AUTH: Retrying role fetch", { attempt: roleCheckRetries, max: MAX_RETRIES });
              await new Promise(resolve => setTimeout(resolve, 500 * roleCheckRetries));
              await fetchRoleWithRetry();
            } else {
              logError("AUTH: Maximum role fetch retries reached", { error });
              if (mounted) {
                setPlatformRole('user');
              }
            }
          }
        };
        
        await fetchRoleWithRetry();
        
        if (mounted) {
          setIsAuthReady(true);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
          setPlatformRole(null);
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
      
      await sendPasswordResetEmail(email, { resetLink: `${window.location.origin}/reset-password` });
      
      logSuccess("AUTH: Password reset email sent", { email });
    } catch (error) {
      logError("AUTH: Password reset request error", error);
      throw error;
    }
  };

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
        
        logSuccess("AUTH: Login successful", {
          user: data.user?.email,
          role: role,
          id: data.user?.id
        });
      }
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
        setPlatformRole('user');
        
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
      setPlatformRole(null);
      logSuccess("AUTH: Logout successful", {});
    } catch (error) {
      logError("AUTH: Logout error", error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated,
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
