import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Activity, 
  Building, 
  Users, 
  CheckCircle, 
  FileText,
  Upload,
  BookOpen,
  RefreshCw
} from 'lucide-react';

// Admin Dashboard Components
import UsersTab from '@/components/admin/UsersTab';
import CompaniesTab from '@/components/admin/CompaniesTab';
import TransactionsTab from '@/components/admin/TransactionsTab';
import RedemptionsTab from '@/components/admin/RedemptionsTab';
import AuditLogTab from '@/components/admin/AuditLogTab';
import CSVImportTab from '@/components/admin/CSVImportTab';
import CoursesTab from '@/components/admin/CoursesTab';
import TabsNavigation from '@/components/ui/TabsNavigation';
import MigrateFinancialData from '@/components/admin/MigrateFinancialData';

// API Functions
import { 
  fetchUsers, 
  fetchCompanies, 
  fetchTransactions, 
  fetchAuditLogs, 
  fetchRedemptionRequests, 
  fetchCSVUploads 
} from '@/components/admin/api';

// Add full width styles to the root HTML element
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('w-full', 'max-w-none');
  document.body.classList.add('w-full', 'max-w-none');
}

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'users';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const { platformRole, user, logAuditEvent } = useAuth();
  const queryClient = useQueryClient();
  
  // Helper functions to check roles
  const isAdmin = platformRole === 'super_admin';
  const isStaff = platformRole === 'staff' || platformRole === 'super_admin';
  
  // Update the active tab when the URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab') || 'users';
    setActiveTab(tab);
  }, [searchParams]);

  const { 
    data: users = [], 
    isLoading: isLoadingUsers 
  } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
    enabled: (isAdmin || isStaff) && (activeTab === 'users'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: companies = [], 
    isLoading: isLoadingCompanies,
    error: companiesError
  } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: fetchCompanies,
    enabled: (isAdmin || isStaff) && (activeTab === 'companies'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: transactions = [], 
    isLoading: isLoadingTransactions 
  } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: fetchTransactions,
    enabled: isAdmin && (activeTab === 'transactions'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: auditLogs = [], 
    isLoading: isLoadingAuditLogs 
  } = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: fetchAuditLogs,
    enabled: isAdmin && (activeTab === 'audit'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: redemptionRequests = [], 
    isLoading: isLoadingRedemptions 
  } = useQuery({
    queryKey: ['admin', 'redemption-requests'],
    queryFn: fetchRedemptionRequests,
    enabled: (isAdmin || isStaff) && (activeTab === 'redemptions'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { 
    data: csvUploads = [], 
    isLoading: isLoadingCSVUploads 
  } = useQuery({
    queryKey: ['admin', 'csv-uploads'],
    queryFn: fetchCSVUploads,
    enabled: isAdmin && (activeTab === 'csv-import'),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
  
  // Handle tab change
  const handleTabChange = (href: string) => {
    const newTab = href.includes('?tab=') ? href.split('?tab=')[1] : 'users';
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    navigate(`/admin?tab=${newTab}`);
  };
  
  // Define admin tabs
  const adminTabs = [
    { name: 'Users', href: '/admin?tab=users', icon: Users },
    { name: 'Companies', href: '/admin?tab=companies', icon: Building },
    { name: 'Transactions', href: '/admin?tab=transactions', icon: Activity },
    { name: 'Redemptions', href: '/admin?tab=redemptions', icon: CheckCircle },
    { name: 'Audit Log', href: '/admin?tab=audit', icon: FileText },
    { name: 'CSV Import', href: '/admin?tab=csv-import', icon: Upload },
    { name: 'Courses', href: '/admin?tab=courses', icon: BookOpen },
    // New migration tab only for super admins
    ...(platformRole === 'super_admin' ? [
      { name: 'Migrate Data', href: '/admin?tab=migrate', icon: RefreshCw }
    ] : [])
  ].filter(tab => {
    // Only show tabs the user has permission to see
    if (tab.name === 'Redemptions') {
      return isStaff; // Any staff or admin can approve redemptions
    }
    if (['Users', 'Companies', 'Transactions', 'Audit Log', 'CSV Import', 'Courses', 'Migrate Data'].includes(tab.name)) {
      return isAdmin; // Only admins can see these tabs
    }
    return true;
  });

  // Add a useEffect to monitor the companies fetch
  useEffect(() => {
    if (activeTab === 'companies') {
      if (companiesError) {
        console.error('Companies data error:', companiesError);
      } else if (!isLoadingCompanies) {
        console.log('Companies data loaded:', {
          count: companies?.length || 0,
          data: companies
        });
      }
    }
  }, [activeTab, companies, isLoadingCompanies, companiesError]);

  // Render the content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return isAdmin ? (
          <UsersTab 
            users={users} 
            isLoading={isLoadingUsers} 
            searchQuery={searchQuery} 
          />
        ) : null;
      
      case 'companies':
        return isAdmin ? (
          <CompaniesTab 
            companies={companies} 
            isLoading={isLoadingCompanies} 
            searchQuery={searchQuery} 
          />
        ) : null;
      
      case 'transactions':
        return isAdmin ? (
          <TransactionsTab 
            transactions={transactions} 
            isLoading={isLoadingTransactions} 
            searchQuery={searchQuery} 
          />
        ) : null;
      
      case 'redemptions':
        return (
          <RedemptionsTab 
            redemptionRequests={redemptionRequests} 
            isLoading={isLoadingRedemptions} 
            searchQuery={searchQuery}
            isAdmin={isAdmin}
            handleStatusUpdate={handleStatusUpdate}
            updateRedemptionStatus={updateRedemptionStatus}
            activeRequest={activeRequest}
          />
        );
      
      case 'courses':
        return isAdmin ? (
          <CoursesTab 
            isLoading={false}
            searchQuery={searchQuery} 
          />
        ) : null;
      
      case 'audit':
        return isAdmin ? (
          <AuditLogTab 
            auditLogs={auditLogs} 
            isLoading={isLoadingAuditLogs} 
            searchQuery={searchQuery} 
          />
        ) : null;
      
      case 'csv-import':
        return isAdmin ? (
          <CSVImportTab 
            csvUploads={csvUploads} 
            isLoading={isLoadingCSVUploads} 
            searchQuery={searchQuery}
            queryClient={queryClient}
          />
        ) : null;
      
      case 'migrate':
        return isAdmin ? (
          <div className="space-y-6">
            <MigrateFinancialData />
            {/* Other migration tools can be added here */}
          </div>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-none">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin 
            ? "Manage users, organizations, and platform settings."
            : "Manage redemption requests and view platform data."}
        </p>
      </div>
      
      {/* Horizontal tabs navigation */}
      <div className="mb-6">
        <TabsNavigation 
          tabs={adminTabs} 
          onChange={handleTabChange}
          activeColor="red"
        />
      </div>
      
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;
