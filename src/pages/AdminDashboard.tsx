
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Admin Dashboard Components
import UsersTab from '@/components/admin/UsersTab';
import CompaniesTab from '@/components/admin/CompaniesTab';
import TransactionsTab from '@/components/admin/TransactionsTab';
import RedemptionsTab from '@/components/admin/RedemptionsTab';
import AuditLogTab from '@/components/admin/AuditLogTab';
import CSVImportTab from '@/components/admin/CSVImportTab';
import CoursesTab from '@/components/admin/CoursesTab';
import AdminDashboardHeader from '@/components/admin/AdminDashboardHeader';

// API Functions
import { 
  fetchUsers, 
  fetchCompanies, 
  fetchTransactions, 
  fetchAuditLogs, 
  fetchRedemptionRequests, 
  fetchCSVUploads 
} from '@/components/admin/api';

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
          <AdminDashboardHeader 
            activeTab={activeTab}
            isAdmin={isAdmin}
            isStaff={isStaff}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {isAdmin && (
            <TabsContent value="users" className="space-y-4">
              <UsersTab 
                users={users} 
                isLoading={isLoadingUsers} 
                searchQuery={searchQuery} 
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="companies" className="space-y-4">
              <CompaniesTab 
                companies={companies} 
                isLoading={isLoadingCompanies} 
                searchQuery={searchQuery} 
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="transactions" className="space-y-4">
              <TransactionsTab 
                transactions={transactions} 
                isLoading={isLoadingTransactions} 
                searchQuery={searchQuery} 
              />
            </TabsContent>
          )}

          <TabsContent value="redemptions" className="space-y-4">
            <RedemptionsTab 
              redemptionRequests={redemptionRequests} 
              isLoading={isLoadingRedemptions} 
              searchQuery={searchQuery}
              isAdmin={isAdmin}
              handleStatusUpdate={handleStatusUpdate}
              updateRedemptionStatus={updateRedemptionStatus}
              activeRequest={activeRequest}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="courses" className="space-y-4">
              <CoursesTab 
                isLoading={false}
                searchQuery={searchQuery} 
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="audit" className="space-y-4">
              <AuditLogTab 
                auditLogs={auditLogs} 
                isLoading={isLoadingAuditLogs} 
                searchQuery={searchQuery} 
              />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="csv-import" className="space-y-4">
              <CSVImportTab 
                csvUploads={csvUploads} 
                isLoading={isLoadingCSVUploads} 
                searchQuery={searchQuery}
                queryClient={queryClient}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
