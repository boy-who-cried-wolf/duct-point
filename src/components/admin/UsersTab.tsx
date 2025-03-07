
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  points: number;
}

interface UsersTabProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

export const UsersTab = ({ users, isLoading, searchQuery }: UsersTabProps) => {
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          Manage user accounts across all organizations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
  );
};

export default UsersTab;
