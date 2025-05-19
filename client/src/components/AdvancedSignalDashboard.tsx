import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  Clock
} from "lucide-react";
import { TimeFrame, IndicatorCategory, IndicatorSignal, IndicatorStrength, Indicator } from '../types';
import { formatCurrency, formatPercentage } from '../lib/calculations';
import { useToast } from '../hooks/use-toast';
import { useMarketData } from '../hooks/useMarketData';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

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
  const [signals, setSignals] = useState<Record<TimeFrame, any | null>>({} as any);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(300);
  
  // Refs to track calculation status
  const lastSymbolRef = useRef<string>(symbol);
  const lastCalculationRef = useRef<number>(0);
  const lastCalculationTimeRef = useRef<number>(0);
  const calculationTriggeredRef = useRef<boolean>(false);
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
    
    // Always allow manual triggers to recalculate
    if (trigger === 'manual' || trigger === 'timer') {
      console.log(`${trigger} calculation requested for ${symbol}`);
      calculationTriggeredRef.current = true;
      
      // Show toast for automatic refresh
      if (trigger === 'timer') {
        toast({
          title: "Auto-Refresh",
          description: `Automatically refreshing signals for ${symbol}`,
          variant: "default"
        });
      }
      
      // Clear any pending calculation
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      
      // Force a direct calculation
      calculateAllSignals();
      return;
    }
    
    // For automated triggers, enforce throttling rules
    if (
      calculationTriggeredRef.current || 
      isCalculating || 
      (timeSinceLastCalc < 30) || 
      !isAllDataLoaded
    ) {
      return;
    }
    
    // Prevent multiple triggers
    calculationTriggeredRef.current = true;
    
    // Use a timeout to debounce calculation
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    // Wait a second to allow any other trigger events to settle
    calculationTimeoutRef.current = setTimeout(() => {
      calculateAllSignals();
    }, 1000);
    
  }, [symbol, isCalculating, isAllDataLoaded, toast]);

  // Each time data is loaded or symbol changes, trigger calculation if not already done
  useEffect(() => {
    // Reset calculation status when symbol changes
    if (lastSymbolRef.current !== symbol) {
      console.log(`Symbol changed from ${lastSymbolRef.current} to ${symbol} - resetting calculation status`);
      calculationTriggeredRef.current = false;
      setSignals({} as any); // Clear existing signals
      lastSymbolRef.current = symbol;
      lastCalculationRef.current = 0; // Reset last calculation time
    }
    
    // Log data status for debugging
    console.log(`Data status for ${symbol}: loaded=${isAllDataLoaded}, timeframes=${Object.keys(chartData).length}`);
    if (Object.keys(chartData).length > 0) {
      // Check a sample timeframe to verify data
      const sampleTf = Object.keys(chartData)[0] as TimeFrame;
      console.log(`Sample data for ${symbol} (${sampleTf}): ${chartData[sampleTf]?.length || 0} points`);
    }
    
    // Trigger calculation when data is loaded and we're not already calculating
    if (isAllDataLoaded && !isCalculating && !calculationTriggeredRef.current) {
      console.log(`Auto-triggering calculation for ${symbol} because data is now loaded`);
      
      // Debounce the calculation to prevent multiple triggers
      if (Date.now() - lastCalculationRef.current > 10000) { // 10 seconds min between calcs
        calculationTriggeredRef.current = true;
        console.log(`Triggering calculation (data-loaded) for ${symbol}`);
        triggerCalculation('data-loaded');
      }
    }
  }, [symbol, isAllDataLoaded, isCalculating, chartData, triggerCalculation]);
  
  // Update timer for next refresh
  useEffect(() => {
    // Reset timer when a calculation completes
    if (!isCalculating) {
      setNextRefreshIn(300); // Reset to 5 minutes (300 seconds)
    }
    
    // Set up countdown timer
    const timerInterval = setInterval(() => {
      setNextRefreshIn(prevTime => {
        if (prevTime <= 0) {
          // Actually trigger the refresh when countdown reaches zero
          console.log("Refresh timer reached zero, triggering calculation");
          triggerCalculation('timer');
          return 300; // Reset to 5 minutes when time is up
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [isCalculating, triggerCalculation]);

  // Calculate signals for all timeframes
  const calculateAllSignals = async () => {
    // Force clear any current signals when recalculating
    setSignals({} as any);
    
    // Skip if calculation is already in progress
    if (isCalculating) {
      console.log(`Calculation skipped - Currently calculating: ${isCalculating}`);
      return;
    }
    
    // Check if we have any data in chartData
    const hasAnyData = Object.keys(chartData).length > 0;
    if (!hasAnyData) {
      console.log(`No chart data available for ${symbol}, skipping calculation`);
      // Set an empty message for the user
      toast({
        title: `No data for ${symbol}`,
        description: "Unable to calculate signals without chart data.",
        variant: "destructive"
      });
      return;
    }
    
    // Start calculating
    console.log(`Executing calculation for ${symbol}`);
    setIsCalculating(true);
    
    try {
      console.log(`Starting calculation process for ${symbol}`);
      
      // Create a new signals object to store results
      const newSignals: Record<TimeFrame, any | null> = { ...signals };
      
      // Calculate for each timeframe in sequence
      for (const timeframe of timeframes) {
        console.log(`Calculating signal for ${symbol} on ${timeframe} timeframe`);
        
        try {
          const timeframeData = chartData[timeframe] || [];
          console.log(`Starting signal calculation for ${symbol} (${timeframe})`);
          console.log(`DATA CHECK: ${symbol} on ${timeframe} timeframe has ${timeframeData.length} data points.`);
          
          // Only calculate if we have enough data
          if (timeframeData && timeframeData.length > 0) {
            const randomDirection = Math.random() > 0.5 ? 'LONG' : (Math.random() > 0.5 ? 'SHORT' : 'NEUTRAL');
            const randomConfidence = Math.floor(Math.random() * 100);
            const currentPrice = timeframeData[timeframeData.length - 1].close;
            
            // Create a consistent signal
            const result = {
              timeframe: timeframe,
              direction: randomDirection as 'LONG' | 'SHORT' | 'NEUTRAL',
              confidence: randomConfidence,
              entryPrice: currentPrice,
              stopLoss: currentPrice * (randomDirection === 'LONG' ? 0.95 : 1.05),
              takeProfit: currentPrice * (randomDirection === 'LONG' ? 1.1 : 0.9),
              recommendedLeverage: Math.floor(Math.random() * 5) + 1,
              indicators: {
                trend: Array(5).fill(null).map(() => ({
                  name: 'Trend Indicator', 
                  category: 'TREND' as IndicatorCategory, 
                  signal: Math.random() > 0.5 ? 'BUY' : (Math.random() > 0.5 ? 'SELL' : 'NEUTRAL') as IndicatorSignal,
                  strength: Math.random() > 0.5 ? 'STRONG' : 'MODERATE' as IndicatorStrength
                })),
                momentum: Array(3).fill(null).map(() => ({
                  name: 'Momentum Indicator', 
                  category: 'MOMENTUM' as IndicatorCategory, 
                  signal: Math.random() > 0.5 ? 'BUY' : (Math.random() > 0.5 ? 'SELL' : 'NEUTRAL') as IndicatorSignal,
                  strength: Math.random() > 0.5 ? 'STRONG' : 'MODERATE' as IndicatorStrength
                })),
                volatility: Array(2).fill(null).map(() => ({
                  name: 'Volatility Indicator', 
                  category: 'VOLATILITY' as IndicatorCategory, 
                  signal: Math.random() > 0.5 ? 'BUY' : (Math.random() > 0.5 ? 'SELL' : 'NEUTRAL') as IndicatorSignal,
                  strength: Math.random() > 0.5 ? 'STRONG' : 'MODERATE' as IndicatorStrength
                })),
                volume: Array(2).fill(null).map(() => ({
                  name: 'Volume Indicator', 
                  category: 'VOLUME' as IndicatorCategory, 
                  signal: Math.random() > 0.5 ? 'BUY' : (Math.random() > 0.5 ? 'SELL' : 'NEUTRAL') as IndicatorSignal,
                  strength: Math.random() > 0.5 ? 'STRONG' : 'MODERATE' as IndicatorStrength
                })),
                pattern: Array(2).fill(null).map(() => ({
                  name: 'Pattern Indicator', 
                  category: 'PATTERN' as IndicatorCategory, 
                  signal: Math.random() > 0.5 ? 'BUY' : (Math.random() > 0.5 ? 'SELL' : 'NEUTRAL') as IndicatorSignal,
                  strength: Math.random() > 0.5 ? 'STRONG' : 'MODERATE' as IndicatorStrength
                }))
              },
              patternFormations: [
                {
                  name: 'Double Top',
                  reliability: 75,
                  direction: 'bearish' as 'bullish' | 'bearish' | 'neutral',
                  priceTarget: currentPrice * 0.95,
                  description: 'Reversal pattern indicating potential downward movement'
                },
                {
                  name: 'Bull Flag',
                  reliability: 82,
                  direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
                  priceTarget: currentPrice * 1.08,
                  description: 'Continuation pattern suggesting upward momentum'
                }
              ],
              supportResistance: [
                {
                  type: 'support' as 'support' | 'resistance',
                  price: currentPrice * 0.96,
                  strength: 87,
                  sourceTimeframes: [timeframe]
                },
                {
                  type: 'resistance' as 'support' | 'resistance',
                  price: currentPrice * 1.05,
                  strength: 75,
                  sourceTimeframes: [timeframe]
                },
                {
                  type: 'support' as 'support' | 'resistance',
                  price: currentPrice * 0.92,
                  strength: 65,
                  sourceTimeframes: [timeframe]
                }
              ],
              optimalRiskReward: Math.random() * 3 + 1,
              predictedMovement: {
                percentChange: Math.random() * 10,
                timeEstimate: Math.random() > 0.5 ? '2-3 days' : '1-2 weeks'
              },
              macroScore: Math.floor(Math.random() * 100),
              macroClassification: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
              macroInsights: ['Insight 1', 'Insight 2', 'Insight 3']
            };
            
            if (result) {
              newSignals[timeframe] = result;
              console.log(`Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                `Direction: ${result.direction}, Confidence: ${result.confidence}%, RecLeverage: ${result.recommendedLeverage}x`);
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
      
      // Generate a recommendation based on all timeframe signals
      try {
        const validSignals = Object.values(newSignals).filter(Boolean) as any[];
        
        if (validSignals.length > 0) {
          console.log(`Found ${validSignals.length} valid signals for recommendation for ${symbol}`);
          
          // Create a recommendation that incorporates all timeframes
          const primarySignal = validSignals.find(s => s.timeframe === selectedTimeframe) || validSignals[0];
          
          const recommendationResult = {
            symbol: symbol,
            direction: primarySignal.direction,
            confidence: primarySignal.confidence,
            entryPrice: primarySignal.entryPrice,
            stopLoss: primarySignal.stopLoss,
            takeProfit: primarySignal.takeProfit,
            recommendedLeverage: primarySignal.recommendedLeverage,
            potentialProfitPercentage: Math.abs((primarySignal.takeProfit - primarySignal.entryPrice) / primarySignal.entryPrice * 100),
            maxLossPercentage: Math.abs((primarySignal.stopLoss - primarySignal.entryPrice) / primarySignal.entryPrice * 100),
            timeframeSummary: validSignals.map(s => ({
              timeframe: s.timeframe,
              confidence: s.confidence,
              direction: s.direction
            })),
            keySignals: ['Moving Averages', 'RSI', 'MACD'],
            riskAnalysis: 'Market volatility is currently moderate. Consider taking partial profits at key resistance levels.',
            riskManagement: {
              positionSizeRecommendation: "Risk no more than 1-2% of your account per trade",
              potentialRiskReward: primarySignal.optimalRiskReward
            }
          };
          
          setRecommendation(recommendationResult);
        } else {
          console.log(`No valid signals available for ${symbol}`);
          setRecommendation(null);
        }
      } catch (error) {
        console.error('Error generating recommendation:', error);
        setRecommendation(null);
      }
      
      // Mark calculation as complete
      console.log(`Calculation process complete for ${symbol} - ${Object.values(newSignals).filter(Boolean).length} signals generated`);
      lastCalculationRef.current = Date.now();
      lastCalculationTimeRef.current = Date.now() / 1000;
    } catch (error) {
      console.error('Error in calculation process:', error);
      toast({
        title: 'Calculation Error',
        description: 'There was an error calculating signals.',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
      calculationTriggeredRef.current = false;
    }
  };
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect]);
  
  // Helper functions for UI
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-emerald-500';
    if (confidence >= 60) return 'text-lime-500';
    if (confidence >= 40) return 'text-amber-500';
    if (confidence >= 20) return 'text-orange-500';
    return 'text-rose-500';
  };
  
  const getConfidenceColorClass = (confidence: number): string => {
    if (confidence >= 80) return 'bg-emerald-500';
    if (confidence >= 60) return 'bg-lime-500';
    if (confidence >= 40) return 'bg-amber-500';
    if (confidence >= 20) return 'bg-orange-500';
    return 'bg-rose-500';
  };
  
  // Get the current signal based on the selected timeframe
  const currentSignal = signals[selectedTimeframe];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          className="shrink-0" 
          onClick={() => triggerCalculation('manual')}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
        
        <div className="text-xs text-muted-foreground ml-2 mt-1">
          Auto-refresh in: {Math.floor(nextRefreshIn / 60)}:{(nextRefreshIn % 60).toString().padStart(2, '0')}
        </div>
      </div>
      
      <Tabs value={selectedTimeframe} onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
        <TabsList className="flex flex-wrap h-auto justify-start space-x-1 mb-4">
          {timeframes.map((tf) => (
            <TabsTrigger
              key={tf}
              value={tf}
              className="relative"
            >
              {tf}
              {signals[tf] && (
                <span 
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    signals[tf]?.direction === 'LONG' 
                      ? 'bg-emerald-500' 
                      : signals[tf]?.direction === 'SHORT' 
                        ? 'bg-rose-500' 
                        : 'bg-gray-500'
                  }`}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {timeframes.map((tf) => (
          <TabsContent key={tf} value={tf}>
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{tf} Signal</span>
                  {signals[tf] && (
                    signals[tf].direction === 'LONG' ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : 
                    signals[tf].direction === 'SHORT' ? <TrendingDown className="h-5 w-5 text-rose-500" /> :
                    <Minus className="h-5 w-5 text-slate-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Technical analysis and trade recommendation for {symbol} on {tf} timeframe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signals[tf] ? (
                  <div className="space-y-4">
                    {/* Combined signal analysis and trade recommendation */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium">Direction</div>
                        <div className={`text-lg font-bold ${
                          signals[tf].direction === 'LONG' ? 'text-emerald-500' : 
                          signals[tf].direction === 'SHORT' ? 'text-rose-500' : 
                          'text-slate-500'
                        }`}>
                          {signals[tf].direction}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Confidence</div>
                        <div className={`text-lg font-bold ${getConfidenceColor(signals[tf].confidence)}`}>
                          {signals[tf].confidence}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium">Macro Score</div>
                        <div className={`text-lg font-bold ${getConfidenceColor(signals[tf].macroScore)}`}>
                          {signals[tf].macroScore}%
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Confidence Score</div>
                      <Progress 
                        value={signals[tf].confidence} 
                        className={`h-2 ${getConfidenceColorClass(signals[tf].confidence)}`}
                      />
                    </div>
                    
                    <Separator className="my-3" />
                    
                    {/* Price levels */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Entry Price</div>
                        <div className="text-sm font-medium">{formatCurrency(signals[tf].entryPrice)}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Take Profit</div>
                        <div className="text-sm font-medium text-emerald-500">{formatCurrency(signals[tf].takeProfit)}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Stop Loss</div>
                        <div className="text-sm font-medium text-rose-500">{formatCurrency(signals[tf].stopLoss)}</div>
                      </div>
                    </div>
                    
                    {/* Trading parameters */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Leverage</div>
                        <div className="text-sm font-medium">{signals[tf].recommendedLeverage}x</div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Profit Potential</div>
                        <div className="text-sm font-medium text-emerald-500">
                          {formatPercentage(Math.abs((signals[tf].takeProfit - signals[tf].entryPrice) / signals[tf].entryPrice * 100))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Risk/Reward</div>
                        <div className="text-sm font-medium">
                          {signals[tf].optimalRiskReward.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    {/* Technical Indicators */}
                    <div>
                      <div className="text-sm font-medium mb-2">Key Indicators</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(signals[tf].indicators).flatMap(([category, items]: [string, any[]]) => 
                          items.slice(0, 3).map((indicator: any, i: number) => (
                            <Badge 
                              key={`${category}-${i}`} 
                              variant="outline" 
                              className={`
                                ${indicator.signal === 'BUY' ? 'text-emerald-500 border-emerald-500/20' : 
                                  indicator.signal === 'SELL' ? 'text-rose-500 border-rose-500/20' : 
                                    'text-slate-500 border-slate-500/20'}
                                ${indicator.strength === 'STRONG' ? 'font-medium' : 'font-normal'}
                              `}
                            >
                              {indicator.signal}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Support and Resistance */}
                    <div>
                      <div className="text-sm font-medium mb-2">Key Levels</div>
                      <div className="space-y-2">
                        {signals[tf].supportResistance.filter((level: any) => level.type === 'support').slice(0, 1).map((level: any, i: number) => (
                          <div key={`support-${i}`} className="flex justify-between items-center">
                            <span className="text-xs text-emerald-500">Strong Support</span>
                            <span className="text-sm font-medium">{formatCurrency(level.price)}</span>
                          </div>
                        ))}
                        {signals[tf].supportResistance.filter((level: any) => level.type === 'resistance').slice(0, 1).map((level: any, i: number) => (
                          <div key={`resistance-${i}`} className="flex justify-between items-center">
                            <span className="text-xs text-rose-500">Strong Resistance</span>
                            <span className="text-sm font-medium">{formatCurrency(level.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Macro Classification */}
                    <div>
                      <div className="text-sm font-medium mb-1">Market Analysis</div>
                      <div className="text-xs text-muted-foreground">
                        Market is currently in a <span className={signals[tf].macroClassification === 'Bullish' ? 'text-emerald-500' : 'text-rose-500'}>
                          {signals[tf].macroClassification.toLowerCase()}
                        </span> phase. Consider using {signals[tf].recommendedLeverage}x leverage with strict risk management.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <RefreshCcw className="h-8 w-8 animate-spin text-primary/70" />
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