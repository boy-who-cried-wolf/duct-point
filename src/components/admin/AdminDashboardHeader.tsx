
import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Building, 
  Users, 
  CheckCircle, 
  FileText,
  Upload,
  BookOpen
} from 'lucide-react';

interface AdminDashboardHeaderProps {
  activeTab: string;
  isAdmin: boolean;
  isStaff: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const AdminDashboardHeader = ({ 
  activeTab, 
  isAdmin, 
  isStaff,
  searchQuery,
  setSearchQuery
}: AdminDashboardHeaderProps) => {
  return (
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
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
        )}
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
  );
};

export default AdminDashboardHeader;
