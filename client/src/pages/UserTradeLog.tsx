import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

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

export const UserTradeLog: FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  
  // Mock user ID - in a real app, this would come from authentication
  const userId = 1;

  useEffect(() => {
    const fetchUserTrades = async () => {
      try {
        setLoading(true);
        
        // Fetch trades for the current user
        const response = await axios.get(`/api/users/${userId}/trades`);
        
        if (response.data && response.data.length > 0) {
          setTrades(response.data);
        } else {
          console.warn('No trades found for this user');
          setTrades([]);
        }
      } catch (error) {
        console.error('Error fetching user trades:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch your trades. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserTrades();
  }, [toast, userId]);

  // Helper function to format date
  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'negotiation':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Negotiation</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50">Rejected</Badge>;
      case 'executed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">Executed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">My Trade Log</h1>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Trades</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>
        
        {/* All Trades Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All My Trades</CardTitle>
              <CardDescription>
                Complete record of all your trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading your trades...</p>
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You have no trades yet</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your trade history</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>{trade.id}</TableCell>
                        <TableCell>{trade.tradeType}</TableCell>
                        <TableCell>{trade.amount}</TableCell>
                        <TableCell className="max-w-md truncate">{trade.details}</TableCell>
                        <TableCell>{getStatusBadge(trade.status)}</TableCell>
                        <TableCell>{formatDate(trade.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Active Trades Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Trades</CardTitle>
              <CardDescription>
                Your current active trades (approved and executed)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading active trades...</p>
                </div>
              ) : trades.filter(t => t.status === 'approved' || t.status === 'executed').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You have no active trades</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your active trades</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades
                      .filter(trade => trade.status === 'approved' || trade.status === 'executed')
                      .map((trade) => {
                        // Format rate with % if needed
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
                            <TableCell>{getStatusBadge(trade.status)}</TableCell>
                            <TableCell className="text-right">{rateValue}</TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pending Approval Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>
                Trades awaiting approval or in negotiation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading pending trades...</p>
                </div>
              ) : trades.filter(t => t.status === 'pending' || t.status === 'negotiation').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You have no pending trades</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your pending trades</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades
                      .filter(trade => trade.status === 'pending' || trade.status === 'negotiation')
                      .map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.id}</TableCell>
                          <TableCell>{trade.tradeType}</TableCell>
                          <TableCell>{trade.amount}</TableCell>
                          <TableCell className="max-w-md truncate">{trade.details}</TableCell>
                          <TableCell>{getStatusBadge(trade.status)}</TableCell>
                          <TableCell>{formatDate(trade.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trade History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>
                Completed and executed trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading trade history...</p>
                </div>
              ) : trades.filter(t => t.status === 'executed').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You have no completed trades</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your completed trades</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades
                      .filter(trade => trade.status === 'executed')
                      .map((trade) => {
                        // Format rate with % if needed
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserTradeLog;