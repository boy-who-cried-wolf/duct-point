import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, logAuth, logError, logSuccess, logWarning, logInfo } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  platformRole: 'super_admin' | 'staff' | 'user' | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  logAuditEvent: (action: string, entityType: string, entityId: string, details?: any) => Promise<void>;
  isAuthReady: boolean;
  requestPasswordReset: (email: string) => Promise<void>;
  authError: string | null;
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
  // Disable all bypass options to use real authentication
  const BYPASS_AUTH_FOR_DEV = false;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [platformRole, setPlatformRole] = useState<'super_admin' | 'staff' | 'user' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle authentication state changes
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let mounted = true;

    // Set up auth change listener
    const setupAuthListener = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            logAuth("Auth state change", { event, userId: session?.user?.id });
            
            if (!mounted) return;
            
            if (session && session.user) {
              setUser(session.user);
              setIsAuthenticated(true);
              
              try {
                await fetchUserRole(session.user);
                await ensureProfileExists(session.user);
              } catch (roleError) {
                logError("Failed to fetch user role or create profile", roleError);
                // Continue even if these fail - better to have basic auth than nothing
              }
            } else {
              setUser(null);
              setIsAuthenticated(false);
              setPlatformRole(null);
            }
            
            // Always mark auth as ready once we've handled the session
            setIsAuthReady(true);
            setAuthError(null);
          }
        );
        
        if (mounted) {
          subscription = data.subscription;
        }
      } catch (error) {
        logError("Failed to set up auth listener", error);
        if (mounted) {
          setAuthError("Failed to set up authentication listener");
          setIsAuthReady(true); // Still mark as ready so we don't get stuck
        }
      }
    };

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        const session = data.session;
        
        if (!mounted) return;
        
        if (session && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          
          try {
            await fetchUserRole(session.user);
            await ensureProfileExists(session.user);
          } catch (roleError) {
            logError("Failed to fetch user role or create profile", roleError);
            // Continue even if these fail
          }
        } else {
          // No session found
          setUser(null);
          setIsAuthenticated(false);
          setPlatformRole(null);
        }
      } catch (error: any) {
        logError("Failed to initialize auth", error);
        if (mounted) {
          setAuthError(error.message || "Failed to initialize authentication");
        }
      } finally {
        if (mounted) {
          // Always set isAuthReady to true to exit the loading state
          setIsAuthReady(true);
          
          // Set up the auth state change listener after initial check
          setupAuthListener();
        }
      }
    };

    // Start the auth initialization
    initializeAuth();

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch user's platform role
  const fetchUserRole = async (user: User) => {
    try {
      logInfo("Fetching user role", { userId: user.id });
      
      // First, check if user has a role in the platform_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('platform_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        // Error other than "not found"
        throw roleError;
      }

      if (roleData && 'role' in roleData) {
        // User has a role defined in platform_roles table
        const role = roleData.role as 'super_admin' | 'staff' | 'user';
        setPlatformRole(role);
        logInfo("User role found in platform_roles table", { role });
        
        // Log the role assignment as an audit event
        await logAuditEvent('role_assignment_checked', 'user', user.id, { 
          role, 
          source: 'platform_roles' 
        });
        
        return;
      }

      // TEMPORARY FOR DEBUGGING: Set as admin to test functionality
      setPlatformRole('super_admin');
      logInfo("User temporarily assigned super_admin role for testing", {});
      
      // Create the platform role record
      const { error: createError } = await supabase
        .from('platform_roles')
        .insert({ user_id: user.id, role: 'super_admin' });
        
      if (createError) {
        logError("Failed to create platform role record", { error: createError });
      }
      
      await logAuditEvent('role_assignment', 'user', user.id, { 
        role: 'super_admin', 
        source: 'temporary_assignment' 
      });
      
      return;

      // If no explicit role in platform_roles, check email domain for staff
      /*
      if (user.email && user.email.endsWith('@ductpoints.com')) {
        setPlatformRole('super_admin');
        logInfo("User assigned super_admin role based on email domain", {});
        
        // Create the platform role record
        const { error: createError } = await supabase
          .from('platform_roles')
          .insert({ user_id: user.id, role: 'super_admin' });
          
        if (createError) {
          logError("Failed to create platform role record", { error: createError });
        }
        
        await logAuditEvent('role_assignment', 'user', user.id, { 
          role: 'super_admin', 
          source: 'email_domain' 
        });
        
        return;
      }

      // Default role is 'user'
      setPlatformRole('user');
      logInfo("User assigned default user role", {});
      
      // Create the platform role record
      const { error: createError } = await supabase
        .from('platform_roles')
        .insert({ user_id: user.id, role: 'user' });
        
      if (createError) {
        logError("Failed to create platform role record", { error: createError });
      }
      
      await logAuditEvent('role_assignment', 'user', user.id, { 
        role: 'user', 
        source: 'default' 
      });
      */
    } catch (error) {
      logError("Error fetching user role", { error });
      // If there's an error, set super_admin for testing
      setPlatformRole('super_admin');
    }
  };

  // Create profile for new users if it doesn't exist
  const ensureProfileExists = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!existingProfile) {
        logAuth("Creating new profile for user", { userId: user.id });
        
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata.full_name || '',
            email: user.email,
            avatar_url: user.user_metadata.avatar_url || null,
            total_points: 0,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }

        logSuccess("Created new user profile", { userId: user.id });
        
        // Log audit event for profile creation
        await logAuditEvent(
          'profile_created',
          'profile',
          user.id,
          { method: 'automatic' }
        );
      }
    } catch (error) {
      logError("Failed to ensure profile exists", error);
    }
  };

  // Implement authentication functions
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        throw error;
      }

      logSuccess("User logged in successfully", { email });
      toast.success("Logged in successfully");
      
      // Log audit event
      await logAuditEvent(
        'user_login',
        'auth',
        data.user?.id || 'unknown',
        { method: 'password' }
      );
    } catch (error: any) {
      logError("Login failed", error);
      toast.error(error.message || "Failed to log in");
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
            full_name: fullName
          }
        }
      });

      if (error) {
        throw error;
      }

      logSuccess("User signed up successfully", { email });
      toast.success("Account created successfully");
      
      // Profile will be created automatically via auth state change handler
    } catch (error: any) {
      logError("Signup failed", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Audit log before logout while we still have the user ID
      if (user) {
        await logAuditEvent(
          'user_logout',
          'auth',
          user.id,
          {}
        );
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      logSuccess("User logged out successfully", {});
      toast.success("Logged out successfully");
    } catch (error: any) {
      logError("Logout failed", error);
      toast.error(error.message || "Failed to log out");
    }
  };

  const logAuditEvent = async (action: string, entityType: string, entityId: string, details: any = {}) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id || null,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details
        });

      if (error) {
        logError("Failed to log audit event", { error, action });
      }
    } catch (error) {
      logError("Exception logging audit event", error);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      logSuccess("Password reset email sent", { email });
      toast.success("Password reset instructions sent to your email");
      
      // Log audit event
      await logAuditEvent(
        'password_reset_requested',
        'auth',
        email,
        {}
      );
    } catch (error: any) {
      logError("Password reset request failed", error);
      // Don't expose if email exists or not for security
      toast.success("If your email is registered, you will receive reset instructions");
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
        requestPasswordReset,
        authError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
