
import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import CoursesCard from "@/components/dashboard/CoursesCard";
import TierProgressCard from "@/components/tiers/TierProgressCard";
import MilestonesList from "@/components/tiers/MilestonesList";
import { useTierData } from "@/hooks/useTierData";
import { mockCourses, mockTransactions, statCards } from "@/data/mockData";

const Dashboard = () => {
  const [userRole, setUserRole] = useState("Admin"); // In a real app, this would come from authentication
  const {
    loading,
    totalPoints,
    currentTier,
    milestones,
    nextMilestone,
    redeemedPerks,
    redeemPerk
  } = useTierData();

  const tierMilestones = currentTier && milestones 
    ? milestones.filter(m => m.tier_id === currentTier.id) 
    : [];

  return (
    <div className="animate-fade-in">
      <DashboardHeader userRole={userRole} />
      
      {!loading && currentTier && (
        <div className="mb-6">
          <TierProgressCard 
            totalPoints={totalPoints} 
            tier={currentTier} 
            nextMilestone={nextMilestone || undefined} 
          />
        </div>
      )}
      
      <StatCards stats={statCards} />
      
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="space-y-4">
          <TransactionsCard transactions={mockTransactions} />
          
          {!loading && currentTier && tierMilestones.length > 0 && (
            <MilestonesList 
              milestones={tierMilestones} 
              redeemedPerks={redeemedPerks} 
              totalPoints={totalPoints} 
              onRedeemPerk={redeemPerk} 
            />
          )}
        </div>
        
        <CoursesCard courses={mockCourses} />
      </div>
    </div>
  );
};

export default Dashboard;
