
import { supabase, logInfo, logError } from './client';

/**
 * Enables realtime tracking for a table by executing appropriate SQL commands
 * This should be called during application initialization
 */
export const enableRealtimeTracking = async () => {
  try {
    // First check if the table is already in the publication
    const { data: pubTables, error: checkError } = await supabase.rpc(
      'get_publication_tables',
      { publication_name: 'supabase_realtime' }
    );
    
    if (checkError) {
      logError('REALTIME: Error checking publication tables', checkError);
      return;
    }
    
    // If profiles table is not already in the publication, add it
    if (!pubTables || !pubTables.includes('profiles')) {
      const { error: trackingError } = await supabase.rpc(
        'supabase_realtime.enable_publication_for_table',
        { table_name: 'profiles' }
      );
      
      if (trackingError) {
        logError('REALTIME: Error enabling publication for profiles table', trackingError);
        return;
      }
      
      logInfo('REALTIME: Successfully enabled realtime tracking for profiles table', {});
    } else {
      logInfo('REALTIME: Realtime tracking already enabled for profiles table', {});
    }
    
    // Set replica identity to full to ensure complete row data in change events
    const { error: replicaError } = await supabase.rpc(
      'set_table_replica_identity_full',
      { table_name: 'profiles' }
    );
    
    if (replicaError) {
      logError('REALTIME: Error setting replica identity for profiles table', replicaError);
      return;
    }
    
    logInfo('REALTIME: Successfully configured replica identity for profiles table', {});
  } catch (error) {
    logError('REALTIME: Unexpected error configuring realtime tracking', error);
  }
};
