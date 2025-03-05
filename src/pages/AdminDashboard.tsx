import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, UserPlus, Download, Filter, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/App";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  total_points: number;
  is_admin: boolean;
  [key: string]: any;
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "Earned" | "Spent";
  points: number;
  description: string;
  date: string;
}

interface Tier {
  id: string;
  name: string;
  min_points: number;
  max_points: number | null;
}

interface Milestone {
  id: string;
  tier_id: string;
  name: string;
  description: string;
  points_required: number;
  max_value: number;
}

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("👨‍💼 AdminDashboard rendering with isAdmin:", isAdmin);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);
      
      // Double-check admin status for extra security
      if (!isAdmin) {
        console.error('❌ Non-admin user attempting to access admin dashboard');
        setError('Admin access required');
        setLoading(false);
        return;
      }
      
      try {
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setError(profilesError.message);
          return;
        }

        setProfiles(profilesData || []);

        // Fetch transactions - Fix: Get transactions and profiles separately
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*');

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          setError(transactionsError.message);
          return;
        }

        // Transform transaction data with user info from profiles
        if (transactionsData) {
          // Create a map of user IDs to names for quick lookup
          const userMap = new Map();
          profilesData?.forEach(profile => {
            userMap.set(profile.id, profile.full_name || profile.email || 'Unknown User');
          });

          const formattedTransactions: Transaction[] = transactionsData.map(t => ({
            id: t.id,
            userId: t.user_id,
            userName: userMap.get(t.user_id) || 'Unknown User',
            type: t.points >= 0 ? "Earned" : "Spent", 
            points: Math.abs(t.points),
            description: t.description || '',
            date: new Date(t.created_at).toISOString(),
          }));

          setTransactions(formattedTransactions);
        }

        // Fetch tiers
        const { data: tiersData, error: tiersError } = await supabase
          .from('tiers')
          .select('*')
          .order('min_points', { ascending: true });

        if (tiersError) {
          console.error('Error fetching tiers:', tiersError);
          setError(tiersError.message);
          return;
        }

        setTiers(tiersData || []);

        // Fetch milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('milestones')
          .select('*');

        if (milestonesError) {
          console.error('Error fetching milestones:', milestonesError);
          setError(milestonesError.message);
          return;
        }

        setMilestones(milestonesData || []);

      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Admin Dashboard</h1>
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, transactions, and rewards.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          {/* Users Tab Content */}
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-8" />
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">NAME</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">EMAIL</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">TOTAL POINTS</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ROLE</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      profiles.map((profile) => (
                        <tr key={profile.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">{profile.full_name || 'Unnamed User'}</td>
                          <td className="py-3 px-4">{profile.email || 'No email'}</td>
                          <td className="py-3 px-4">{profile.total_points.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <Badge variant={profile.is_admin ? "default" : "outline"}>
                              {profile.is_admin ? 'Admin' : 'User'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="ghost" size="sm">Edit</Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          {/* Transactions Tab Content */}
          <div className="flex justify-between items-center">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>View and manage point transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">USER</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">TYPE</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">POINTS</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">DESCRIPTION</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted-foreground">
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">{transaction.userName}</td>
                          <td className="py-3 px-4">
                            <Badge variant={transaction.type === "Earned" ? "outline" : "secondary"} className={transaction.type === "Earned" ? "text-blue-500 bg-blue-50" : "text-red-500 bg-red-50"}>
                              {transaction.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <span className={transaction.type === "Earned" ? "text-blue-500" : "text-red-500"}>
                              {transaction.type === "Earned" ? "+" : "-"}{transaction.points}
                            </span>
                          </td>
                          <td className="py-3 px-4">{transaction.description}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rewards" className="space-y-4">
          {/* Rewards Tab Content */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tiers</CardTitle>
                <CardDescription>Configure point tiers for user progression.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="p-3 rounded-md border hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{tier.name}</h3>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tier.min_points.toLocaleString()} - {tier.max_points ? tier.max_points.toLocaleString() : '∞'} points
                      </p>
                    </div>
                  ))}
                  <Button className="w-full">Add New Tier</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>Manage rewards and milestones.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="p-3 rounded-md border hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{milestone.name}</h3>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {milestone.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-sm">
                          <span className="font-medium">{milestone.points_required.toLocaleString()}</span> points required
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Value up to ${milestone.max_value}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full">Add New Milestone</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
