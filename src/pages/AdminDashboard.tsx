
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Building, Users, Search, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

// Define types for our data
interface User {
  id: string;
  email?: string;
  full_name?: string;
  is_admin: boolean;
  company?: string;
  total_points: number;
}

interface Company {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'Earned' | 'Spent';
  points: number;
  description: string;
  date: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      toast.error('You need admin access to view this page');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch real users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*');
          
        if (usersError) {
          console.error('Error fetching users:', usersError);
          toast.error('Failed to load users data');
        } else {
          setUsers(usersData || []);
        }
        
        // Fetch real transactions from Supabase
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*, profiles(full_name)');
          
        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          toast.error('Failed to load transactions data');
        } else {
          // Transform the data to match our expected format
          const formattedTransactions = (transactionsData || []).map(transaction => ({
            id: transaction.id,
            userId: transaction.user_id,
            userName: transaction.profiles?.full_name || 'Unknown User',
            type: transaction.points > 0 ? 'Earned' : 'Spent',
            points: Math.abs(transaction.points),
            description: transaction.description || 'No description',
            date: transaction.created_at
          }));
          setTransactions(formattedTransactions);
        }
        
        // For now, we'll use mock companies (could be replaced with real data later)
        setCompanies([
          { id: '1', name: 'Acme Inc.', totalPoints: 4300, memberCount: 12 },
          { id: '2', name: 'Globex Corp', totalPoints: 2800, memberCount: 8 },
          { id: '3', name: 'Initech', totalPoints: 5600, memberCount: 15 },
          { id: '4', name: 'Umbrella Corp', totalPoints: 3100, memberCount: 9 },
        ]);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin]);

  const filteredUsers = users.filter(user => 
    (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => 
    transaction.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string = 'Unknown') => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, companies, and transactions.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Transactions
              </TabsTrigger>
            </TabsList>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Search ${activeTab}...`}
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user accounts across all organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No users found.</p>
                  ) : (
                    filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'Anonymous User'}</p>
                            <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm">{user.company || 'No company'}</p>
                            <p className="text-sm font-medium">{user.total_points || 0} points</p>
                          </div>
                          <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                            {user.is_admin ? 'Admin' : 'User'}
                          </Badge>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Companies</CardTitle>
                <CardDescription>
                  Manage organizations using the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCompanies.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No companies found.</p>
                  ) : (
                    filteredCompanies.map(company => (
                      <div key={company.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{company.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-sm text-muted-foreground">{company.memberCount} members</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">{company.totalPoints} total points</p>
                          </div>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  View all point transactions across the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTransactions.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No transactions found.</p>
                  ) : (
                    filteredTransactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(transaction.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{transaction.userName}</p>
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                          </div>
                          <Badge variant={transaction.type === 'Earned' ? 'default' : 'destructive'}>
                            {transaction.type === 'Earned' ? '+' : '-'}{transaction.points} points
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
