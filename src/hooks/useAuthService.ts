
import { logAuth, logError, logSuccess, supabase } from "../integrations/supabase/client";
import { useEmailService } from "./useEmailService";
import { usePlatformRole } from "./usePlatformRole";

/**
 * Hook for authentication-related functionality
 */
export const useAuthService = () => {
  const { sendUserWelcomeEmail, sendUserPasswordResetEmail } = useEmailService();
  const { fetchUserPlatformRole } = usePlatformRole();
  
  /**
   * Logs in a user with email and password
   */
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

      const role = await fetchUserPlatformRole(data.user.id);
      
      logSuccess("AUTH: Login successful", {
        user: data.user?.email,
        role: role,
        id: data.user?.id
      });
      
      return {
        user: data.user,
        role
      };
    } catch (error) {
      logError("AUTH: Login error", error);
      throw error;
    }
  };

  /**
   * Signs up a new user with email and password
   */
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
        await sendUserWelcomeEmail(data.user, { fullName });
        
        logSuccess("AUTH: Signup successful", {
          user: data.user.email,
          role: "user",
          id: data.user.id
        });
        
        return {
          user: data.user,
          role: 'user' as 'super_admin' | 'staff' | 'user'
        };
      }
      
      throw new Error("Failed to create user");
    } catch (error) {
      logError("AUTH: Signup error", error);
      throw error;
    }
  };

  /**
   * Logs out the current user
   */
  const logout = async () => {
    try {
      logAuth("AUTH: Attempting logout", {});
      await supabase.auth.signOut();
      logSuccess("AUTH: Logout successful", {});
    } catch (error) {
      logError("AUTH: Logout error", error);
      throw error;
    }
  };
  
  /**
   * Requests a password reset for a user
   */
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
      
      await sendUserPasswordResetEmail(email, { resetLink: `${window.location.origin}/reset-password` });
      
      logSuccess("AUTH: Password reset email sent", { email });
    } catch (error) {
      logError("AUTH: Password reset request error", error);
      throw error;
    }
  };
  
  return {
    login,
    signup,
    logout,
    requestPasswordReset
  };
};
