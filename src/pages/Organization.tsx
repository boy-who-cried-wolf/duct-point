import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Mail, Users, Search, Activity, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../App';
import { supabase } from '../integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
interface Member {
  id: number;
  userId: string;
  name: string;
  email: string;
  role: 'org_admin' | 'org_user';
  avatar: string;
  points: number;
}

interface Organization {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
}

interface RedemptionRequest {
  id: string;
  points: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Fetch functions
const fetchOrganizationData = async (userId: string | undefined) => {
  if (!userId) return null;
  
  // First get the user's organization
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();
    
  if (memberError) {
    // If error is not found, user doesn't belong to an organization yet
    if (memberError.code !== 'PGRST116') {
      throw memberError;
    }
    return null;
  }
  
  if (!memberData) return null;
  
  // Get organization details
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', memberData.organization_id)
    .single();
    
  if (orgError) throw orgError;
  
  // Get all members of this organization
  const { data: membersData, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', memberData.organization_id);
    
  if (membersError) throw membersError;
  
  // Get profiles for all members
  const memberIds = membersData.map(m => m.user_id);
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, total_points')
    .in('id', memberIds);
    
  if (profilesError) throw profilesError;
  
  // Create a map of user_id to role
  const roleMap = new Map();
  membersData.forEach(m => {
    roleMap.set(m.user_id, m.role);
  });
  
  // Calculate total organization points
  const totalPoints = profilesData.reduce((sum, profile) => sum + (profile.total_points || 0), 0);
  
  // Create members array
  const members = profilesData.map((profile, index) => ({
    id: index + 1,
    userId: profile.id,
    name: profile.full_name || 'Unknown',
    email: profile.email || 'No email',
    role: roleMap.get(profile.id) || 'org_user',
    avatar: profile.avatar_url || '',
    points: profile.total_points || 0
  }));
  
  // Get redemption requests
  const { data: requestsData, error: requestsError } = await supabase
    .from('redemption_requests')
    .select('id, points, reason, status, created_at')
    .eq('organization_id', memberData.organization_id)
    .order('created_at', { ascending: false });
    
  if (requestsError) throw requestsError;
  
  const redemptionRequests = requestsData.map(req => ({
    id: req.id,
    points: req.points,
    reason: req.reason || '',
    status: req.status,
    createdAt: req.created_at
  }));
  
  return {
    userRole: memberData.role,
    organization: {
      id: orgData.id,
      name: orgData.name,
      totalPoints,
      memberCount: members.length
    },
    members,
    redemptionRequests
  };
};

// Component
const Organization = () => {
  const { user, logAuditEvent } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMember, setNewMember] = useState({
    email: '',
    name: '',
    role: 'org_user' as 'org_admin' | 'org_user'
  });
  const [requestData, setRequestData] = useState({
    points: 0,
    reason: ''
  });
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch organization data
  const { 
    data: orgData, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['organization', user?.id],
    queryFn: () => fetchOrganizationData(user?.id),
    enabled: !!user?.id
  });
  
  // Create redemption request mutation
  const createRedemptionRequest = useMutation({
    mutationFn: async ({ points, reason }: { points: number, reason: string }) => {
      if (!orgData?.organization?.id) {
        throw new Error('No organization found');
      }
      
      const { data, error } = await supabase
        .from('redemption_requests')
        .insert({
          organization_id: orgData.organization.id,
          requested_by: user?.id,
          points,
          reason,
          status: 'pending' as 'pending' | 'approved' | 'rejected'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Log audit event
      await logAuditEvent(
        'redemption_request_created',
        'redemption_request',
        data.id,
        { points, organization_id: orgData.organization.id }
      );
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', user?.id] });
      toast.success('Redemption request submitted successfully');
      setIsRequestDialogOpen(false);
      setRequestData({ points: 0, reason: '' });
    },
    onError: (error) => {
      toast.error(`Failed to submit redemption request: ${error.message}`);
    }
  });
  
  // Handle adding a new member
  const addMember = useMutation({
    mutationFn: async ({ email, name, role }: { email: string, name: string, role: 'org_admin' | 'org_user' }) => {
      if (!orgData?.organization?.id) {
        throw new Error('No organization found');
      }
      
      // First check if user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('User with this email does not exist');
        }
        throw userError;
      }
      
      // Check if user is already in another organization
      const { data: existingMember, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userData.id);
        
      if (memberError) throw memberError;
      
      if (existingMember && existingMember.length > 0) {
        throw new Error('User is already a member of another organization');
      }
      
      // Add user to organization
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          user_id: userData.id,
          organization_id: orgData.organization.id,
          role: role
        })
        .select();
        
      if (error) throw error;
      
      // Log audit event
      await logAuditEvent(
        'member_added',
        'organization_member',
        data[0].id,
        { user_id: userData.id, organization_id: orgData.organization.id, role }
      );
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', user?.id] });
      toast.success('Team member added successfully');
      setNewMember({
        email: '',
        name: '',
        role: 'org_user'
      });
    },
    onError: (error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    }
  });
  
  // Handle submitting a redemption request
  const handleSubmitRequest = () => {
    if (requestData.points <= 0) {
      toast.error('Points must be a positive number');
      return;
    }
    
    if (requestData.points > (orgData?.organization?.totalPoints || 0)) {
      toast.error('Cannot request more points than your organization has');
      return;
    }
    
    createRedemptionRequest.mutate(requestData);
  };
  
  // Handle adding a new member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMember.mutate(newMember);
  };
  
  // Filter members based on search query
  const filteredMembers = orgData?.members?.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  
  if (isLoading) {
    return (
      <div className="animate-fade-in flex justify-center items-center h-64">
        <p>Loading organization data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-center items-center h-64 flex-col gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Error Loading Organization</h2>
          <p className="text-muted-foreground">
            {(error as Error).message || 'An error occurred while loading organization data'}
          </p>
        </div>
      </div>
    );
  }
  
  if (!orgData || !orgData.organization) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Organization</h1>
            <p className="text-muted-foreground">
              You are not currently a member of any organization.
            </p>
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Join an Organization</CardTitle>
            <CardDescription>
              Contact your organization administrator to get an invitation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  const isOrgAdmin = orgData.userRole === 'org_admin';
  
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Organization</h1>
          <p className="text-muted-foreground">
            Manage your team members and organization settings.
          </p>
        </div>
        
        {isOrgAdmin && (
          <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                Request Points Redemption
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Points Redemption</DialogTitle>
                <DialogDescription>
                  Submit a request to redeem points for your organization. Your request will be reviewed by the platform administrators.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points to Redeem</Label>
                  <Input
                    id="points"
                    type="number"
                    value={requestData.points}
                    onChange={(e) => setRequestData(prev => ({ ...prev, points: Number(e.target.value) }))}
                    min={1}
                    max={orgData.organization.totalPoints}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {orgData.organization.totalPoints} points
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Redemption (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for this redemption request"
                    value={requestData.reason}
                    onChange={(e) => setRequestData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRequestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitRequest}
                  disabled={
                    createRedemptionRequest.isPending || 
                    requestData.points <= 0 || 
                    requestData.points > orgData.organization.totalPoints
                  }
                >
                  {createRedemptionRequest.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {orgData.organization.name}
                  </CardTitle>
                  <CardDescription>
                    {orgData.organization.memberCount} members · {orgData.organization.totalPoints.toLocaleString()} total points
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search members..." 
                    className="pl-8 w-[200px]" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMembers.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No members found.</p>
                ) : (
                  filteredMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">{member.points} points</p>
                          <Badge variant={member.role === 'org_admin' ? 'default' : 'secondary'}>
                            {member.role === 'org_admin' ? 'Admin' : 'Member'}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Redemption Requests */}
          {isOrgAdmin && orgData.redemptionRequests && orgData.redemptionRequests.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Redemption Requests
                </CardTitle>
                <CardDescription>
                  Track the status of your organization's redemption requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orgData.redemptionRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{request.points.toLocaleString()} Points</p>
                          {request.reason && (
                            <p className="text-sm text-muted-foreground">{request.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleDateString()}</p>
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {isOrgAdmin && (
          <div className="md:col-span-1">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Team Member
                </CardTitle>
                <CardDescription>
                  Invite a new member to join your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="john.doe@example.com" 
                      required 
                      value={newMember.email} 
                      onChange={(e) => setNewMember(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      User must already be registered on the platform
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select 
                      id="role" 
                      name="role" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                      value={newMember.role} 
                      onChange={(e) => setNewMember(prev => ({
                        ...prev,
                        role: e.target.value
                      }))}
                    >
                      <option value="org_user">Member</option>
                      <option value="org_admin">Admin</option>
                    </select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addMember.isPending}
                  >
                    {addMember.isPending ? 'Adding...' : 'Add Member'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Organization;
