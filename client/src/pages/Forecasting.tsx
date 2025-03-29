import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, LineChart, Calendar } from "lucide-react";
import { Link } from 'wouter';

export default function Forecasting() {
  const [forecastType, setForecastType] = useState<string>("interest");
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="mr-4 p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Financial Forecasting</h1>
      </div>
      
      <Tabs defaultValue="interest" onValueChange={setForecastType} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interest">Interest Rate Forecasting</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow Forecasting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interest" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Interest Rate Forecast</CardTitle>
              </div>
              <CardDescription>
                Predict future interest rates for your financial planning. 
                Rate forecasts help councils make informed borrowing and investment decisions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate-type">Rate Type</Label>
                    <Select defaultValue="bank-rate">
                      <SelectTrigger id="rate-type">
                        <SelectValue placeholder="Select rate type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank-rate">Bank of England Base Rate</SelectItem>
                        <SelectItem value="pwlb-1yr">PWLB 1 Year</SelectItem>
                        <SelectItem value="pwlb-5yr">PWLB 5 Year</SelectItem>
                        <SelectItem value="pwlb-10yr">PWLB 10 Year</SelectItem>
                        <SelectItem value="pwlb-25yr">PWLB 25 Year</SelectItem>
                        <SelectItem value="pwlb-50yr">PWLB 50 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forecast-months">Forecast Period (Months)</Label>
                    <Select defaultValue="12">
                      <SelectTrigger id="forecast-months">
                        <SelectValue placeholder="Select forecast period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                        <SelectItem value="24">24 Months</SelectItem>
                        <SelectItem value="36">36 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confidence-level">Confidence Level</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger id="confidence-level">
                        <SelectValue placeholder="Select confidence level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (68%)</SelectItem>
                        <SelectItem value="medium">Medium (90%)</SelectItem>
                        <SelectItem value="high">High (99%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forecast-model">Forecast Model</Label>
                    <Select defaultValue="arima">
                      <SelectTrigger id="forecast-model">
                        <SelectValue placeholder="Select forecast model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arima">ARIMA</SelectItem>
                        <SelectItem value="prophet">Prophet</SelectItem>
                        <SelectItem value="lstm">LSTM Neural Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" placeholder="Add any additional notes or context for this forecast" />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Reset</Button>
              <Button>Generate Forecast</Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-primary" />
                <CardTitle>Rate Forecast Visualization</CardTitle>
              </div>
              <CardDescription>
                Generate a forecast to see the predicted rates with confidence intervals.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
              <p className="text-gray-500">Forecast visualization will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cashflow" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Cash Flow Forecast</CardTitle>
              </div>
              <CardDescription>
                Project your council's future cash flows to ensure adequate liquidity and optimize investment strategy.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="forecast-name">Forecast Name</Label>
                    <Input id="forecast-name" placeholder="Q2 2025 Cash Flow Forecast" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forecast-period">Forecast Period</Label>
                    <Select defaultValue="quarterly">
                      <SelectTrigger id="forecast-period">
                        <SelectValue placeholder="Select forecast period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="starting-balance">Starting Balance (£)</Label>
                    <Input id="starting-balance" placeholder="1,000,000" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forecast-horizon">Forecast Horizon (Periods)</Label>
                    <Select defaultValue="4">
                      <SelectTrigger id="forecast-horizon">
                        <SelectValue placeholder="Select number of periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 Periods</SelectItem>
                        <SelectItem value="8">8 Periods</SelectItem>
                        <SelectItem value="12">12 Periods</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="cf-notes">Notes</Label>
                  <Input id="cf-notes" placeholder="Add any additional notes or context for this forecast" />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Reset</Button>
              <Button>Create Cash Flow Template</Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <LineChart className="h-5 w-5 text-primary" />
                <CardTitle>Cash Flow Visualization</CardTitle>
              </div>
              <CardDescription>
                Create a forecast to see projected cash flows over the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
              <p className="text-gray-500">Cash flow visualization will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}