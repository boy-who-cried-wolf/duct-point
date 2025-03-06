
import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  const tiersDataRef = useRef<Tier[]>([]);
  const milestonesRef = useRef<Milestone[]>([]);
  const totalPointsRef = useRef<number>(0);
  
  useEffect(() => {
    tiersDataRef.current = tiersData;
    milestonesRef.current = milestones;
    totalPointsRef.current = userState.totalPoints;
  }, [tiersData, milestones, userState.totalPoints]);

  const { totalPoints, currentTier } = userState;

  const determineUserTier = useCallback((points: number, tiers: Tier[]): Tier | null => {
    if (!tiers || tiers.length === 0) {
      logWarning('TIERS: No tiers available to determine user tier', { points });
      return null;
    }
    
    const sortedTiers = [...tiers].sort((a, b) => a.min_points - b.min_points);
    
    return sortedTiers.reduce((highest, current) => {
      if (points >= current.min_points) {
        return current;
      }
      return highest;
    }, sortedTiers[0]);
  }, []);

  const updateNextMilestone = useCallback((points: number) => {
    const currentMilestones = milestonesRef.current;
    if (!currentMilestones || currentMilestones.length === 0) {
      return;
    }
    
    const nextAvailableMilestone = currentMilestones
      .filter(milestone => milestone.points_required > points)
      .sort((a, b) => a.points_required - b.points_required)[0] || null;
    
    setNextMilestone(nextAvailableMilestone);
  }, []);

  const handleProfileUpdate = useCallback((payload: any) => {
    if (!payload || typeof payload !== 'object') {
      logError('TIERS: Invalid payload received in realtime update', { payload });
      return;
    }

    const newData = payload.new;
    if (newData && typeof newData === 'object' && 'total_points' in newData) {
      const newPoints = typeof newData.total_points === 'number' ? newData.total_points : 0;
      
      logInfo('TIERS: Updating points from realtime event', { 
        newPoints: newPoints,
        oldPoints: totalPointsRef.current
      });
      
      if (newPoints !== totalPointsRef.current) {
        const newTier = determineUserTier(newPoints, tiersDataRef.current);
        setUserState({
          totalPoints: newPoints,
          currentTier: newTier
        });
        
        updateNextMilestone(newPoints);
      }
    }
  }, [determineUserTier, updateNextMilestone]);

  useEffect(() => {
    if (!user) {
      logWarning('TIERS: No user found, skipping tier data fetch');
      setLoading(false);
      setInitialized(true);
      return;
    }

    const fetchTierData = async () => {
      try {
        setLoading(true);
        setError(null);
        logInfo('TIERS: Fetching tier data', { userId: user.id });

        const [profileResponse, tiersResponse, milestonesResponse, perksResponse] = await Promise.all([
          supabase
            .from('profiles')
            .select('total_points')
            .eq('id', user.id)
            .single(),
          
          supabase
            .from('tiers')
            .select('*')
            .order('min_points', { ascending: true }),
          
          supabase
            .from('milestones')
            .select('*')
            .order('points_required', { ascending: true }),
          
          supabase
            .from('redeemed_perks')
            .select('*')
            .eq('user_id', user.id)
        ]);

        if (profileResponse.error) {
          logError('TIERS: Error fetching profile points', { error: profileResponse.error });
          if (profileResponse.error.code !== 'PGRST116') {
            setError(`Failed to fetch profile: ${profileResponse.error.message}`);
          }
        }
        
        if (tiersResponse.error) {
          logError('TIERS: Error fetching tiers', { error: tiersResponse.error });
          setError(`Failed to fetch tiers: ${tiersResponse.error.message}`);
          return;
        }
        
        const fetchedTiersData = tiersResponse.data || [];
        setTiersData(fetchedTiersData);
        tiersDataRef.current = fetchedTiersData;
        
        if (milestonesResponse.error) {
          logError('TIERS: Error fetching milestones', { error: milestonesResponse.error });
          setError(`Failed to fetch milestones: ${milestonesResponse.error.message}`);
          return;
        }
        
        const milestonesData = milestonesResponse.data || [];
        setMilestones(milestonesData);
        milestonesRef.current = milestonesData;
        
        if (perksResponse.error) {
          logError('TIERS: Error fetching redeemed perks', { error: perksResponse.error });
          setError(`Failed to fetch redeemed perks: ${perksResponse.error.message}`);
          return;
        }
        
        setRedeemedPerks(perksResponse.data || []);
        
        if (profileResponse.data && 'total_points' in profileResponse.data) {
          const points = profileResponse.data.total_points || 0;
          totalPointsRef.current = points;
          
          const userTier = determineUserTier(points, fetchedTiersData);
          
          setUserState({
            totalPoints: points,
            currentTier: userTier
          });
          
          logSuccess('TIERS: User tier determined', { 
            tier: userTier?.name, 
            points: points
          });
          
          updateNextMilestone(points);
        }
        
        logSuccess('TIERS: Initial data load completed');
        setInitialized(true);
      } catch (err: any) {
        logError('TIERS: Error fetching tier data', { error: err });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTierData();

    // Fix the subscribe calls to use the correct signature with two parameters
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => handleProfileUpdate(payload)
      )
      .subscribe((status) => {
        logInfo('TIERS: Profile subscription status', { status });
      }, (error) => {
        logError('TIERS: Profile subscription error', { error });
      });

    const perksSubscription = supabase
      .channel('perks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'redeemed_perks',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const { data, error } = await supabase
            .from('redeemed_perks')
            .select('*')
            .eq('user_id', user.id);
            
          if (error) {
            logError('TIERS: Error fetching updated perks', error);
            return;
          }
          
          if (data) {
            logInfo('TIERS: Updated redeemed perks', { count: data.length });
            setRedeemedPerks(data);
          }
        }
      )
      .subscribe((status) => {
        logInfo('TIERS: Perks subscription status', { status });
      }, (error) => {
        logError('TIERS: Perks subscription error', { error });
      });

    return () => {
      logInfo('TIERS: Cleaning up subscriptions');
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(perksSubscription);
    };
  }, [user?.id, determineUserTier, updateNextMilestone, handleProfileUpdate]);

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

      logSuccess('TIERS: Successfully redeemed perk', { milestoneId });
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
