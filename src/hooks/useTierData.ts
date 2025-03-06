
import { useState, useEffect, useCallback } from 'react';
import { supabase, logInfo, logError, logSuccess, logWarning } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface Profile {
  total_points: number;
  [key: string]: any;
}

interface UserState {
  totalPoints: number;
  currentTier: Tier | null;
}

export const useTierData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userState, setUserState] = useState<UserState>({
    totalPoints: 0,
    currentTier: null
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [redeemedPerks, setRedeemedPerks] = useState<RedeemedPerk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tiersData, setTiersData] = useState<Tier[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Extract totalPoints and currentTier from userState for better readability
  const { totalPoints, currentTier } = userState;

  // Determine the user's tier based on points and available tiers
  const determineUserTier = useCallback((points: number, tiers: Tier[]): Tier | null => {
    if (!tiers || tiers.length === 0) {
      logWarning('TIERS: No tiers available to determine user tier', { points });
      return null;
    }
    
    logInfo('TIERS: Determining tier with points:', { points, tiersCount: tiers.length });
    
    // Sort tiers by min_points in case they're not already sorted
    const sortedTiers = [...tiers].sort((a, b) => a.min_points - b.min_points);
    
    // Find the highest tier where user's points meet or exceed the minimum
    return sortedTiers.reduce((highest, current) => {
      if (points >= current.min_points) {
        return current;
      }
      return highest;
    }, sortedTiers[0]);
  }, []);

  // Update both points and tier atomically
  const updateUserState = useCallback((points: number) => {
    logInfo('TIERS: Updating user state with points:', { points, tiersCount: tiersData.length });
    
    if (isNaN(points)) {
      logError('TIERS: Invalid points value', { points });
      return;
    }
    
    setUserState(prevState => {
      const newTier = determineUserTier(points, tiersData);
      
      // Log the changes for debugging
      if (prevState.currentTier?.id !== newTier?.id) {
        logInfo('TIERS: Tier changing from', { 
          from: prevState.currentTier?.name, 
          to: newTier?.name,
          points: points
        });
      }
      
      return {
        totalPoints: points,
        currentTier: newTier
      };
    });
  }, [determineUserTier, tiersData]);

  // Determine next milestone based on points
  const updateNextMilestone = useCallback((points: number) => {
    if (!milestones || milestones.length === 0) {
      logWarning('TIERS: No milestones available', { points });
      return;
    }
    
    const nextAvailableMilestone = milestones
      .filter(milestone => milestone.points_required > points)
      .sort((a, b) => a.points_required - b.points_required)[0] || null;
    
    logInfo('TIERS: Setting next milestone', { 
      milestone: nextAvailableMilestone?.name,
      required: nextAvailableMilestone?.points_required,
      currentPoints: points
    });
    
    setNextMilestone(nextAvailableMilestone);
  }, [milestones]);

  // Safely handle profile update from realtime subscription
  const handleProfileUpdate = useCallback((payload: any) => {
    if (!payload || typeof payload !== 'object') {
      logError('TIERS: Invalid payload received', { payload });
      return;
    }

    logInfo('TIERS: Profile update received:', { payload });
    
    const newData = payload.new;
    if (newData && typeof newData === 'object' && 'total_points' in newData) {
      const newPoints = typeof newData.total_points === 'number' ? newData.total_points : 0;
      
      logInfo('TIERS: Updating points from realtime event', { 
        oldPoints: totalPoints, 
        newPoints: newPoints
      });
      
      // Update both points and tier atomically
      updateUserState(newPoints);
      
      // Update next milestone based on new points
      updateNextMilestone(newPoints);
    } else {
      logWarning('TIERS: Received profile update without valid points', { payload });
    }
  }, [totalPoints, updateUserState, updateNextMilestone]);

  useEffect(() => {
    const fetchTierData = async () => {
      if (!user) {
        logWarning('TIERS: No user found, skipping tier data fetch', {});
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        logInfo('TIERS: Fetching tier data', { userId: user.id });

        // Fetch user points
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logError('TIERS: Error fetching profile points', { error: profileError });
          if (profileError.code !== 'PGRST116') { // Not found error
            setError(`Failed to fetch profile: ${profileError.message}`);
          }
        } else {
          const userPoints = profileData && typeof profileData === 'object' && 'total_points' in profileData 
            ? (profileData as Profile).total_points 
            : 0;
            
          logInfo('TIERS: Initial points loaded:', { userPoints });
        }

        // Fetch tiers
        const { data: fetchedTiersData, error: tiersError } = await supabase
          .from('tiers')
          .select('*')
          .order('min_points', { ascending: true });

        if (tiersError) {
          logError('TIERS: Error fetching tiers', { error: tiersError });
          setError(`Failed to fetch tiers: ${tiersError.message}`);
          return;
        }

        logInfo('TIERS: Fetched tiers data', { count: fetchedTiersData?.length || 0 });
        setTiersData(fetchedTiersData || []);

        if (fetchedTiersData && fetchedTiersData.length > 0 && profileData && 'total_points' in profileData) {
          const points = profileData.total_points || 0;
          const userTier = determineUserTier(points, fetchedTiersData);
          
          // Update state atomically
          setUserState({
            totalPoints: points,
            currentTier: userTier
          });
          
          logSuccess('TIERS: User tier determined', { 
            tier: userTier?.name, 
            minPoints: userTier?.min_points, 
            maxPoints: userTier?.max_points 
          });
        }

        // Fetch milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('*')
          .order('points_required', { ascending: true });

        if (milestonesError) {
          logError('TIERS: Error fetching milestones', { error: milestonesError });
          setError(`Failed to fetch milestones: ${milestonesError.message}`);
          return;
        }
        
        logInfo('TIERS: Setting milestones', { count: milestonesData?.length || 0 });
        setMilestones(milestonesData || []);

        // Determine next milestone
        if (milestonesData && profileData && 'total_points' in profileData) {
          const points = profileData.total_points || 0;
          updateNextMilestone(points);
        }

        // Fetch redeemed perks
        const { data: perksData, error: perksError } = await supabase
          .from('redeemed_perks')
          .select('*')
          .eq('user_id', user.id);

        if (perksError) {
          logError('TIERS: Error fetching redeemed perks', { error: perksError });
          setError(`Failed to fetch redeemed perks: ${perksError.message}`);
          return;
        }
        
        logInfo('TIERS: Setting redeemed perks', { count: perksData?.length || 0 });
        setRedeemedPerks(perksData || []);
        
        setInitialized(true);
      } catch (err: any) {
        logError('TIERS: Error fetching tier data', { error: err });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    logInfo('TIERS: useEffect triggered, initiating data fetch', {});
    fetchTierData();

    // Set up realtime subscriptions
    let profileSubscription: any = null;
    let perksSubscription: any = null;

    if (user) {
      profileSubscription = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user?.id}`
          },
          handleProfileUpdate
        )
        .subscribe((status) => {
          logInfo('TIERS: Profile subscription status', { status });
        });

      perksSubscription = supabase
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
            logInfo('TIERS: Perks update received:', { payload });
            if (user) {
              supabase
                .from('redeemed_perks')
                .select('*')
                .eq('user_id', user.id)
                .then(({ data, error }) => {
                  if (error) {
                    logError('TIERS: Error fetching updated perks', error);
                    return;
                  }
                  if (data) {
                    logInfo('TIERS: Updated redeemed perks', { count: data.length });
                    setRedeemedPerks(data);
                  }
                });
            }
          }
        )
        .subscribe((status) => {
          logInfo('TIERS: Perks subscription status', { status });
        });
    }

    return () => {
      logInfo('TIERS: Cleaning up subscriptions', {});
      if (profileSubscription) supabase.removeChannel(profileSubscription);
      if (perksSubscription) supabase.removeChannel(perksSubscription);
    };
  }, [user, determineUserTier, updateNextMilestone, handleProfileUpdate]);

  const redeemPerk = async (milestoneId: string) => {
    if (!user) {
      throw new Error('You must be logged in to redeem perks');
    }

    try {
      const { error } = await supabase
        .from('redeemed_perks')
        .insert({
          user_id: user.id,
          milestone_id: milestoneId,
        });

      if (error) {
        logError('TIERS: Error redeeming perk', error);
        throw error;
      }

      const { data, error: fetchError } = await supabase
        .from('redeemed_perks')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        logError('TIERS: Error fetching redeemed perks after redemption', fetchError);
        return;
      }

      if (data) {
        logSuccess('TIERS: Successfully redeemed perk and updated list', { count: data.length });
        setRedeemedPerks(data);
      }
    } catch (err) {
      logError('TIERS: Unexpected error in redeemPerk', { error: err });
      throw err;
    }
  };

  return {
    loading,
    error,
    initialized,
    totalPoints,
    currentTier,
    milestones,
    nextMilestone,
    redeemedPerks,
    redeemPerk
  };
};
