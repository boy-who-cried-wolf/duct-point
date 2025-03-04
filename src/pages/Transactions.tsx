
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock transaction data
const mockTransactions = [
  {
    id: 1,
    type: "earned",
    points: 100,
    description: "Completed Introduction to React course",
    date: "2023-05-15T14:30:00Z",
    user: "John Doe"
  },
  {
    id: 2,
    type: "spent",
    points: 50,
    description: "Redeemed for Amazon gift card",
    date: "2023-05-10T11:45:00Z",
    user: "Jane Smith"
  },
  {
    id: 3,
    type: "earned",
    points: 75,
    description: "Completed Git Version Control course",
    date: "2023-05-05T09:15:00Z",
    user: "Mike Johnson"
  },
  {
    id: 4,
    type: "earned",
    points: 120,
    description: "Completed Advanced CSS Techniques course",
    date: "2023-04-28T16:20:00Z",
    user: "John Doe"
  },
  {
    id: 5,
    type: "spent",
    points: 200,
    description: "Redeemed for company swag",
    date: "2023-04-22T10:30:00Z",
    user: "Sarah Williams"
  },
  {
    id: 6,
    type: "earned",
    points: 90,
    description: "Completed TypeScript Fundamentals course",
    date: "2023-04-15T13:45:00Z",
    user: "Mike Johnson"
  },
  {
    id: 7,
    type: "spent",
    points: 75,
    description: "Redeemed for lunch voucher",
    date: "2023-04-10T12:15:00Z",
    user: "Jane Smith"
  },
  {
    id: 8,
    type: "earned",
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

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Transaction Summary</CardTitle>
          <CardDescription>
            Overview of point activity in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-muted-foreground text-sm">Total Earned</div>
              <div className="text-2xl font-bold text-green-500">+535 points</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-muted-foreground text-sm">Total Spent</div>
              <div className="text-2xl font-bold text-destructive">-325 points</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="text-muted-foreground text-sm">Net Balance</div>
              <div className="text-2xl font-bold">210 points</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="earned">Earned Only</SelectItem>
                  <SelectItem value="spent">Spent Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              paginatedTransactions.map(transaction => (
                <div 
                  key={transaction.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border gap-2"
                >
                  <div className="flex-1">
                    <div className="font-medium">{transaction.description}</div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(transaction.date)}
                      <span className="mx-2">•</span>
                      {transaction.user}
                    </div>
                  </div>
                  <Badge 
                    variant={transaction.type === "earned" ? "default" : "destructive"}
                  >
                    {transaction.type === "earned" ? "+" : "-"}{transaction.points} points
                  </Badge>
                </div>
              ))
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
