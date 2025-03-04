import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Define proper interfaces for our types
interface Profile {
  total_points: number;
  [key: string]: any;
}

interface Tier {
  id: string;
  name: string;
  min_points: number;
  max_points: number | null;
  created_at?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  points_required: number;
  max_value: number;
  tier_id: string;
  created_at?: string;
}

interface RedeemedPerk {
  id: string;
  user_id: string;
  milestone_id: string;
  redeemed_at: string;
  status: string;
}

export const useTierData = () => {
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  const [redeemedPerks, setRedeemedPerks] = useState<RedeemedPerk[]>([]);

  const fetchTiers = async (): Promise<Tier[]> => {
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .order('min_points', { ascending: true });

    if (error) {
      console.error('Error fetching tiers:', error);
      return [];
    }

    return data as Tier[];
  };

  const fetchMilestones = async (): Promise<Milestone[]> => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .order('points_required', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }

    return data as Milestone[];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        if (userId) {
          // Fetch user profile data (includes points)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (profileError) {
            console.error('Error fetching user profile data:', profileError);
            setLoading(false);
            return;
          }
          
          // Cast to Profile type to satisfy TypeScript
          const profile = profileData as Profile;
          setTotalPoints(profile?.total_points || 0);
          
          // Fetch redeemed perks
          const { data: perksData, error: perksError } = await supabase
            .from('redeemed_perks')
            .select('*')
            .eq('user_id', userId);
            
          if (perksError) {
            console.error('Error fetching redeemed perks:', perksError);
          } else {
            setRedeemedPerks(perksData || []);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error in data fetching:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const determineTier = async () => {
      setLoading(true);
      const tiers = await fetchTiers();
      const sortedTiers = tiers.sort((a, b) => a.min_points - b.min_points);

      let foundTier: Tier | null = null;
      for (const tier of sortedTiers) {
        if (tier.max_points === null) {
          if (totalPoints >= tier.min_points) {
            foundTier = tier;
            break;
          }
        } else if (totalPoints >= tier.min_points && totalPoints < tier.max_points) {
          foundTier = tier;
          break;
        }
      }
      setCurrentTier(foundTier);
      setLoading(false);
    };

    determineTier();
  }, [totalPoints]);

  useEffect(() => {
    const calculateNextMilestone = async () => {
      setLoading(true);
      const allMilestones = await fetchMilestones();
      setMilestones(allMilestones);

      if (currentTier) {
        const tierMilestones = allMilestones.filter(m => m.tier_id === currentTier.id);
        const unredeemedMilestones = tierMilestones.filter(milestone => {
          return !redeemedPerks.some(perk => perk.milestone_id === milestone.id);
        });

        if (unredeemedMilestones.length > 0) {
          const next = unredeemedMilestones.reduce((prev, curr) => {
            return (curr.points_required < prev.points_required) ? curr : prev;
          });
          setNextMilestone(next);
        } else {
          setNextMilestone(null);
        }
      }
      setLoading(false);
    };

    calculateNextMilestone();
  }, [currentTier, redeemedPerks]);

  const redeemPerk = async (milestoneId: string) => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        toast.error('User not authenticated.');
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('redeemed_perks')
        .insert([{ user_id: userId, milestone_id: milestoneId }])
        .select()
        .single();

      if (error) {
        console.error('Error redeeming perk:', error);
        toast.error('Failed to redeem perk.');
      } else {
        setRedeemedPerks([...redeemedPerks, data as RedeemedPerk]);
        toast.success('Perk redeemed successfully!');
      }
    } catch (error) {
      console.error('Error redeeming perk:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    totalPoints,
    currentTier,
    milestones,
    nextMilestone,
    redeemedPerks,
    redeemPerk
  };
};
