import { FC, useState, useEffect } from "react";
import { Rate } from "@/types";
import { getCurrentRates } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PoundSterling, TrendingUp, Calendar, Building } from "lucide-react";

export const RatesPanel: FC = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const response = await getCurrentRates();
        setRates(response.rates);
      } catch (error) {
        console.error("Error fetching rates:", error);
        toast({
          title: "Error fetching current rates",
          description: "Unable to load the latest money market rates",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    
    // Refresh rates every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [toast]);

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-primary font-medium text-lg">
          <PoundSterling className="h-5 w-5 mr-2" />
          Current Money Market Rates
        </CardTitle>
        <CardDescription>Latest UK financial rates for council planning</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-12 bg-neutral-100 animate-pulse rounded-md"></div>
            <div className="h-12 bg-neutral-100 animate-pulse rounded-md"></div>
            <div className="h-12 bg-neutral-100 animate-pulse rounded-md"></div>
          </div>
        ) : rates.length > 0 ? (
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-3">
              {rates.map((rate, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{rate.name}</div>
                      <div className="text-xs text-secondary/70 flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        Last updated: {rate.lastUpdated}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                      {rate.value}
                    </Badge>
                  </div>
                  <div className="text-xs text-secondary/70 flex items-center mt-2">
                    <Building className="h-3 w-3 mr-1" />
                    Source: {rate.source}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-secondary/70">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No current rates available</p>
            <p className="text-xs mt-1">Check back later for updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RatesPanel;