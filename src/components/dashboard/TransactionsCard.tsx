
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";

interface Transaction {
  id: number;
  type: string;
  points: number;
  description: string;
  date: string;
}

interface TransactionsCardProps {
  transactions: Transaction[];
}

const TransactionsCard = ({ transactions }: TransactionsCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden shadow-none border-none">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your recent point activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No transactions to display yet.
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(transaction => (
              <div 
                key={transaction.id} 
                className="flex justify-between items-center p-3 rounded-md border border-border hover:bg-accent/50 transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">
                    {transaction.description}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                </div>
                <span 
                  className={`ml-auto text-sm font-medium ${
                    transaction.type === "earned" ? "text-blue-500" : "text-destructive"
                  }`}
                >
                  {transaction.type === "earned" ? "+" : "-"}{transaction.points} points
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-3 flex justify-end bg-transparent">
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-full gap-1" 
          onClick={() => navigate("/transactions")}
        >
          View all transactions
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TransactionsCard;
