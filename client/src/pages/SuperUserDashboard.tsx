import { FC, useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import TradeAnalytics from '@/components/TradeAnalytics';

// Define Trade interface explicitly to avoid import issues
interface Trade {
  id: number;
  userId: number;
  tradeType: string;
  amount: string;
  details: string;
  status: 'negotiation' | 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: Date;
  approvedBy?: number;
  approvalComment?: string;
  rate?: string; // Interest rate for the trade
  lender?: string;
  borrower?: string;
  startDate?: string;
  maturityDate?: string;
}

export const SuperUserDashboard: FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { toast } = useToast();

  // Fetch trades when component mounts or tab changes
  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      try {
        // Always fetch all trades to ensure we have data for all tabs
        // This prevents issues with tabs not showing data
        const response = await axios.get('/api/trades');
        
        // Set trades directly without any transformation
        // to avoid date serialization issues
        console.log('Fetched all trades:', response.data);
        console.log('Number of executed trades:', response.data.filter(t => t.status === 'executed').length);
        
        if (response.data && response.data.length > 0) {
          setTrades(response.data);
        } else {
          console.error('Received empty trade data from API');
        }
      } catch (error) {
        console.error('Error fetching trades:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch trades. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [toast]); // Remove activeTab dependency since we're always fetching all trades

  // Handle trade approval or status change
  const handleApproval = async (tradeId: number, status: 'pending' | 'approved' | 'rejected') => {
    try {
      await axios.patch(`/api/trades/${tradeId}`, {
        status,
        approvedBy: 1, // Using default super user ID
        approvalComment: status === 'pending' ? 'Trade moved to pending' : 
                         status === 'approved' ? 'Trade approved' : 'Trade rejected'
      });
      
      toast({
        title: 'Success',
        description: status === 'pending' ? 'Trade moved to pending successfully.' :
                     status === 'approved' ? 'Trade approved successfully.' : 
                     'Trade rejected successfully.',
      });
      
      // Update the trades list
      setTrades(trades.map(trade => 
        trade.id === tradeId ? { ...trade, status } : trade
      ));
    } catch (error) {
      console.error(`Error ${status} trade:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${status} trade. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Handle trade execution (mark as executed)
  const handleExecution = async (tradeId: number) => {
    try {
      // Find the trade to extract rate information if available
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) {
        throw new Error("Trade not found");
      }
      
      // Try to extract rate from details if not already available
      let rateValue = null;
      if (!trade.rate) {
        const rateMatch = trade.details.match(/(\d+\.?\d*)\s*%/);
        if (rateMatch && rateMatch[1]) {
          rateValue = rateMatch[1] + '%';
        }
      }
      
      // Generate lender/borrower information based on trade type if not already set
      let lender = trade.lender;
      let borrower = trade.borrower;
      
      if (!lender || !borrower) {
        if (trade.tradeType === 'PWLB Loan') {
          lender = 'Public Works Loan Board';
          borrower = 'Birmingham City Council';
        } else if (trade.tradeType === 'MMF Investment') {
          lender = 'Birmingham City Council';
          borrower = 'Money Market Fund';
        } else if (trade.tradeType === 'Deposit') {
          lender = 'Birmingham City Council';
          borrower = 'Barclays Bank';
        } else if (trade.tradeType === 'Local Authority Loan') {
          lender = 'Birmingham City Council';
          borrower = 'Manchester City Council';
        } else if (trade.tradeType === 'Treasury Bill') {
          lender = 'Birmingham City Council';
          borrower = 'UK Treasury';
        } else {
          lender = 'Lender';
          borrower = 'Borrower';
        }
      }
      
      // Generate start and maturity dates if not already set
      const today = new Date();
      const startDate = trade.startDate || `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;
      
      // Default to 3 months maturity if not specified
      let maturityDate = trade.maturityDate;
      if (!maturityDate) {
        const maturityDateObj = new Date(today);
        maturityDateObj.setMonth(today.getMonth() + 3);
        maturityDate = `${maturityDateObj.getDate()}.${maturityDateObj.getMonth() + 1}.${maturityDateObj.getFullYear()}`;
      }
      
      await axios.patch(`/api/trades/${tradeId}`, {
        status: 'executed',
        approvedBy: 1, // Using default super user ID
        approvalComment: 'Trade executed',
        rate: rateValue || trade.rate, // Use extracted rate or existing rate
        lender,
        borrower,
        startDate,
        maturityDate
      });
      
      toast({
        title: 'Success',
        description: 'Trade marked as executed successfully.',
      });
      
      // Update the trades list
      setTrades(trades.map(t => 
        t.id === tradeId ? { 
          ...t, 
          status: 'executed',
          rate: rateValue || t.rate,
          lender,
          borrower,
          startDate,
          maturityDate
        } : t
      ));
    } catch (error) {
      console.error('Error executing trade:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute trade. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
      <h1 className="text-3xl font-bold mb-6">Super User Dashboard</h1>
      
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Trades</TabsTrigger>
          <TabsTrigger value="negotiation">Negotiations</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="executed">Executed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>All Trades</CardTitle>
              <CardDescription>
                View and manage all trades in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading trades...</p>
                </div>
              ) : trades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No trades found</p>
                </div>
              ) : (
                <Table>
                  <TableCaption>List of all trades</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
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
                        <TableCell>
                          {trade.status === 'negotiation' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleApproval(trade.id, 'pending')}
                              >
                                Move to Pending
                              </Button>
                            </div>
                          )}
                          {trade.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleApproval(trade.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleApproval(trade.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {trade.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleExecution(trade.id)}
                            >
                              Mark Executed
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs have similar content but filtered by status */}
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Trade Analytics</CardTitle>
              <CardDescription>
                Visual analysis of executed trades including rates, types, and time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Pass only trades with status 'executed' */}
              <TradeAnalytics 
                trades={trades.filter(trade => trade.status === 'executed')} 
                isLoading={loading} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Status-specific tabs */}
        {['negotiation', 'pending', 'approved', 'rejected', 'executed'].map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{status} Trades</CardTitle>
                <CardDescription>
                  {status === 'negotiation' && 'Trades currently in negotiation phase'}
                  {status === 'pending' && 'Trades waiting for approval'}
                  {status === 'approved' && 'Approved trades ready for execution'}
                  {status === 'rejected' && 'Rejected trades'}
                  {status === 'executed' && 'Successfully executed trades'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <p>Loading trades...</p>
                  </div>
                ) : trades.filter(t => t.status === status).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No {status} trades found</p>
                  </div>
                ) : status === 'executed' ? (
                  <Table>
                    <TableCaption>List of {status} trades</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades
                        .filter(trade => trade.status === status)
                        .map((trade) => {
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
                ) : (
                  <Table>
                    <TableCaption>List of {status} trades</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades
                        .filter(trade => trade.status === status)
                        .map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>{trade.id}</TableCell>
                          <TableCell>{trade.tradeType}</TableCell>
                          <TableCell>{trade.amount}</TableCell>
                          <TableCell className="max-w-md truncate">{trade.details}</TableCell>
                          <TableCell>{formatDate(trade.createdAt)}</TableCell>
                          <TableCell>
                            {status === 'negotiation' && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApproval(trade.id, 'pending')}
                                >
                                  Move to Pending
                                </Button>
                              </div>
                            )}
                            {status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleApproval(trade.id, 'approved')}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleApproval(trade.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {status === 'approved' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleExecution(trade.id)}
                              >
                                Mark Executed
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SuperUserDashboard;