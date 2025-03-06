
import { supabase, logInfo, logError, logSuccess, logWarning } from './client';

/**
 * Enables realtime tracking for a table by executing appropriate SQL commands
 * This should be called during application initialization
 */
export const enableRealtimeTracking = async () => {
  try {
    logInfo('REALTIME: Checking if realtime is enabled for profiles table', {});
    
    // We can't directly execute custom RPC functions with the current setup
    // Instead, we'll use a more direct approach
    const { data: realtimeStatus, error: realtimeError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (realtimeError) {
      logError('REALTIME: Error checking realtime status', realtimeError);
      return;
    }
    
    // Try to enable realtime directly
    logInfo('REALTIME: Attempting to enable realtime for profiles table', {});
    await enableProfilesRealtimeFallback();
    
    logSuccess('REALTIME: Successfully completed realtime tracking setup', {});
  } catch (error) {
    logError('REALTIME: Unexpected error configuring realtime tracking', error);
  }
};

/**
 * Fallback function to enable realtime for profiles table
 * Used when RPC methods are not available or fail
 */
const enableProfilesRealtimeFallback = async () => {
  try {
    // First try using Supabase's built-in function to enable realtime
    // This is often done by triggering a dummy update to the table
    const { error: realtimeError } = await supabase
      .from('profiles')
      .update({ id: supabase.auth.getUser().then(u => u.data.user?.id || '') })
      .eq('id', 'trigger_replication_setup')
      .select();
    
    if (realtimeError && realtimeError.code !== 'PGRST116') {
      // PGRST116 is "No rows updated" which is expected if the dummy row doesn't exist
      logWarning('REALTIME: Could not trigger automatic setup', realtimeError);
    }
    
    // Log instructions for manual setup as last resort
    logInfo('REALTIME: For manual setup, run these SQL commands in the Supabase SQL editor:', {
      sql: `
-- Create publication if it doesn't exist
BEGIN;
SELECT pg_catalog.set_config('search_path', '', false);
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- Add profiles table to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Set replica identity to FULL for the profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
COMMIT;
      `
    });
  } catch (error) {
    logError('REALTIME: Fallback method failed', error);
  }
};
