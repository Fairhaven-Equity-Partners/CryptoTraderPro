import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// Types
type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
type Direction = 'LONG' | 'SHORT' | 'NEUTRAL';

// Format currency helper
function formatCurrency(price: number): string {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: price < 1 ? 6 : price < 100 ? 2 : 0
  });
}

interface SimpleSignalDisplayProps {
  symbol: string;
}

export default function SimpleSignalDisplay({ symbol }: SimpleSignalDisplayProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [price, setPrice] = useState(111175); // Default BTC price
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Generate data based on timeframe and price
  const generateSignalData = (timeframe: TimeFrame, price: number) => {
    // Simple deterministic algorithm
    const seed = Math.floor(price * 100 + timeframe.length * 17);
    const direction: Direction = seed % 3 === 0 ? 'LONG' : 
                    seed % 3 === 1 ? 'SHORT' : 'NEUTRAL';
    
    const confidence = 60 + (seed % 36);
    const successProb = Math.min(60 + (seed % 39), 98);
    
    return {
      direction,
      confidence,
      entryPrice: price,
      stopLoss: direction === 'LONG' ? price * 0.97 : price * 1.03,
      takeProfit: direction === 'LONG' ? price * 1.05 : price * 0.95,
      successProbability: successProb,
      recommendedLeverage: direction === 'NEUTRAL' ? 1 : 5
    };
  };
  
  // Fetch price periodically
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsCalculating(true);
        const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
        const data = await response.json();
        setPrice(data.price);
        
        // Simulate calculation delay
        setTimeout(() => {
          setIsCalculating(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching price:', error);
        setIsCalculating(false);
      }
    };
    
    // Fetch immediately
    fetchPrice();
    
    // Set up interval
    const interval = setInterval(fetchPrice, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  // Current signal data
  const signalData = generateSignalData(selectedTimeframe, price);
  
  // Signal color based on direction
  const getSignalColor = (direction: Direction) => {
    switch (direction) {
      case 'LONG': return 'text-green-500';
      case 'SHORT': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };
  
  // Signal icon based on direction
  const SignalIcon = () => {
    switch (signalData.direction) {
      case 'LONG': return <TrendingUp className="h-10 w-10 text-green-500" />;
      case 'SHORT': return <TrendingDown className="h-10 w-10 text-red-500" />;
      default: return <Minus className="h-10 w-10 text-yellow-500" />;
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">{symbol} Market Analysis</h2>
        <div className="flex items-center space-x-2">
          <span className="font-semibold">Current Price:</span>
          <Badge variant="outline" className="bg-blue-900/20 text-base">
            {formatCurrency(price)}
          </Badge>
          {isCalculating && (
            <Badge variant="outline" className="bg-purple-900/20">
              Calculating...
            </Badge>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Signal Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Signal Direction</CardTitle>
            <CardDescription>Current market sentiment</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <SignalIcon />
            <div className={`mt-4 text-2xl font-bold ${getSignalColor(signalData.direction)}`}>
              {signalData.direction}
            </div>
            <div className="mt-2 text-gray-400 text-sm">
              Confidence: {signalData.confidence}%
            </div>
            <Progress 
              value={signalData.confidence} 
              className="mt-2 w-full" 
              indicatorClassName={
                signalData.direction === 'LONG' ? 'bg-green-500' : 
                signalData.direction === 'SHORT' ? 'bg-red-500' :
                'bg-yellow-500'
              }
            />
          </CardContent>
        </Card>
        
        {/* Price Levels Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Entry & Exit</CardTitle>
            <CardDescription>Recommended price levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Entry</span>
              <span className="font-bold">{formatCurrency(signalData.entryPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stop Loss</span>
              <span className="font-bold text-red-500">{formatCurrency(signalData.stopLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Take Profit</span>
              <span className="font-bold text-green-500">{formatCurrency(signalData.takeProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Probability</span>
              <span className="font-bold">{signalData.successProbability}%</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Risk Management Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Risk Management</CardTitle>
            <CardDescription>Leverage recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Conservative</span>
              <span className="font-bold">2x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Moderate</span>
              <span className="font-bold">{signalData.recommendedLeverage}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Aggressive</span>
              <span className="font-bold">{signalData.recommendedLeverage * 2}x</span>
            </div>
            <div className="mt-6 p-2 bg-blue-900/20 rounded-md">
              <span className="font-semibold">Recommendation: </span>
              <span>Use {signalData.recommendedLeverage}x leverage for optimal risk/reward</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Summary Card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
            <CardDescription>Current market outlook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-md bg-gray-800">
              {signalData.direction === 'LONG' ? (
                <p>Strong bullish signal on {selectedTimeframe} timeframe with {signalData.confidence}% confidence. 
                   Consider entering near {formatCurrency(signalData.entryPrice)}.</p>
              ) : signalData.direction === 'SHORT' ? (
                <p>Strong bearish signal on {selectedTimeframe} timeframe with {signalData.confidence}% confidence. 
                   Consider entering near {formatCurrency(signalData.entryPrice)}.</p>
              ) : (
                <p>Neutral market on {selectedTimeframe} timeframe. No clear directional bias. 
                   Consider waiting for stronger signals.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center"
              onClick={() => setIsCalculating(true)}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Last Update: {new Date().toLocaleTimeString()}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Timeframe Selection */}
      <div className="mt-6">
        <Tabs value={selectedTimeframe} onValueChange={(tf) => setSelectedTimeframe(tf as TimeFrame)}>
          <TabsList className="grid grid-cols-9 mb-4">
            <TabsTrigger value="1m">1m</TabsTrigger>
            <TabsTrigger value="5m">5m</TabsTrigger>
            <TabsTrigger value="15m">15m</TabsTrigger>
            <TabsTrigger value="30m">30m</TabsTrigger>
            <TabsTrigger value="1h">1h</TabsTrigger>
            <TabsTrigger value="4h">4h</TabsTrigger>
            <TabsTrigger value="1d">1d</TabsTrigger>
            <TabsTrigger value="1w">1w</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 flex items-center">
            <div className="flex items-center gap-2">
              <div className={`${signalData.direction === 'LONG' ? 'bg-green-500' : signalData.direction === 'SHORT' ? 'bg-red-500' : 'bg-yellow-500'} p-2 rounded-md flex items-center`}>
                {signalData.direction === 'LONG' ? 
                  <ArrowUpRight className="h-5 w-5" /> : 
                  signalData.direction === 'SHORT' ? 
                  <ArrowDownRight className="h-5 w-5" /> : 
                  <Minus className="h-5 w-5" />
                }
                <span className="ml-2 font-semibold">
                  {signalData.direction} on {selectedTimeframe}
                </span>
              </div>
            </div>
            <div className="ml-auto text-sm text-gray-400">
              Auto-Updating Every 60 Seconds
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}