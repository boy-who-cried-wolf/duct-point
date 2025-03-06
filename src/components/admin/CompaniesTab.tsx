
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Company {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
}

interface CompaniesTabProps {
  companies: Company[];
  isLoading: boolean;
  searchQuery: string;
}

export const CompaniesTab = ({ companies, isLoading, searchQuery }: CompaniesTabProps) => {
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Organizations</CardTitle>
        <CardDescription>
          Manage organizations using the platform.
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
                    <p className="text-sm text-muted-foreground">{company.memberCount} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{company.totalPoints} total points</p>
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
