
/**
 * Utility function to log audit events (now a no-op)
 */
export const logAuditEvent = async (
  userId: string | undefined,
  action: string, 
  entityType: string, 
  entityId: string, 
  details?: any
) => {
  // No-op function - no longer auditing events
  console.log("Audit disabled:", { action, entityType, entityId, details });
  return;
};
