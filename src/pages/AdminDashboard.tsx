
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Building, Users, Search, Clock } from 'lucide-react';

// Mock data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', company: 'Acme Inc.', points: 2500 },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', company: 'Acme Inc.', points: 1800 },
  { id: 3, name: 'Robert Johnson', email: 'robert@globex.com', role: 'User', company: 'Globex Corp', points: 950 },
  { id: 4, name: 'Sarah Williams', email: 'sarah@initech.com', role: 'Admin', company: 'Initech', points: 3200 },
  { id: 5, name: 'Michael Brown', email: 'michael@umbrella.com', role: 'User', company: 'Umbrella Corp', points: 1100 },
];

const mockCompanies = [
  { id: 1, name: 'Acme Inc.', totalPoints: 4300, memberCount: 12 },
  { id: 2, name: 'Globex Corp', totalPoints: 2800, memberCount: 8 },
  { id: 3, name: 'Initech', totalPoints: 5600, memberCount: 15 },
  { id: 4, name: 'Umbrella Corp', totalPoints: 3100, memberCount: 9 },
];

const mockTransactions = [
  { id: 1, userId: 1, userName: 'John Doe', type: 'Earned', points: 100, description: 'Completed "Introduction to React" course', date: '2023-05-10T15:30:00Z' },
  { id: 2, userId: 2, userName: 'Jane Smith', type: 'Earned', points: 150, description: 'Completed "Advanced CSS" course', date: '2023-05-11T12:45:00Z' },
  { id: 3, userId: 3, userName: 'Robert Johnson', type: 'Earned', points: 75, description: 'Completed "Git Basics" course', date: '2023-05-12T09:15:00Z' },
  { id: 4, userId: 4, userName: 'Sarah Williams', type: 'Spent', points: 200, description: 'Redeemed for Amazon gift card', date: '2023-05-13T16:20:00Z' },
  { id: 5, userId: 5, userName: 'Michael Brown', type: 'Earned', points: 125, description: 'Completed "JavaScript Fundamentals" course', date: '2023-05-14T11:00:00Z' },
];

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

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = mockCompanies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = mockTransactions.filter(transaction => 
    transaction.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

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
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm">{user.company}</p>
                            <p className="text-sm font-medium">{user.points} points</p>
                          </div>
                          <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                            {user.role}
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
