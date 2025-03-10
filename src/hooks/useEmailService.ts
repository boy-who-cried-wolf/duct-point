
import { User } from "@supabase/supabase-js";

/**
 * Hook for email-related functionality (now mocked)
 */
export const useEmailService = () => {
  /**
   * Mock function for welcome email
   */
  const sendUserWelcomeEmail = async (user: User, { fullName }: { fullName: string }) => {
    console.log("Welcome email service disabled", { user, fullName });
    return { success: true };
  };
  
  /**
   * Mock function for password reset email
   */
  const sendUserPasswordResetEmail = async (email: string, { resetLink }: { resetLink: string }) => {
    console.log("Password reset email service disabled", { email, resetLink });
    return { success: true };
  };
  
  /**
   * Mock function for password confirmation email
   */
  const sendUserPasswordConfirmationEmail = async (user: User) => {
    console.log("Password confirmation email service disabled", { user });
    return { success: true };
  };
  
  return {
    sendUserWelcomeEmail,
    sendUserPasswordResetEmail,
    sendUserPasswordConfirmationEmail
  };
};
