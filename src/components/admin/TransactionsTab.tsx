
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: string;
  points: number;
  description: string;
  date: string;
}

interface TransactionsTabProps {
  transactions: Transaction[];
  isLoading: boolean;
  searchQuery: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const TransactionsTab = ({ transactions, isLoading, searchQuery }: TransactionsTabProps) => {
  const filteredTransactions = transactions.filter(transaction => 
    transaction.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>
          View all point transactions across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No transactions found.</p>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{getInitials(transaction.userName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{transaction.userName}</p>
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                  <Badge variant={transaction.type === 'Earned' ? 'default' : 'destructive'}>
                    {transaction.type === 'Earned' ? '+' : '-'}{transaction.points} points
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
