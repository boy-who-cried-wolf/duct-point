
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, Users, TrendingUp } from "lucide-react";

const statCards = [
  {
    title: "Total Points",
    value: "2,500",
    description: "Points accumulated",
    icon: TrendingUp,
    trend: "+12% from last month",
    trendUp: true
  },
  {
    title: "Courses Completed",
    value: "15",
    description: "Out of 23 total courses",
    icon: BookOpen,
    trend: "+3 new this month",
    trendUp: true
  },
  {
    title: "Team Members",
    value: "24",
    description: "Active participants",
    icon: Users,
    trend: "+2 new members",
    trendUp: true
  },
  {
    title: "Recent Activity",
    value: "8",
    description: "Transactions this week",
    icon: Activity,
    trend: "2 hours ago",
    trendUp: null
  }
];

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Duct Points dashboard.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card, index) => (
          <Card key={index} className="overflow-hidden card-hover">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.trend && (
                <p className={`text-xs mt-2 ${
                  card.trendUp === true ? 'text-green-500' : 
                  card.trendUp === false ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  {card.trend}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden card-hover">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your recent point activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No transactions to display yet.
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden card-hover">
          <CardHeader>
            <CardTitle>Available Courses</CardTitle>
            <CardDescription>
              Courses you can take to earn points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No courses available yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
