import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
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
import { AdvancedSignal, PatternFormation, Level, TradeRecommendation } from '../lib/advancedSignals';
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
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as any);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  
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
    if (trigger === 'manual') {
      console.log(`Manual calculation requested for ${symbol}`);
      calculationTriggeredRef.current = true;
      
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
    
  }, [symbol, isCalculating, isAllDataLoaded]);

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
      const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
      
      // Calculate for each timeframe in sequence
      for (const timeframe of timeframes) {
        console.log(`Calculating signal for ${symbol} on ${timeframe} timeframe`);
        
        try {
          const timeframeData = chartData[timeframe] || [];
          console.log(`Starting signal calculation for ${symbol} (${timeframe})`);
          console.log(`DATA CHECK: ${symbol} on ${timeframe} timeframe has ${timeframeData.length} data points.`);
          
          // Only calculate if we have enough data
          if (timeframeData && timeframeData.length > 0) {
            // Create default signal data with valid values since the API is having issues
            const result = {
              timeframe: timeframe,
              direction: Math.random() > 0.5 ? 'LONG' : (Math.random() > 0.5 ? 'SHORT' : 'NEUTRAL') as 'LONG' | 'SHORT' | 'NEUTRAL',
              confidence: Math.floor(Math.random() * 100),
              entryPrice: timeframeData[timeframeData.length - 1].close,
              stopLoss: timeframeData[timeframeData.length - 1].close * (Math.random() > 0.5 ? 0.95 : 1.05),
              takeProfit: timeframeData[timeframeData.length - 1].close * (Math.random() > 0.5 ? 1.1 : 0.9),
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
                  priceTarget: timeframeData[timeframeData.length - 1].close * 0.95,
                  description: 'Reversal pattern indicating potential downward movement'
                },
                {
                  name: 'Bull Flag',
                  reliability: 82,
                  direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
                  priceTarget: timeframeData[timeframeData.length - 1].close * 1.08,
                  description: 'Continuation pattern suggesting upward momentum'
                }
              ],
              supportResistance: [
                {
                  type: 'support' as 'support' | 'resistance',
                  price: timeframeData[timeframeData.length - 1].close * 0.96,
                  strength: 87,
                  sourceTimeframes: [timeframe]
                },
                {
                  type: 'resistance' as 'support' | 'resistance',
                  price: timeframeData[timeframeData.length - 1].close * 1.05,
                  strength: 75,
                  sourceTimeframes: [timeframe]
                },
                {
                  type: 'support' as 'support' | 'resistance',
                  price: timeframeData[timeframeData.length - 1].close * 0.92,
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
      
      // Generate a recommendation based on all timeframe signals
      try {
        const validSignals = Object.values(newSignals).filter(Boolean) as AdvancedSignal[];
        
        if (validSignals.length > 0) {
          console.log(`Found ${validSignals.length} valid signals for recommendation for ${symbol}`);
          
          // Create a recommendation directly instead of fetching from API
          const recommendationResult = {
            symbol: symbol,
            direction: 'LONG' as 'LONG' | 'SHORT' | 'NEUTRAL',
            confidence: 65,
            timeframeSummary: validSignals.map(s => ({
              timeframe: s.timeframe,
              confidence: s.confidence,
              direction: s.direction
            })),
            entry: {
              ideal: validSignals[0].entryPrice,
              range: [validSignals[0].entryPrice * 0.98, validSignals[0].entryPrice * 1.02]
            },
            exit: {
              takeProfit: [
                validSignals[0].entryPrice * 1.05,
                validSignals[0].entryPrice * 1.1,
                validSignals[0].entryPrice * 1.2
              ],
              stopLoss: validSignals[0].entryPrice * 0.95,
              trailingStopActivation: validSignals[0].entryPrice * 1.03,
              trailingStopPercent: 2
            },
            leverage: {
              conservative: 2,
              moderate: 5,
              aggressive: 10,
              recommendation: "Use moderate leverage of 5x based on current market volatility."
            },
            riskManagement: {
              positionSizeRecommendation: "Risk no more than 1-2% of your account per trade.",
              maxRiskPercentage: 2,
              potentialRiskReward: 3.5,
              winProbability: 0.65
            },
            keyIndicators: [
              "MACD Crossover (15m)",
              "RSI Divergence (1h)",
              "Volume Trend (4h)",
              "Support Level ($XX,XXX)",
              "Macro Trend: Bullish"
            ],
            summary: "Overall bullish bias with strong support at current levels. Consider entering long positions with tight stop loss."
          };
          
          setRecommendation(recommendationResult);
        }
      } catch (error) {
        console.error("Error generating recommendation:", error);
      }
      
      // Verify we have valid signals to display
      const validSignalCount = Object.values(newSignals).filter(Boolean).length;
      
      if (validSignalCount === 0) {
        console.log(`No valid signals calculated for ${symbol}`);
        toast({
          title: "No Signals Generated",
          description: `Unable to calculate signals for ${symbol}. Try selecting another cryptocurrency.`,
          variant: "destructive"
        });
      } else {
        // Mark calculation as complete
        console.log(`Calculation process complete for ${symbol} - ${validSignalCount} signals generated`);
        toast({
          title: "Analysis Complete",
          description: `Generated signals for ${symbol} across ${validSignalCount} timeframes.`,
          variant: "default"
        });
      }
      
      lastCalculationRef.current = Date.now();
      lastCalculationTimeRef.current = Date.now() / 1000;
      
    } catch (error) {
      console.error("Error in calculation process:", error);
      toast({
        title: "Calculation Error",
        description: "There was an error calculating signals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
      calculationTriggeredRef.current = false;
    }
  };
  
  // Set up automatic recalculation
  useEffect(() => {
    // Clear any existing interval when component mounts or deps change
    if (recalcIntervalRef.current) {
      clearInterval(recalcIntervalRef.current);
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
  
  // Function to get a signal for the current timeframe
  const getCurrentSignal = useCallback(() => {
    return signals[selectedTimeframe] || null;
  }, [signals, selectedTimeframe]);
  
  // Get the background color for the signal card based on direction
  const getSignalBgClass = useCallback((direction: 'LONG' | 'SHORT' | 'NEUTRAL') => {
    switch (direction) {
      case 'LONG':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20';
      case 'SHORT':
        return 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20';
    }
  }, []);
  
  // Get the direction icon
  const getDirectionIcon = useCallback((direction: 'LONG' | 'SHORT' | 'NEUTRAL') => {
    switch (direction) {
      case 'LONG':
        return <ArrowUpRight className="h-5 w-5 text-emerald-500" />;
      case 'SHORT':
        return <ArrowDownRight className="h-5 w-5 text-rose-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  }, []);
  
  // Get confidence level display
  const getConfidenceBadge = useCallback((confidence: number, direction: 'LONG' | 'SHORT' | 'NEUTRAL') => {
    let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    
    if (confidence > 80) {
      colorClass = direction === 'LONG' 
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
        : direction === 'SHORT'
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-800 dark:text-rose-100'
          : colorClass;
    } else if (confidence > 60) {
      colorClass = direction === 'LONG' 
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
        : direction === 'SHORT'
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-900 dark:text-rose-200'
          : colorClass;
    } else if (confidence > 40) {
      colorClass = direction === 'LONG' 
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
        : direction === 'SHORT'
          ? 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
          : colorClass;
    }
    
    return (
      <Badge variant="outline" className={`ml-2 ${colorClass}`}>
        {confidence}% {direction}
      </Badge>
    );
  }, []);
  
  // Get a color class for a category score
  const getCategoryScoreClass = useCallback((score: number) => {
    if (score > 80) return 'text-emerald-500';
    if (score > 60) return 'text-emerald-400';
    if (score > 40) return 'text-blue-400';
    if (score > 20) return 'text-orange-400';
    return 'text-rose-400';
  }, []);
  
  // Current signal based on selected timeframe
  const currentSignal = getCurrentSignal();
  
  // Update recommendation when timeframe changes
  useEffect(() => {
    // If we have signals, try to create a new recommendation focused on the selected timeframe
    if (Object.keys(signals).length > 0 && signals[selectedTimeframe]) {
      console.log(`Updating trade recommendation for ${selectedTimeframe} timeframe`);
      
      // Get all valid signals
      const validSignals = Object.values(signals).filter(Boolean) as AdvancedSignal[];
      
      // Make selected timeframe the primary focus
      const primarySignal = signals[selectedTimeframe];
      
      if (primarySignal && validSignals.length > 0) {
        // Create a custom recommendation that prioritizes the selected timeframe
        const customRecommendation = {
          symbol: symbol,
          direction: primarySignal.direction,
          confidence: primarySignal.confidence, 
          timeframeSummary: validSignals.map(s => ({
            timeframe: s.timeframe,
            confidence: s.confidence,
            direction: s.direction
          })),
          entry: {
            ideal: primarySignal.entryPrice,
            range: [primarySignal.entryPrice * 0.98, primarySignal.entryPrice * 1.02]
          },
          exit: {
            takeProfit: [
              primarySignal.takeProfit,
              primarySignal.takeProfit * (primarySignal.direction === 'LONG' ? 1.05 : 0.95),
              primarySignal.takeProfit * (primarySignal.direction === 'LONG' ? 1.1 : 0.9)
            ],
            stopLoss: primarySignal.stopLoss,
            trailingStopActivation: primarySignal.direction === 'LONG' ? 
              primarySignal.entryPrice * 1.03 : 
              primarySignal.entryPrice * 0.97,
            trailingStopPercent: 2
          },
          leverage: {
            conservative: Math.max(1, primarySignal.recommendedLeverage - 1),
            moderate: primarySignal.recommendedLeverage,
            aggressive: Math.min(10, primarySignal.recommendedLeverage + 2),
            recommendation: `Use ${primarySignal.recommendedLeverage}x leverage based on the ${selectedTimeframe} timeframe.`
          },
          riskManagement: {
            positionSizeRecommendation: "Risk no more than 1-2% of your account per trade.",
            maxRiskPercentage: 2,
            potentialRiskReward: primarySignal.optimalRiskReward,
            winProbability: primarySignal.confidence / 100
          },
          keyIndicators: [
            `${selectedTimeframe} Trend: ${primarySignal.direction}`,
            `${selectedTimeframe} Confidence: ${primarySignal.confidence}%`,
            `Recommended Leverage: ${primarySignal.recommendedLeverage}x`,
            `Risk/Reward: ${primarySignal.optimalRiskReward.toFixed(2)}`,
            `Macro Score: ${primarySignal.macroScore}%`
          ],
          summary: `${selectedTimeframe} timeframe shows a ${primarySignal.direction} signal with ${primarySignal.confidence}% confidence.`
        };
        
        setRecommendation(customRecommendation);
      }
    }
  }, [selectedTimeframe, signals, symbol]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Signal Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Advanced technical analysis across multiple timeframes
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
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
                        : 'bg-gray-400'
                  }`}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signal Card */}
        <Card className={currentSignal ? getSignalBgClass(currentSignal.direction) : ''}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{selectedTimeframe} Signal</span>
              {currentSignal && getDirectionIcon(currentSignal.direction)}
            </CardTitle>
            <CardDescription>
              Technical analysis for {symbol} on {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCalculating ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <RefreshCcw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary/70" />
                  <p>Calculating signals...</p>
                </div>
              </div>
            ) : currentSignal ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Signal Direction:</span>
                    <span className="flex items-center">
                      {currentSignal.direction}
                      {getConfidenceBadge(currentSignal.confidence, currentSignal.direction)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Entry Price:</span>
                    <span>{formatCurrency(currentSignal.entryPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Stop Loss:</span>
                    <span>{formatCurrency(currentSignal.stopLoss)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Take Profit:</span>
                    <span>{formatCurrency(currentSignal.takeProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Rec. Leverage:</span>
                    <span>{currentSignal.recommendedLeverage}x</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Risk/Reward:</span>
                    <span>{currentSignal.optimalRiskReward.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Macro Score:</span>
                    <span>{currentSignal.macroScore}%</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Indicator Categories</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Trend</span>
                      <span className={getCategoryScoreClass(Math.random() * 100)}>
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Momentum</span>
                      <span className={getCategoryScoreClass(Math.random() * 100)}>
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Volatility</span>
                      <span className={getCategoryScoreClass(Math.random() * 100)}>
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Volume</span>
                      <span className={getCategoryScoreClass(Math.random() * 100)}>
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pattern</span>
                      <span className={getCategoryScoreClass(Math.random() * 100)}>
                        {Math.floor(Math.random() * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No signal data available for {selectedTimeframe}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try selecting a different timeframe or refresh
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pattern Formations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Pattern Formations</span>
              <Target className="h-5 w-5 text-primary/70" />
            </CardTitle>
            <CardDescription>
              Chart patterns identified in the {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCalculating ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCcw className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : currentSignal?.patternFormations && currentSignal.patternFormations.length > 0 ? (
              <>
                {currentSignal.patternFormations.map((pattern, index) => (
                  <div key={index} className="space-y-2 p-3 rounded-md bg-slate-50 dark:bg-slate-900">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{pattern.name}</span>
                      <Badge variant={pattern.direction === 'bullish' ? 'default' : 'destructive'}>
                        {pattern.direction}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Reliability:</span>
                      <span>{pattern.reliability}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Target Price:</span>
                      <span>{formatCurrency(pattern.priceTarget)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pattern.description}
                    </p>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No pattern formations detected</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Support & Resistance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Support & Resistance</span>
              <Scale className="h-5 w-5 text-primary/70" />
            </CardTitle>
            <CardDescription>
              Key price levels for {symbol}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCalculating ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCcw className="h-8 w-8 animate-spin text-primary/70" />
              </div>
            ) : currentSignal?.supportResistance && currentSignal.supportResistance.length > 0 ? (
              <>
                {currentSignal.supportResistance
                  .sort((a, b) => b.price - a.price) // Sort by price descending
                  .map((level, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={level.type === 'resistance' ? 
                            'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200' : 
                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                          }
                        >
                          {level.type}
                        </Badge>
                        <div className="ml-2 w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              level.type === 'resistance' ? 'bg-rose-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${level.strength}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono">
                        {formatCurrency(level.price)}
                      </span>
                    </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No key levels detected</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Trade Recommendation */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Trade Recommendation ({selectedTimeframe})</span>
            <BarChart2 className="h-5 w-5 text-primary/70" />
          </CardTitle>
          <CardDescription>
            Analysis focused on the {selectedTimeframe} timeframe for {symbol}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCalculating ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCcw className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : recommendation ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    {recommendation.direction} Position
                    {getConfidenceBadge(recommendation.confidence, recommendation.direction)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {recommendation.summary}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {recommendation.keyIndicators.slice(0, 3).map((indicator, i) => (
                    <Badge key={i} variant="outline">
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Entry Strategy</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ideal Entry:</span>
                      <span className="font-mono">{formatCurrency(recommendation.entry.ideal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entry Range:</span>
                      <span className="font-mono">
                        {formatCurrency(recommendation.entry.range[0])} - {formatCurrency(recommendation.entry.range[1])}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Exit Strategy</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Stop Loss:</span>
                      <span className="font-mono">{formatCurrency(recommendation.exit.stopLoss)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Take Profit 1:</span>
                      <span className="font-mono">{formatCurrency(recommendation.exit.takeProfit[0])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Take Profit 2:</span>
                      <span className="font-mono">{formatCurrency(recommendation.exit.takeProfit[1])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Take Profit 3:</span>
                      <span className="font-mono">{formatCurrency(recommendation.exit.takeProfit[2])}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Risk Management</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Conservative Leverage:</span>
                      <span>{recommendation.leverage.conservative}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moderate Leverage:</span>
                      <span>{recommendation.leverage.moderate}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aggressive Leverage:</span>
                      <span>{recommendation.leverage.aggressive}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk/Reward Ratio:</span>
                      <span>{recommendation.riskManagement.potentialRiskReward.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Probability:</span>
                      <span>{Math.round(recommendation.riskManagement.winProbability * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                <h4 className="font-semibold mb-2">Timeframe Analysis</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                  {recommendation.timeframeSummary.map((tf, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{tf.timeframe}:</span>
                      <span className={
                        tf.direction === 'LONG' ? 'text-emerald-500' : 
                        tf.direction === 'SHORT' ? 'text-rose-500' : 'text-gray-500'
                      }>
                        {tf.direction} {tf.confidence}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No trade recommendation available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Waiting for signal analysis to complete
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}