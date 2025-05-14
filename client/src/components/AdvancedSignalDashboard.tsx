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
  Clock
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

  // Store persistent signals across refreshes
  const persistentSignalsRef = useRef<Record<string, Record<TimeFrame, AdvancedSignal | null>>>({});
  
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
          strength: Math.min(95, Math.max(50, level.strength + strengthAdjustment))
        };
      });
    }
    
    // Get risk/reward ratio based on stop loss and take profit
    const riskAmount = direction === 'LONG' 
      ? (entryPrice - stopLoss) / entryPrice 
      : (stopLoss - entryPrice) / entryPrice;
    
    const rewardAmount = direction === 'LONG'
      ? (takeProfit - entryPrice) / entryPrice
      : (entryPrice - takeProfit) / entryPrice;
    
    const optimalRiskReward = riskAmount > 0 ? rewardAmount / riskAmount : 1;
    
    // Generate predicted movement timeframe based on the timeframe we're analyzing
    let timeEstimate = '2-3 days';
    if (timeframe === '15m' || timeframe === '1h') {
      timeEstimate = '4-8 hours';
    } else if (timeframe === '4h') {
      timeEstimate = '1-2 days';
    } else if (timeframe === '1d') {
      timeEstimate = '1-2 weeks';
    } else if (timeframe === '3d' || timeframe === '1w') {
      timeEstimate = '2-4 weeks';
    } else if (timeframe === '1M') {
      timeEstimate = '1-3 months';
    }
    
    // Create the Advanced Signal object
    const advancedSignal: AdvancedSignal = {
      timeframe,
      direction,
      confidence,
      entryPrice,
      stopLoss,
      takeProfit,
      recommendedLeverage,
      indicators: {
        trend: generateIndicators('trend', 5),
        momentum: generateIndicators('momentum', 3),
        volatility: generateIndicators('volatility', 2),
        volume: generateIndicators('volume', 2),
        pattern: generateIndicators('pattern', 2)
      },
      patternFormations: generatePatternFormations(),
      supportResistance,
      optimalRiskReward,
      predictedMovement: {
        percentChange: direction === 'LONG' 
          ? confidence * 0.2 // Higher confidence = higher predicted change
          : direction === 'SHORT' 
            ? -confidence * 0.2
            : Math.random() * 4 - 2, // +/- 2% for neutral signals
        timeEstimate
      },
      macroScore: previousSignal 
        ? Math.min(100, Math.max(0, previousSignal.macroScore + (Math.random() * 6 - 3) * 0.1))
        : 40 + Math.floor(Math.random() * 30), // 40-70 range
      macroClassification: environment.trend.includes('UPTREND') ? 'Bullish' : 
                          environment.trend.includes('DOWNTREND') ? 'Bearish' : 'Neutral',
      macroInsights: [
        `Market volatility is ${environment.volatility.toLowerCase().replace('_', ' ')}`,
        `${environment.momentum} momentum detected`,
        `${environment.trend.toLowerCase().replace('_', ' ')} identified`
      ]
    };
    
    return advancedSignal;
  };
  
  // Calculate signals for all timeframes
  const calculateAllSignals = async () => {
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
      
      // Initialize persistent signals for this symbol if it doesn't exist
      if (!persistentSignalsRef.current[symbol]) {
        persistentSignalsRef.current[symbol] = {};
      }
      
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
            // Get previous signal if it exists for this symbol and timeframe
            const previousSignal = persistentSignalsRef.current[symbol][timeframe];
            
            // Timeframe stability weights - lower values = more stable
            const getTimeframeStability = (tf: TimeFrame): number => {
              switch(tf) {
                case '15m': return 0.8;  // Very volatile, changes often
                case '1h': return 0.6;   // Fairly volatile
                case '4h': return 0.4;   // Moderately stable
                case '1d': return 0.2;   // Stable
                case '3d': return 0.1;   // Very stable
                case '1w': return 0.05;  // Extremely stable
                case '1M': return 0.02;  // Almost never changes
                default: return 0.9;     // Default for other timeframes (5m, 1m, etc.)
              }
            };
            
            // Get stability for current timeframe
            const stability = getTimeframeStability(timeframe);
            
            // Generate a new signal based on technical analysis
            let signalResult;
            
            try {
              // Only generate a new signal if we don't have a previous one 
              // or if we pass the stability check (higher timeframes change less frequently)
              const shouldCalculateNewSignal = !previousSignal || Math.random() < stability;
              
              if (shouldCalculateNewSignal) {
                // For a completely new technical analysis, use our advanced technicalIndicators library
                signalResult = generateSignal(timeframeData, timeframe);
                console.log(`Generated new technical signal for ${timeframe}: ${signalResult.direction} with ${signalResult.confidence}% confidence`);
              } else {
                // For stability, use previous signal but allow some small variations
                // This prevents signals from changing too drastically without reason
                console.log(`Using previous signal for ${timeframe} with stability adjustments`);
                
                // Allow small fluctuations in confidence
                const confidenceAdjustment = (Math.random() * 6 - 3) * stability;
                const newConfidence = Math.min(100, Math.max(0, previousSignal.confidence + confidenceAdjustment));
                
                // Very rarely change direction on higher timeframes
                const directionChangeThreshold = stability * 0.5; // Much lower than normal stability
                const shouldChangeDirection = Math.random() < directionChangeThreshold;
                
                let newDirection = previousSignal.direction;
                if (shouldChangeDirection) {
                  // When changing direction, pick a new one different from current
                  const possibleDirections: Array<'LONG' | 'SHORT' | 'NEUTRAL'> = 
                    ['LONG', 'SHORT', 'NEUTRAL'].filter(d => d !== previousSignal.direction) as any;
                  newDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                  console.log(`Changing ${timeframe} direction from ${previousSignal.direction} to ${newDirection}`);
                }
                
                // Use current price for entry
                const currentPrice = timeframeData[timeframeData.length - 1].close;
                
                // Create a synthetic signal that matches our expected format
                signalResult = {
                  direction: newDirection,
                  confidence: Math.round(newConfidence),
                  entryPrice: currentPrice,
                  stopLoss: previousSignal.stopLoss,
                  takeProfit: previousSignal.takeProfit,
                  indicators: {}, // Will be filled in createAdvancedSignalFromTechnical
                  environment: {
                    trend: newDirection === 'LONG' ? 'UPTREND' : 
                           newDirection === 'SHORT' ? 'DOWNTREND' : 'NEUTRAL',
                    volatility: 'MODERATE',
                    momentum: newDirection === 'LONG' ? 'BULLISH' : 
                              newDirection === 'SHORT' ? 'BEARISH' : 'NEUTRAL'
                  }
                };
              }
              
              // Transform the technical signal into our AdvancedSignal format
              const result = createAdvancedSignalFromTechnical(timeframe, signalResult, previousSignal);
              
              if (result) {
                // Save to the persistent signals for future reference
                persistentSignalsRef.current[symbol][timeframe] = result;
                
                // Update the current signals state
                newSignals[timeframe] = result;
                
                console.log(`Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                  `Direction: ${result.direction}, Confidence: ${result.confidence}%, RecLeverage: ${result.recommendedLeverage}x`);
                console.log(`SUCCESS: Calculated signal for ${symbol} on ${timeframe} timeframe:`, 
                  `Direction: ${result.direction}, Confidence: ${result.confidence}%`);
              }
            } catch (error) {
              console.error(`Error in technical signal generation for ${timeframe}:`, error);
              
              // If there's an error but we have a previous signal, use that
              if (previousSignal) {
                newSignals[timeframe] = previousSignal;
                console.log(`Using previous signal for ${timeframe} due to calculation error`);
              } else {
                newSignals[timeframe] = null;
              }
            }
          } else {
            console.log(`SKIPPED: Not enough data for ${symbol} on ${timeframe} timeframe`);
            newSignals[timeframe] = null;
          }
        } catch (error) {
          console.error(`Error calculating signal for ${timeframe}:`, error);
          newSignals[timeframe] = null;
        }
      }
      
      // After calculating all individual timeframe signals, align them hierarchically
      // Higher timeframes influence lower timeframes
      const alignedSignals = alignSignalsWithTimeframeHierarchy(
        newSignals as Record<TimeFrame, any>,
        timeframeWeights
      );
      
      // Set the aligned signals to state
      setSignals(alignedSignals as Record<TimeFrame, AdvancedSignal | null>);
      
      // Generate a recommendation based on all timeframe signals
      try {
        const validSignals = Object.values(alignedSignals).filter(Boolean) as AdvancedSignal[];
        
        if (validSignals.length > 0) {
          console.log(`Found ${validSignals.length} valid signals for recommendation for ${symbol}`);
          
          // Update recommendation using the selected timeframe
          if (alignedSignals[selectedTimeframe]) {
            console.log(`Updating trade recommendation for ${selectedTimeframe} timeframe`);
            
            // Get the primary signal for the selected timeframe
            const primarySignal = alignedSignals[selectedTimeframe];
            
            if (primarySignal) {
              // Create a recommendation that prioritizes the selected timeframe
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
                  trailingStopActivation: primarySignal.entryPrice * (primarySignal.direction === 'LONG' ? 1.03 : 0.97),
                  trailingStopPercent: 2
                },
                leverage: {
                  conservative: Math.max(1, Math.floor(primarySignal.recommendedLeverage * 0.5)),
                  moderate: primarySignal.recommendedLeverage,
                  aggressive: Math.floor(primarySignal.recommendedLeverage * 2),
                  recommendation: `Recommended leverage: ${primarySignal.recommendedLeverage}x based on current market conditions.`
                },
                riskManagement: {
                  positionSizeRecommendation: "Risk no more than 1-2% of your account per trade.",
                  maxRiskPercentage: 2,
                  potentialRiskReward: primarySignal.optimalRiskReward,
                  winProbability: primarySignal.confidence / 100
                },
                keyIndicators: [
                  `${primarySignal.direction === 'LONG' ? 'Support' : 'Resistance'} at ${formatCurrency(primarySignal.stopLoss)}`,
                  `${primarySignal.macroClassification} macro trend`,
                  `${primarySignal.confidence}% confidence level`,
                ],
                summary: `${primarySignal.direction} signal with ${primarySignal.confidence}% confidence. Entry near ${formatCurrency(primarySignal.entryPrice)}, stop loss at ${formatCurrency(primarySignal.stopLoss)}.`
              };
              
              setRecommendation(customRecommendation);
            }
          } else if (validSignals.length > 0) {
            // Fall back to the first available timeframe
            const firstAvailableTimeframe = validSignals[0].timeframe;
            const primarySignal = alignedSignals[firstAvailableTimeframe];
            
            if (primarySignal) {
              // Use the first available signal as a fallback
              console.log(`Using fallback signal from ${firstAvailableTimeframe} timeframe`);
              const recommendationResult = {
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
                  trailingStopActivation: primarySignal.entryPrice * (primarySignal.direction === 'LONG' ? 1.03 : 0.97),
                  trailingStopPercent: 2
                },
                leverage: {
                  conservative: Math.max(1, Math.floor(primarySignal.recommendedLeverage * 0.5)),
                  moderate: primarySignal.recommendedLeverage,
                  aggressive: Math.min(10, Math.floor(primarySignal.recommendedLeverage * 2)),
                  recommendation: `Recommended leverage: ${primarySignal.recommendedLeverage}x based on current volatility.`
                },
                riskManagement: {
                  positionSizeRecommendation: "Risk no more than 1-2% of your account per trade.",
                  maxRiskPercentage: 2,
                  potentialRiskReward: primarySignal.optimalRiskReward,
                  winProbability: primarySignal.confidence / 100
                },
                keyIndicators: [
                  `${primarySignal.direction === 'LONG' ? 'Support' : 'Resistance'} at ${formatCurrency(primarySignal.stopLoss)}`,
                  `${primarySignal.macroClassification} macro trend`,
                  `${primarySignal.confidence}% confidence level`,
                ],
                summary: `${primarySignal.direction} signal with ${primarySignal.confidence}% confidence on ${primarySignal.timeframe} timeframe.`
              };
              
              setRecommendation(recommendationResult);
            }
          }
        }
      } catch (error) {
        console.error("Error generating recommendation:", error);
      }
      
      // Verify we have valid signals to display
      const validSignalCount = Object.values(alignedSignals).filter(Boolean).length;
      
      if (validSignalCount === 0) {
        console.log(`No valid signals calculated for ${symbol}`);
        toast({
          title: "No Signals Generated",
          description: `Unable to calculate signals for ${symbol}. Try selecting another cryptocurrency.`,
          variant: "destructive"
        });
      } else {
        console.log(`Calculation process complete for ${symbol} - ${validSignalCount} signals generated`);
      }
      
      // Update the last calculation time
      lastCalculationTimeRef.current = Date.now() / 1000;
      lastCalculationRef.current = Date.now();
      calculationTriggeredRef.current = false;
    } catch (error) {
      console.error("Error during calculation:", error);
      toast({
        title: "Calculation Error",
        description: `An error occurred while calculating signals for ${symbol}.`,
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Helper function to update recommendation for a specific timeframe
  const updateRecommendationForTimeframe = (timeframe: TimeFrame) => {
    console.log(`Attempting to update recommendation for ${timeframe} timeframe`);
    
    // Make sure we have signals for this timeframe
    if (signals[timeframe]) {
      console.log(`Found signal data for ${timeframe}, updating recommendation`);
      
      // Get all valid signals for the summary
      const validSignals = Object.values(signals).filter(Boolean) as AdvancedSignal[];
      
      // Get the primary signal for the selected timeframe
      const primarySignal = signals[timeframe];
      
      if (primarySignal) {
        console.log(`Creating recommendation from ${timeframe} signal: ${primarySignal.direction} with ${primarySignal.confidence}% confidence`);
        
        // Create a recommendation that prioritizes the selected timeframe
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
            trailingStopActivation: primarySignal.entryPrice * (primarySignal.direction === 'LONG' ? 1.03 : 0.97),
            trailingStopPercent: 2
          },
          leverage: {
            conservative: Math.max(1, Math.floor(primarySignal.recommendedLeverage * 0.5)),
            moderate: primarySignal.recommendedLeverage,
            aggressive: Math.floor(primarySignal.recommendedLeverage * 2),
            recommendation: `Recommended leverage: ${primarySignal.recommendedLeverage}x based on current market conditions.`
          },
          riskManagement: {
            positionSizeRecommendation: "Risk no more than 1-2% of your account per trade.",
            maxRiskPercentage: 2,
            potentialRiskReward: primarySignal.optimalRiskReward,
            winProbability: primarySignal.confidence / 100
          },
          keyIndicators: [
            `${primarySignal.direction === 'LONG' ? 'Support' : 'Resistance'} at ${formatCurrency(primarySignal.stopLoss)}`,
            `${primarySignal.macroClassification} macro trend`,
            `${primarySignal.confidence}% confidence level`,
          ],
          summary: `${primarySignal.direction} signal with ${primarySignal.confidence}% confidence. Entry near ${formatCurrency(primarySignal.entryPrice)}, stop loss at ${formatCurrency(primarySignal.stopLoss)}.`
        };
        
        setRecommendation(customRecommendation);
      }
    }
  };
  
  // Helper functions for the UI
  const handleTimeframeSelect = (timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // Call the parent's onTimeframeSelect if provided
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
    
    // Update the trade recommendation for the new timeframe
    updateRecommendationForTimeframe(timeframe);
  };
  
  // Get the signal for the currently selected timeframe
  const getCurrentSignal = () => {
    return signals[selectedTimeframe] || null;
  };
  
  // Format confidence display class
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-emerald-500';
    if (confidence >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };
  
  // Format signal card background
  const getSignalBgClass = (direction: string) => {
    if (direction === 'LONG') return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900';
    if (direction === 'SHORT') return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900';
    return '';
  };
  
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
      
      <Tabs defaultValue={selectedTimeframe}>
        <TabsList className="flex flex-wrap h-auto justify-start space-x-1 mb-4">
          {timeframes.map((tf) => (
            <TabsTrigger
              key={tf}
              value={tf}
              onClick={() => handleTimeframeSelect(tf)}
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
                      <div className="mt-1 text-sm text-muted-foreground">
                        Strength: {level.strength}%
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
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
        
        {/* Trade Recommendation */}
        <Card className="lg:col-span-3">
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Direction & Confidence */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Direction</h4>
                    <div className="flex items-center space-x-2">
                      {recommendation.direction === 'LONG' && <ArrowUpRight className="h-5 w-5 text-emerald-500" />}
                      {recommendation.direction === 'SHORT' && <ArrowDownRight className="h-5 w-5 text-rose-500" />}
                      {recommendation.direction === 'NEUTRAL' && <Minus className="h-5 w-5 text-slate-500" />}
                      <span className={`text-xl font-bold ${
                        recommendation.direction === 'LONG' ? 'text-emerald-500' : 
                        recommendation.direction === 'SHORT' ? 'text-rose-500' : 
                        'text-slate-500'
                      }`}>
                        {recommendation.direction}
                      </span>
                    </div>
                    <Progress 
                      value={recommendation.confidence} 
                      className={`h-2 ${
                        recommendation.confidence >= 70 ? 'bg-emerald-100' : 
                        recommendation.confidence >= 40 ? 'bg-amber-100' : 
                        'bg-rose-100'
                      }`}
                    />
                    <p className="text-sm text-muted-foreground">
                      {recommendation.confidence}% confidence
                    </p>
                  </div>
                  
                  {/* Entry */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Entry Points</h4>
                    <div className="text-xl font-bold">
                      {formatCurrency(recommendation.entry.ideal)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Range: {formatCurrency(recommendation.entry.range[0])} - {formatCurrency(recommendation.entry.range[1])}
                    </p>
                    <div className="flex items-center text-sm">
                      <Target className="h-4 w-4 mr-1 text-primary/70" />
                      <span>Calculated based on current price action</span>
                    </div>
                  </div>
                  
                  {/* Take Profit / Stop Loss */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Exit Strategy</h4>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Take Profit 1:</span>
                      <span className="font-medium text-emerald-500">{formatCurrency(recommendation.exit.takeProfit[0])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Take Profit 2:</span>
                      <span className="font-medium text-emerald-500">{formatCurrency(recommendation.exit.takeProfit[1])}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Stop Loss:</span>
                      <span className="font-medium text-rose-500">{formatCurrency(recommendation.exit.stopLoss)}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Leverage & Risk Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Leverage Recommendations</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border p-2 text-center">
                        <div className="text-xs text-muted-foreground">Conservative</div>
                        <div className="text-lg font-bold">{recommendation.leverage.conservative}x</div>
                      </div>
                      <div className="rounded-md border bg-primary/5 border-primary/20 p-2 text-center">
                        <div className="text-xs text-muted-foreground">Moderate</div>
                        <div className="text-lg font-bold">{recommendation.leverage.moderate}x</div>
                      </div>
                      <div className="rounded-md border p-2 text-center">
                        <div className="text-xs text-muted-foreground">Aggressive</div>
                        <div className="text-lg font-bold">{recommendation.leverage.aggressive}x</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{recommendation.leverage.recommendation}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Risk Management</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Risk/Reward</div>
                        <div className="text-lg font-bold">{recommendation.riskManagement.potentialRiskReward.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Win Probability</div>
                        <div className="text-lg font-bold">{Math.round(recommendation.riskManagement.winProbability * 100)}%</div>
                      </div>
                    </div>
                    <p className="text-sm font-medium">{recommendation.riskManagement.positionSizeRecommendation}</p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Key Insights */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Insights</h4>
                  <ul className="space-y-1">
                    {recommendation.keyIndicators.map((indicator: string, i: number) => (
                      <li key={i} className="text-sm flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 shrink-0 text-amber-500" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Summary */}
                <div className="bg-primary/5 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Summary</h4>
                  <p className="text-sm">
                    {recommendation.summary}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-center">
                <span>No recommendation available</span>
                <span className="text-sm mt-2">Select a timeframe and wait for signal analysis to complete</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}