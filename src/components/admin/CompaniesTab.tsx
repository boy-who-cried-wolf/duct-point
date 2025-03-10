
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, MoreHorizontal, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
  if (amount === undefined) return 'No data';
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

export const CompaniesTab = ({ companies, isLoading, searchQuery }: CompaniesTabProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold">Organizations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all organizations in the platform including their YTD spend, total points, and member count.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button>
            Add Organization
          </Button>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="text-center py-8">Loading organizations...</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No organizations found.</div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        className="py-3 pr-3 pl-4 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase sm:pl-0"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                      >
                        YTD Spend
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                      >
                        Total Points
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase"
                      >
                        Users
                      </th>
                      <th scope="col" className="relative py-3 pr-4 pl-3 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-muted/50">
                        <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap sm:pl-0">
                          <div className="flex flex-col">
                            <span>{company.name}</span>
                            {company.companyId && (
                              <Badge variant="outline" className="w-fit mt-1">
                                ID: {company.companyId}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap">
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            {formatCurrency(company.ytdSpend)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap font-medium">
                          {formatNumber(company.totalPoints)}
                        </td>
                        <td className="px-3 py-4 text-sm whitespace-nowrap">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-blue-500" />
                            {formatNumber(company.memberCount)}
                          </span>
                        </td>
                        <td className="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination UI */}
                <div className="flex items-center justify-between px-4 py-3 sm:px-6 mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(startIndex + itemsPerPage, filteredCompanies.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredCompanies.length}</span> organizations
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-l-md px-2"
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            // If we have 5 or fewer pages, show all page numbers
                            pageNum = idx + 1;
                          } else if (currentPage <= 3) {
                            // If we're at the beginning
                            pageNum = idx + 1;
                            if (idx === 4) pageNum = totalPages;
                          } else if (currentPage >= totalPages - 2) {
                            // If we're at the end
                            pageNum = totalPages - 4 + idx;
                            if (idx === 0) pageNum = 1;
                          } else {
                            // We're in the middle
                            pageNum = currentPage - 2 + idx;
                            if (idx === 0) pageNum = 1;
                            if (idx === 4) pageNum = totalPages;
                          }
                          
                          return (
                            <Button
                              key={idx}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="px-3.5"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-r-md px-2"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesTab;
