import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from '../hooks/use-toast';
import { TimeFrame } from '../types';

// Import our manual calculator
import { calculateManualSignal } from '../lib/manualCalculator';

const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

// Format currency function
function formatCurrency(price: number): string {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: price < 1 ? 6 : price < 100 ? 2 : 0
  });
}

export default function SimpleSignalDashboard({ symbol }: { symbol: string }) {
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1d');
  const [assetPrice, setAssetPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [signals, setSignals] = useState<Record<TimeFrame, any>>({});
  
  // Fetch initial price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(`/api/crypto/${symbol}`);
        const data = await response.json();
        setAssetPrice(data.lastPrice);
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    };
    
    fetchPrice();
    
    // Set up interval to update price
    const interval = setInterval(fetchPrice, 30000);
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  // Handle manual calculation
  const handleCalculate = () => {
    if (assetPrice === 0) {
      toast({
        title: "Error",
        description: "Price data not available yet",
        variant: "destructive"
      });
      return;
    }
    
    setIsCalculating(true);
    toast({
      title: "Manual calculation started",
      description: "Generating signals for all timeframes...",
    });
    
    // Calculate signals for all timeframes
    const newSignals: Record<TimeFrame, any> = {};
    
    // Use timeout to allow UI to update
    setTimeout(() => {
      timeframes.forEach(tf => {
        // Use our manual calculator to get deterministic signals
        const signal = calculateManualSignal(assetPrice, tf);
        newSignals[tf] = signal;
      });
      
      // Update signals state
      setSignals(newSignals);
      setIsCalculating(false);
      
      toast({
        title: "Calculation complete",
        description: "Signals updated for all timeframes",
      });
    }, 500);
  };
  
  // Get direction indicator
  const getDirectionIcon = (direction: string) => {
    if (direction === 'LONG') return <TrendingUp className="text-green-500" />;
    if (direction === 'SHORT') return <TrendingDown className="text-red-500" />;
    return <Minus className="text-gray-500" />;
  };
  
  // Get signal background color
  const getSignalBgClass = (direction: string): string => {
    if (direction === 'LONG') return 'bg-green-900/30 text-green-300 border-green-800';
    if (direction === 'SHORT') return 'bg-red-900/30 text-red-300 border-red-800';
    return 'bg-blue-900/30 text-blue-300 border-blue-800';
  };
  
  // Current signal based on selected timeframe
  const currentSignal = signals[selectedTimeframe];
  
  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            {symbol} Signal Dashboard
            {assetPrice > 0 && (
              <Badge variant="outline" className="ml-2 bg-indigo-900/30 text-indigo-300 border-indigo-800">
                {formatCurrency(assetPrice)}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs bg-indigo-900/30 text-indigo-300 border-indigo-800 hover:bg-indigo-800/50 hover:text-indigo-200"
            onClick={handleCalculate}
            disabled={isCalculating}
          >
            {isCalculating ? 'Calculating...' : 'Calculate Now'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          defaultValue="1d" 
          value={selectedTimeframe}
          onValueChange={(value) => setSelectedTimeframe(value as TimeFrame)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 md:grid-cols-10 bg-gray-950 border border-gray-800">
            {timeframes.map(tf => (
              <TabsTrigger 
                key={tf} 
                value={tf}
                className="data-[state=active]:bg-indigo-900/40 data-[state=active]:text-indigo-200"
              >
                {tf}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {timeframes.map(tf => (
            <TabsContent key={tf} value={tf} className="border-none p-0 pt-4">
              {signals[tf] ? (
                <div className="space-y-4">
                  {/* Signal Direction */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-md text-white font-semibold">Signal</h3>
                    <Badge variant="outline" className={`px-4 py-1 ${getSignalBgClass(signals[tf].direction)}`}>
                      <span className="flex items-center gap-1">
                        {getDirectionIcon(signals[tf].direction)}
                        {signals[tf].direction} ({signals[tf].confidence}%)
                      </span>
                    </Badge>
                  </div>
                  
                  {/* Entry, Stop Loss and Take Profit */}
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                      <div className="text-xs text-gray-400 mb-1">Entry</div>
                      <div className="text-md text-white font-semibold">{formatCurrency(signals[tf].entryPrice)}</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                      <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                      <div className="text-md text-red-400 font-semibold">{formatCurrency(signals[tf].stopLoss)}</div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                      <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                      <div className="text-md text-green-400 font-semibold">{formatCurrency(signals[tf].takeProfit)}</div>
                    </div>
                  </div>
                  
                  {/* Pattern and Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                      <div className="text-xs text-gray-400 mb-1">Pattern</div>
                      <div className="text-md text-white font-semibold">
                        {signals[tf].patternFormations[0]?.name || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                      <div className="text-xs text-gray-400 mb-1">Expected Duration</div>
                      <div className="text-md text-white font-semibold">{signals[tf].expectedDuration}</div>
                    </div>
                  </div>
                  
                  {/* Success Probability */}
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                    <div className="flex justify-between">
                      <div className="text-xs text-gray-400">Success Probability</div>
                      <div className="text-xs text-gray-400">{signals[tf].successProbability}%</div>
                    </div>
                    <div className="mt-1 h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                        style={{ width: `${signals[tf].successProbability}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-indigo-300">
                      {signals[tf].successProbabilityDescription}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[300px] text-gray-500">
                  No signal data available. Click "Calculate Now" to generate signals.
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}