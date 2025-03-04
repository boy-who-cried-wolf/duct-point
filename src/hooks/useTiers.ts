
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tier } from '../types/tierTypes';

export const useTiers = () => {
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<Tier[]>([]);

  useEffect(() => {
    const fetchTiers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tiers')
        .select('*')
        .order('min_points', { ascending: true });

      if (error) {
        console.error('Error fetching tiers:', error);
        setTiers([]);
      } else {
        setTiers(data as Tier[]);
      }
      setLoading(false);
    };

    fetchTiers();
  }, []);

  return { tiers, loading };
};
