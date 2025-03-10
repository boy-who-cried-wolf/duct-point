import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { UseMutationResult } from '@tanstack/react-query';

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

interface RedemptionsTabProps {
  redemptionRequests: RedemptionRequest[];
  isLoading: boolean;
  searchQuery: string;
  isAdmin: boolean;
  handleStatusUpdate: (id: string, status: 'approved' | 'rejected') => void;
  updateRedemptionStatus: UseMutationResult<any, Error, { id: string; status: 'approved' | 'rejected' }, unknown>;
  activeRequest: string | null;
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

export const RedemptionsTab = ({ 
  redemptionRequests, 
  isLoading, 
  searchQuery, 
  isAdmin,
  handleStatusUpdate,
  updateRedemptionStatus,
  activeRequest
}: RedemptionsTabProps) => {
  const filteredRedemptionRequests = redemptionRequests.filter(request => 
    request.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.requestedByName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.status.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Redemption Requests</CardTitle>
        <CardDescription>
          Manage point redemption requests from organizations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
                  <CardFooter className="flex justify-end gap-2 pt-2 border-t bg-transparent">
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
  );
};

export default RedemptionsTab;
