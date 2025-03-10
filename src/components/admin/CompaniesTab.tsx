
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
  ytdSpend?: number; // Property for YTD spend
  companyId?: string; // Adding company_id for reference
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

export const CompaniesTab = ({ companies, isLoading, searchQuery }: CompaniesTabProps) => {
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Organizations</CardTitle>
        <CardDescription>
          Manage organizations using the platform. YTD spend values are updated from CSV uploads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading organizations...</div>
        ) : filteredCompanies.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No organizations found.</p>
        ) : (
          <div className="space-y-4">
            {filteredCompanies.map(company => (
              <div key={company.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{company.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {company.memberCount} members
                      </span>
                      {company.companyId && (
                        <Badge variant="secondary" className="text-xs">
                          ID: {company.companyId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right flex flex-col items-end">
                    <p className="font-medium">{company.totalPoints} total points</p>
                    <Badge variant="outline" className="flex items-center gap-1 mt-1">
                      <DollarSign className="h-3 w-3" />
                      YTD: {formatCurrency(company.ytdSpend)}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompaniesTab;
