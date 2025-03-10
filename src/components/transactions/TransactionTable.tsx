import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";

// Define the transaction interface that matches our data model
interface Transaction {
  id: number;
  type: "earned" | "spent";
  points: number;
  description: string;
  date: string;
  user: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails?: (id: number) => void;
}

// Format date string
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default function TransactionTable({ transactions, onViewDetails }: TransactionTableProps) {
  return (
    <div className="space-y-3">
      {transactions.map(transaction => (
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
              <User className="h-3 w-3 mr-1" />
              {transaction.user}
            </div>
          </div>
          <Badge 
            variant={transaction.type === "earned" ? "default" : "destructive"}
            className="font-medium"
          >
            {transaction.type === "earned" ? "+" : "-"}{transaction.points} points
          </Badge>
        </div>
      ))}
    </div>
  );
} 