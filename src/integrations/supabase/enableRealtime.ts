
import { supabase, logInfo, logError } from './client';

/**
 * Enables realtime tracking for a table by executing appropriate SQL commands
 * This should be called during application initialization
 */
export const enableRealtimeTracking = async () => {
  try {
    // First check if the publication exists
    const { data: pubData, error: pubError } = await supabase
      .from('pg_publication')
      .select('pubname')
      .eq('pubname', 'supabase_realtime')
      .single();
    
    if (pubError && pubError.code !== 'PGRST116') {
      logError('REALTIME: Error checking publication', pubError);
      return;
    }
    
    // Check if profiles table is in the publication
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_publication_tables')
      .select('tablename')
      .eq('pubname', 'supabase_realtime')
      .eq('tablename', 'profiles');
    
    if (tablesError) {
      logError('REALTIME: Error checking publication tables', tablesError);
      return;
    }
    
    // If profiles table is not in the publication, we need to enable it
    // Note: This requires appropriate permissions, which may need to be granted by an admin
    if (!tablesData || tablesData.length === 0) {
      logInfo('REALTIME: Profiles table not found in publication, enabling tracking', {});
      
      // For security, we'll log this but the actual enabling needs to be done by an admin
      // in the Supabase dashboard or via a custom function with appropriate permissions
      logWarning('REALTIME: This operation requires admin privileges in Supabase', {});
      
      // Instead of trying to enable it directly, we'll provide instructions
      logInfo('REALTIME: Please go to the Supabase dashboard and enable realtime for the profiles table', {});
    } else {
      logSuccess('REALTIME: Realtime tracking already enabled for profiles table', {});
    }
  } catch (error) {
    logError('REALTIME: Unexpected error configuring realtime tracking', error);
  }
};

// Add missing logWarning and logSuccess functions if they don't exist
const logWarning = (title: string, data: any) => {
  console.warn(`%c ⚠️ ${title}`, 'font-weight: bold; font-size: 14px; color: #f59e0b;', data);
};

const logSuccess = (title: string, data: any) => {
  console.log(`%c ✅ ${title}`, 'font-weight: bold; font-size: 14px; color: #22c55e;', data);
};
