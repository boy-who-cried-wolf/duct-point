
import { useState, useEffect } from 'react';
import { useTiers } from './useTiers';
import { useMilestones } from './useMilestones';
import { useUserProfile } from './useUserProfile';
import { useRedeemedPerks } from './useRedeemedPerks';
import { Tier, Milestone } from '../types/tierTypes';

export const useTierData = () => {
  const { tiers, loading: tiersLoading } = useTiers();
  const { milestones, loading: milestonesLoading } = useMilestones();
  const { totalPoints, userId, loading: profileLoading } = useUserProfile();
  const { redeemedPerks, redeemPerk, loading: perksLoading } = useRedeemedPerks(userId);
  
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  
  // Determine user's current tier based on their points
  useEffect(() => {
    if (tiersLoading || !tiers.length) return;
    
    const sortedTiers = [...tiers].sort((a, b) => a.min_points - b.min_points);
    
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
  }, [totalPoints, tiers, tiersLoading]);
  
  // Determine next milestone based on current tier and redeemed perks
  useEffect(() => {
    if (milestonesLoading || !currentTier || !milestones.length) return;
    
    const tierMilestones = milestones.filter(m => m.tier_id === currentTier.id);
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
  }, [currentTier, milestones, redeemedPerks, milestonesLoading]);
  
  const loading = profileLoading || tiersLoading || milestonesLoading || perksLoading;
  
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
