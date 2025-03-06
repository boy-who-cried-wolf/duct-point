
import { useState, useEffect } from 'react';
import { supabase, logInfo, logError, logSuccess } from '@/integrations/supabase/client';
import { useAuth } from '../App';

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

  useEffect(() => {
    const fetchTierData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        logInfo('TIERS: Fetching tier data', { userId: user.id });
        console.log('TIERS: Fetching tier data', { userId: user.id });

        // Fetch user's total points from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logError('TIERS: Error fetching profile points', profileError);
          console.error('TIERS: Error fetching profile points', profileError);
          // Don't throw, just use 0 points as fallback
          setTotalPoints(0);
        } else {
          // Handle the case where profileData might be null or undefined
          const userPoints = profileData && 'total_points' in profileData 
            ? (profileData as Profile).total_points 
            : 0;
            
          setTotalPoints(userPoints);
          logInfo('TIERS: User points loaded', { points: userPoints });
          console.log('TIERS: User points loaded', { points: userPoints });
        }

        // Fetch all tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('tiers')
          .select('*')
          .order('min_points', { ascending: true });

        if (tiersError) {
          logError('TIERS: Error fetching tiers', tiersError);
          console.error('TIERS: Error fetching tiers', tiersError);
          throw tiersError;
        }

        console.log('TIERS: Fetched tiers data', tiersData);

        if (tiersData && tiersData.length > 0) {
          // Determine current tier based on total points
          const userTier = tiersData.reduce((prev, current) => {
            if (totalPoints >= current.min_points) {
              return current;
            }
            return prev;
          }, tiersData[0]);

          setCurrentTier(userTier);
          logSuccess('TIERS: User tier determined', { 
            tier: userTier.name, 
            minPoints: userTier.min_points, 
            maxPoints: userTier.max_points 
          });
          console.log('TIERS: User tier determined', { 
            tier: userTier.name, 
            minPoints: userTier.min_points, 
            maxPoints: userTier.max_points,
            totalPoints: totalPoints
          });
        }

        // Fetch all milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('*')
          .order('points_required', { ascending: true });

        if (milestonesError) {
          console.error('TIERS: Error fetching milestones', milestonesError);
          throw milestonesError;
        }
        setMilestones(milestonesData || []);
        console.log('TIERS: Fetched milestones', milestonesData);

        // Determine next milestone
        const nextAvailableMilestone = milestonesData
          ? milestonesData
              .filter(milestone => milestone.points_required > totalPoints)
              .sort((a, b) => a.points_required - b.points_required)[0] || null
          : null;

        setNextMilestone(nextAvailableMilestone);
        console.log('TIERS: Next milestone determined', nextAvailableMilestone);

        // Fetch redeemed perks for the user
        const { data: perksData, error: perksError } = await supabase
          .from('redeemed_perks')
          .select('*')
          .eq('user_id', user.id);

        if (perksError) {
          console.error('TIERS: Error fetching redeemed perks', perksError);
          throw perksError;
        }
        setRedeemedPerks(perksData || []);
        console.log('TIERS: Fetched redeemed perks', perksData);

      } catch (err: any) {
        logError('TIERS: Error fetching tier data', err);
        console.error('TIERS: Error fetching tier data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTierData();

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
          console.log('TIERS: Profile update received:', payload);
          if (payload.new && 'total_points' in payload.new) {
            console.log('TIERS: Updating total points from', totalPoints, 'to', payload.new.total_points);
            setTotalPoints(payload.new.total_points || 0);
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
          console.log('TIERS: Perks update received:', payload);
          // Refresh redeemed perks when changes occur
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
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(perksSubscription);
    };
  }, [user, totalPoints]);

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

    // Refresh redeemed perks
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
