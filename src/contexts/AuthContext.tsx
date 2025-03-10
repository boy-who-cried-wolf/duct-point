
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase, logAuth, logError, logSuccess, logInfo } from "../integrations/supabase/client";
import { useAuthService } from "../hooks/useAuthService";
import { usePlatformRole } from "../hooks/usePlatformRole";
import { logAuditEvent } from "../hooks/useAuditEvents";

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
  
  const { fetchUserPlatformRole } = usePlatformRole();
  const { login: authLogin, signup: authSignup, logout: authLogout, requestPasswordReset: authRequestPasswordReset } = useAuthService();

  // Helper function to log audit events
  const handleAuditEvent = async (action: string, entityType: string, entityId: string, details?: any) => {
    await logAuditEvent(user?.id, action, entityType, entityId, details);
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
                logInfo("AUTH: Retrying role fetch", { attempt: roleCheckRetries, max: MAX_RETRIES });
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
              logInfo("AUTH: Retrying role fetch", { attempt: roleCheckRetries, max: MAX_RETRIES });
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
  }, [fetchUserPlatformRole]);

  // Wrapper functions to update state after auth actions
  const login = async (email: string, password: string) => {
    const { user, role } = await authLogin(email, password);
    setIsAuthenticated(true);
    setUser(user);
    setPlatformRole(role);
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const { user, role } = await authSignup(email, password, fullName);
    setIsAuthenticated(true);
    setUser(user);
    setPlatformRole(role);
  };

  const logout = async () => {
    await authLogout();
    setIsAuthenticated(false);
    setUser(null);
    setPlatformRole(null);
  };

  const requestPasswordReset = async (email: string) => {
    await authRequestPasswordReset(email);
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
        logAuditEvent: handleAuditEvent,
        isAuthReady,
        requestPasswordReset
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
