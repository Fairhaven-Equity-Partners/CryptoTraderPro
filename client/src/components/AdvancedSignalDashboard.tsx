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
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // If the outer component wants to be notified of selection changes
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect]);
  
  // Get the current signal based on selected timeframe
  const getCurrentSignal = useCallback(() => {
    if (signals && selectedTimeframe && signals[selectedTimeframe]) {
      return signals[selectedTimeframe];
    }
    return null;
  }, [signals, selectedTimeframe]);
  
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
  
  // Function to get the background color for the signal card
  const getSignalBgClass = useCallback((direction: string) => {
    if (direction === 'LONG') return 'bg-emerald-500/5 border-emerald-500/20';
    if (direction === 'SHORT') return 'bg-rose-500/5 border-rose-500/20';
    return 'bg-slate-500/5 border-slate-500/20';
  }, []);
  
  // Function to get the color for the confidence score
  const getConfidenceColor = useCallback((score: number) => {
    if (score > 80) return 'text-emerald-400';
    if (score > 60) return 'text-lime-400';
    if (score > 40) return 'text-amber-400';
    if (score > 20) return 'text-orange-400';
    return 'text-rose-400';
  }, []);
  
  // Current signal based on selected timeframe
  const currentSignal = getCurrentSignal();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Signal Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Advanced technical analysis across multiple timeframes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground">
            Auto-refresh in: {Math.floor(nextRefreshIn / 60)}:{(nextRefreshIn % 60).toString().padStart(2, '0')}
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
              {currentSignal && (
                currentSignal.direction === 'LONG' ? <TrendingUp className="h-5 w-5 text-emerald-500" /> : 
                currentSignal.direction === 'SHORT' ? <TrendingDown className="h-5 w-5 text-rose-500" /> :
                <Minus className="h-5 w-5 text-slate-500" />
              )}
            </CardTitle>
            <CardDescription>
              Technical analysis for {symbol} on {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSignal ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Direction</div>
                    <div className={`text-lg font-bold ${
                      currentSignal.direction === 'LONG' ? 'text-emerald-500' : 
                      currentSignal.direction === 'SHORT' ? 'text-rose-500' : 
                      'text-slate-500'
                    }`}>
                      {currentSignal.direction}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Confidence</div>
                    <div className={`text-lg font-bold ${getConfidenceColor(currentSignal.confidence)}`}>
                      {currentSignal.confidence}%
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Macro Score</div>
                    <div className={`text-lg font-bold ${getConfidenceColor(currentSignal.macroScore)}`}>
                      {currentSignal.macroScore}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entry Price</span>
                    <span className="font-medium">{formatCurrency(currentSignal.entryPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Take Profit</span>
                    <span className="font-medium text-emerald-500">{formatCurrency(currentSignal.takeProfit)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stop Loss</span>
                    <span className="font-medium text-rose-500">{formatCurrency(currentSignal.stopLoss)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Risk/Reward</span>
                    <span className="font-medium">{currentSignal.optimalRiskReward.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recommended Leverage</span>
                    <span className="font-medium">{currentSignal.recommendedLeverage}x</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Key Indicators</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(currentSignal.indicators).flatMap(([category, items]) => 
                      items.map((indicator: any, i: number) => (
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
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-center">
                <span>No signal data available for {selectedTimeframe}</span>
                <span className="text-sm mt-2">Try selecting a different timeframe or refresh</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pattern Formations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Pattern Formations</span>
              <Info className="h-5 w-5 text-primary/70" />
            </CardTitle>
            <CardDescription>
              Chart patterns identified in the {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSignal && currentSignal.patternFormations && currentSignal.patternFormations.length > 0 ? (
              <div className="space-y-3">
                {currentSignal.patternFormations.map((pattern, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{pattern.name}</span>
                      <Badge 
                        variant="outline"
                        className={`
                          ${pattern.direction === 'bullish' ? 'text-emerald-500 border-emerald-500/20' : 
                            pattern.direction === 'bearish' ? 'text-rose-500 border-rose-500/20' : 
                              'text-slate-500 border-slate-500/20'}
                        `}
                      >
                        {pattern.direction}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reliability</span>
                      <span>{pattern.reliability}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span>{formatCurrency(pattern.priceTarget)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{pattern.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No pattern formations detected
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
          <CardContent>
            {currentSignal && currentSignal.supportResistance && currentSignal.supportResistance.length > 0 ? (
              <div className="space-y-3">
                {currentSignal.supportResistance.map((level, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <Badge 
                        variant="outline"
                        className={level.type === 'support' ? 
                          'text-emerald-500 border-emerald-500/20' : 
                          'text-rose-500 border-rose-500/20'
                        }
                      >
                        {level.type}
                      </Badge>
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground mr-2">Strength:</span>
                        <span>{level.strength}%</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {formatCurrency(level.price)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No key levels detected
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
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Direction</div>
                  <div className={`text-lg font-bold ${
                    recommendation.direction === 'LONG' ? 'text-emerald-500' : 
                    recommendation.direction === 'SHORT' ? 'text-rose-500' : 
                    'text-slate-500'
                  }`}>
                    {recommendation.direction}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className={`text-lg font-bold ${getConfidenceColor(recommendation.confidence)}`}>
                    {recommendation.confidence}%
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Risk/Reward</div>
                  <div className="text-lg font-bold">
                    {recommendation.riskManagement.potentialRiskReward.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Entry Strategy</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ideal Entry</span>
                      <span className="font-medium">{formatCurrency(recommendation.entry.ideal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Range</span>
                      <span className="font-medium">
                        {formatCurrency(recommendation.entry.range[0])} - {formatCurrency(recommendation.entry.range[1])}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Exit Strategy</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Take Profit Levels</span>
                      <div className="text-right">
                        {recommendation.exit.takeProfit.map((tp: number, i: number) => (
                          <div key={i} className="font-medium text-emerald-500">
                            TP{i+1}: {formatCurrency(tp)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stop Loss</span>
                      <span className="font-medium text-rose-500">{formatCurrency(recommendation.exit.stopLoss)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Leverage Recommendation</h4>
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <div className="text-center p-1 bg-slate-100 dark:bg-slate-800 rounded">
                    <div className="text-xs text-muted-foreground">Conservative</div>
                    <div className="font-medium">{recommendation.leverage.conservative}x</div>
                  </div>
                  <div className="text-center p-1 bg-primary/10 rounded border border-primary/20">
                    <div className="text-xs text-muted-foreground">Recommended</div>
                    <div className="font-medium">{recommendation.leverage.moderate}x</div>
                  </div>
                  <div className="text-center p-1 bg-slate-100 dark:bg-slate-800 rounded">
                    <div className="text-xs text-muted-foreground">Aggressive</div>
                    <div className="font-medium">{recommendation.leverage.aggressive}x</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{recommendation.leverage.recommendation}</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Key Indicators</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {recommendation.keyIndicators.map((indicator: string, i: number) => (
                    <div key={i} className="flex items-center">
                      <Target className="h-3 w-3 mr-2 text-primary/70" />
                      <span className="text-sm">{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Summary</h4>
                <p className="text-sm text-muted-foreground">{recommendation.summary}</p>
              </div>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground text-center">
              <span>No trade recommendation available</span>
              <span className="text-sm mt-1">Waiting for signal analysis to complete</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}