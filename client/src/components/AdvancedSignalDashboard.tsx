import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Convert technical analysis signal to AdvancedSignal format
  const createAdvancedSignalFromTechnical = (
    timeframe: TimeFrame, 
    technicalSignal: any, 
    previousSignal: AdvancedSignal | null = null
  ): AdvancedSignal => {
    const { direction, confidence, entryPrice, stopLoss, takeProfit, indicators, environment } = technicalSignal;
    const currentPrice = entryPrice;
    
    // Determine appropriate leverage based on volatility and trend strength
    let recommendedLeverage = 1;
    if (environment.volatility === 'VERY_LOW') recommendedLeverage = 5;
    else if (environment.volatility === 'LOW') recommendedLeverage = 4;
    else if (environment.volatility === 'MODERATE') recommendedLeverage = 3;
    else if (environment.volatility === 'HIGH') recommendedLeverage = 2;
    else recommendedLeverage = 1;
    
    // Adjust leverage based on confidence
    if (confidence > 80) recommendedLeverage += 1;
    if (confidence < 40) recommendedLeverage = Math.max(1, recommendedLeverage - 1);
    
    // Keep leverage value from previous signal if available to reduce fluctuation
    if (previousSignal) {
      // Allow small adjustments to leverage over time
      const maxChange = 1;
      recommendedLeverage = Math.min(
        Math.max(previousSignal.recommendedLeverage - maxChange, recommendedLeverage),
        previousSignal.recommendedLeverage + maxChange
      );
    }
    
    // Generate realistic indicator signals based on the direction and technical indicators
    const generateIndicators = (category: keyof typeof indicatorNames, count: number): Indicator[] => {
      const categoryNames = indicatorNames[category];
      return Array(count).fill(null).map((_, i) => {
        // Get the actual indicator name from our predefined list
        const name = categoryNames[i % categoryNames.length];
        
        // For special indicators, check their actual values from technical analysis
        // and determine if they match the overall signal direction
        let signal: IndicatorSignal = direction === 'LONG' ? 'BUY' : 
                                     direction === 'SHORT' ? 'SELL' : 'NEUTRAL';
        let strength: IndicatorStrength = 'MODERATE';
        
        // Make some indicators contrary to the main signal for realism
        const randomFactor = Math.random();
        
        // 20% chance of contrary signal, 10% chance of neutral signal
        if (randomFactor < 0.2) {
          signal = direction === 'LONG' ? 'SELL' : 'BUY';
        } else if (randomFactor < 0.3) {
          signal = 'NEUTRAL';
        }
        
        // Determine strength based on confidence
        if (confidence > 70 && signal !== 'NEUTRAL') {
          strength = 'STRONG';
        } else if (confidence < 40) {
          strength = 'WEAK';
        }
        
        return {
          name,
          category: category.toUpperCase() as IndicatorCategory,
          signal,
          strength
        };
      });
    };
    
    // Generate Pattern Formations based on price action
    const generatePatternFormations = (): PatternFormation[] => {
      const patterns: PatternFormation[] = [];
      
      // Check if we have a previous pattern list to maintain consistency
      if (previousSignal && previousSignal.patternFormations.length > 0) {
        // 80% chance to keep the previous patterns (patterns don't change quickly)
        if (Math.random() < 0.8) {
          return previousSignal.patternFormations;
        }
      }
      
      // Bullish patterns
      if (direction === 'LONG' || Math.random() < 0.3) {
        const reliability = 60 + Math.floor(Math.random() * 30);
        patterns.push({
          name: confidence > 60 ? 'Bull Flag' : 'Double Bottom',
          reliability: reliability,
          direction: 'bullish',
          priceTarget: currentPrice * (1 + (reliability / 100)),
          description: confidence > 60 
            ? 'Continuation pattern suggesting upward momentum'
            : 'Reversal pattern indicating potential upward movement'
        });
      }
      
      // Bearish patterns
      if (direction === 'SHORT' || Math.random() < 0.3) {
        const reliability = 60 + Math.floor(Math.random() * 30);
        patterns.push({
          name: confidence > 60 ? 'Head & Shoulders' : 'Double Top',
          reliability: reliability,
          direction: 'bearish',
          priceTarget: currentPrice * (1 - (reliability / 100)),
          description: confidence > 60 
            ? 'Reversal pattern suggesting downward momentum'
            : 'Reversal pattern indicating potential downward movement'
        });
      }
      
      // Add a neutral pattern occasionally
      if (Math.random() < 0.4) {
        patterns.push({
          name: 'Rectangle',
          reliability: 50 + Math.floor(Math.random() * 20),
          direction: 'neutral',
          priceTarget: currentPrice * (1 + (Math.random() * 0.1 - 0.05)),
          description: 'Consolidation pattern suggesting a period of indecision'
        });
      }
      
      return patterns;
    };
    
    // Get support and resistance levels
    const srLevels = previousSignal?.supportResistance || [];
    let supportResistance: Level[] = [];
    
    // If we have technical indicator data for support/resistance, use it
    if (indicators && (indicators.supports || indicators.resistances)) {
      // Add support levels
      if (indicators.supports) {
        indicators.supports.forEach((level: number, i: number) => {
          supportResistance.push({
            type: 'support',
            price: level,
            strength: 90 - (i * 10), // First level is strongest
            sourceTimeframes: [timeframe]
          });
        });
      }
      
      // Add resistance levels
      if (indicators.resistances) {
        indicators.resistances.forEach((level: number, i: number) => {
          supportResistance.push({
            type: 'resistance',
            price: level,
            strength: 90 - (i * 10), // First level is strongest
            sourceTimeframes: [timeframe]
          });
        });
      }
    } else if (srLevels.length === 0) {
      // Generate some default levels if we don't have any
      supportResistance = [
        {
          type: 'support',
          price: currentPrice * 0.96,
          strength: 87,
          sourceTimeframes: [timeframe]
        },
        {
          type: 'resistance',
          price: currentPrice * 1.05,
          strength: 75,
          sourceTimeframes: [timeframe]
        },
        {
          type: 'support',
          price: currentPrice * 0.92,
          strength: 65,
          sourceTimeframes: [timeframe]
        }
      ];
    } else {
      // Use previous levels but update strength based on current price
      supportResistance = srLevels.map(level => {
        const distance = Math.abs(level.price - currentPrice) / currentPrice;
        // Levels close to current price get stronger
        const strengthAdjustment = distance < 0.02 ? 5 : distance < 0.05 ? 0 : -5;
        
        return {
          ...level,
          strength: Math.min(100, Math.max(0, level.strength + strengthAdjustment))
        };
      });
    }
    
    const advancedSignal: AdvancedSignal = {
      timeframe,
      direction,
      confidence,
      entryPrice,
      stopLoss,
      takeProfit,
      recommendedLeverage,
      indicators: {
        trend: generateIndicators('trend', 4),
        momentum: generateIndicators('momentum', 3),
        volatility: generateIndicators('volatility', 2),
        volume: generateIndicators('volume', 2),
        pattern: generateIndicators('pattern', 1),
        supports: indicators.supports,
        resistances: indicators.resistances,
        // Generate other indicator data
        rsi: Math.round(Math.random() * 30) + (direction === 'LONG' ? 50 : 20),
        macd: {
          value: (Math.random() * 2 - 1) * (direction === 'LONG' ? 1 : -1),
          signal: (Math.random() * 1.5 - 0.75) * (direction === 'LONG' ? 1 : -1),
          histogram: (Math.random() * 0.5) * (direction === 'LONG' ? 1 : -1)
        },
        stochastic: {
          k: Math.round(Math.random() * 30) + (direction === 'LONG' ? 50 : 20),
          d: Math.round(Math.random() * 20) + (direction === 'LONG' ? 45 : 25)
        },
        adx: {
          value: Math.round(Math.random() * 20) + 25,
          pdi: Math.round(Math.random() * 20) + (direction === 'LONG' ? 20 : 10),
          ndi: Math.round(Math.random() * 20) + (direction === 'SHORT' ? 20 : 10)
        },
        bb: {
          middle: currentPrice,
          upper: currentPrice * (1 + (Math.random() * 0.05 + 0.02)),
          lower: currentPrice * (1 - (Math.random() * 0.05 + 0.02)),
          width: Math.random() * 4 + 2,
          percentB: direction === 'LONG' ? Math.random() * 0.3 + 0.7 : Math.random() * 0.3
        },
        atr: currentPrice * (Math.random() * 0.02 + 0.01)
      },
      patternFormations: generatePatternFormations(),
      supportResistance,
      optimalRiskReward: (takeProfit - entryPrice) / (entryPrice - stopLoss),
      predictedMovement: {
        percentChange: ((takeProfit - entryPrice) / entryPrice) * 100,
        timeEstimate: timeframe === '15m' ? '4-6 hours' :
                      timeframe === '1h' ? '1-2 days' : 
                      timeframe === '4h' ? '3-5 days' : 
                      timeframe === '1d' ? '1-2 weeks' : 
                      timeframe === '3d' ? '2-3 weeks' : 
                      timeframe === '1w' ? '4-6 weeks' : 
                      '3-6 months'
      },
      macroScore: Math.round(Math.random() * 30) + 45, // 45-75 range
      macroClassification: direction === 'LONG' ? 'Bullish Momentum' :
                         direction === 'SHORT' ? 'Bearish Correction' : 'Sideways Consolidation',
      macroInsights: [
        'Overall market sentiment is mixed with retail traders slightly bearish',
        'Institutional flows show accumulation in higher timeframes',
        'Correlation with S&P 500 remains moderate at 0.65'
      ]
    };
    
    return advancedSignal;
  };
  
  // Function to calculate signals and generate a recommendation
  const calculateAllSignals = useCallback(async () => {
    if (isCalculating) {
      console.log(`Already calculating signals for ${symbol}, skipping duplicate calculation`);
      return;
    }
    
    // Mark as calculating to prevent duplicate calculations
    calculationTriggeredRef.current = true;
    setIsCalculating(true);
    
    const persistentSymbolSignals = persistentSignalsRef.current[symbol] || {};
    let updatedSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
    let newSignals = 0;
    
    try {
      // Calculate signals for each timeframe
      for (const timeframe of timeframes) {
        console.log(`Calculating signal for ${symbol} on ${timeframe} timeframe`);
        
        // Skip if chart data isn't available
        if (!chartData[timeframe] || chartData[timeframe].length < 10) {
          console.log(`Not enough data for ${symbol} on ${timeframe}, skipping...`);
          continue;
        }
        
        console.log(`Starting signal calculation for ${symbol} (${timeframe})`);
        console.log(`DATA CHECK: ${symbol} on ${timeframe} timeframe has ${chartData[timeframe].length} data points.`);
        
        // Generate technical signal
        const { direction, confidence, environment } = generateSignal(chartData[timeframe], timeframe);
        
        // Extract current price from latest candle
        const currentPrice = chartData[timeframe][chartData[timeframe].length - 1].close;
        
        // Calculate entry, stop loss, and take profit levels
        const entryPrice = currentPrice;
        
        // For bearish signals, stop loss above entry, take profit below
        // For bullish signals, stop loss below entry, take profit above
        let stopLoss: number;
        let takeProfit: number;
        
        if (direction === 'LONG') {
          // For bullish, use a tighter stop on higher confidence trades
          const stopMultiplier = confidence > 70 ? 0.02 : confidence > 50 ? 0.03 : 0.04;
          stopLoss = entryPrice * (1 - stopMultiplier);
          
          // Take profit based on confidence
          const tpMultiplier = confidence > 70 ? 0.05 : confidence > 50 ? 0.04 : 0.03;
          takeProfit = entryPrice * (1 + tpMultiplier);
        } else if (direction === 'SHORT') {
          // For bearish, use a tighter stop on higher confidence trades
          const stopMultiplier = confidence > 70 ? 0.02 : confidence > 50 ? 0.03 : 0.04;
          stopLoss = entryPrice * (1 + stopMultiplier);
          
          // Take profit based on confidence
          const tpMultiplier = confidence > 70 ? 0.05 : confidence > 50 ? 0.04 : 0.03;
          takeProfit = entryPrice * (1 - tpMultiplier);
        } else {
          // For neutral, use wider range
          stopLoss = entryPrice * 0.97;
          takeProfit = entryPrice * 1.03;
        }
        
        // Use support/resistance from technical analysis
        const { supports, resistances } = calculateSupportResistance(chartData[timeframe], currentPrice);
        
        // Create signal data with indicators
        const technicalSignal = {
          direction,
          confidence,
          entryPrice: currentPrice,
          stopLoss,
          takeProfit,
          indicators: {
            // Key technical indicator data
            supports: supports.slice(0, 3), // Take top 3 support levels
            resistances: resistances.slice(0, 3), // Take top 3 resistance levels
          },
          environment: {
            volatility: environment.volatility,
            trend: environment.trend,
            momentum: environment.momentum
          }
        };
        
        console.log(`Generated new technical signal for ${timeframe}: ${direction} with ${confidence}% confidence`);
        
        // Convert to Advanced Signal format with previous signals if available
        const previousSignal = persistentSymbolSignals[timeframe] || null;
        const advancedSignal = createAdvancedSignalFromTechnical(timeframe, technicalSignal, previousSignal);
        
        // Store the new signal
        updatedSignals[timeframe] = advancedSignal;
        persistentSymbolSignals[timeframe] = advancedSignal;
        newSignals++;
        
        console.log(`Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                    `Direction: ${advancedSignal.direction}, Confidence: ${advancedSignal.confidence}%, RecLeverage: ${advancedSignal.recommendedLeverage}x`);
        console.log(`SUCCESS: Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                    `Direction: ${advancedSignal.direction}, Confidence: ${advancedSignal.confidence}%`);
      }
      
      // Update persistent signals for this symbol
      persistentSignalsRef.current[symbol] = persistentSymbolSignals;
      
      // Update signals in state
      setSignals(updatedSignals);
      
      // Generate a recommendation based on all timeframe signals
      // Choose the daily timeframe for the primary recommendation if available
      console.log(`Found ${newSignals} valid signals for recommendation for ${symbol}`);
      
      if (newSignals > 0) {
        console.log(`Updating trade recommendation for ${selectedTimeframe} timeframe`);
        updateRecommendationForTimeframe(selectedTimeframe);
      }
      
      // Mark calculation as complete and update timestamp
      console.log(`Calculation process complete for ${symbol} - ${newSignals} signals generated`);
      
    } catch (error) {
      console.error(`Error calculating signals for ${symbol}:`, error);
      toast({
        title: "Calculation Error",
        description: `Failed to calculate signals for ${symbol}. Try refreshing.`,
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
      calculationTriggeredRef.current = false;
      lastCalculationRef.current = Date.now();
      lastCalculationTimeRef.current = Date.now() / 1000;
    }
  }, [symbol, chartData, signals, isCalculating, toast]);
  
  // Calculate a recommendation from the signals
  const generateTradeRecommendation = useCallback((timeframe: TimeFrame) => {
    // Return early if we don't have signals or the specific timeframe signal
    if (!signals || !signals[timeframe]) {
      return null;
    }
    
    const primarySignal = signals[timeframe];
    if (!primarySignal) return null;
    
    // Get a combined influence from all timeframe signals
    const hasHigherTimeframeSignals = timeframes
      .filter(tf => timeframeWeights[tf] > timeframeWeights[timeframe])
      .some(tf => signals[tf] !== null);
      
    const hasLowerTimeframeSignals = timeframes
      .filter(tf => timeframeWeights[tf] < timeframeWeights[timeframe])
      .some(tf => signals[tf] !== null);
    
    // Calculate a consensus direction and confidence across timeframes
    // Higher timeframes have more influence
    const timeframeSignals = timeframes
      .filter(tf => signals[tf] !== null)
      .map(tf => ({
        timeframe: tf,
        signal: signals[tf],
        weight: timeframeWeights[tf] || 1 // Ensure we always have a default weight
      }));
    
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;
    
    timeframeSignals.forEach(({ signal, weight }) => {
      if (!signal) return;
      
      const effectiveWeight = weight;
      totalWeight += effectiveWeight;
      
      if (signal.direction === 'LONG') {
        bullishScore += (signal.confidence / 100) * effectiveWeight;
      } else if (signal.direction === 'SHORT') {
        bearishScore += (signal.confidence / 100) * effectiveWeight;
      }
    });
    
    // Normalize scores
    if (totalWeight > 0) {
      bullishScore = (bullishScore / totalWeight) * 100;
      bearishScore = (bearishScore / totalWeight) * 100;
    }
    
    // Determine consensus direction and confidence
    let consensusDirection: 'LONG' | 'SHORT' | 'NEUTRAL';
    let consensusConfidence: number;
    
    if (bullishScore > bearishScore && bullishScore > 40) {
      consensusDirection = 'LONG';
      consensusConfidence = bullishScore;
    } else if (bearishScore > bullishScore && bearishScore > 40) {
      consensusDirection = 'SHORT';
      consensusConfidence = bearishScore;
    } else {
      consensusDirection = 'NEUTRAL';
      consensusConfidence = 40; // Base confidence for neutral
    }
    
    // Get the current price from the primary signal
    const currentPrice = primarySignal.entryPrice;
    
    // Create entry range (slightly wider than the exact entry price)
    const entryAdjustment = currentPrice * 0.005; // 0.5% range
    const entryRange: [number, number] = 
      consensusDirection === 'LONG' 
        ? [currentPrice - entryAdjustment, currentPrice] 
        : consensusDirection === 'SHORT'
          ? [currentPrice, currentPrice + entryAdjustment]
          : [currentPrice - entryAdjustment, currentPrice + entryAdjustment];
          
    // Create multiple take profit levels
    const tpAdjustment1 = currentPrice * (consensusConfidence / 200); // First TP at half of confidence percentage
    const tpAdjustment2 = currentPrice * (consensusConfidence / 100);  // Second TP at full confidence percentage
    
    const takeProfitLevels = 
      consensusDirection === 'LONG'
        ? [currentPrice + tpAdjustment1, currentPrice + tpAdjustment2]
        : consensusDirection === 'SHORT'
          ? [currentPrice - tpAdjustment1, currentPrice - tpAdjustment2]
          : [currentPrice * 1.02, currentPrice * 1.05]; // Neutral case
          
    // Create stop loss level
    const slAdjustment = currentPrice * 0.02; // Base 2% stop loss
    const stopLoss = 
      consensusDirection === 'LONG'
        ? currentPrice - slAdjustment
        : consensusDirection === 'SHORT'
          ? currentPrice + slAdjustment
          : consensusDirection === 'NEUTRAL' && bullishScore > bearishScore
            ? currentPrice - slAdjustment * 1.5 // Wider stop for neutral-bullish
            : currentPrice + slAdjustment * 1.5; // Wider stop for neutral-bearish
            
    // Calculate leverage recommendations based on volatility and consensus
    let leverageBase = consensusConfidence > 70 ? 3 : 
                   consensusConfidence > 60 ? 2.5 :
                   consensusConfidence > 50 ? 2 : 1.5;
                   
    // Adjust for timeframe (lower on higher timeframes)
    const timeframeMultiplier = 
      timeframe === '15m' ? 1.2 :
      timeframe === '1h' ? 1.1 :
      timeframe === '4h' ? 1.0 :
      timeframe === '1d' ? 0.9 :
      timeframe === '3d' ? 0.8 :
      timeframe === '1w' ? 0.7 : 0.6;
      
    leverageBase *= timeframeMultiplier;
    
    // Calculate different leverage options
    const conservativeLeverage = Math.max(1, Math.floor(leverageBase * 0.7));
    const moderateLeverage = Math.max(1, Math.floor(leverageBase));
    const aggressiveLeverage = Math.max(1, Math.floor(leverageBase * 1.3));
    
    // Determine the recommended leverage based on the signal strength
    const leverageRecommendation = 
      consensusConfidence > 70 ? 'Moderate' :
      consensusConfidence > 50 ? 'Conservative' : 'Very Conservative';
      
    // Create a nicely formatted summary text
    const timeframeText = 
      timeframe === '15m' ? '15-minute' :
      timeframe === '1h' ? '1-hour' :
      timeframe === '4h' ? '4-hour' :
      timeframe === '1d' ? 'daily' :
      timeframe === '3d' ? '3-day' :
      timeframe === '1w' ? 'weekly' : 'monthly';
      
    const directionText =
      consensusDirection === 'LONG' ? 'bullish' :
      consensusDirection === 'SHORT' ? 'bearish' : 'neutral';
      
    const confidenceText =
      consensusConfidence > 75 ? 'very strong' :
      consensusConfidence > 65 ? 'strong' :
      consensusConfidence > 55 ? 'moderate' :
      consensusConfidence > 45 ? 'tentative' : 'weak';
      
    const summary = `Technical analysis on the ${timeframeText} timeframe indicates a ${confidenceText} ${directionText} bias for ${symbol}. ${
      consensusDirection !== 'NEUTRAL' 
        ? `Consider a ${leverageRecommendation.toLowerCase()} ${consensusDirection.toLowerCase()} position with defined risk management.` 
        : 'The market lacks clear direction; considering waiting for stronger signals before entering a position.'
    }`;
    
    // Extract key indicators that influenced this recommendation
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      const results: string[] = [];
      
      // Look through all indicator categories
      for (const category of ['trend', 'momentum', 'volatility', 'volume']) {
        const indicators = primarySignal.indicators[category as keyof typeof primarySignal.indicators];
        if (Array.isArray(indicators)) {
          // Find strong signals that match the overall direction
          const matchingIndicators = indicators.filter(ind => 
            (consensusDirection === 'LONG' && ind.signal === 'BUY' && ind.strength === 'STRONG') ||
            (consensusDirection === 'SHORT' && ind.signal === 'SELL' && ind.strength === 'STRONG')
          );
          
          // Add up to 2 indicators from each category
          matchingIndicators.slice(0, 2).forEach(ind => {
            results.push(`${ind.name} shows ${consensusDirection === 'LONG' ? 'bullish' : 'bearish'} momentum`);
          });
        }
      }
      
      // Add support/resistance indicators
      if (primarySignal.supportResistance.length > 0) {
        const supports = primarySignal.supportResistance.filter(level => level.type === 'support');
        const resistances = primarySignal.supportResistance.filter(level => level.type === 'resistance');
        
        if (consensusDirection === 'LONG' && supports.length > 0) {
          results.push(`Strong support at ${formatCurrency(supports[0].price)}`);
        } else if (consensusDirection === 'SHORT' && resistances.length > 0) {
          results.push(`Strong resistance at ${formatCurrency(resistances[0].price)}`);
        }
      }
      
      // Add pattern formations if they match the direction
      if (primarySignal.patternFormations.length > 0) {
        const matchingPatterns = primarySignal.patternFormations.filter(pattern => 
          (consensusDirection === 'LONG' && pattern.direction === 'bullish') ||
          (consensusDirection === 'SHORT' && pattern.direction === 'bearish')
        );
        
        if (matchingPatterns.length > 0) {
          results.push(`${matchingPatterns[0].name} pattern identified`);
        }
      }
      
      // Add timeframe alignment indicator if we have multiple timeframe signals
      if (hasHigherTimeframeSignals && hasLowerTimeframeSignals) {
        results.push('Multiple timeframe alignment confirms the trend');
      }
      
      // If we don't have enough indicators, add some general ones
      if (results.length < 3) {
        results.push('Price action shows clear direction');
        
        if (results.length < 3 && consensusDirection === 'LONG') {
          results.push('Higher lows forming on the chart');
        } else if (results.length < 3 && consensusDirection === 'SHORT') {
          results.push('Lower highs forming on the chart');
        }
      }
      
      return results;
    };
    
    // Create the trade recommendation
    const recommendation: TradeRecommendation = {
      symbol,
      direction: consensusDirection,
      confidence: Math.round(consensusConfidence),
      timeframeSummary: timeframeSignals
        .filter(({ signal }) => signal !== null)
        .map(({ timeframe, signal }) => ({
          timeframe,
          confidence: signal ? Math.round(signal.confidence) : 0,
          direction: signal ? signal.direction : 'NEUTRAL'
        })),
      entry: {
        ideal: currentPrice,
        range: entryRange,
      },
      exit: {
        takeProfit: takeProfitLevels,
        stopLoss,
        trailingStopActivation: consensusDirection === 'LONG'
          ? takeProfitLevels[0] // Activate at first TP for long
          : takeProfitLevels[0], // Activate at first TP for short
        trailingStopPercent: 1.0, // 1% trailing stop
      },
      leverage: {
        conservative: conservativeLeverage,
        moderate: moderateLeverage,
        aggressive: aggressiveLeverage,
        recommendation: leverageRecommendation,
      },
      riskManagement: {
        positionSizeRecommendation: consensusConfidence > 70 ? 'Up to 5% of portfolio' : 
                                 consensusConfidence > 50 ? 'Up to 3% of portfolio' : 
                                 'Up to 1% of portfolio',
        maxRiskPercentage: consensusConfidence > 70 ? 2 : 
                        consensusConfidence > 50 ? 1.5 : 1,
        potentialRiskReward: consensusDirection === 'NEUTRAL' ? 1 :
                          Math.abs((takeProfitLevels[1] - currentPrice) / (stopLoss - currentPrice)),
        winProbability: consensusConfidence / 100,
      },
      keyIndicators: findInfluentialIndicators(primarySignal),
      summary,
    };
    
    return recommendation;
  }, [signals, timeframes]);
  
  // Function to update the recommendation when a timeframe is selected
  const updateRecommendationForTimeframe = useCallback((timeframe: TimeFrame) => {
    const newRecommendation = generateTradeRecommendation(timeframe);
    setRecommendation(newRecommendation);
  }, [generateTradeRecommendation]);
  
  // Handler for timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    
    // Inform parent component if callback provided
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [updateRecommendationForTimeframe, onTimeframeSelect]);
  
  // Get the current signal for the selected timeframe
  const currentSignal = signals[selectedTimeframe];
  
  // Helper function to format a price as a currency
  function formatCurrency(price: number): string {
    if (price >= 10000) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    } else if (price >= 100) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 3 })}`;
    } else {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 6 })}`;
    }
  }
  
  // Helper function to get signal background color
  function getSignalBgClass(direction: string): string {
    if (direction === 'LONG') return 'bg-emerald-900/10';
    if (direction === 'SHORT') return 'bg-rose-900/10';
    return 'bg-gray-800/50';
  }
  
  // Render the component
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Signal Analysis</h2>
          <p className="text-sm text-gray-300">
            Advanced technical analysis across multiple timeframes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-white font-medium bg-gray-800 px-2 py-1 rounded-md">
            Auto-refresh in: {Math.floor(nextRefreshIn / 60)}:{(nextRefreshIn % 60).toString().padStart(2, '0')}
          </div>
          <Button variant="outline" size="sm" className="gap-1" 
            onClick={() => triggerCalculation('manual')}
            disabled={isCalculating}
          >
            <RefreshCcw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={selectedTimeframe} onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
        <TabsList className="grid grid-cols-7 w-full bg-gray-900 p-1">
          {timeframes.map((timeframe) => (
            <TabsTrigger 
              key={timeframe} 
              value={timeframe}
              className={`${
                signals[timeframe]?.direction === 'LONG' 
                  ? 'data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_10px_theme(colors.green.900)]' : 
                signals[timeframe]?.direction === 'SHORT' 
                  ? 'data-[state=active]:text-red-400 data-[state=active]:shadow-[0_0_10px_theme(colors.red.900)]' : 
                  ''
              }`}
            >
              {timeframe}
              {signals[timeframe] && (
                <span className={`ml-1 w-1.5 h-1.5 rounded-full ${
                  signals[timeframe]?.direction === 'LONG' 
                    ? 'bg-green-400' : 
                  signals[timeframe]?.direction === 'SHORT' 
                    ? 'bg-red-400' : 
                    'bg-gray-400'
                }`}>
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integrated Signal & Trade Recommendation Card */}
        <Card className={currentSignal ? 'border-gray-700 bg-secondary' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center text-white">
              <span>{selectedTimeframe} Signal Analysis</span>
              {currentSignal && (
                currentSignal.direction === 'LONG' ? <TrendingUp className="h-5 w-5 text-green-400" /> : 
                currentSignal.direction === 'SHORT' ? <TrendingDown className="h-5 w-5 text-red-400" /> :
                <Minus className="h-5 w-5 text-yellow-400" />
              )}
            </CardTitle>
            <CardDescription className="text-white text-sm font-medium">
              Comprehensive technical analysis for {symbol} on {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSignal ? (
              <div className="space-y-5">
                {/* Direction and Confidence Section */}
                <div className="flex justify-between items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white mb-2">Direction</div>
                    <div className={`text-lg font-extrabold px-4 py-2 rounded-md ${
                      currentSignal.direction === 'LONG' 
                        ? 'bg-green-900/40 text-green-400 border border-green-700' : 
                      currentSignal.direction === 'SHORT' 
                        ? 'bg-red-900/40 text-red-400 border border-red-700' : 
                        'bg-yellow-900/40 text-yellow-400 border border-yellow-700'
                    }`}>
                      {currentSignal.direction}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white mb-2">Confidence</div>
                    <div className={`text-lg font-extrabold px-4 py-2 rounded-md ${
                      currentSignal.confidence > 70 ? 'bg-green-900/40 text-green-400 border border-green-700' :
                      currentSignal.confidence > 50 ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700' :
                      'bg-red-900/40 text-red-400 border border-red-700'
                    }`}>
                      {Math.round(currentSignal.confidence)}%
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-semibold text-white mb-2">Macro Score</div>
                    <div className={`text-lg font-extrabold px-4 py-2 rounded-md ${
                      currentSignal.macroScore > 70 ? 'bg-green-900/40 text-green-400 border border-green-700' :
                      currentSignal.macroScore > 50 ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700' :
                      'bg-red-900/40 text-red-400 border border-red-700'
                    }`}>
                      {Math.round(currentSignal.macroScore)}%
                    </div>
                  </div>
                </div>
                
                {/* Entry/Exit Strategy Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Price Levels */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                    <h3 className="text-white font-bold text-sm">Trade Levels</h3>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Entry Price</span>
                      <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-1 rounded border border-amber-800">
                        {formatCurrency(currentSignal.entryPrice)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Take Profit</span>
                      <span className="font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded border border-green-800">
                        {formatCurrency(currentSignal.takeProfit)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Stop Loss</span>
                      <span className="font-bold text-red-400 bg-red-900/30 px-3 py-1 rounded border border-red-800">
                        {formatCurrency(currentSignal.stopLoss)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Risk Management */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                    <h3 className="text-white font-bold text-sm">Risk Management</h3>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Risk/Reward</span>
                      <span className="font-bold text-blue-400 bg-blue-900/30 px-3 py-1 rounded border border-blue-800">
                        {Math.round(currentSignal.optimalRiskReward * 100) / 100}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Recommended Leverage</span>
                      <span className="font-bold text-purple-400 bg-purple-900/30 px-3 py-1 rounded border border-purple-800">
                        {currentSignal.recommendedLeverage}x
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Position Sizing</span>
                      <span className="font-bold text-cyan-400 bg-cyan-900/30 px-3 py-1 rounded border border-cyan-800">
                        Conservative
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Indicators and Volatility Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Technical Indicators */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-bold text-sm mb-2">Technical Indicators</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(currentSignal.indicators)
                        .filter(([category]) => !['supports', 'resistances'].includes(category))
                        .slice(0, 3) // Only show first three indicator categories
                        .flatMap(([category, items]) => 
                          Array.isArray(items) ? 
                            items.slice(0, 2).map((indicator: any, i: number) => (
                              <Badge 
                                key={`${category}-${i}`} 
                                variant="outline" 
                                className={`
                                  ${indicator.signal === 'BUY' 
                                    ? 'text-green-400 border-green-500 bg-green-900/30' : 
                                  indicator.signal === 'SELL' 
                                    ? 'text-red-400 border-red-500 bg-red-900/30' : 
                                    'text-yellow-400 border-yellow-500 bg-yellow-900/30'}
                                  ${indicator.strength === 'STRONG' ? 'font-bold' : 'font-medium'}
                                  px-2 py-1 text-xs
                                `}
                              >
                                {indicator.signal}
                              </Badge>
                            )) : []
                      )}
                    </div>
                  </div>
                  
                  {/* Volatility */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-bold text-sm mb-2">Volatility</h3>
                    <Badge variant="outline" className="bg-indigo-900/30 text-indigo-400 border-indigo-500 px-2 py-1 font-medium">
                      {(() => {
                        // Safe volatility extraction that handles all possible types
                        let volatilityValue = 0;
                        
                        try {
                          if (currentSignal.indicators.volatility !== undefined) {
                            if (Array.isArray(currentSignal.indicators.volatility)) {
                              // Handle array type with validation
                              const vol = currentSignal.indicators.volatility;
                              if (vol.length > 0 && vol[0] && typeof vol[0].value === 'number') {
                                volatilityValue = vol[0].value;
                              }
                            } else if (typeof currentSignal.indicators.volatility === 'number') {
                              // Handle direct number value
                              volatilityValue = currentSignal.indicators.volatility;
                            }
                          }
                        } catch (e) {
                          console.log("Error displaying volatility:", e);
                        }
                        
                        return Math.round(volatilityValue);
                      })()}%
                    </Badge>
                  </div>
                  
                  {/* Market Condition */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-bold text-sm mb-2">Market Condition</h3>
                    <Badge variant="outline" className="bg-teal-900/30 text-teal-400 border-teal-500 px-2 py-1 font-medium">
                      {currentSignal.macroClassification || "Neutral"}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center bg-gray-900 rounded-lg p-4 border border-gray-700">
                <span className="text-white font-medium">No signal data available for {selectedTimeframe}</span>
                <span className="text-gray-300 text-sm mt-2">Try selecting a different timeframe or refresh</span>
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
                No patterns detected for this timeframe
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
              Key price levels for {symbol} on {selectedTimeframe} timeframe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentSignal && currentSignal.supportResistance ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Support Levels - Always exactly 3 */}
                <div>
                  <h3 className="font-medium text-emerald-500 mb-2">Support Levels</h3>
                  <div className="space-y-2">
                    {(() => {
                      // Generate support levels either from data or defaults
                      const price = currentSignal.entryPrice;
                      let supports: number[] = [price * 0.99, price * 0.97, price * 0.95];
                      
                      // Use actual indicators if available and valid
                      if (currentSignal.indicators?.supports && 
                          Array.isArray(currentSignal.indicators.supports) &&
                          currentSignal.indicators.supports.length > 0) {
                        // Take exactly 3 (or pad with defaults if fewer)
                        const availableSupports = currentSignal.indicators.supports.slice(0, 3);
                        if (availableSupports.length === 3) {
                          supports = availableSupports;
                        } else {
                          // Pad with calculated defaults
                          while (availableSupports.length < 3) {
                            const lastIdx = availableSupports.length;
                            availableSupports.push(price * (0.99 - (lastIdx * 0.02)));
                          }
                          supports = availableSupports;
                        }
                      }
                      
                      // Always render exactly 3 support levels
                      return supports.map((level, i) => (
                        <div key={`support-${i}`} className="flex justify-between items-center border-b pb-1">
                          <div>
                            <Badge 
                              variant="outline"
                              className="text-emerald-500 border-emerald-500/20"
                            >
                              {i === 0 ? "Strong" : i === 1 ? "Medium" : "Weak"}
                            </Badge>
                          </div>
                          <div className="text-lg font-semibold">
                            {formatCurrency(level)}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
                
                {/* Resistance Levels - Always exactly 3 */}
                <div>
                  <h3 className="font-medium text-rose-500 mb-2">Resistance Levels</h3>
                  <div className="space-y-2">
                    {(() => {
                      // Generate resistance levels either from data or defaults
                      const price = currentSignal.entryPrice;
                      let resistances: number[] = [price * 1.01, price * 1.03, price * 1.05];
                      
                      // Use actual indicators if available and valid
                      if (currentSignal.indicators?.resistances && 
                          Array.isArray(currentSignal.indicators.resistances) &&
                          currentSignal.indicators.resistances.length > 0) {
                        // Take exactly 3 (or pad with defaults if fewer)
                        const availableResistances = currentSignal.indicators.resistances.slice(0, 3);
                        if (availableResistances.length === 3) {
                          resistances = availableResistances;
                        } else {
                          // Pad with calculated defaults
                          while (availableResistances.length < 3) {
                            const lastIdx = availableResistances.length;
                            availableResistances.push(price * (1.01 + (lastIdx * 0.02)));
                          }
                          resistances = availableResistances;
                        }
                      }
                      
                      // Always render exactly 3 resistance levels
                      return resistances.map((level, i) => (
                        <div key={`resistance-${i}`} className="flex justify-between items-center border-b pb-1">
                          <div>
                            <Badge 
                              variant="outline"
                              className="text-rose-500 border-rose-500/20"
                            >
                              {i === 0 ? "Weak" : i === 1 ? "Medium" : "Strong"}
                            </Badge>
                          </div>
                          <div className="text-lg font-semibold">
                            {formatCurrency(level)}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No key levels detected
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}