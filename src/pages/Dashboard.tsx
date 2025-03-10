import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, BookOpen, Users, TrendingUp, Clock, ArrowRight, AlertCircle, Loader2, GraduationCap, CheckCircle } from "lucide-react";
import TierProgressCard from "@/components/tiers/TierProgressCard";
import MilestonesList from "@/components/tiers/MilestonesList";
import { useTierData } from "@/hooks/useTierData";
import { useCourses } from "@/hooks/useCourses";
import AvailableCoursesList from "@/components/courses/AvailableCoursesList";
import RecentTransactionsList from "@/components/transactions/RecentTransactionsList";

const mockTransactions = [{
  id: 1,
  type: "earned" as const,
  points: 100,
  description: "Completed Introduction to React course",
  date: "2023-05-15T14:30:00Z"
}, {
  id: 2,
  type: "spent" as const,
  points: 50,
  description: "Redeemed for Amazon gift card",
  date: "2023-05-10T11:45:00Z"
}, {
  id: 3,
  type: "earned" as const,
  points: 75,
  description: "Completed Git Version Control course",
  date: "2023-05-05T09:15:00Z"
}];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const statCards = [{
  title: "Total Points",
  value: "2,500",
  description: "Points accumulated",
  icon: TrendingUp,
  trend: "+12% from last month",
  trendUp: true
}, {
  title: "Courses Completed",
  value: "15",
  description: "Out of 23 total courses",
  icon: BookOpen,
  trend: "+3 new this month",
  trendUp: true
}, {
  title: "Team Members",
  value: "24",
  description: "Active participants",
  icon: Users,
  trend: "+2 new members",
  trendUp: true
}, {
  title: "Recent Activity",
  value: "8",
  description: "Transactions this week",
  icon: Activity,
  trend: "2 hours ago",
  trendUp: null
}];

const Dashboard = () => {
  const navigate = useNavigate();
  
  const {
    loading: tierLoading,
    error: tierError,
    initialized,
    totalPoints,
    currentTier,
    milestones,
    nextMilestone,
    redeemedPerks,
    redeemPerk
  } = useTierData();
  
  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
    enrollInCourse,
    isEnrolled
  } = useCourses();
  
  const tierMilestones = currentTier && milestones ? milestones.filter(m => m.tier_id === currentTier.id) : [];
  
  console.log('Dashboard rendering with tier data:', { 
    tierLoading, 
    initialized,
    tierError,
    totalPoints, 
    currentTier, 
    nextMilestone,
    redeemedPerks: redeemedPerks?.length,
    milestones: milestones?.length,
    tierMilestones: tierMilestones?.length,
    milestonesCondition: !tierLoading && initialized && currentTier && tierMilestones.length > 0
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Duct Points dashboard.
          </p>
        </div>
        
        <Button onClick={() => navigate("/admin")} variant="outline" className="gap-2">
          Admin Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-6">
        <TierProgressCard 
          totalPoints={totalPoints} 
          tier={currentTier} 
          nextMilestone={nextMilestone || undefined} 
          loading={tierLoading && !initialized}
        />
      </div>
      
      {tierError && (
        <div className="mb-6 p-4 border border-destructive/30 bg-destructive/10 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">{tierError}</p>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((card, index) => (
          <Card key={index} className="overflow-hidden card-hover shadow-none border-none bg-slate-50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.trend && (
                <p className={`text-xs mt-2 ${
                  card.trendUp === true 
                    ? 'text-green-500' 
                    : card.trendUp === false 
                    ? 'text-red-500' 
                    : 'text-muted-foreground'
                }`}>
                  {card.trend}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="space-y-4">
          <Card className="overflow-hidden shadow-none border-none">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your recent point activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockTransactions.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No transactions to display yet.
                </div>
              ) : (
                <RecentTransactionsList 
                  transactions={mockTransactions} 
                  onViewDetails={(id) => {
                    console.log(`View details for transaction ${id}`);
                    toast.info(`Viewing details for transaction ${id}`);
                  }}
                />
              )}
            </CardContent>
            <CardFooter className="border-t px-4 py-3 flex justify-end bg-transparent">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/transactions")}>
                View all transactions
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
          
          {tierLoading && !initialized && (
            <Card className="overflow-hidden shadow-none border-none h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Loading milestones...</p>
              </div>
            </Card>
          )}
          
          {!tierLoading && initialized && currentTier && (
            <MilestonesList 
              milestones={tierMilestones.length > 0 ? tierMilestones : milestones || []} 
              redeemedPerks={redeemedPerks || []} 
              totalPoints={totalPoints} 
              onRedeemPerk={redeemPerk} 
            />
          )}
          
          {!tierLoading && initialized && !currentTier && milestones && milestones.length > 0 && (
            <Card className="overflow-hidden shadow-none border-none p-4">
              <div className="text-center">
                <p className="text-muted-foreground">No tier assigned yet. Milestones will appear here when you reach a tier.</p>
              </div>
            </Card>
          )}
        </div>
        
        <Card className="overflow-hidden shadow-none border-none">
          <CardHeader>
            <CardTitle>Available Courses</CardTitle>
            <CardDescription>
              Courses you can take to earn points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : coursesError ? (
              <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-destructive">{coursesError}</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No courses available yet.
              </div>
            ) : (
              <AvailableCoursesList 
                courses={courses.slice(0, 5)} 
                onEnroll={enrollInCourse}
                isEnrolled={isEnrolled}
                onViewCourse={(courseId) => {
                  const course = courses.find(c => c.id === courseId);
                  if (course?.url) {
                    window.open(course.url, '_blank');
                  } else {
                    toast.info(`Course details for ${course?.title || 'this course'} are coming soon`);
                  }
                }}
              />
            )}
          </CardContent>
          <CardFooter className="border-t px-4 py-3 flex justify-end bg-transparent">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/courses")}>
              Browse all courses
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
