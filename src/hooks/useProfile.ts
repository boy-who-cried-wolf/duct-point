
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../App';
import { useToast } from './use-toast';

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company: string | null;
  job_title: string | null;
  total_points: number;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch the user's profile
  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the user's profile
  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update the local state with the new data
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err.message || 'Failed to update profile. Please try again.',
      });
      return false;
    }
  };

  // Update the avatar URL
  const updateAvatar = async (avatarUrl: string) => {
    return updateProfile({ avatar_url: avatarUrl });
  };

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Subscribe to profile changes
  useEffect(() => {
    if (!user) return;

    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as ProfileData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateAvatar,
  };
}
