
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { RedeemedPerk } from '../types/tierTypes';

export const useRedeemedPerks = (userId: string | null) => {
  const [loading, setLoading] = useState(true);
  const [redeemedPerks, setRedeemedPerks] = useState<RedeemedPerk[]>([]);

  useEffect(() => {
    const fetchRedeemedPerks = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('redeemed_perks')
          .select('*')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error fetching redeemed perks:', error);
        } else {
          setRedeemedPerks(data || []);
        }
      } catch (error) {
        console.error('Error in redeemed perks fetching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRedeemedPerks();
  }, [userId]);

  const redeemPerk = async (milestoneId: string) => {
    if (!userId) {
      toast.error('User not authenticated.');
      return;
    }

    try {
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

  return { redeemedPerks, redeemPerk, loading };
};
