
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, MoreHorizontal, ExternalLink } from 'lucide-react';
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
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
                  {filteredCompanies.map((company) => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompaniesTab;
