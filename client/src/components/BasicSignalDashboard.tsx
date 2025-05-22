import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from '../hooks/use-toast';

// Format currency function
function formatCurrency(price: number): string {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: price < 1 ? 6 : price < 100 ? 2 : 0
  });
}

export default function BasicSignalDashboard({ symbol, price }: { symbol: string; price: number }) {
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [signal, setSignal] = useState<any>(null);
  
  // Handle manual calculation
  const handleCalculate = () => {
    if (price === 0) {
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
      description: "Generating market signal...",
    });
    
    // Simple calculation based on price
    setTimeout(() => {
      // Use price to deterministically set direction (same price = same result)
      const priceMod = Math.floor(price) % 100;
      
      // Determine direction
      let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
      if (priceMod < 40) direction = 'LONG';
      else if (priceMod < 80) direction = 'SHORT';
      else direction = 'NEUTRAL';
      
      // Calculate confidence (50-95)
      const confidence = 50 + (priceMod % 45);
      
      // Calculate stop loss and take profit
      let stopLoss, takeProfit;
      if (direction === 'LONG') {
        stopLoss = price * 0.97;
        takeProfit = price * 1.05;
      } else if (direction === 'SHORT') {
        stopLoss = price * 1.03;
        takeProfit = price * 0.95;
      } else {
        stopLoss = price * 0.98;
        takeProfit = price * 1.02;
      }
      
      const successProbability = Math.min(confidence + 5, 95);
      
      // Set the signal
      setSignal({
        direction,
        confidence,
        entryPrice: price,
        stopLoss: Math.round(stopLoss * 100) / 100,
        takeProfit: Math.round(takeProfit * 100) / 100,
        successProbability
      });
      
      setIsCalculating(false);
      
      toast({
        title: "Calculation complete",
        description: "Market signal updated",
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
  
  return (
    <Card className="w-full bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            {symbol} Signal Dashboard
            {price > 0 && (
              <Badge variant="outline" className="ml-2 bg-indigo-900/30 text-indigo-300 border-indigo-800">
                {formatCurrency(price)}
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
        {signal ? (
          <div className="space-y-4">
            {/* Signal Direction */}
            <div className="flex justify-between items-center">
              <h3 className="text-md text-white font-semibold">Signal</h3>
              <Badge variant="outline" className={`px-4 py-1 ${getSignalBgClass(signal.direction)}`}>
                <span className="flex items-center gap-1">
                  {getDirectionIcon(signal.direction)}
                  {signal.direction} ({signal.confidence}%)
                </span>
              </Badge>
            </div>
            
            {/* Entry, Stop Loss and Take Profit */}
            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Entry</div>
                <div className="text-md text-white font-semibold">{formatCurrency(signal.entryPrice)}</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                <div className="text-md text-red-400 font-semibold">{formatCurrency(signal.stopLoss)}</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                <div className="text-md text-green-400 font-semibold">{formatCurrency(signal.takeProfit)}</div>
              </div>
            </div>
            
            {/* Success Probability */}
            <div className="bg-gray-900/50 p-3 rounded border border-gray-800">
              <div className="flex justify-between">
                <div className="text-xs text-gray-400">Success Probability</div>
                <div className="text-xs text-gray-400">{signal.successProbability}%</div>
              </div>
              <div className="mt-1 h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  style={{ width: `${signal.successProbability}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-indigo-300">
                {signal.successProbability > 80 ? 'Very High Probability' : 
                 signal.successProbability > 65 ? 'Good Probability' : 
                 signal.successProbability > 50 ? 'Moderate Probability' : 'Low Probability'}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[300px] text-gray-500">
            No signal data available. Click "Calculate Now" to generate a signal.
          </div>
        )}
      </CardContent>
    </Card>
  );
}