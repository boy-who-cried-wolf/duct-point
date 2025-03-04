
// Mock courses data
export const mockCourses = [{
  id: 1,
  title: "Introduction to React",
  description: "Learn the basics of React and component-based architecture.",
  pointValue: 100,
  duration: "2 hours",
  difficulty: "Beginner"
}, {
  id: 2,
  title: "Advanced CSS Techniques",
  description: "Master modern CSS layouts, animations, and responsive design.",
  pointValue: 150,
  duration: "3 hours",
  difficulty: "Intermediate"
}, {
  id: 3,
  title: "Git Version Control",
  description: "Learn how to use Git for effective team collaboration.",
  pointValue: 75,
  duration: "1.5 hours",
  difficulty: "Beginner"
}];

// Mock transactions data
export const mockTransactions = [{
  id: 1,
  type: "earned",
  points: 100,
  description: "Completed Introduction to React course",
  date: "2023-05-15T14:30:00Z"
}, {
  id: 2,
  type: "spent",
  points: 50,
  description: "Redeemed for Amazon gift card",
  date: "2023-05-10T11:45:00Z"
}, {
  id: 3,
  type: "earned",
  points: 75,
  description: "Completed Git Version Control course",
  date: "2023-05-05T09:15:00Z"
}];

// Stats card data
export const statCards = [{
  title: "Total Points",
  value: "2,500",
  description: "Points accumulated",
  icon: "TrendingUp",
  trend: "+12% from last month",
  trendUp: true
}, {
  title: "Courses Completed",
  value: "15",
  description: "Out of 23 total courses",
  icon: "BookOpen",
  trend: "+3 new this month",
  trendUp: true
}, {
  title: "Team Members",
  value: "24",
  description: "Active participants",
  icon: "Users",
  trend: "+2 new members",
  trendUp: true
}, {
  title: "Recent Activity",
  value: "8",
  description: "Transactions this week",
  icon: "Activity",
  trend: "2 hours ago",
  trendUp: null
}];
