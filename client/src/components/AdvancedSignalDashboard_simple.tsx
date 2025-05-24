import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Scale, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  RefreshCcw,
  Clock
} from "lucide-react";
import { TimeFrame } from '../types';
import { useToast } from '../hooks/use-toast';

// List of timeframes to display
const timeframes: TimeFrame[] = ['15m', '1h', '4h', '1d', '3d', '1w', '1M'];

// Define the props for the component
interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

// Main component
export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect 
}: AdvancedSignalDashboardProps) {
  // State
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1d');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculation, setLastCalculation] = useState<number>(0);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(120);
  
  // Refs to track calculation status
  const lastCalculationTimeRef = useRef<number>(0);
  const calculationTriggeredRef = useRef<boolean>(false);
  const recalcIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get toast for notifications
  const { toast } = useToast();
  
  // Function to format currency values
  function formatCurrency(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  // Function to trigger calculation
  const triggerCalculation = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCalc = now - lastCalculationTimeRef.current;
    
    // Don't calculate more than once every 2 minutes (120000ms)
    if (timeSinceLastCalc < 120000 && lastCalculationTimeRef.current > 0) {
      console.log(`Throttling calculation: Last calculation was ${Math.round(timeSinceLastCalc/1000)}s ago, minimum interval is 120s`);
      return;
    }
    
    console.log(`Triggering calculation for ${symbol}`);
    setIsCalculating(true);
    
    // Simulate calculation time
    setTimeout(() => {
      setIsCalculating(false);
      lastCalculationTimeRef.current = Date.now();
      setLastCalculation(Date.now());
      toast({
        title: "Analysis Complete",
        description: `Updated signals for ${symbol}`,
        variant: "default"
      });
      calculationTriggeredRef.current = false;
    }, 2000);
    
  }, [symbol, toast]);

  // Handle price updates
  useEffect(() => {
    const handlePriceUpdate = (event: Event) => {
      const priceEvent = event as CustomEvent;
      const { symbol: eventSymbol, price } = priceEvent.detail;
      
      // Only handle updates for our current symbol
      if (eventSymbol === symbol) {
        console.log(`Price update received for ${symbol}: ${price}`);
        setCurrentPrice(price);
      }
    };
    
    // Listen for live price updates
    window.addEventListener('live-price-update', handlePriceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
    };
  }, [symbol]);

  // Update timer for next refresh
  useEffect(() => {
    // Clear any existing timers first to prevent duplicates
    if (recalcIntervalRef.current) {
      clearInterval(recalcIntervalRef.current);
    }
    
    // Reset timer when a calculation completes
    if (!isCalculating && lastCalculation > 0) {
      setNextRefreshIn(120); // Reset to 2 minutes (120 seconds)
    }
    
    // Set up countdown timer
    const timerInterval = setInterval(() => {
      setNextRefreshIn(prevTime => {
        if (prevTime <= 0) {
          triggerCalculation();
          return 120; // Reset to 2 minutes
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // Save interval reference for cleanup
    recalcIntervalRef.current = timerInterval;
    
    // Cleanup function
    return () => {
      if (recalcIntervalRef.current) {
        clearInterval(recalcIntervalRef.current);
      }
    };
  }, [isCalculating, lastCalculation, triggerCalculation]);

  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{symbol}</h2>
          <p className="text-muted-foreground">
            Advanced Technical Analysis Dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {currentPrice && (
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold">
                {formatCurrency(currentPrice)}
              </span>
              <span className="text-xs text-muted-foreground">
                Live Price
              </span>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1" 
            onClick={() => triggerCalculation()}
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          {isCalculating ? 
            'Calculating...' : 
            lastCalculation > 0 ? 
              `Last updated: ${new Date(lastCalculation).toLocaleTimeString()}` : 
              'Not yet calculated'
          }
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span>Next update in: {nextRefreshIn}s</span>
      </div>
      
      <Tabs defaultValue={selectedTimeframe} className="w-full">
        <TabsList className="grid grid-cols-7 w-full">
          {timeframes.map(timeframe => (
            <TabsTrigger 
              key={timeframe} 
              value={timeframe}
              onClick={() => handleTimeframeSelect(timeframe)}
            >
              {timeframe}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {timeframes.map(timeframe => (
          <TabsContent key={timeframe} value={timeframe} className="space-y-4 pt-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {symbol} Analysis - {timeframe} Timeframe
                </CardTitle>
                <CardDescription>
                  Technical analysis and trade signals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentPrice ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Price:</span>
                      <span className="font-bold">{formatCurrency(currentPrice)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Signal Strength:</span>
                        <Progress value={75} className="w-1/2" />
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Strong Buy
                        </Badge>
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                          Bullish Trend
                        </Badge>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          Moderate Volatility
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Support</span>
                        <div className="font-medium text-green-500">
                          {formatCurrency(currentPrice * 0.97)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Resistance</span>
                        <div className="font-medium text-red-500">
                          {formatCurrency(currentPrice * 1.03)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Stop Loss</span>
                        <div className="font-medium text-red-500">
                          {formatCurrency(currentPrice * 0.95)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Take Profit</span>
                        <div className="font-medium text-green-500">
                          {formatCurrency(currentPrice * 1.05)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40">
                    <span className="text-muted-foreground">
                      Waiting for price data...
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}