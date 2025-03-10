
import { User } from "@supabase/supabase-js";
import { sendPasswordConfirmationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../integrations/email-service";

/**
 * Hook for email-related functionality
 */
export const useEmailService = () => {
  /**
   * Sends a welcome email to a newly registered user
   */
  const sendUserWelcomeEmail = async (user: User, { fullName }: { fullName: string }) => {
    return sendWelcomeEmail(user, { fullName });
  };
  
  /**
   * Sends a password reset email to a user
   */
  const sendUserPasswordResetEmail = async (email: string, { resetLink }: { resetLink: string }) => {
    return sendPasswordResetEmail(email, { resetLink });
  };
  
  /**
   * Sends a password confirmation email to a user
   */
  const sendUserPasswordConfirmationEmail = async (user: User) => {
    return sendPasswordConfirmationEmail(user);
  };
  
  return {
    sendUserWelcomeEmail,
    sendUserPasswordResetEmail,
    sendUserPasswordConfirmationEmail
  };
};
