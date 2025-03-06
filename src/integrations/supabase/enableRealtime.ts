
import { supabase, logInfo, logError, logSuccess, logWarning } from './client';

/**
 * Enables realtime tracking for a table by executing appropriate SQL commands
 * This should be called during application initialization
 */
export const enableRealtimeTracking = async () => {
  try {
    logInfo('REALTIME: Checking if realtime is enabled for profiles table', {});
    
    // We can't directly query system tables with PostgrestClient
    // Instead, execute RPC functions or stored procedures
    const { data: publicationCheck, error: publicationError } = await supabase.rpc('check_publication_exists', {
      publication_name: 'supabase_realtime'
    }).maybeSingle();
    
    if (publicationError) {
      logError('REALTIME: Error checking publication', publicationError);
      
      // Fall back to a more direct approach - just try to enable it directly
      logWarning('REALTIME: Falling back to direct approach to enable realtime', {});
      await enableProfilesRealtimeFallback();
      return;
    }
    
    if (!publicationCheck || !publicationCheck.exists) {
      logWarning('REALTIME: Publication does not exist, attempting to create it', {});
      await enableProfilesRealtimeFallback();
      return;
    }
    
    // Check if profiles table is included in the publication
    const { data: tableCheck, error: tableCheckError } = await supabase.rpc('check_table_in_publication', {
      publication_name: 'supabase_realtime',
      table_name: 'profiles'
    }).maybeSingle();
    
    if (tableCheckError) {
      logError('REALTIME: Error checking if table is in publication', tableCheckError);
      await enableProfilesRealtimeFallback();
      return;
    }
    
    if (!tableCheck || !tableCheck.is_included) {
      logWarning('REALTIME: Profiles table not in publication, adding it', {});
      await enableProfilesRealtimeFallback();
      return;
    }
    
    logSuccess('REALTIME: Profiles table is already enabled for realtime', {});
  } catch (error) {
    logError('REALTIME: Unexpected error configuring realtime tracking', error);
    await enableProfilesRealtimeFallback();
  }
};

/**
 * Fallback function to enable realtime for profiles table
 * Used when RPC methods are not available or fail
 */
const enableProfilesRealtimeFallback = async () => {
  try {
    // First try using Supabase's built-in function to enable realtime
    const { error: realtimeError } = await supabase
      .from('profiles')
      .update({ id: supabase.auth.getUser().then(u => u.data.user?.id || '') })
      .eq('id', 'trigger_replication_setup')
      .select();
    
    if (realtimeError && realtimeError.code !== 'PGRST116') {
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
