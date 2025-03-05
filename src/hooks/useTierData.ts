
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/App';

interface Tier {
  id: string;
  name: string;
  min_points: number;
  max_points: number | null;
}

interface Milestone {
  id: string;
  tier_id: string;
  name: string;
  description: string;
  points_required: number;
  max_value: number;
}

interface RedeemedPerk {
  id: string;
  milestone_id: string;
  redeemed_at: string;
  status: string;
}

// Define the profile type to ensure type safety
interface Profile {
  total_points: number;
  [key: string]: any;
}

export const useTierData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [redeemedPerks, setRedeemedPerks] = useState<RedeemedPerk[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track mounted state to avoid setting state after unmount
  const isMounted = useRef(true);
  
  // Use a ref to avoid dependency cycle with totalPoints
  const pointsRef = useRef(totalPoints);
  
  // Update the ref whenever totalPoints changes
  useEffect(() => {
    pointsRef.current = totalPoints;
  }, [totalPoints]);

  // Main data fetching function
  const fetchAllTierData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Fetching all tier data for user:", user.id);
      setLoading(true);

      // Fetch user's total points from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        if (isMounted.current) setTotalPoints(0);
      } else {
        // Handle the case where profileData might be null or undefined
        const userPoints = profileData && 'total_points' in profileData 
          ? (profileData as Profile).total_points 
          : 0;
          
        if (isMounted.current) setTotalPoints(userPoints);
        pointsRef.current = userPoints;
      }

      // Fetch all tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from('tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (tiersError) {
        console.error('❌ Error fetching tiers:', tiersError);
        if (isMounted.current) setError(tiersError.message);
        return;
      }

      if (tiersData && tiersData.length > 0 && isMounted.current) {
        // Determine current tier based on points
        const userPoints = pointsRef.current;
        const userTier = tiersData.reduce((prev, current) => {
          if (userPoints >= current.min_points) {
            return current;
          }
          return prev;
        }, tiersData[0]);

        setCurrentTier(userTier);
      }

      // Fetch all milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .order('points_required', { ascending: true });

      if (milestonesError) {
        console.error('❌ Error fetching milestones:', milestonesError);
        if (isMounted.current) setError(milestonesError.message);
        return;
      }
      
      if (isMounted.current) {
        setMilestones(milestonesData || []);

        // Determine next milestone based on current points
        const userPoints = pointsRef.current;
        const nextAvailableMilestone = milestonesData
          ? milestonesData
              .filter(milestone => milestone.points_required > userPoints)
              .sort((a, b) => a.points_required - b.points_required)[0] || null
          : null;

        setNextMilestone(nextAvailableMilestone);
      }

      // Fetch redeemed perks for the user
      const { data: perksData, error: perksError } = await supabase
        .from('redeemed_perks')
        .select('*')
        .eq('user_id', user.id);

      if (perksError) {
        console.error('❌ Error fetching redeemed perks:', perksError);
        if (isMounted.current) setError(perksError.message);
        return;
      }
      
      if (isMounted.current) {
        setRedeemedPerks(perksData || []);
        setError(null);
      }

    } catch (err: any) {
      console.error('❌ Unexpected error in fetchAllTierData:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Initial data fetch
  useEffect(() => {
    console.log("🔄 Initial useTierData setup for user:", user?.id);
    isMounted.current = true;
    
    fetchAllTierData();
    
    // Set up realtime subscription for profile updates
    const profileSubscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Profile update received:', payload);
          if (payload.new && 'total_points' in payload.new && isMounted.current) {
            const newPoints = payload.new.total_points || 0;
            setTotalPoints(newPoints);
            
            // No need to trigger a full refresh here
            // The useEffect below will handle updating the relevant data
          }
        }
      )
      .subscribe();

    // Set up realtime subscription for redeemed perks
    const perksSubscription = supabase
      .channel('perks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'redeemed_perks',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Perks update received:', payload);
          // Only refresh redeemed perks when changes occur
          if (isMounted.current) {
            supabase
              .from('redeemed_perks')
              .select('*')
              .eq('user_id', user?.id)
              .then(({ data, error }) => {
                if (error) {
                  console.error('❌ Error refreshing perks:', error);
                } else if (data && isMounted.current) {
                  setRedeemedPerks(data);
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🧹 Cleaning up useTierData subscriptions");
      isMounted.current = false;
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(perksSubscription);
    };
  }, [user]);

  // Update tier and next milestone when total points change
  // We specifically handle this separately to avoid a full data refresh
  useEffect(() => {
    if (!user || !milestones.length) return;
    
    console.log("🔄 Updating tier data after points change:", totalPoints);
    
    // Update current tier
    supabase
      .from('tiers')
      .select('*')
      .order('min_points', { ascending: true })
      .then(({ data: tiersData, error }) => {
        if (error) {
          console.error('❌ Error updating tier after points change:', error);
          return;
        }
        
        if (tiersData && tiersData.length > 0 && isMounted.current) {
          const userTier = tiersData.reduce((prev, current) => {
            if (totalPoints >= current.min_points) {
              return current;
            }
            return prev;
          }, tiersData[0]);
          
          setCurrentTier(userTier);
        }
      });
    
    // Update next milestone
    const nextAvailableMilestone = milestones
      .filter(milestone => milestone.points_required > totalPoints)
      .sort((a, b) => a.points_required - b.points_required)[0] || null;
    
    if (isMounted.current) {
      setNextMilestone(nextAvailableMilestone);
    }
  }, [totalPoints, milestones, user]);

  const redeemPerk = async (milestoneId: string) => {
    if (!user) {
      throw new Error('You must be logged in to redeem perks');
    }

    const { error } = await supabase
      .from('redeemed_perks')
      .insert({
        user_id: user.id,
        milestone_id: milestoneId,
      });

    if (error) {
      throw error;
    }

    // We don't need to refresh redeemed perks here because the
    // realtime subscription will handle it
  };

  return {
    loading,
    error,
    totalPoints,
    currentTier,
    milestones,
    nextMilestone,
    redeemedPerks,
    redeemPerk
  };
};
