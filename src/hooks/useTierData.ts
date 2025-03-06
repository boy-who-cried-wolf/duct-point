import { useState, useEffect } from 'react';
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
        console.log('TIERS: No user found, skipping tier data fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        logInfo('TIERS: Fetching tier data', { userId: user.id });
        console.log('TIERS: Fetching tier data', { userId: user.id });

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (profileError) {
          logError('TIERS: Error fetching profile points', profileError);
          console.error('TIERS: Error fetching profile points', profileError);
          setTotalPoints(0);
        } else {
          const userPoints = profileData && typeof profileData === 'object' && 'total_points' in profileData 
            ? (profileData as Profile).total_points 
            : 0;
            
          console.log('TIERS: Setting total points to', userPoints);
          setTotalPoints(userPoints);
          logInfo('TIERS: User points loaded', { points: userPoints });
        }

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
          const userPoints = totalPoints;
          console.log('TIERS: Determining tier with points:', userPoints);
          
          const userTier = tiersData.reduce((prev, current) => {
            if (userPoints >= current.min_points) {
              return current;
            }
            return prev;
          }, tiersData[0]);

          console.log('TIERS: Setting current tier to', userTier);
          setCurrentTier(userTier);
          logSuccess('TIERS: User tier determined', { 
            tier: userTier.name, 
            minPoints: userTier.min_points, 
            maxPoints: userTier.max_points 
          });
        }

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

        const userPoints = totalPoints;
        const nextAvailableMilestone = milestonesData
          ? milestonesData
              .filter(milestone => milestone.points_required > userPoints)
              .sort((a, b) => a.points_required - b.points_required)[0] || null
          : null;

        console.log('TIERS: Setting next milestone to', nextAvailableMilestone);
        setNextMilestone(nextAvailableMilestone);

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
            console.log('TIERS: Updating total points from', totalPoints, 'to', payload.new.total_points);
            setTotalPoints(payload.new.total_points || 0);
            
            supabase
              .from('tiers')
              .select('*')
              .order('min_points', { ascending: true })
              .then(({ data: tiersData }) => {
                if (tiersData && tiersData.length > 0) {
                  const userPoints = payload.new.total_points || 0;
                  const userTier = tiersData.reduce((prev, current) => {
                    if (userPoints >= current.min_points) {
                      return current;
                    }
                    return prev;
                  }, tiersData[0]);
                  
                  console.log('TIERS: Updating current tier after point change to', userTier);
                  setCurrentTier(userTier);
                }
              });
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
  }, [user]);

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
