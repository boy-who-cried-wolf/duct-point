import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';

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
  
  const didInitialize = useRef(false);
  const isMounted = useRef(true);
  const pointsRef = useRef(totalPoints);

  useEffect(() => {
    pointsRef.current = totalPoints;
  }, [totalPoints]);

  const fetchAllTierData = async (retry = 0) => {
    if (!user) {
      if (isMounted.current) {
        setLoading(false);
        console.log("⚠️ No user found for tier data");
      }
      return;
    }

    try {
      console.log(`🔄 Fetching all tier data for user: ${user.id} (retry: ${retry})`);
      setLoading(true);

      await ensureMockData();

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        if (isMounted.current) {
          setError(`Profile error: ${profileError.message}`);
        }
      } else if (profileData) {
        const userPoints = profileData && 'total_points' in profileData 
          ? (profileData as Profile).total_points 
          : 0;
          
        if (isMounted.current) {
          console.log(`💰 Setting total points to ${userPoints}`);
          setTotalPoints(userPoints);
        }
        pointsRef.current = userPoints;
      }

      const [tiersResponse, milestonesResponse, perksResponse] = await Promise.all([
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

      if (tiersResponse.error) {
        console.error('❌ Error fetching tiers:', tiersResponse.error);
        if (isMounted.current) setError(`Tiers error: ${tiersResponse.error.message}`);
      } else if (tiersResponse.data && tiersResponse.data.length > 0 && isMounted.current) {
        console.log(`🏆 Found ${tiersResponse.data.length} tiers`);
        
        const userPoints = pointsRef.current;
        const userTier = tiersResponse.data.reduce((prev, current) => {
          if (userPoints >= current.min_points) {
            return current;
          }
          return prev;
        }, tiersResponse.data[0]);

        if (isMounted.current) {
          console.log(`🏅 Setting current tier to ${userTier.name}`);
          setCurrentTier(userTier);
        }
      }

      if (milestonesResponse.error) {
        console.error('❌ Error fetching milestones:', milestonesResponse.error);
        if (isMounted.current) setError(`Milestones error: ${milestonesResponse.error.message}`);
      } else if (isMounted.current && milestonesResponse.data) {
        console.log(`🎯 Found ${milestonesResponse.data.length} milestones`);
        setMilestones(milestonesResponse.data || []);

        const userPoints = pointsRef.current;
        const nextAvailableMilestone = milestonesResponse.data
          ? milestonesResponse.data
              .filter(milestone => milestone.points_required > userPoints)
              .sort((a, b) => a.points_required - b.points_required)[0] || null
          : null;

        if (isMounted.current && nextAvailableMilestone) {
          console.log(`⭐ Next milestone: ${nextAvailableMilestone.name} (${nextAvailableMilestone.points_required} points)`);
          setNextMilestone(nextAvailableMilestone);
        }
      }

      if (perksResponse.error) {
        console.error('❌ Error fetching redeemed perks:', perksResponse.error);
        if (isMounted.current) setError(`Perks error: ${perksResponse.error.message}`);
      } else if (isMounted.current) {
        console.log(`🎁 Found ${perksResponse.data?.length || 0} redeemed perks`);
        setRedeemedPerks(perksResponse.data || []);
      }

      if (isMounted.current) setError(null);

    } catch (err: any) {
      console.error('❌ Unexpected error in fetchAllTierData:', err);
      if (isMounted.current) {
        setError(`Unexpected error: ${err.message}`);
      }
      
      if (retry < 3 && isMounted.current) {
        console.log(`🔄 Retrying tier data fetch (${retry + 1}/3)...`);
        setTimeout(() => {
          fetchAllTierData(retry + 1);
        }, 1000 * (retry + 1));
      }
    } finally {
      if (isMounted.current) {
        console.log("✅ Tier data fetch complete");
        setLoading(false);
        didInitialize.current = true;
      }
    }
  };

  const ensureMockData = async () => {
    try {
      const { data: tiers, error: tierError } = await supabase
        .from('tiers')
        .select('*');
      
      if (tierError) {
        console.error('Error checking tiers:', tierError);
        return;
      }
      
      if (!tiers || tiers.length === 0) {
        console.log('🛠️ Creating mock tier data for development');
        
        const mockTiers = [
          { name: 'Bronze', min_points: 0, max_points: 999 },
          { name: 'Silver', min_points: 1000, max_points: 4999 },
          { name: 'Gold', min_points: 5000, max_points: 9999 },
          { name: 'Platinum', min_points: 10000, max_points: null }
        ];
        
        const { data: createdTiers, error: createTiersError } = await supabase
          .from('tiers')
          .insert(mockTiers)
          .select();
          
        if (createTiersError) {
          console.error('Error creating mock tiers:', createTiersError);
          return;
        }
        
        const mockMilestones = [];
        
        mockMilestones.push(
          {
            tier_id: createdTiers[0].id,
            name: 'Swag Bag',
            description: 'Get sent a free swag bag with a Duct calendar, hat, tumbler, and more',
            points_required: 10000,
            max_value: 25
          },
          {
            tier_id: createdTiers[1].id,
            name: 'Free Shipping ($500)',
            description: 'Free shipping on 1 order worth $500 max on shipping',
            points_required: 50000,
            max_value: 500
          },
          {
            tier_id: createdTiers[2].id,
            name: 'Free Shipping ($1000)',
            description: 'Free shipping on 1 order with max $1000 on shipping',
            points_required: 75000,
            max_value: 1000
          }
        );
        
        for (const tier of createdTiers) {
          const baseMilestones = [
            { 
              tier_id: tier.id, 
              name: `${tier.name} Badge`, 
              description: `Earn the ${tier.name} badge by reaching ${tier.min_points} points.`,
              points_required: tier.min_points,
              max_value: 10
            },
            { 
              tier_id: tier.id, 
              name: `${tier.name} Certificate`, 
              description: `Receive a ${tier.name} certificate by earning ${tier.min_points + 500} points.`,
              points_required: tier.min_points + 500,
              max_value: 15
            }
          ];
          
          mockMilestones.push(...baseMilestones);
        }
        
        const { error: createMilestonesError } = await supabase
          .from('milestones')
          .insert(mockMilestones);
          
        if (createMilestonesError) {
          console.error('Error creating mock milestones:', createMilestonesError);
          return;
        }
        
        if (user) {
          const mockTransaction = {
            user_id: user.id,
            points: 45000,
            description: 'Welcome bonus'
          };
          
          const { error: createTransactionError } = await supabase
            .from('transactions')
            .insert(mockTransaction);
            
          if (createTransactionError) {
            console.error('Error creating mock transaction:', createTransactionError);
          } else {
            console.log('✅ Created welcome bonus transaction with 45,000 points');
            
            toast.success('Added 45,000 points as welcome bonus');
          }
        }
      }
    } catch (err) {
      console.error('Error in ensureMockData:', err);
    }
  };

  useEffect(() => {
    console.log("🔄 Initial useTierData setup for user:", user?.id);
    isMounted.current = true;
    
    if (!didInitialize.current) {
      fetchAllTierData();
    }
    
    const timeoutId = setTimeout(() => {
      if (isMounted.current && loading) {
        console.log("⏱️ useTierData loading timeout reached");
        setLoading(false);
      }
    }, 5000);

    const profileSubscription = supabase
      .channel('profile-changes')
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
          console.log('Perks update received:', payload);
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
      clearTimeout(timeoutId);
      supabase.removeChannel(profileSubscription);
      supabase.removeChannel(perksSubscription);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !milestones.length || !isMounted.current) return;
    
    console.log("🔄 Updating tier data after points change:", totalPoints);
    
    const nextAvailableMilestone = milestones
      .filter(milestone => milestone.points_required > totalPoints)
      .sort((a, b) => a.points_required - b.points_required)[0] || null;
    
    if (isMounted.current) {
      setNextMilestone(nextAvailableMilestone);
    }
    
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
          
          if (isMounted.current) {
            setCurrentTier(userTier);
          }
        }
      });
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
  };

  return {
    loading,
    error,
    totalPoints,
    currentTier,
    milestones,
    nextMilestone,
    redeemedPerks,
    redeemPerk,
    refreshData: fetchAllTierData
  };
};
