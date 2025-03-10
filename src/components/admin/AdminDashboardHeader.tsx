import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';
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
  onTabChange: (value: string) => void;
}

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

export const AdminDashboardHeader = ({ 
  activeTab, 
  isAdmin, 
  isStaff,
  searchQuery,
  setSearchQuery,
  onTabChange
}: AdminDashboardHeaderProps) => {
  const tabs = [
    ...(isAdmin ? [{ name: 'Users', value: 'users', icon: <Users className="h-4 w-4 mr-2" /> }] : []),
    ...(isAdmin ? [{ name: 'Organizations', value: 'companies', icon: <Building className="h-4 w-4 mr-2" /> }] : []),
    ...(isAdmin ? [{ name: 'Transactions', value: 'transactions', icon: <Activity className="h-4 w-4 mr-2" /> }] : []),
    { name: 'Redemptions', value: 'redemptions', icon: <CheckCircle className="h-4 w-4 mr-2" /> },
    ...(isAdmin ? [{ name: 'Courses', value: 'courses', icon: <BookOpen className="h-4 w-4 mr-2" /> }] : []),
    ...(isAdmin ? [{ name: 'Audit Log', value: 'audit', icon: <FileText className="h-4 w-4 mr-2" /> }] : []),
    ...(isAdmin ? [{ name: 'CSV Import', value: 'csv-import', icon: <Upload className="h-4 w-4 mr-2" /> }] : []),
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        {/* Mobile dropdown for tabs */}
        <div className="grid grid-cols-1 sm:hidden w-64">
          <select
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value)}
            aria-label="Select a tab"
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600"
          >
            {tabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
          />
        </div>

        {/* Tabs for larger screens */}
        <div className="hidden sm:block">
          <div className="border-b border-gray-200 w-full">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <a
                  key={tab.value}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onTabChange(tab.value);
                  }}
                  aria-current={activeTab === tab.value ? 'page' : undefined}
                  className={classNames(
                    activeTab === tab.value
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap flex items-center'
                  )}
                >
                  {tab.icon}
                  {tab.name}
                </a>
              ))}
            </nav>
          </div>
        </div>

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
    </div>
  );
};

export default AdminDashboardHeader;
