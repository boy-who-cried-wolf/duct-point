
import { useState } from "react";
import { logAuth, logError, logInfo, logSuccess, logWarning, supabase } from "../integrations/supabase/client";

/**
 * Hook to fetch the user's platform role
 */
export const usePlatformRole = () => {
  const [loading, setLoading] = useState(false);
  
  /**
   * Fetches the user's platform role from the database
   */
  const fetchUserPlatformRole = async (userId: string) => {
    if (!userId) {
      logError("AUTH: Cannot fetch platform role without userId", {});
      return 'user' as 'super_admin' | 'staff' | 'user';
    }
    
    setLoading(true);
    try {
      logAuth("AUTH: Fetching user platform role", { userId });
      
      const { data, error } = await supabase
        .from('user_platform_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        if (error.code === '42P17') {
          logError("AUTH: Recursion detected in role fetch, using fallback", error);
          
          // Use direct query instead of RPC to avoid type issues
          const { data: directData, error: directError } = await supabase
            .from('user_platform_roles')
            .select('role')
            .eq('user_id', userId)
            .single();
            
          if (directError) {
            logError("AUTH: Error in fallback role fetch", directError);
            return 'user';
          }
          
          if (directData) {
            logSuccess("AUTH: User platform role fetched via fallback", { role: directData.role });
            
            if (directData.role === 'super_admin' || directData.role === 'staff' || directData.role === 'user') {
              return directData.role as 'super_admin' | 'staff' | 'user';
            }
          }
          
          return 'user';
        } else {
          logError("AUTH: Error fetching platform role", error);
          return 'user';
        }
      }
      
      if (data && data.role) {
        logSuccess("AUTH: User platform role fetched", { role: data.role });
        return data.role as 'super_admin' | 'staff' | 'user';
      }
      
      logInfo("AUTH: No specific role found, defaulting to 'user'", {});
      return 'user' as 'super_admin' | 'staff' | 'user';
    } catch (error) {
      logError("AUTH: Error in fetchUserPlatformRole", error);
      return 'user';
    } finally {
      setLoading(false);
    }
  };
  
  return {
    fetchUserPlatformRole,
    loading
  };
};
