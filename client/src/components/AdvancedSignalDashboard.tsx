import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
  Info, 
  Target, 
  DollarSign,
  RefreshCcw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// import { AutoCalculationStatus } from "./AutoCalculationStatus";

// Import window type definitions
import '../lib/windowTypes';

// Import our new type definitions and utilities
import { TimeFrame } from '../types';
import { formatCurrency } from '../lib/utils';

// Interface for price level display
interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

// Local price formatter for this component
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  } else {
    return price.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8 
    });
  }
}

// Memoized price level display component
const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center">
        <Badge variant="outline" className={`${colorClass} text-xs font-mono`}>
          {value ? formatCurrency(value) : 'N/A'}
        </Badge>
        <span className="ml-1 text-xs text-gray-500">{timeframe}</span>
      </div>
    </div>
  );
});

// Interface for dashboard props
interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
  onAnalysisComplete?: () => void;
}

// Main component
export default function AdvancedSignalDashboard({ 
  symbol,
  onTimeframeSelect,
  onAnalysisComplete 
}: AdvancedSignalDashboardProps) {
  // State for storing signals, timeframes, etc.
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1h');
  const [displayedSignal, setDisplayedSignal] = useState<any>(null);
  const [allTimeframeSignals, setAllTimeframeSignals] = useState<Record<TimeFrame, any>>({} as any);
  const [assetPrice, setAssetPrice] = useState<number>(0);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);
  const { toast } = useToast();
  
  // Timer for auto-refresh countdown
  const timerIntervalRef = useRef<number | null>(null);
  
  // List of timeframes available
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  // Subscribe to price updates
  useEffect(() => {
    // Function to handle live price updates
    const handleLivePriceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.symbol === symbol && event.detail.price) {
        console.log(`✅ LIVE PRICE RECEIVED for ${symbol}: ${event.detail.price}`);
        setAssetPrice(event.detail.price);
        
        // Price updates now automatically trigger calculations via the autoCalculationSystem
      }
    };
    
    // Listen for price updates
    window.addEventListener('live-price-update', handleLivePriceUpdate as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('live-price-update', handleLivePriceUpdate as EventListener);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [symbol]);
  
  // Start countdown timer for auto-refresh
  useEffect(() => {
    // Start countdown timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = window.setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          // Reset to 60 when it hits 0
          return 60;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  // Format the timer for display
  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(nextRefreshIn / 60);
    const seconds = nextRefreshIn % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [nextRefreshIn]);
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // If there's a signal for this timeframe, display it
    if (allTimeframeSignals[timeframe]) {
      setDisplayedSignal(allTimeframeSignals[timeframe]);
    }
    
    // Call the parent callback if provided
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [allTimeframeSignals, onTimeframeSelect]);
  
  // Function to get signal background class based on direction
  function getSignalBgClass(direction: string): string {
    if (direction === 'LONG') return 'bg-green-900/30 text-green-300 border-green-800';
    if (direction === 'SHORT') return 'bg-red-900/30 text-red-300 border-red-800';
    return 'bg-gray-800/30 text-gray-300 border-gray-700';
  }
  
  // Render the component
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white font-bold text-lg">Advanced Signal Dashboard</h2>
          <p className="text-slate-400 text-sm">Comprehensive technical analysis for {symbol}</p>
        </div>
        <div className="flex justify-end items-center space-x-2">
          {/* Just always show the timer or price fetching, never show calculating signals */}
          {formattedTimer === "0:00" || formattedTimer === "0:01" || formattedTimer === "0:02" || formattedTimer === "0:03" || formattedTimer === "0:04" || formattedTimer === "0:05" ? (
            <Badge variant="outline" className="text-xs bg-blue-700/70 text-white border-blue-600 px-3 py-1 animate-pulse">
              FETCHING PRICE DATA...
            </Badge>
          ) : (
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                {/* Auto calculation status indicator */}
                <Badge variant="outline" className="text-xs bg-green-700/70 text-white border-green-600 px-3 py-1">
                  AUTO CALCULATIONS ACTIVE
                </Badge>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Next auto-update in {formattedTimer}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Card className="border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Signal Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 bg-zinc-900/50 text-zinc-300 border-zinc-700">
                {assetPrice > 0 ? `${formatCurrency(assetPrice)}` : 'Loading...'}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Select a timeframe to view detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-4">
            <Tabs defaultValue={selectedTimeframe} onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
              <TabsList className="grid grid-cols-5 md:grid-cols-9 mb-4">
                {timeframes.map((tf) => (
                  <TabsTrigger 
                    key={tf} 
                    value={tf}
                    className={`text-xs ${
                      allTimeframeSignals[tf]?.direction === 'LONG' 
                        ? 'data-[state=active]:bg-green-900/30 data-[state=active]:text-green-300' 
                        : allTimeframeSignals[tf]?.direction === 'SHORT'
                          ? 'data-[state=active]:bg-red-900/30 data-[state=active]:text-red-300'
                          : ''
                    }`}
                  >
                    {tf}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* Content for each timeframe */}
              {timeframes.map((tf) => (
                <TabsContent key={tf} value={tf} className="space-y-4">
                  {allTimeframeSignals[tf] ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Signal direction */}
                        <Card className="border border-slate-800 bg-slate-900/50">
                          <CardHeader className="py-4 px-4">
                            <CardTitle className="text-sm font-medium">Signal Direction</CardTitle>
                          </CardHeader>
                          <CardContent className="py-2 px-4">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className={`px-4 py-2 text-sm font-semibold ${getSignalBgClass(allTimeframeSignals[tf]?.direction)}`}>
                                {allTimeframeSignals[tf]?.direction === 'LONG' && (
                                  <TrendingUp className="w-4 h-4 mr-1" />
                                )}
                                {allTimeframeSignals[tf]?.direction === 'SHORT' && (
                                  <TrendingDown className="w-4 h-4 mr-1" />
                                )}
                                {allTimeframeSignals[tf]?.direction === 'NEUTRAL' && (
                                  <Minus className="w-4 h-4 mr-1" />
                                )}
                                {allTimeframeSignals[tf]?.direction || 'LOADING...'}
                              </Badge>
                              <div className="text-right">
                                <div className="text-sm font-medium text-slate-300">Confidence</div>
                                <div className="text-2xl font-bold text-slate-200">{allTimeframeSignals[tf]?.confidence || 0}%</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-slate-500 text-center">
                        <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Signal data is loading...</p>
                        <p className="text-sm text-slate-600 mt-1">Please wait while we analyze the market</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}