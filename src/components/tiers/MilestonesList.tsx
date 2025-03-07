
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Check, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Milestone {
  id: string;
  name: string;
  description: string;
  points_required: number;
  max_value: number;
  tier_id: string;
}

interface RedeemedPerk {
  id: string;
  milestone_id: string;
  redeemed_at: string;
  status: string;
}

interface MilestonesListProps {
  milestones: Milestone[];
  redeemedPerks: RedeemedPerk[];
  totalPoints: number;
  onRedeemPerk: (milestoneId: string) => Promise<void>;
}

const MilestonesList = ({
  milestones,
  redeemedPerks,
  totalPoints,
  onRedeemPerk
}: MilestonesListProps) => {
  const isRedeemed = (milestoneId: string) => {
    return redeemedPerks.some(perk => perk.milestone_id === milestoneId);
  };

  const getRedemptionStatus = (milestoneId: string) => {
    const perk = redeemedPerks.find(p => p.milestone_id === milestoneId);
    return perk ? perk.status : null;
  };

  const handleRedeem = async (milestoneId: string) => {
    try {
      await onRedeemPerk(milestoneId);
      toast.success("Perk redeemed successfully!");
    } catch (error) {
      console.error("Error redeeming perk:", error);
      toast.error("Failed to redeem perk. Please try again.");
    }
  };

  return (
    <Card className="overflow-hidden card-hover shadow-none border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <span>Available Rewards</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const redeemed = isRedeemed(milestone.id);
            const status = getRedemptionStatus(milestone.id);
            const canRedeem = totalPoints >= milestone.points_required && !redeemed;

            return (
              <div
                key={milestone.id}
                className={`p-3 rounded-md border ${canRedeem
                    ? 'border-primary/30 bg-primary/5'
                    : redeemed
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      {milestone.name}
                      {redeemed && (
                        status === 'pending'
                          ? <Clock className="h-3.5 w-3.5 text-amber-500 ml-1" />
                          : <Check className="h-3.5 w-3.5 text-green-500 ml-1" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {milestone.description}
                    </p>
                  </div>
                  <span className="text-blue-500 font-medium text-sm">
                    {milestone.points_required.toLocaleString()} points
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    Value up to ${milestone.max_value}
                  </div>
                  {redeemed ? (
                    <Badge variant="outline" className={
                      status === 'pending' ? 'text-amber-500' : 'text-green-500'
                    }>
                      {status === 'pending' ? 'Processing' : 'Redeemed'}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canRedeem}
                      onClick={() => handleRedeem(milestone.id)}
                    >
                      Redeem
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {milestones.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No milestones available at this time.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MilestonesList;
