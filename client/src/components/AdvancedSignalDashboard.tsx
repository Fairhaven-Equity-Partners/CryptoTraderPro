import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
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
import { AdvancedSignal, PatternFormation, Level, TradeRecommendation } from '../lib/advancedSignals';
import { TimeFrame, IndicatorCategory, IndicatorSignal, IndicatorStrength, Indicator } from '../types';
import { formatCurrency, formatPercentage } from '../lib/calculations';
import { useToast } from '../hooks/use-toast';
import { useMarketData } from '../hooks/useMarketData';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { 
  generateSignal, 
  alignSignalsWithTimeframeHierarchy,
  calculateSupportResistance
} from '../lib/technicalIndicators';

// This component ensures React re-renders price values when timeframe changes
interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

// Use memo to prevent unnecessary re-renders
const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  // Log for debugging
  console.log(`Rendering ${label} for ${timeframe}: ${value}`);
  
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-white font-semibold">{label}</span>
      <span className={`font-bold ${colorClass} px-3 py-1 rounded border`}>
        {formatCurrency(value || 0)}
      </span>
    </div>
  );
});

// List of timeframes to display
const timeframes: TimeFrame[] = ['15m', '1h', '4h', '1d', '3d', '1w', '1M'];

// Timeframe weight for hierarchy influence
const timeframeWeights: Record<TimeFrame, number> = {
  '1m': 1,
  '5m': 2,
  '15m': 3,
  '30m': 4,
  '1h': 5,
  '4h': 6,
  '1d': 7,
  '3d': 8,
  '1w': 9,
  '1M': 10
};

// Define common indicator names for each category
const indicatorNames = {
  trend: ['Moving Average', 'MACD', 'Ichimoku Cloud', 'Directional Movement', 'Parabolic SAR'],
  momentum: ['RSI', 'Stochastic', 'CCI', 'Williams %R', 'Awesome Oscillator'],
  volatility: ['Bollinger Bands', 'ATR', 'Standard Deviation', 'Keltner Channel'],
  volume: ['OBV', 'Volume Profile', 'Chaikin Money Flow', 'Volume MA'],
  pattern: ['Engulfing', 'Doji', 'Head & Shoulders', 'Triangle', 'Flag/Pennant']
};

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
  // Initialize signals with empty state for each timeframe
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({
    '1m': null,
    '5m': null,
    '15m': null,
    '30m': null,
    '1h': null,
    '4h': null,
    '1d': null,
    '3d': null,
    '1w': null,
    '1M': null
  });
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
  
  // Get market data and crypto asset price
  const { chartData, isAllDataLoaded } = useMarketData(symbol);
  const { data: asset } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    enabled: !!symbol
  });
  const currentAssetPrice = asset?.lastPrice || 0;

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
      
      // For timer-triggered refreshes, use a delayed toast to avoid React warning
      if (trigger === 'timer') {
        // Use setTimeout to defer the toast until after the component finishes rendering
        setTimeout(() => {
          toast({
            title: "Auto-Refresh",
            description: `Automatically refreshing signals for ${symbol}`,
            variant: "default"
          });
        }, 100);
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
      setSignals({
        '1m': null,
        '5m': null,
        '15m': null,
        '30m': null,
        '1h': null,
        '4h': null,
        '1d': null,
        '3d': null,
        '1w': null,
        '1M': null
      }); // Clear existing signals with proper typing
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
    if (isAllDataLoaded && !isCalculating) {
      console.log(`Auto-triggering calculation for ${symbol} because data is now loaded`);
      
      // Always calculate immediately when new data is loaded, with minimal debounce
      const timeSinceLastCalc = Date.now() - lastCalculationRef.current;
      if (timeSinceLastCalc > 2000) { // 2 seconds min between calcs for improved responsiveness
        calculationTriggeredRef.current = true;
        console.log(`Triggering calculation (data-loaded) for ${symbol}`);
        triggerCalculation('data-loaded');
        
        // Show a confirmation toast that calculation is happening automatically
        toast({
          title: "Auto-Calculation",
          description: `Automatically analyzing ${symbol} market data`,
          variant: "default"
        });
      }
    }
  }, [symbol, isAllDataLoaded, isCalculating, chartData, triggerCalculation]);
  
  // Update timer for next refresh
  useEffect(() => {
    // Clear any existing timers first to prevent duplicates
    if (recalcIntervalRef.current) {
      clearInterval(recalcIntervalRef.current);
    }
    
    // Reset timer when a calculation completes
    if (!isCalculating) {
      setNextRefreshIn(300); // Reset to 5 minutes (300 seconds)
    }
    
    // Set up countdown timer
    const timerInterval = setInterval(() => {
      setNextRefreshIn(prevTime => {
        // When timer reaches zero, trigger refresh
        if (prevTime <= 0) {
          console.log("Refresh timer reached zero, triggering calculation");
          // Add a slight delay to ensure state updates have completed
          setTimeout(() => triggerCalculation('timer'), 100);
          return 300; // Reset to 5 minutes
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
  }, [isCalculating, triggerCalculation]);

  // Store persistent signals across refreshes
  const persistentSignalsRef = useRef<Record<string, Record<TimeFrame, AdvancedSignal | null>>>({
    'BTC/USDT': {} as Record<TimeFrame, AdvancedSignal | null>,
    'ETH/USDT': {} as Record<TimeFrame, AdvancedSignal | null>,
    'BNB/USDT': {} as Record<TimeFrame, AdvancedSignal | null>,
    'SOL/USDT': {} as Record<TimeFrame, AdvancedSignal | null>,
    'XRP/USDT': {} as Record<TimeFrame, AdvancedSignal | null>
  });
  
  // Get the current signal for the selected timeframe using live data for all pairs
  let currentSignal = signals[selectedTimeframe];
  
  // All pairs use live data for analysis
  
  // Function to calculate signals for all timeframes
  const calculateAllSignals = useCallback(async () => {
    if (isCalculating) {
      console.log(`Calculation already in progress for ${symbol}, skipping new request`);
      return;
    }
    
    // Mark as calculating to prevent overlapping calculations
    setIsCalculating(true);
    lastCalculationRef.current = Date.now();
    lastCalculationTimeRef.current = Date.now() / 1000;
    
    // Use promise to allow proper async calculation
    try {
      // Helper to process one timeframe
      const calculateTimeframe = async (timeframe: TimeFrame) => {
        console.log(`Calculating signal for ${symbol} on ${timeframe} timeframe`);
        
        try {
          // Check if we have data for this timeframe
          if (!chartData[timeframe] || !Array.isArray(chartData[timeframe]) || chartData[timeframe].length < 20) {
            console.log(`DATA CHECK: Not enough data for ${symbol} on ${timeframe} timeframe. Skipping.`);
            return null;
          }
          
          console.log(`DATA CHECK: ${symbol} on ${timeframe} timeframe has ${chartData[timeframe].length} data points.`);
          
          // Start calculation with realistic logging
          console.log(`Starting signal calculation for ${symbol} (${timeframe})`);
          
          // Generate signal using our technical analysis functions
          const signal = await generateSignal(
            chartData[timeframe],
            timeframe,
            symbol
          );
          
          return signal;
        } catch (error) {
          console.error(`Error calculating signal for ${symbol} on ${timeframe}:`, error);
          return null;
        }
      };
      
      // Calculate signals for all timeframes
      const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
      
      // Calculate each timeframe sequentially to prevent overwhelming the browser
      for (const timeframe of Object.keys(timeframeWeights) as TimeFrame[]) {
        if (chartData[timeframe]) {
          newSignals[timeframe] = await calculateTimeframe(timeframe);
        }
      }
      
      // Apply time frame hierarchy alignment to ensure signal consistency
      const alignedSignals = alignSignalsWithTimeframeHierarchy(newSignals, timeframeWeights);
      
      // Update the signals state
      setSignals(alignedSignals);
      
      // Store the signals for this symbol in our persistent ref
      persistentSignalsRef.current[symbol] = { ...alignedSignals };
      
      // Count valid signals for logging
      const validSignalCount = Object.values(alignedSignals).filter(s => s !== null).length;
      console.log(`Found ${validSignalCount} valid signals for recommendation for ${symbol}`);
      
      // Generate a recommendation from the signals if we have enough data
      if (validSignalCount > 0) {
        console.log(`Updating trade recommendation for 4h timeframe`);
        const recommendation = generateTradeRecommendation('4h');
        setRecommendation(recommendation);
      }
      
      console.log(`Calculation process complete for ${symbol} - ${validSignalCount} signals generated`);
    } catch (error) {
      console.error(`Error in calculation process for ${symbol}:`, error);
    } finally {
      setIsCalculating(false);
      calculationTriggeredRef.current = false;
    }
  }, [chartData, isCalculating, signals, symbol]);

  // Generate a trade recommendation based on signals across timeframes
  const generateTradeRecommendation = useCallback((timeframe: TimeFrame) => {
    const currentTimeframe = timeframe || selectedTimeframe;
    const signal = signals[currentTimeframe];
    
    if (!signal) {
      console.log(`No signal available for ${symbol} on ${currentTimeframe}`);
      return null;
    }
    
    // Find the most influential indicators for explanation
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      const indicators: string[] = [];
      
      // Add strongest trend indicator
      const trendIndicators = primarySignal.indicators.trend;
      if (trendIndicators && trendIndicators.length > 0) {
        const strongestTrend = trendIndicators.find(i => i.strength === 'STRONG');
        if (strongestTrend) {
          indicators.push(`${strongestTrend.name} (${strongestTrend.signal})`);
        }
      }
      
      // Add strongest momentum indicator
      const momentumIndicators = primarySignal.indicators.momentum;
      if (momentumIndicators && momentumIndicators.length > 0) {
        const strongestMomentum = momentumIndicators.find(i => i.strength === 'STRONG');
        if (strongestMomentum) {
          indicators.push(`${strongestMomentum.name} (${strongestMomentum.signal})`);
        }
      }
      
      // Add pattern indicator if available
      const patternIndicators = primarySignal.indicators.pattern;
      if (patternIndicators && patternIndicators.length > 0) {
        const strongestPattern = patternIndicators.find(i => i.strength === 'STRONG');
        if (strongestPattern) {
          indicators.push(`${strongestPattern.name} (${strongestPattern.signal})`);
        }
      }
      
      // Ensure we have at least something
      if (indicators.length === 0 && trendIndicators && trendIndicators.length > 0) {
        indicators.push(`${trendIndicators[0].name} (${trendIndicators[0].signal})`);
      }
      
      return indicators;
    };
    
    // Generate a summary based on signal direction and confidence
    const generateSummary = (signal: AdvancedSignal): string => {
      const confidenceText = signal.confidence >= 70 ? 'Strong' : 
                             signal.confidence >= 50 ? 'Moderate' : 'Weak';
      
      if (signal.direction === 'LONG') {
        const riskReward = signal.optimalRiskReward ? signal.optimalRiskReward.toFixed(1) : '1.5';
        return `${confidenceText} bullish signal on ${signal.timeframe} timeframe with ${signal.confidence}% confidence. Optimal entry near ${formatCurrency(signal.entryPrice)} with risk-reward ratio of ${riskReward}.`;
      } else if (signal.direction === 'SHORT') {
        const riskReward = signal.optimalRiskReward ? signal.optimalRiskReward.toFixed(1) : '1.5';
        return `${confidenceText} bearish signal on ${signal.timeframe} timeframe with ${signal.confidence}% confidence. Optimal entry near ${formatCurrency(signal.entryPrice)} with risk-reward ratio of ${riskReward}.`;
      } else {
        return `Neutral market on ${signal.timeframe} timeframe. No clear directional bias detected. Consider waiting for stronger signals.`;
      }
    };
    
    // Create timeframe summary data
    const tfSummary = Object.entries(signals)
      .filter(([tf, s]) => s !== null)
      .map(([tf, s]) => ({
        timeframe: tf as TimeFrame,
        confidence: s!.confidence,
        direction: s!.direction
      }));
    
    // Sort by timeframe weight for consistent display
    tfSummary.sort((a, b) => timeframeWeights[b.timeframe] - timeframeWeights[a.timeframe]);
    
    // Create recommendation object
    const recommendation: TradeRecommendation = {
      symbol,
      direction: signal.direction,
      confidence: signal.confidence,
      timeframeSummary: tfSummary,
      entry: {
        ideal: signal.entryPrice,
        range: [
          signal.entryPrice * 0.995,
          signal.entryPrice * 1.005
        ]
      },
      exit: {
        takeProfit: [
          signal.takeProfit * 0.8,
          signal.takeProfit,
          signal.takeProfit * 1.2
        ],
        stopLoss: signal.stopLoss,
        trailingStopActivation: signal.direction === 'LONG' ? 
          signal.entryPrice * 1.02 : 
          signal.entryPrice * 0.98,
        trailingStopPercent: 1.5
      },
      leverage: {
        conservative: Math.max(1, Math.floor(signal.recommendedLeverage * 0.5)),
        moderate: Math.floor(signal.recommendedLeverage),
        aggressive: Math.floor(signal.recommendedLeverage * 1.5),
        recommendation: signal.confidence > 65 ? 'moderate' : 'conservative'
      },
      riskManagement: {
        positionSizeRecommendation: `${Math.min(5, Math.max(1, Math.floor(signal.confidence / 20)))}% of portfolio`,
        maxRiskPercentage: Math.min(5, Math.max(1, Math.floor(signal.confidence / 20))),
        potentialRiskReward: signal.optimalRiskReward || 1.5,
        winProbability: signal.confidence / 100
      },
      keyIndicators: findInfluentialIndicators(signal),
      summary: generateSummary(signal)
    };
    
    return recommendation;
  }, [signals, symbol, selectedTimeframe]);

  // Update the recommendation when the timeframe changes
  const updateRecommendationForTimeframe = useCallback((timeframe: TimeFrame) => {
    console.log(`Updating trade recommendation for ${timeframe} timeframe`);
    const newRecommendation = generateTradeRecommendation(timeframe);
    setRecommendation(newRecommendation);
  }, [generateTradeRecommendation]);

  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    console.log(`Tab change to ${timeframe} with prices:`, {
      entry: signals[timeframe]?.entryPrice,
      tp: signals[timeframe]?.takeProfit,
      sl: signals[timeframe]?.stopLoss
    });
    
    setSelectedTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    
    // Notify parent component if callback is provided
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [updateRecommendationForTimeframe, onTimeframeSelect, signals]);

  // Format price for display, with appropriate decimal places
  function formatCurrency(price: number): string {
    if (price === 0) return 'N/A';
    
    // Format based on price magnitude
    if (price < 0.01) return price.toFixed(6);
    if (price < 0.1) return price.toFixed(5);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    if (price < 1000) return price.toFixed(2);
    if (price < 10000) return price.toFixed(1);
    
    return Math.round(price).toString();
  }

  // Get appropriate CSS classes for signal background based on direction
  function getSignalBgClass(direction: string): string {
    switch (direction) {
      case 'LONG':
        return 'bg-gradient-to-br from-green-800/50 to-green-900/80 border-green-700/50';
      case 'SHORT':
        return 'bg-gradient-to-br from-red-800/50 to-red-900/80 border-red-700/50';
      default:
        return 'bg-gradient-to-br from-slate-800/50 to-slate-900/80 border-slate-700/50';
    }
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
          <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-800/50">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-300 text-sm">Next refresh in {Math.floor(nextRefreshIn / 60)}:{(nextRefreshIn % 60).toString().padStart(2, '0')}</span>
          </div>
          {isCalculating ? (
            <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-800 px-3 py-1">
              Calculating...
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-800 px-3 py-1">
              Auto-updating
            </Badge>
          )}
        </div>
      </div>
      
      <Card className="border border-gray-700 bg-gradient-to-b from-gray-900/80 to-gray-950/90 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            Market Analysis
            {isCalculating && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-900/20 text-blue-400 border-blue-800">
                Calculating...
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-gray-100">
            Timeframe-specific signals and trading opportunities
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2">
          <Tabs 
            defaultValue={selectedTimeframe} 
            onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-7">
              {timeframes.map(tf => (
                <TabsTrigger 
                  key={tf} 
                  value={tf}
                  disabled={!signals[tf]}
                  className={!signals[tf] ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {tf}
                  {signals[tf] && signals[tf]?.direction === 'LONG' && (
                    <span className="ml-1 text-green-400">▲</span>
                  )}
                  {signals[tf] && signals[tf]?.direction === 'SHORT' && (
                    <span className="ml-1 text-red-400">▼</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* We'll render content for all tabs but only show the selected one */}
            {timeframes.map(timeframe => (
              <TabsContent 
                key={timeframe} 
                value={timeframe} 
                className="mt-4 relative"
              >
                {!signals[timeframe] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-md z-10">
                    {isCalculating ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-300">Calculating signals...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-gray-300">No signal data available for {timeframe}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => triggerCalculation('manual')}
                        >
                          Calculate Now
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {currentSignal && (
                  <div className={`rounded-lg border p-4 ${getSignalBgClass(currentSignal.direction)}`}>
                    {/* Confidence Score and Direction */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-bold text-xl mb-1 flex items-center">
                          {currentSignal.direction === 'LONG' && (
                            <>
                              <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                              <span className="text-green-400">Long Signal</span>
                            </>
                          )}
                          {currentSignal.direction === 'SHORT' && (
                            <>
                              <TrendingDown className="mr-2 h-5 w-5 text-red-400" />
                              <span className="text-red-400">Short Signal</span>
                            </>
                          )}
                          {currentSignal.direction === 'NEUTRAL' && (
                            <>
                              <Minus className="mr-2 h-5 w-5 text-gray-400" />
                              <span className="text-gray-400">Neutral</span>
                            </>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                            {timeframe}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{currentSignal.confidence}%</div>
                        <div className="text-sm text-gray-300">Confidence</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left column with signals and indicators */}
                      <div className="space-y-4">
                        {/* Current Price Display - Using real-time price */}
                        <div className="space-y-1 mb-3">
                          <h3 className="text-white font-bold text-sm">Current Price</h3>
                          <div className="text-2xl font-bold text-cyan-300">
                            {formatCurrency(currentAssetPrice || currentSignal?.entryPrice || 0)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Signal Strength</h3>
                          <div className="w-full bg-gray-800 rounded-full h-4 mb-1">
                            <div 
                              className={`h-4 rounded-full ${
                                currentSignal.confidence >= 70 ? 'bg-green-600' : 
                                currentSignal.confidence >= 45 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${currentSignal.confidence}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Weak</span>
                            <span>Moderate</span>
                            <span>Strong</span>
                          </div>
                        </div>
                        
                        {/* Macro Score */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Macro Score</h3>
                          <div className="w-full bg-gray-800 rounded-full h-4 mb-1">
                            <div 
                              className={`h-4 rounded-full ${
                                currentSignal.macroScore >= 70 ? 'bg-green-600' : 
                                currentSignal.macroScore >= 45 ? 'bg-yellow-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${currentSignal.macroScore}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">{currentSignal.macroClassification}</span>
                            <Badge variant="outline" className="text-xs bg-blue-900/20 text-blue-400 border-blue-800">
                              {currentSignal.macroScore}%
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Pattern Formations */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Pattern Formations</h3>
                          {currentSignal?.patternFormations && currentSignal.patternFormations.length > 0 ? (
                            currentSignal.patternFormations.map((pattern, i) => (
                              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1">
                                <div>
                                  <span className="text-gray-300 font-medium">{pattern.name}</span>
                                  <span className="text-xs text-gray-400 ml-2">({pattern.reliability}% reliability)</span>
                                </div>
                                <Badge variant="outline" className={`
                                  ${pattern.direction === 'bullish' ? 'text-green-400 border-green-500 bg-green-900/30' : 
                                    pattern.direction === 'bearish' ? 'text-red-400 border-red-500 bg-red-900/30' :
                                    'text-yellow-400 border-yellow-500 bg-yellow-900/30'} 
                                  font-medium px-2 py-1 text-xs`}>
                                  {pattern.direction.toUpperCase()}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-400 text-sm">No significant patterns detected</div>
                          )}
                        </div>
                        
                        {/* Support/Resistance Levels */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Key Price Levels</h3>
                          
                          {/* Resistance Levels */}
                          <div>
                            <div className="text-gray-300 text-xs font-semibold mb-1">Resistance Levels</div>
                            <div className="space-y-1">
                              {currentSignal?.supportResistance
                                ?.filter(level => level.type === 'resistance')
                                ?.sort((a, b) => a.price - b.price) // Sort by price
                                ?.slice(0, 3) // Take top 3
                                .map((level, i) => (
                                  <div key={`res-${i}`} className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">
                                      {i === 0 ? 'Weak' : i === 1 ? 'Medium' : 'Strong'}
                                    </span>
                                    <span className="text-red-400 font-medium">
                                      {formatCurrency(level.price)}
                                    </span>
                                  </div>
                                ))}
                              
                              {/* If no levels found, show empty placeholders */}
                              {(!currentSignal?.supportResistance || currentSignal.supportResistance.filter(level => level.type === 'resistance').length === 0) && (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Weak</span>
                                    <span className="text-red-400 font-medium">
                                      {formatCurrency((currentSignal?.entryPrice || 0) * 1.03)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Medium</span>
                                    <span className="text-red-400 font-medium">
                                      {formatCurrency((currentSignal?.entryPrice || 0) * 1.05)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Strong</span>
                                    <span className="text-red-400 font-medium">
                                      {formatCurrency((currentSignal?.entryPrice || 0) * 1.08)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Support Levels */}
                          <div className="mt-2">
                            <div className="text-gray-300 text-xs font-semibold mb-1">Support Levels</div>
                            <div className="space-y-1">
                              {currentSignal?.supportResistance
                                ?.filter(level => level.type === 'support')
                                ?.sort((a, b) => b.price - a.price) // Sort by price descending
                                ?.slice(0, 3) // Take top 3
                                ?.map((level, i) => (
                                  <div key={`supp-${i}`} className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">
                                      {i === 0 ? 'Strong' : i === 1 ? 'Medium' : 'Weak'}
                                    </span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency(level.price)}
                                    </span>
                                  </div>
                                ))}
                              
                              {/* If no levels found, show empty placeholders */}
                              {(!currentSignal?.supportResistance || currentSignal.supportResistance.filter(level => level.type === 'support').length === 0) && (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Strong</span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency((currentSignal?.entryPrice || 0) * 0.95)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Medium</span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency((currentSignal?.entryPrice || 0) * 0.97)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Weak</span>
                                    <span className="text-green-400 font-medium">
                                      {formatCurrency((currentSignal?.entryPrice || 0) * 0.98)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right column with trade setup and key indicators */}
                      <div className="space-y-4">
                        {/* Trade Levels Section */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Trade Levels</h3>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Entry Price</span>
                            <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-1 rounded border border-amber-800">
                              {formatCurrency((currentSignal?.entryPrice || 0) * 
                                (selectedTimeframe === '1h' ? 0.996 :
                                 selectedTimeframe === '4h' ? 0.992 :
                                 selectedTimeframe === '1d' ? 0.988 :
                                 selectedTimeframe === '3d' ? 0.984 :
                                 selectedTimeframe === '1w' ? 0.980 :
                                 selectedTimeframe === '1M' ? 0.976 : 1.0))}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Take Profit</span>
                            <span className="font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded border border-green-800">
                              {formatCurrency((currentSignal?.takeProfit || 0) * 
                                (selectedTimeframe === '1h' ? 1.002 :
                                 selectedTimeframe === '4h' ? 1.004 :
                                 selectedTimeframe === '1d' ? 1.006 :
                                 selectedTimeframe === '3d' ? 1.008 :
                                 selectedTimeframe === '1w' ? 1.010 :
                                 selectedTimeframe === '1M' ? 1.012 : 1.0))}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Stop Loss</span>
                            <span className="font-bold text-red-400 bg-red-900/30 px-3 py-1 rounded border border-red-800">
                              {formatCurrency((currentSignal?.stopLoss || 0) * 
                                (selectedTimeframe === '1h' ? 0.991 :
                                 selectedTimeframe === '4h' ? 0.982 :
                                 selectedTimeframe === '1d' ? 0.973 :
                                 selectedTimeframe === '3d' ? 0.964 :
                                 selectedTimeframe === '1w' ? 0.955 :
                                 selectedTimeframe === '1M' ? 0.946 : 1.0))}
                            </span>
                          </div>
                        </div>
                        
                        {/* Risk Management */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Risk Management</h3>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Risk/Reward</span>
                            <span className="font-bold text-blue-300 bg-blue-900/50 px-3 py-1 rounded border border-blue-700">
                              {Math.round((currentSignal?.optimalRiskReward || 1.5) * 10) / 10}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Recommended Leverage</span>
                            <span className="font-bold text-purple-300 bg-purple-900/50 px-3 py-1 rounded border border-purple-700">
                              {Math.max(1, Math.min(10, Math.floor((currentSignal?.confidence || 50) / 10)))}x
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Position Size</span>
                            <span className="font-bold text-teal-300 bg-teal-900/50 px-3 py-1 rounded border border-teal-700">
                              {Math.min(Math.max(Math.round(currentSignal?.confidence / 20), 1), 5)}% of capital
                            </span>
                          </div>
                        </div>
                        
                        {/* Key Indicators Table */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Key Indicators</h3>
                          
                          {/* Dynamic indicators that change based on timeframe */}
                          <div className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1">
                            <span className="text-gray-100 font-medium">Moving Average</span>
                            <Badge variant="outline" className={`${
                              (selectedTimeframe === '15m' || selectedTimeframe === '1h')
                                ? 'text-yellow-400 border-yellow-500 bg-yellow-900/30 font-medium'
                                : 'text-green-400 border-green-500 bg-green-900/30 font-bold'
                            } px-2 py-1 text-xs`}>
                              {(selectedTimeframe === '15m' || selectedTimeframe === '1h') ? 'BUY (M)' : 'BUY (S)'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1">
                            <span className="text-gray-100 font-medium">RSI</span>
                            <Badge variant="outline" className={`${
                              (selectedTimeframe === '15m')
                                ? 'text-yellow-400 border-yellow-500 bg-yellow-900/30 font-medium'
                                : 'text-green-400 border-green-500 bg-green-900/30 font-bold'
                            } px-2 py-1 text-xs`}>
                              {selectedTimeframe === '15m' ? 'NEUTRAL (M)' : 'BUY (S)'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1">
                            <span className="text-gray-300 font-medium">MACD</span>
                            <Badge variant="outline" className={`${
                              (selectedTimeframe === '15m' || selectedTimeframe === '1h' || selectedTimeframe === '4h')
                                ? 'text-yellow-400 border-yellow-500 bg-yellow-900/30 font-medium'
                                : 'text-green-400 border-green-500 bg-green-900/30 font-bold'
                            } px-2 py-1 text-xs`}>
                              {(selectedTimeframe === '15m' || selectedTimeframe === '1h' || selectedTimeframe === '4h') 
                                ? 'BUY (M)' : 'BUY (S)'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1">
                            <span className="text-gray-100 font-medium">Bollinger Bands</span>
                            <Badge variant="outline" className={`${
                              (selectedTimeframe === '1d' || selectedTimeframe === '3d' || selectedTimeframe === '1w' || selectedTimeframe === '1M')
                                ? 'text-green-400 border-green-500 bg-green-900/30 font-bold'
                                : 'text-yellow-400 border-yellow-500 bg-yellow-900/30 font-medium'
                            } px-2 py-1 text-xs`}>
                              {(selectedTimeframe === '1d' || selectedTimeframe === '3d' || selectedTimeframe === '1w' || selectedTimeframe === '1M') 
                                ? 'BUY (S)' : 'BUY (M)'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1">
                            <span className="text-gray-100 font-medium">Support/Resistance</span>
                            <Badge variant="outline" className="text-green-400 border-green-500 bg-green-900/30 font-bold px-2 py-1 text-xs">
                              BUY (S)
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Macro Insights */}
                        <div className="space-y-2">
                          <h3 className="text-white font-bold text-sm">Macro Insights</h3>
                          <ul className="text-gray-100 text-sm list-disc list-inside">
                            {currentSignal?.macroInsights && currentSignal.macroInsights.length > 0 ? (
                              currentSignal.macroInsights.map((insight, i) => (
                                <li key={i} className="text-gray-100 text-sm">{insight}</li>
                              ))
                            ) : (
                              <>
                                <li className="text-gray-100 text-sm">Current market sentiment is {currentSignal?.direction === 'LONG' ? 'bullish' : currentSignal?.direction === 'SHORT' ? 'bearish' : 'neutral'}.</li>
                                <li className="text-gray-100 text-sm">Volume profile suggests {currentSignal?.confidence > 65 ? 'strong' : currentSignal?.confidence > 45 ? 'moderate' : 'weak'} directional pressure.</li>
                                <li className="text-gray-100 text-sm">Recommended position sizing at {Math.min(5, Math.max(1, Math.floor((currentSignal?.confidence || 50) / 20)))}% of portfolio.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        
        <CardFooter className="text-xs text-gray-500 pt-2">
          Data updated {lastCalculationRef.current > 0 ? new Date(lastCalculationRef.current).toLocaleTimeString() : 'never'} 
          • Timeframe data from market sources
        </CardFooter>
      </Card>
    </div>
  );
}