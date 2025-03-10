import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/ui/StatsCard";
import TransactionTable from "@/components/transactions/TransactionTable";

// Mock transaction data
const mockTransactions = [
  {
    id: 1,
    type: "earned" as const,
    points: 100,
    description: "Completed Introduction to React course",
    date: "2023-05-15T14:30:00Z",
    user: "John Doe"
  },
  {
    id: 2,
    type: "spent" as const,
    points: 50,
    description: "Redeemed for Amazon gift card",
    date: "2023-05-10T11:45:00Z",
    user: "Jane Smith"
  },
  {
    id: 3,
    type: "earned" as const,
    points: 75,
    description: "Completed Git Version Control course",
    date: "2023-05-05T09:15:00Z",
    user: "Mike Johnson"
  },
  {
    id: 4,
    type: "earned" as const,
    points: 120,
    description: "Completed Advanced CSS Techniques course",
    date: "2023-04-28T16:20:00Z",
    user: "John Doe"
  },
  {
    id: 5,
    type: "spent" as const,
    points: 200,
    description: "Redeemed for company swag",
    date: "2023-04-22T10:30:00Z",
    user: "Sarah Williams"
  },
  {
    id: 6,
    type: "earned" as const,
    points: 90,
    description: "Completed TypeScript Fundamentals course",
    date: "2023-04-15T13:45:00Z",
    user: "Mike Johnson"
  },
  {
    id: 7,
    type: "spent" as const,
    points: 75,
    description: "Redeemed for lunch voucher",
    date: "2023-04-10T12:15:00Z",
    user: "Jane Smith"
  },
  {
    id: 8,
    type: "earned" as const,
    points: 150,
    description: "Completed Docker Essentials course",
    date: "2023-04-05T15:30:00Z",
    user: "Sarah Williams"
  }
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter transactions based on search term and type
  const filteredTransactions = mockTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        transaction.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all point transactions within your organization
        </p>
      </div>

      <div className="mb-6">
        <StatsCard 
          title="Transaction Summary"
          stats={[
            { name: 'Total Earned', stat: '+535 points' },
            { name: 'Total Spent', stat: '-325 points' },
            { name: 'Net Balance', stat: '210 points' },
          ]}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <CardDescription>
                Detailed log of all point transactions
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8 w-full sm:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select 
                value={filterType} 
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Transaction Type</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned Points</SelectItem>
                  <SelectItem value="spent">Spent Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found matching your search criteria.
            </div>
          ) : (
            <TransactionTable 
              transactions={paginatedTransactions}
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span> of{' '}
                <span className="font-medium">{filteredTransactions.length}</span> transactions
              </div>
              <div className="flex flex-1 justify-between sm:justify-end">
                <Button 
                  className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
