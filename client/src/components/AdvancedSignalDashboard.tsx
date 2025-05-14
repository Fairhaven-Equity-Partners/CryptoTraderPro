import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown,
  ChevronUp,
  BarChart4,
  Percent,
  LineChart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  DollarSign,
  RefreshCcw,
  Clock
} from "lucide-react";
import { AdvancedSignal } from '@/lib/advancedSignals';
import { TimeFrame } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

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
  // State for the selected timeframe
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1d');
  const [isCalculating, setIsCalculating] = useState(false);
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as any);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  
  // Refs for managing calculation state
  const calculationTriggeredRef = useRef(false);
  const lastCalculationTimeRef = useRef(0);
  const recalcIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get toast for notifications
  const { toast } = useToast();
  
  // Get market data
  const { chartData, isAllDataLoaded } = useMarketData(symbol);

  // Function to trigger calculation
  const triggerCalculation = useCallback((trigger: string) => {
    const now = Date.now() / 1000;
    const timeSinceLastCalc = now - lastCalculationTimeRef.current;
    
    console.log(`Attempt to trigger calculation (${trigger}) for ${symbol}:
      - Already triggered: ${calculationTriggeredRef.current}
      - Currently calculating: ${isCalculating}
      - Last calculation: ${timeSinceLastCalc.toFixed(2)}s ago
      - All data loaded: ${isAllDataLoaded}`);
    
    // Don't calculate if already calculating, trigger already set, 
    // or calculated recently (except for manual refresh)
    if (
      calculationTriggeredRef.current || 
      isCalculating || 
      (timeSinceLastCalc < 30 && trigger !== 'manual') || 
      !isAllDataLoaded
    ) {
      return;
    }
    
    console.log(`Triggering calculation (${trigger}) for ${symbol}`);
    
    // Set the trigger flag
    calculationTriggeredRef.current = true;
    
    // Use a timeout to debounce calculation
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    // Wait a second to allow any other trigger events to settle
    calculationTimeoutRef.current = setTimeout(() => {
      calculateAllSignals();
    }, 1000);
    
  }, [symbol, isCalculating, isAllDataLoaded]);
  
  // Calculate signals for all timeframes
  const calculateAllSignals = async () => {
    if (!isAllDataLoaded || isCalculating) return;
    
    console.log(`Executing calculation for ${symbol} after delay`);
    setIsCalculating(true);
    
    try {
      console.log(`Starting calculation process for ${symbol}`);
      
      // Create a new signals object to store results
      const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
      
      // Calculate for each timeframe in sequence
      for (const timeframe of timeframes) {
        console.log(`Calculating signal for ${symbol} on ${timeframe} timeframe`);
        
        try {
          const timeframeData = chartData[timeframe] || [];
          console.log(`Starting signal calculation for ${symbol} (${timeframe})`);
          console.log(`DATA CHECK: ${symbol} on ${timeframe} timeframe has ${timeframeData.length} data points.`);
          
          // Only calculate if we have enough data
          if (timeframeData.length > 0) {
            // Actually calculate the signal
            const result = await fetch('/api/signals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                symbol, 
                timeframe,
                chartData: timeframeData
              })
            }).then(r => r.json());
            
            if (result) {
              newSignals[timeframe] = result;
              console.log(`Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                `Direction: ${result.direction}, Confidence: ${result.confidence}%, RecLeverage: ${result.recommendedLeverage}x`);
              console.log(`SUCCESS: Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                `Direction: ${result.direction}, Confidence: ${result.confidence}%`);
            }
          } else {
            console.log(`SKIPPED: Not enough data for ${symbol} on ${timeframe} timeframe`);
            newSignals[timeframe] = null;
          }
        } catch (error) {
          console.error(`Error calculating signal for ${timeframe}:`, error);
          newSignals[timeframe] = null;
        }
        
        // Update the signals state incrementally so UI can update
        setSignals({ ...newSignals });
      }
      
      // Filter out valid signals for recommendation
      const validSignals = Object.values(newSignals).filter(s => s !== null) as AdvancedSignal[];
      console.log(`Found ${validSignals.length} valid signals for recommendation for ${symbol}`);
      
      if (validSignals.length > 0) {
        try {
          const recommendationResult = await fetch('/api/signals/' + symbol).then(r => r.json());
          setRecommendation(recommendationResult);
        } catch (error) {
          console.error('Error generating recommendation:', error);
        }
      }
      
      // Update calculation tracking variables
      lastCalculationTimeRef.current = Date.now() / 1000;
      console.log(`Calculation process complete for ${symbol}`);
      
      // Reset trigger flag after slight delay to prevent rapid re-triggering
      setTimeout(() => {
        calculationTriggeredRef.current = false;
      }, 2000);
      
    } catch (error) {
      console.error('Error in calculation process:', error);
      toast({
        title: 'Calculation Error',
        description: 'Failed to calculate signals. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Auto-trigger calculation when data loads
  useEffect(() => {
    if (isAllDataLoaded && !isCalculating && !calculationTriggeredRef.current) {
      console.log(`Auto-triggering calculation for ${symbol} because data is now loaded`);
      triggerCalculation('data-loaded');
    }
  }, [isAllDataLoaded, triggerCalculation, isCalculating, symbol]);
  
  // Set up recalculation interval
  useEffect(() => {
    // Data loading status checks for debug
    console.log(`Data loading status changed: isAllDataLoaded=${isAllDataLoaded}, isCalculating=${isCalculating}, triggered=${calculationTriggeredRef.current}`);
    
    // Clear any existing interval when component updates
    if (recalcIntervalRef.current) {
      clearInterval(recalcIntervalRef.current);
      recalcIntervalRef.current = null;
    }
    
    // Set up a new interval for recalculation
    recalcIntervalRef.current = setInterval(() => {
      if (isAllDataLoaded && !isCalculating && !calculationTriggeredRef.current) {
        triggerCalculation('auto-interval');
      }
    }, 60000); // 1 minute interval - increased to reduce server load
    
    // Clean up interval on component unmount
    return () => {
      if (recalcIntervalRef.current) {
        clearInterval(recalcIntervalRef.current);
      }
      
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [isAllDataLoaded, triggerCalculation, isCalculating]);
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // No need to recalculate signals on timeframe selection - they should already be
    // calculated as part of the main calculation process
    
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect]);
  
  // Get signal for selected timeframe
  const selectedSignal = signals[selectedTimeframe];
  
  // Helper function to render score badge
  const renderScoreBadge = (score: number) => {
    let color = '';
    if (score < 40) color = 'destructive';
    else if (score < 60) color = 'secondary';
    else if (score < 80) color = 'warning';
    else color = 'success';
    
    return (
      <Badge variant={color === 'success' ? 'outline' : color as any} className={`ml-2 text-lg ${color === 'success' ? 'border-green-500 text-green-500' : ''}`}>
        {score}/100
      </Badge>
    );
  };
  
  // Helper function to render direction badge
  const renderDirectionBadge = (direction: 'LONG' | 'SHORT' | 'NEUTRAL') => {
    if (direction === 'LONG') {
      return (
        <Badge variant="outline" className="ml-2 border-green-500 text-green-500">
          <TrendingUp className="mr-1 h-4 w-4" />
          LONG
        </Badge>
      );
    } else if (direction === 'SHORT') {
      return (
        <Badge variant="destructive" className="ml-2">
          <TrendingDown className="mr-1 h-4 w-4" />
          SHORT
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="ml-2">
          <Minus className="mr-1 h-4 w-4" />
          NEUTRAL
        </Badge>
      );
    }
  };
  
  // Force direct calculation without any checks
  const forceCalculate = () => {
    console.log("Forcing direct calculation for all timeframes...");
    // Reset flags to ensure calculation runs
    calculationTriggeredRef.current = false;
    lastCalculationTimeRef.current = 0;
    setIsCalculating(false);
    
    // Run calculation directly without debounce
    calculateAllSignals();
  };

  return (
    <div className="space-y-4">
      {/* Emergency calculation button */}
      {!recommendation && !isCalculating && (
        <Card className="border border-yellow-600">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
              <h3 className="text-lg font-medium">Signal calculation required</h3>
              <p className="text-muted-foreground text-sm text-center">
                Initial signal calculation needed for {symbol}.
              </p>
              <Button onClick={forceCalculate} className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Calculate Signals
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Signal refresh button */}
      {(recommendation || isCalculating) && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">
              {symbol} Analysis
            </h3>
            {isCalculating && (
              <Badge variant="outline" className="ml-2">
                <Clock className="animate-spin h-3 w-3 mr-1" />
                Calculating...
              </Badge>
            )}
          </div>
          <Button onClick={() => triggerCalculation('manual')} 
                  disabled={isCalculating} 
                  variant="outline" 
                  size="sm"
                  className="text-xs">
            <RefreshCcw className={`mr-1 h-3 w-3 ${isCalculating ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
        </div>
      )}
      
      <Card>
        <CardContent>
          <Tabs defaultValue={selectedTimeframe} onValueChange={(val) => handleTimeframeSelect(val as TimeFrame)}>
            <TabsList className="grid grid-cols-7 mb-4">
              {timeframes.map(tf => (
                <TabsTrigger key={tf} value={tf} className="text-xs sm:text-sm">{tf}</TabsTrigger>
              ))}
            </TabsList>
            
            {timeframes.map(tf => (
              <TabsContent key={tf} value={tf} className="space-y-4">
                {signals[tf] ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-lg font-semibold mr-2">
                          {symbol} ({tf})
                        </span>
                        {renderDirectionBadge(signals[tf]!.direction)}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">Confidence:</span>
                        {renderScoreBadge(signals[tf]!.confidence)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Entry & Exit Strategy</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Entry Price:</span>
                              <span className="font-semibold">{formatCurrency(signals[tf]!.entryPrice)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stop Loss:</span>
                              <span className="text-red-500">{formatCurrency(signals[tf]!.stopLoss)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Take Profit:</span>
                              <span className="text-green-500">{formatCurrency(signals[tf]!.takeProfit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Risk/Reward:</span>
                              <span>{signals[tf]!.optimalRiskReward.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Recommended Leverage:</span>
                              <span className={signals[tf]!.recommendedLeverage > 3 ? "text-red-500 font-semibold" : "font-semibold"}>
                                {signals[tf]!.recommendedLeverage}x
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Advanced Stats Panel - always visible */}
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Advanced Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          {signals[tf]?.indicators ? (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Trend Strength:</span>
                                <Badge variant={
                                  calculateCategoryScore(signals[tf]?.indicators?.trend || []) > 70 ? "outline" : 
                                  calculateCategoryScore(signals[tf]?.indicators?.trend || []) > 40 ? "secondary" : "destructive"
                                } className="text-xs">
                                  {calculateCategoryScore(signals[tf]?.indicators?.trend || [])}/100
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Momentum:</span>
                                <Badge variant={
                                  calculateCategoryScore(signals[tf]?.indicators?.momentum || []) > 70 ? "outline" : 
                                  calculateCategoryScore(signals[tf]?.indicators?.momentum || []) > 40 ? "secondary" : "destructive"
                                } className="text-xs">
                                  {calculateCategoryScore(signals[tf]?.indicators?.momentum || [])}/100
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Volatility:</span>
                                <Badge variant={
                                  calculateCategoryScore(signals[tf]?.indicators?.volatility || []) > 70 ? "outline" : 
                                  calculateCategoryScore(signals[tf]?.indicators?.volatility || []) > 40 ? "secondary" : "destructive"
                                } className="text-xs">
                                  {calculateCategoryScore(signals[tf]?.indicators?.volatility || [])}/100
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Volume Profile:</span>
                                <Badge variant={
                                  calculateCategoryScore(signals[tf]?.indicators?.volume || []) > 70 ? "outline" : 
                                  calculateCategoryScore(signals[tf]?.indicators?.volume || []) > 40 ? "secondary" : "destructive"
                                } className="text-xs">
                                  {calculateCategoryScore(signals[tf]?.indicators?.volume || [])}/100
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span>Pattern Recognition:</span>
                                <Badge variant={
                                  calculateCategoryScore(signals[tf]?.indicators?.pattern || []) > 70 ? "outline" : 
                                  calculateCategoryScore(signals[tf]?.indicators?.pattern || []) > 40 ? "secondary" : "destructive"
                                } className="text-xs">
                                  {calculateCategoryScore(signals[tf]?.indicators?.pattern || [])}/100
                                </Badge>
                              </div>
                              {signals[tf]?.macroScore !== undefined && (
                                <div className="flex justify-between">
                                  <span>Macro Environment:</span>
                                  <Badge variant={
                                    signals[tf]!.macroScore > 70 ? "outline" : 
                                    signals[tf]!.macroScore > 40 ? "secondary" : "destructive"
                                  } className="text-xs">
                                    {signals[tf]!.macroScore}/100
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-2 text-muted-foreground text-sm">
                              Analysis data not available for this timeframe.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Support & Resistance Levels */}
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Support & Resistance Levels</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            {signals[tf]?.supportResistance && signals[tf]!.supportResistance.length > 0 ? (
                              signals[tf]!.supportResistance.map((level, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className={level.type === 'support' ? 'text-green-500' : 'text-red-500'}>
                                    {level.type === 'support' ? 'Support' : 'Resistance'} 
                                    <span className="text-xs text-gray-400 ml-1">
                                      ({level.strength}/100)
                                    </span>
                                  </span>
                                  <span className="font-medium">{formatCurrency(level.price)}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-400">No significant levels detected</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Pattern Formations */}
                      <Card className="border border-gray-800">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">Chart Patterns</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            {signals[tf]?.patternFormations && signals[tf]!.patternFormations.length > 0 ? (
                              signals[tf]!.patternFormations.map((pattern, i) => (
                                <div key={i} className="flex flex-col space-y-1 border-b border-gray-800 pb-2 last:border-0">
                                  <div className="flex justify-between">
                                    <span className="font-medium">{pattern.name}</span>
                                    <Badge variant={
                                      pattern.direction === 'bullish' ? "outline" : 
                                      pattern.direction === 'bearish' ? "destructive" : "secondary"
                                    } className="text-xs">
                                      {pattern.direction.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Target: {formatCurrency(pattern.priceTarget)}</span>
                                    <span>Reliability: {pattern.reliability}%</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-400">No chart patterns detected</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
                    <p className="text-lg font-semibold">Signal not available</p>
                    <p className="text-gray-400 text-center max-w-md">
                      {isCalculating
                        ? "Calculation in progress..."
                        : "Signal calculation not available for this timeframe yet. Click 'Refresh Analysis' to calculate."}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate category score
function calculateCategoryScore(indicators: any[]) {
  if (!indicators || indicators.length === 0) return 0;
  
  // Count the number of bullish and bearish signals
  let bullishCount = 0;
  let bearishCount = 0;
  
  indicators.forEach(ind => {
    if (ind.signal === 'BUY') bullishCount++;
    else if (ind.signal === 'SELL') bearishCount++;
  });
  
  // Calculate a score based on the proportion of bullish vs bearish indicators
  const totalCount = indicators.length;
  
  // Base score is 50 (neutral)
  let score = 50;
  
  // Adjust score based on the difference between bullish and bearish counts
  if (totalCount > 0) {
    // Range is -1 to 1, then scale to -50 to 50
    const bullishBearishRatio = (bullishCount - bearishCount) / totalCount;
    score += bullishBearishRatio * 50;
  }
  
  // Ensure score is between 0 and 100
  return Math.round(Math.max(0, Math.min(100, score)));
}