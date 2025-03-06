import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Mail, Users, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data for team members
const initialMembers = [{
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'Admin',
  avatar: '',
  points: 2500
}, {
  id: 2,
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  role: 'User',
  avatar: '',
  points: 1800
}, {
  id: 3,
  name: 'Robert Johnson',
  email: 'robert.johnson@example.com',
  role: 'User',
  avatar: '',
  points: 950
}];
const Organization = () => {
  const [members, setMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMember, setNewMember] = useState({
    email: '',
    name: '',
    role: 'User'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter members based on search query
  const filteredMembers = members.filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add new member to the list
      const newId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
      const memberToAdd = {
        id: newId,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        avatar: '',
        points: 0
      };
      setMembers([...members, memberToAdd]);
      setNewMember({
        email: '',
        name: '',
        role: 'User'
      });
      toast.success('Team member added successfully');
    } catch (error) {
      toast.error('Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleNewMemberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };
  return <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Organization</h1>
          <p className="text-muted-foreground">
            Manage your team members and their access.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage your team and their roles.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search members..." className="pl-8 w-[200px]" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMembers.length === 0 ? <p className="text-center py-4 text-muted-foreground">No members found.</p> : filteredMembers.map(member => <div key={member.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
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
                          <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Team Member
              </CardTitle>
              <CardDescription>
                Invite a new member to join your team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required value={newMember.name} onChange={handleNewMemberChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required value={newMember.email} onChange={handleNewMemberChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select id="role" name="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={newMember.role} onChange={e => setNewMember(prev => ({
                  ...prev,
                  role: e.target.value
                }))}>
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Member'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Organization;