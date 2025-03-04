
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/tierTypes';

export const useUserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        
        if (user?.id) {
          setUserId(user.id);
          
          // Fetch user profile data (includes points)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile data:', profileError);
          } else {
            // Cast to Profile type to satisfy TypeScript
            const profile = profileData as Profile;
            setTotalPoints(profile?.total_points || 0);
          }
        }
      } catch (error) {
        console.error('Error in user profile data fetching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return { loading, totalPoints, userId };
};
