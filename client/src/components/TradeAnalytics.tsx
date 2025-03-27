import { FC, useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';

// Define Trade interface for the analytics component
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
}

// Extracted rate data from trade details
interface RateData {
  id: number;
  timestamp: number;
  rate: number;
  amount: number;
  tradeType: string;
}

// Type distribution data
interface TradeTypeData {
  name: string;
  value: number;
}

// Time period rate data
interface TimePeriodRateData {
  period: string;
  avgRate: number;
  totalAmount: number;
  count: number;
}

interface TradeAnalyticsProps {
  trades?: Trade[];
  isLoading?: boolean;
}

export const TradeAnalytics: FC<TradeAnalyticsProps> = ({ trades = [], isLoading = false }) => {
  const [rateData, setRateData] = useState<RateData[]>([]);
  const [typeData, setTypeData] = useState<TradeTypeData[]>([]);
  const [periodData, setPeriodData] = useState<TimePeriodRateData[]>([]);

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Process trade data for charts when trades change
  useEffect(() => {
    if (trades.length === 0) return;

    // Only use executed trades for analytics
    const executedTrades = trades.filter(trade => trade.status === 'executed');
    
    // Process data for line chart (rates over time)
    const rateDataPoints: RateData[] = executedTrades.map(trade => {
      // Extract rate from trade.rate field or from details as a fallback
      let rate = 0;
      if (trade.rate) {
        const rateMatch = trade.rate.match(/(\d+\.?\d*)%?/);
        rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
      } else {
        const rateMatch = trade.details.match(/(\d+\.?\d*)%/);
        rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
      }
      
      // Extract amount as a number
      const amountMatch = trade.amount.match(/[\d,]+\.?\d*/);
      const amount = amountMatch 
        ? parseFloat(amountMatch[0].replace(/,/g, '')) 
        : 0;
      
      return {
        id: trade.id,
        timestamp: new Date(trade.createdAt).getTime(),
        rate,
        amount,
        tradeType: trade.tradeType
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
    
    setRateData(rateDataPoints);
    
    // Process data for pie chart (trade type distribution)
    const typeCount: Record<string, number> = {};
    executedTrades.forEach(trade => {
      if (!typeCount[trade.tradeType]) {
        typeCount[trade.tradeType] = 0;
      }
      typeCount[trade.tradeType]++;
    });
    
    const typeDataPoints: TradeTypeData[] = Object.entries(typeCount).map(
      ([name, value]) => ({ name, value })
    );
    
    setTypeData(typeDataPoints);
    
    // Process data for bar chart (average rates by period)
    const periodRates: Record<string, { sum: number, count: number, amount: number }> = {};
    
    executedTrades.forEach(trade => {
      const date = new Date(trade.createdAt);
      const period = format(date, 'MMM yyyy');
      
      // Extract rate from trade.rate field or from details as a fallback
      let rate = 0;
      if (trade.rate) {
        const rateMatch = trade.rate.match(/(\d+\.?\d*)%?/);
        rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
      } else {
        const rateMatch = trade.details.match(/(\d+\.?\d*)%/);
        rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
      }
      
      const amountMatch = trade.amount.match(/[\d,]+\.?\d*/);
      const amount = amountMatch 
        ? parseFloat(amountMatch[0].replace(/,/g, '')) 
        : 0;
      
      if (!periodRates[period]) {
        periodRates[period] = { sum: 0, count: 0, amount: 0 };
      }
      
      periodRates[period].sum += rate;
      periodRates[period].count += 1;
      periodRates[period].amount += amount;
    });
    
    const periodDataPoints: TimePeriodRateData[] = Object.entries(periodRates).map(
      ([period, data]) => ({
        period,
        avgRate: parseFloat((data.sum / data.count).toFixed(2)),
        totalAmount: data.amount,
        count: data.count
      })
    ).sort((a, b) => {
      // Sort by date (assumes period format is "MMM yyyy")
      const dateA = new Date(a.period);
      const dateB = new Date(b.period);
      return dateA.getTime() - dateB.getTime();
    });
    
    setPeriodData(periodDataPoints);
    
  }, [trades]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (trades.length === 0 || trades.filter(trade => trade.status === 'executed').length === 0) {
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
      <Tabs defaultValue="rates" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rates">Rates Over Time</TabsTrigger>
          <TabsTrigger value="types">Trade Types</TabsTrigger>
          <TabsTrigger value="periods">Rates by Period</TabsTrigger>
        </TabsList>
        
        {/* Rates Over Time Chart */}
        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Rates Over Time</CardTitle>
              <CardDescription>
                Historical view of executed trade rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={rateData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="timestamp" 
                      type="number"
                      domain={['auto', 'auto']}
                      tickFormatter={(timestamp) => format(new Date(timestamp), 'dd/MM/yy')}
                    />
                    <YAxis 
                      label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      labelFormatter={(timestamp) => format(new Date(timestamp), 'dd MMM yyyy HH:mm')}
                      formatter={(value, name) => {
                        if (name === 'rate') return [`${value}%`, 'Rate'];
                        if (name === 'amount') return [`£${value.toLocaleString()}`, 'Amount'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                      name="Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trade Types Pie Chart */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Trade Type Distribution</CardTitle>
              <CardDescription>
                Breakdown of executed trades by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} trades`, props.payload.name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Rates by Period Bar Chart */}
        <TabsContent value="periods">
          <Card>
            <CardHeader>
              <CardTitle>Average Rates by Period</CardTitle>
              <CardDescription>
                Monthly average rates for executed trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={periodData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="period" />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      label={{ value: 'Avg Rate (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Count', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'avgRate') return [`${value}%`, 'Avg Rate'];
                        if (name === 'count') return [`${value} trades`, 'Count'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="avgRate" 
                      fill="#8884d8" 
                      name="Avg Rate (%)"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="count" 
                      fill="#82ca9d" 
                      name="Trade Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradeAnalytics;