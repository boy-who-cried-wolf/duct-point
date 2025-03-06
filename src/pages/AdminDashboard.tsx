import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Building, 
  Users, 
  Search, 
  Clock, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Database
} from 'lucide-react';
import { useAuth } from '../App';
import { supabase, logError, logSuccess, logInfo } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CSVImport from '@/components/CSVImport';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  points: number;
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
  type: string;
  points: number;
  description: string;
  date: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  createdAt: string;
}

interface RedemptionRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  requestedBy: string;
  requestedByName: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CSVUpload {
  id: string;
  fileName: string;
  uploadedBy: string;
  uploadedByName: string;
  rowCount: number;
  createdAt: string;
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

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, company, total_points');
    
  if (error) {
    logError('Failed to fetch users', error);
    throw error;
  }
  
  const { data: roleData, error: roleError } = await supabase
    .from('user_platform_roles')
    .select('user_id, role');
    
  if (roleError) {
    logError('Failed to fetch user roles', roleError);
  }
  
  const roleMap = new Map();
  if (roleData) {
    roleData.forEach(item => {
      roleMap.set(item.user_id, item.role);
    });
  }
  
  return data.map(user => ({
    id: user.id,
    name: user.full_name || 'Unknown',
    email: user.email || 'No email',
    role: roleMap.get(user.id) || 'user',
    company: user.company || 'No company',
    points: user.total_points || 0
  }));
};

const fetchCompanies = async (): Promise<Company[]> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name');
    
  if (error) {
    logError('Failed to fetch companies', error);
    throw error;
  }
  
  const companyIds = data.map(org => org.id);
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, user_id')
    .in('organization_id', companyIds);
    
  if (memberError) {
    logError('Failed to fetch organization members', memberError);
    throw memberError;
  }
  
  const memberCounts = new Map();
  memberData.forEach(member => {
    const count = memberCounts.get(member.organization_id) || 0;
    memberCounts.set(member.organization_id, count + 1);
  });
  
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, total_points');
    
  if (profilesError) {
    logError('Failed to fetch user profiles', profilesError);
    throw profilesError;
  }
  
  const pointsMap = new Map();
  profilesData.forEach(profile => {
    pointsMap.set(profile.id, profile.total_points || 0);
  });
  
  const orgUserMap = new Map();
  memberData.forEach(member => {
    const users = orgUserMap.get(member.organization_id) || [];
    users.push(member.user_id);
    orgUserMap.set(member.organization_id, users);
  });
  
  const orgPoints = new Map();
  for (const [orgId, userIds] of orgUserMap.entries()) {
    let totalPoints = 0;
    userIds.forEach(userId => {
      totalPoints += pointsMap.get(userId) || 0;
    });
    orgPoints.set(orgId, totalPoints);
  }
  
  return data.map(org => ({
    id: org.id,
    name: org.name,
    totalPoints: orgPoints.get(org.id) || 0,
    memberCount: memberCounts.get(org.id) || 0
  }));
};

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, user_id, points, description, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) {
    logError('Failed to fetch transactions', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(tx => tx.user_id))];
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for transactions', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(tx => ({
    id: tx.id,
    userId: tx.user_id,
    userName: userMap.get(tx.user_id) || 'Unknown User',
    type: tx.points >= 0 ? 'Earned' : 'Spent',
    points: Math.abs(tx.points),
    description: tx.description || 'No description',
    date: tx.created_at
  }));
};

const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
    
  if (error) {
    logError('Failed to fetch audit logs', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for audit logs', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(log => ({
    id: log.id,
    userId: log.user_id,
    userName: log.user_id ? userMap.get(log.user_id) || 'Unknown User' : 'System',
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    details: log.details,
    createdAt: log.created_at
  }));
};

const fetchRedemptionRequests = async (): Promise<RedemptionRequest[]> => {
  const { data, error } = await supabase
    .from('redemption_requests')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    logError('Failed to fetch redemption requests', error);
    throw error;
  }
  
  const orgIds = [...new Set(data.map(req => req.organization_id))];
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds);
    
  if (orgError) {
    logError('Failed to fetch organization data', orgError);
    throw orgError;
  }
  
  const orgMap = new Map();
  orgData.forEach(org => {
    orgMap.set(org.id, org.name);
  });
  
  const userIds = [
    ...new Set([
      ...data.map(req => req.requested_by),
      ...data.map(req => req.approved_by).filter(Boolean)
    ])
  ];
  
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for redemption requests', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(req => ({
    id: req.id,
    organizationId: req.organization_id,
    organizationName: orgMap.get(req.organization_id) || 'Unknown Organization',
    requestedBy: req.requested_by,
    requestedByName: userMap.get(req.requested_by) || 'Unknown User',
    points: req.points,
    status: req.status,
    reason: req.reason || '',
    approvedBy: req.approved_by,
    approvedByName: req.approved_by ? userMap.get(req.approved_by) || 'Unknown User' : null,
    createdAt: req.created_at,
    updatedAt: req.updated_at
  }));
};

const fetchCSVUploads = async (): Promise<CSVUpload[]> => {
  const { data, error } = await supabase
    .from('organizations_data_uploads')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    logError('Failed to fetch CSV uploads', error);
    throw error;
  }
  
  const userIds = [...new Set(data.map(upload => upload.uploaded_by).filter(Boolean))];
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
    
  if (userError) {
    logError('Failed to fetch user data for CSV uploads', userError);
    throw userError;
  }
  
  const userMap = new Map();
  userData.forEach(user => {
    userMap.set(user.id, user.full_name || user.email || 'Unknown User');
  });
  
  return data.map(upload => ({
    id: upload.id,
    fileName: upload.file_name,
    uploadedBy: upload.uploaded_by,
    uploadedByName: userMap.get(upload.uploaded_by) || 'Unknown User',
    rowCount: upload.row_count,
    createdAt: upload.created_at
  }));
};

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'users';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin, isStaff, user, logAuditEvent } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: isAdmin || isStaff
  });

  const { 
    data: companies = [], 
    isLoading: isLoadingCompanies 
  } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: fetchCompanies,
    enabled: isAdmin || isStaff
  });

  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: fetchTransactions,
    enabled: isAdmin
  });

  const { 
    data: auditLogs = [], 
    isLoading: isLoadingAuditLogs 
  } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: fetchAuditLogs,
    enabled: isAdmin
  });

  const { 
    data: redemptionRequests = [], 
    isLoading: isLoadingRedemptions 
  } = useQuery({
    queryKey: ['admin', 'redemption-requests'],
    queryFn: fetchRedemptionRequests,
    enabled: isAdmin || isStaff
  });

  const { 
    data: csvUploads = [], 
    isLoading: isLoadingCSVUploads 
  } = useQuery({
    queryKey: ['admin', 'csv-uploads'],
    queryFn: fetchCSVUploads,
    enabled: isAdmin
  });

  const updateRedemptionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { data, error } = await supabase
        .from('redemption_requests')
        .update({ 
          status, 
          approved_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) {
        logError('Failed to update redemption request', error);
        throw error;
      }
      
      await logAuditEvent(
        `redemption_request_${status}`,
        'redemption_request',
        id,
        { status }
      );
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'redemption-requests'] });
      toast.success(`Redemption request ${activeStatus === 'approved' ? 'approved' : 'rejected'} successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update redemption request: ${error.message}`);
    }
  });

  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<'approved' | 'rejected'>('approved');

  const handleStatusUpdate = (id: string, status: 'approved' | 'rejected') => {
    setActiveRequest(id);
    setActiveStatus(status);
    updateRedemptionStatus.mutate({ id, status });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction => 
    transaction.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRedemptionRequests = redemptionRequests.filter(request => 
    request.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.requestedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCSVUploads = csvUploads.filter(upload => 
    upload.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    upload.uploadedByName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage users, organizations, and platform settings."
              : "Manage redemption requests and view platform data."}
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
              {isAdmin && (
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="companies" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Organizations
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Transactions
                </TabsTrigger>
              )}
              <TabsTrigger value="redemptions" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Redemptions
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Audit Log
                </TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="csv-import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  CSV Import
                </TabsTrigger>
              )}
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

          {isAdmin && (
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    Manage user accounts across all organizations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="text-center py-8">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No users found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredUsers.map(user => (
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
                            <Badge 
                              variant={
                                user.role === 'super_admin' 
                                  ? 'default' 
                                  : user.role === 'staff' 
                                    ? 'secondary' 
                                    : 'outline'
                              }
                            >
                              {user.role === 'super_admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'User'}
                            </Badge>
                            <Button variant="outline" size="sm">Edit</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="companies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Organizations</CardTitle>
                  <CardDescription>
                    Manage organizations using the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCompanies ? (
                    <div className="text-center py-8">Loading organizations...</div>
                  ) : filteredCompanies.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No organizations found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredCompanies.map(company => (
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                  <CardDescription>
                    View all point transactions across the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingTransactions ? (
                    <div className="text-center py-8">Loading transactions...</div>
                  ) : filteredTransactions.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No transactions found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredTransactions.map(transaction => (
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="redemptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Redemption Requests</CardTitle>
                <CardDescription>
                  Manage point redemption requests from organizations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRedemptions ? (
                  <div className="text-center py-8">Loading redemption requests...</div>
                ) : filteredRedemptionRequests.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No redemption requests found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredRedemptionRequests.map(request => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg font-medium">{request.organizationName}</CardTitle>
                              <CardDescription>
                                Requested by {request.requestedByName} on {formatDate(request.createdAt)}
                              </CardDescription>
                            </div>
                            <Badge variant={
                              request.status === 'approved' 
                                ? 'default' 
                                : request.status === 'rejected' 
                                  ? 'destructive' 
                                  : 'outline'
                            }>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Points Requested</h4>
                              <p className="text-2xl font-bold">{request.points.toLocaleString()}</p>
                            </div>
                            {request.reason && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Reason</h4>
                                <p className="text-sm">{request.reason}</p>
                              </div>
                            )}
                          </div>
                          
                          {request.status !== 'pending' && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm">
                                {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approvedByName} on {formatDate(request.updatedAt)}
                              </p>
                            </div>
                          )}
                        </CardContent>
                        
                        {request.status === 'pending' && isAdmin && (
                          <CardFooter className="flex justify-end gap-2 bg-muted/30 pt-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={updateRedemptionStatus.isPending && activeRequest === request.id}
                              onClick={() => handleStatusUpdate(request.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              disabled={updateRedemptionStatus.isPending && activeRequest === request.id}
                              onClick={() => handleStatusUpdate(request.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Track all actions performed on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAuditLogs ? (
                  <div className="text-center py-8">Loading audit logs...</div>
                ) : filteredAuditLogs.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No audit logs found.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredAuditLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(log.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{log.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{log.action}</span> - {log.entityType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <AlertCircle className="h-4 w-4" />
                            <span className="sr-only">Details</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="csv-import" className="space-y-4">
              <div className="grid gap-4 grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Organization Data</CardTitle>
                    <CardDescription>
                      Upload a CSV file containing organization data. The file should have columns for Company ID, Company Name, and YTD Spend.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CSVImport 
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin', 'csv-uploads'] });
                        queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Upload History</CardTitle>
                    <CardDescription>
                      Previous CSV uploads and their status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingCSVUploads ? (
                      <div className="text-center py-8">Loading upload history...</div>
                    ) : filteredCSVUploads.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No uploads found.</p>
                    ) : (
                      <div className="space-y-4">
                        {filteredCSVUploads.map(upload => (
                          <div key={upload.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback><Database className="h-4 w-4" /></AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{upload.fileName}</p>
                                <p className="text-sm text-muted-foreground">Uploaded by {upload.uploadedByName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">{formatDate(upload.createdAt)}</p>
                              </div>
                              <Badge variant="outline">{upload.rowCount} rows</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
