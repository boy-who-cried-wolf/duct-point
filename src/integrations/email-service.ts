
import { supabase, logInfo, logError } from "./supabase/client";
import { User } from "@supabase/supabase-js";

// Type definition for email templates
export type EmailTemplateType = 
  | 'welcome'
  | 'account_approved'
  | 'password_reset'
  | 'password_confirmation'
  | 'email_update'
  | 'course_registration'
  | 'milestone_reached'
  | 'reward_approved';

// Function to get template ID from the database
export const getTemplateId = async (templateType: EmailTemplateType): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('template_id')
      .eq('type', templateType)
      .single();

    if (error) {
      logError(`EMAIL: Failed to get template for ${templateType}`, error);
      return null;
    }

    return data.template_id;
  } catch (err) {
    logError(`EMAIL: Exception getting template for ${templateType}`, err);
    return null;
  }
};

// Main function to send an email
export const sendEmail = async (
  user: User | null,
  email: string,
  templateType: EmailTemplateType,
  data: Record<string, any> = {}
): Promise<boolean> => {
  try {
    if (!user && !email) {
      logError('EMAIL: No user or email provided for sending email', { templateType });
      return false;
    }

    // Get the actual email address
    const emailAddress = email || user?.email;
    
    if (!emailAddress) {
      logError('EMAIL: Unable to determine email address', { user, templateType });
      return false;
    }

    // Get the template ID from the database
    const templateId = await getTemplateId(templateType);
    
    if (!templateId) {
      logError(`EMAIL: No template found for type ${templateType}`, {});
      return false;
    }

    logInfo(`EMAIL: Sending ${templateType} email to ${emailAddress}`, { templateId });

    // Call the edge function to send the email
    const { data: responseData, error } = await supabase.functions.invoke('send-email', {
      body: {
        templateId,
        email: emailAddress,
        userId: user?.id || null,
        data,
        templateType
      }
    });

    if (error) {
      logError(`EMAIL: Error sending ${templateType} email`, { error, emailAddress });
      return false;
    }

    logInfo(`EMAIL: Successfully sent ${templateType} email`, { 
      emailAddress, 
      templateType,
      response: responseData
    });
    
    return true;
  } catch (err) {
    logError(`EMAIL: Exception sending ${templateType} email`, err);
    return false;
  }
};

// Email sending functions for specific templates
export const sendWelcomeEmail = async (user: User, data: Record<string, any> = {}) => {
  return sendEmail(user, user.email || '', 'welcome', data);
};

export const sendPasswordResetEmail = async (email: string, data: Record<string, any> = {}) => {
  return sendEmail(null, email, 'password_reset', data);
};

export const sendPasswordConfirmationEmail = async (email: string, data: Record<string, any> = {}) => {
  return sendEmail(null, email, 'password_confirmation', data);
};

export const sendEmailUpdateConfirmation = async (user: User, newEmail: string, data: Record<string, any> = {}) => {
  return sendEmail(user, newEmail, 'email_update', data);
};

export const sendCourseRegistrationEmail = async (user: User, courseData: Record<string, any>) => {
  return sendEmail(user, user.email || '', 'course_registration', courseData);
};

export const sendMilestoneReachedEmail = async (user: User, milestoneData: Record<string, any>) => {
  return sendEmail(user, user.email || '', 'milestone_reached', milestoneData);
};

export const sendRewardApprovedEmail = async (user: User, rewardData: Record<string, any>) => {
  return sendEmail(user, user.email || '', 'reward_approved', rewardData);
};
