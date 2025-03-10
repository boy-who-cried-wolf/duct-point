
import { logError, logInfo, supabase } from "../integrations/supabase/client";

/**
 * Utility function to log audit events to the database
 */
export const logAuditEvent = async (
  userId: string | undefined,
  action: string, 
  entityType: string, 
  entityId: string, 
  details?: any
) => {
  try {
    if (!userId) {
      logError("AUDIT: Cannot log audit event when userId is not provided", {});
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
