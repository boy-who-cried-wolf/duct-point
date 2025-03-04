
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Milestone } from '../types/tierTypes';

export const useMilestones = () => {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching milestones:', error);
        setMilestones([]);
      } else {
        setMilestones(data as Milestone[]);
      }
      setLoading(false);
    };

    fetchMilestones();
  }, []);

  return { milestones, loading };
};
