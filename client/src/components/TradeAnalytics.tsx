import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define Trade interface for the analytics component
interface Trade {
  id: number;
  userId: number;
  tradeType: string;
  amount: string;
  details: string;
  status: 'negotiation' | 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: string | Date;
  approvedBy?: number;
  approvalComment?: string;
  rate?: string; // Interest rate for the trade
  lender?: string;
  borrower?: string;
  startDate?: string;
  maturityDate?: string;
}

interface TradeAnalyticsProps {
  trades?: Trade[];
  isLoading?: boolean;
}

export const TradeAnalytics: FC<TradeAnalyticsProps> = ({ trades = [], isLoading = false }) => {
  // Get executed trades - explicitly filter by status to ensure we're getting the right ones
  const executedTrades = trades.filter(trade => trade.status === 'executed');
  
  // Debug logs to troubleshoot issues
  console.log('All trades received by TradeAnalytics:', trades);
  console.log('Executed trades count:', executedTrades.length);
  if (executedTrades.length > 0) {
    console.log('First executed trade:', executedTrades[0]);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (executedTrades.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No executed trades found. Analytics will be displayed once trades are executed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Executed Trades</CardTitle>
          <CardDescription>
            All completed and executed trades with full details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executedTrades.map((trade) => {
                // Extract rate value
                let rateValue = trade.rate || "N/A";
                if (rateValue && !rateValue.includes('%')) {
                  rateValue = `${rateValue}%`;
                }
                
                // Format the transaction in the requested format
                const lender = trade.lender || "Unknown";
                const borrower = trade.borrower || "Unknown";
                const amount = trade.amount.replace(/£/g, "GBP ");
                const dateRange = trade.startDate && trade.maturityDate 
                  ? `from ${trade.startDate} to ${trade.maturityDate}`
                  : "";
                
                const transaction = `${lender} lends ${amount} to ${borrower} at ${rateValue} ${dateRange}`;
                
                return (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.id}</TableCell>
                    <TableCell>{transaction}</TableCell>
                    <TableCell className="text-right">{rateValue}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradeAnalytics;