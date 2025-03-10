
import { useState } from "react";

/**
 * Hook to fetch the user's platform role
 */
export const usePlatformRole = () => {
  const [loading, setLoading] = useState(false);
  
  /**
   * Always returns 'super_admin' to bypass role checks
   */
  const fetchUserPlatformRole = async (userId: string) => {
    // Simply return 'super_admin' without any database checks
    return 'super_admin' as 'super_admin' | 'staff' | 'user';
  };
  
  return {
    fetchUserPlatformRole,
    loading
  };
};
