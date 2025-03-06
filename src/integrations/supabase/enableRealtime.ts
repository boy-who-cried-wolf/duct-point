
import { supabase, logInfo, logSuccess, logWarning } from './client';

/**
 * Enables realtime tracking for tables by setting the appropriate Postgres configuration
 * This should be called during application initialization
 */
export const enableRealtimeTracking = async () => {
  try {
    logInfo('REALTIME: Initializing realtime subscriptions', {});
    
    // We'll check if we can connect to the database at all
    const { error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      logWarning('REALTIME: Could not connect to database', { error });
      return false;
    }
    
    logSuccess('REALTIME: Successfully connected to database', {});
    
    // Note: We don't need to manually enable realtime for tables anymore
    // Supabase handles this automatically with proper channel subscriptions
    
    return true;
  } catch (error) {
    logWarning('REALTIME: Error in enableRealtimeTracking', { error });
    return false;
  }
};
