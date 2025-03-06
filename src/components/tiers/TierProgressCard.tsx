
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Medal, Award, Crown } from "lucide-react";

interface TierProgressCardProps {
  totalPoints: number;
  tier: {
    name: string;
    min_points: number;
    max_points: number | null;
  };
  nextMilestone?: {
    name: string;
    points_required: number;
    description: string;
  };
}

const TierProgressCard = ({ totalPoints, tier, nextMilestone }: TierProgressCardProps) => {
  // Calculate progress percentage toward final goal (400,000)
  const MAX_GOAL = 400000;
  const progressPercentage = Math.min(Math.round((totalPoints / MAX_GOAL) * 100), 100);
  
  console.log('TierProgressCard rendering:', { 
    totalPoints, 
    tierName: tier?.name, 
    progressPercentage 
  });
  
  // Determine tier icon
  const TierIcon = () => {
    if (!tier) return null;
    
    switch (tier.name) {
      case 'Bronze':
        return <Medal className="h-5 w-5 text-amber-600" />;
      case 'Silver':
        return <Award className="h-5 w-5 text-slate-400" />;
      case 'Gold':
        return <Crown className="h-5 w-5 text-yellow-400" />;
      default:
        return null;
    }
  };

  if (!tier) {
    console.log('TierProgressCard: No tier data available');
    return null;
  }

  return (
    <Card className="overflow-hidden card-hover shadow-none border-none">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TierIcon />
            <span>Your Current Tier: {tier.name}</span>
          </CardTitle>
          <span className="text-blue-500 font-medium">
            {totalPoints.toLocaleString()} Points
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress to Ultimate Reward</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>0</span>
              <span>100,000</span>
              <span>200,000</span>
              <span>300,000</span>
              <span>400,000</span>
            </div>
          </div>
          
          {nextMilestone && (
            <div className="bg-muted/50 p-3 rounded-md border border-border">
              <div className="text-sm font-medium mb-1">Next Milestone: {nextMilestone.name}</div>
              <div className="text-xs text-muted-foreground">{nextMilestone.description}</div>
              <div className="mt-2 text-sm">
                <span className="font-medium">{totalPoints.toLocaleString()}</span> / <span>{nextMilestone.points_required.toLocaleString()}</span> points needed
              </div>
              <Progress 
                value={Math.min(Math.round((totalPoints / nextMilestone.points_required) * 100), 100)} 
                className="h-1.5 mt-1" 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TierProgressCard;
