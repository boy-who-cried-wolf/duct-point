
import { useState, useEffect, useCallback } from 'react';
import { supabase, logInfo, logError, logSuccess } from '@/integrations/supabase/client';
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

  // Extract totalPoints and currentTier from userState for better readability
  const { totalPoints, currentTier } = userState;

  // Determine the user's tier based on points and available tiers
  const determineUserTier = useCallback((points: number, tiers: Tier[]): Tier | null => {
    if (!tiers || tiers.length === 0) return null;
    
    console.log('TIERS: Determining tier with points:', points);
    
    return tiers.reduce((prev, current) => {
      if (points >= current.min_points) {
        return current;
      }
      return prev;
    }, tiers[0]);
  }, []);

  // Update both points and tier atomically
  const updateUserState = useCallback((points: number) => {
    console.log('TIERS: Updating user state with points:', points);
    
    setUserState(prevState => {
      const newTier = determineUserTier(points, tiersData);
      
      // Log the changes for debugging
      if (prevState.currentTier?.id !== newTier?.id) {
        console.log('TIERS: Tier changing from', prevState.currentTier?.name, 'to', newTier?.name);
      }
      
      return {
        totalPoints: points,
        currentTier: newTier
      };
    });
  }, [determineUserTier, tiersData]);

  // Determine next milestone based on points
  const updateNextMilestone = useCallback((points: number) => {
    if (!milestones || milestones.length === 0) return;
    
    const nextAvailableMilestone = milestones
      .filter(milestone => milestone.points_required > points)
      .sort((a, b) => a.points_required - b.points_required)[0] || null;
    
    console.log('TIERS: Setting next milestone to', nextAvailableMilestone);
    setNextMilestone(nextAvailableMilestone);
  }, [milestones]);

  useEffect(() => {
    const fetchTierData = async () => {
      if (!user) {
        console.log('TIERS: No user found, skipping tier data fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        logInfo('TIERS: Fetching tier data', { userId: user.id });
        console.log('TIERS: Fetching tier data', { userId: user.id });

        // Fetch user points
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logError('TIERS: Error fetching profile points', profileError);
          console.error('TIERS: Error fetching profile points', profileError);
        } else {
          const userPoints = profileData && typeof profileData === 'object' && 'total_points' in profileData 
            ? (profileData as Profile).total_points 
            : 0;
            
          console.log('TIERS: Initial points loaded:', userPoints);
          logInfo('TIERS: User points loaded', { points: userPoints });
        }

        // Fetch tiers
        const { data: fetchedTiersData, error: tiersError } = await supabase
          .from('tiers')
          .select('*')
          .order('min_points', { ascending: true });

        if (tiersError) {
          logError('TIERS: Error fetching tiers', tiersError);
          console.error('TIERS: Error fetching tiers', tiersError);
          throw tiersError;
        }

        console.log('TIERS: Fetched tiers data', fetchedTiersData);
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
          console.error('TIERS: Error fetching milestones', milestonesError);
          throw milestonesError;
        }
        console.log('TIERS: Setting milestones to', milestonesData);
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
          console.error('TIERS: Error fetching redeemed perks', perksError);
          throw perksError;
        }
        console.log('TIERS: Setting redeemed perks to', perksData);
        setRedeemedPerks(perksData || []);

      } catch (err: any) {
        logError('TIERS: Error fetching tier data', err);
        console.error('TIERS: Error fetching tier data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    console.log('TIERS: useEffect triggered, initiating data fetch');
    fetchTierData();

    // Set up realtime subscriptions
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
          console.log('TIERS: Profile update received:', payload);
          if (payload.new && typeof payload.new === 'object' && 'total_points' in payload.new) {
            const newPoints = payload.new.total_points || 0;
            console.log('TIERS: Updating points from', totalPoints, 'to', newPoints);
            
            // Update both points and tier atomically
            updateUserState(newPoints);
            
            // Update next milestone based on new points
            updateNextMilestone(newPoints);
          }
        }
      )
      .subscribe();

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
          console.log('TIERS: Perks update received:', payload);
          supabase
            .from('redeemed_perks')
            .select('*')
            .eq('user_id', user?.id)
            .then(({ data }) => {
              if (data) {
                console.log('TIERS: Updated redeemed perks', data);
                setRedeemedPerks(data);
              }
            });
        }
      )
      .subscribe();

    return () => {
      console.log('TIERS: Cleaning up subscriptions');
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(perksSubscription);
    };
  }, [user, determineUserTier, updateNextMilestone, updateUserState, totalPoints]);

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

    const { data } = await supabase
      .from('redeemed_perks')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setRedeemedPerks(data);
    }
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
