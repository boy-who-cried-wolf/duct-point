import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, MoreHorizontal, ExternalLink, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface Company {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
  ytdSpend?: number;
  companyId?: string;
}

interface CompaniesTabProps {
  companies: Company[];
  isLoading: boolean;
  searchQuery: string;
}

// Format currency with commas and dollar sign
const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

// Format numbers with commas
const formatNumber = (num: number | undefined) => {
  if (num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

// Mock user avatars for the demo
const mockUserAvatars = [
  'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
];

export const CompaniesTab = ({ companies, isLoading, searchQuery }: CompaniesTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Add debug logging for incoming props
  console.log('CompaniesTab render:', { 
    isLoading, 
    companiesCount: companies?.length || 0,
    searchQuery,
    firstCompany: companies?.[0] || 'No companies'
  });
  
  // Create safe filtered companies with fallback
  const safeCompanies = companies || [];
  const filteredCompanies = safeCompanies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // If companies is empty but not loading, show special message
  const showEmptyState = !isLoading && (!companies || companies.length === 0);
  
  // Add more detailed empty state UI
  const renderEmptyState = () => (
    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">No Organizations Found</h3>
      <p className="mt-1 text-sm text-gray-500">
        There are no organizations in the database, or there was an error loading the data.
      </p>
      <p className="mt-3 text-xs text-gray-500">
        Try uploading organization data using the CSV Import feature.
      </p>
    </div>
  );
  
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + itemsPerPage);
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  // Generate random user avatars based on member count
  const getUserAvatars = (count: number) => {
    // Limit to a maximum of 5 visible avatars
    const visibleCount = Math.min(count, 5);
    const avatars = [];
    
    for (let i = 0; i < visibleCount; i++) {
      avatars.push(mockUserAvatars[i % mockUserAvatars.length]);
    }
    
    return avatars;
  };

  return (
    <div className="w-full max-w-none">
      <div className="flex justify-between w-full max-w-none">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Organizations</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all organizations in the platform including their YTD spend, total points, and member count.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Add Organization
          </button>
        </div>
      </div>
      
      <div className="mt-8 w-full max-w-none">
        <div className="overflow-x-auto w-full max-w-none">
          <div className="w-full max-w-none">
            {isLoading ? (
              <div className="text-center py-8">Loading organizations...</div>
            ) : showEmptyState ? (
              renderEmptyState()
            ) : (
              <>
                <table className="w-full max-w-none table-auto">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                        Company ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        YTD Spend
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Points
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Users
                      </th>
                      <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-3">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedCompanies.map((company, idx) => (
                      <tr key={company.id} className={idx % 2 === 0 ? undefined : 'bg-gray-50'}>
                        <td className="py-4 pr-3 pl-4 text-sm font-bold whitespace-nowrap text-gray-900 sm:pl-3">
                          {company.companyId || '-'}
                        </td>
                        <td className="px-3 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                          {company.name}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                          <span className="flex items-center">
                            {company.ytdSpend ? (
                              <>
                                <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                                {formatCurrency(company.ytdSpend)}
                              </>
                            ) : (
                              <span className="text-gray-400">YTD Spend not available</span>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 font-medium">
                          {formatNumber(company.totalPoints)}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                          <div className="flex -space-x-2">
                            {getUserAvatars(company.memberCount).map((avatar, i) => (
                              <img
                                key={i}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                                src={avatar}
                                alt=""
                              />
                            ))}
                            {company.memberCount > 5 && (
                              <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-xs font-medium text-gray-700 ring-2 ring-white">
                                +{company.memberCount - 5}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                          <a href="#" className="text-red-600 hover:text-red-900 flex items-center justify-end">
                            View
                            <ArrowRight className="h-4 w-4 ml-1" />
                            <span className="sr-only">, {company.name}</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Updated Pagination UI */}
                <nav
                  aria-label="Pagination"
                  className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 mt-4 w-full max-w-none"
                >
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredCompanies.length)}
                      </span> of{' '}
                      <span className="font-medium">{filteredCompanies.length}</span> results
                    </p>
                  </div>
                  <div className="flex flex-1 justify-between sm:justify-end">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePrevPage();
                      }}
                      className={`relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 ${
                        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Previous
                    </a>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNextPage();
                      }}
                      className={`relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 ${
                        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Next
                    </a>
                  </div>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesTab;
