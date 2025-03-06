
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle } from 'lucide-react';

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

interface AuditLogTabProps {
  auditLogs: AuditLog[];
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

export const AuditLogTab = ({ auditLogs, isLoading, searchQuery }: AuditLogTabProps) => {
  const filteredAuditLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          Track all actions performed on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
  );
};

export default AuditLogTab;
