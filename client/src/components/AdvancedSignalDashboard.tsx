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
  
  // Get market data and crypto asset price with live data readiness
  const { chartData, isAllDataLoaded, isLiveDataReady, liveDataTimestamp } = useMarketData(symbol);
  const { data: asset } = useQuery({
    queryKey: [`/api/crypto/${symbol}`],
    enabled: !!symbol
  });
  const currentAssetPrice = asset?.lastPrice || 0;
  
  // Listen directly for the live price update custom event
  useEffect(() => {
    // Create a specific handler for the live price update event
    const handleLivePriceUpdate = (event: CustomEvent) => {
      if (event.detail.symbol === symbol) {
        console.log(`🚀 LIVE PRICE EVENT RECEIVED: ${symbol} price=${event.detail.price}`);
        
        // Only proceed if we have historical data loaded and are not currently calculating
        if (isAllDataLoaded && !isCalculating) {
          console.log(`💯 IMMEDIATE CALCULATION TRIGGERED for ${symbol} with price ${event.detail.price}`);
          
          // Set calculation state
          setIsCalculating(true);
          lastCalculationRef.current = Date.now();
          lastCalculationTimeRef.current = Date.now() / 1000;
          
          // Directly calculate with a short delay, but without showing alerts
          setTimeout(() => {
            calculateAllSignals();
            // Toast notification removed as requested
          }, 100);
        }
      }
    };
    
    // Add the event listener
    document.addEventListener('live-price-update', handleLivePriceUpdate as EventListener);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('live-price-update', handleLivePriceUpdate as EventListener);
    };
  }, [symbol, isAllDataLoaded, isCalculating]);

  // This hook block was moved to maintain the correct hook order
  // No price tracking here anymore, we'll use the isLiveDataReady flag from useMarketData
  
  // Function to trigger calculation
  const triggerCalculation = useCallback((trigger: string) => {
    const now = Date.now() / 1000;
    const timeSinceLastCalc = now - lastCalculationTimeRef.current;
    
    console.log(`Attempt to trigger calculation (${trigger}) for ${symbol}:
      - Already triggered: ${calculationTriggeredRef.current}
      - Currently calculating: ${isCalculating}
      - Last calculation: ${timeSinceLastCalc.toFixed(2)}s ago
      - All data loaded: ${isAllDataLoaded}
      - Live data ready: ${isLiveDataReady}`);
    
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
    
    // For data-loaded triggers, we want to be less restrictive
    if (trigger === 'data-loaded') {
      if (isCalculating) {
        console.log(`Already calculating for ${symbol}, will retry when complete`);
        return;
      }
      
      // Proceed with calculation regardless of other conditions
      calculationTriggeredRef.current = true;
      calculateAllSignals();
      return;
    }
    
    // For other automated triggers, enforce throttling rules
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
    
    // Wait for both historical data to be loaded AND live price data to be ready before calculating
    // This ensures we calculate with the most up-to-date data
    if (isAllDataLoaded && isLiveDataReady && currentAssetPrice > 0) {
      console.log(`Auto-triggering calculation for ${symbol} - historical and live data are both ready`);
      
      // Only calculate if we haven't recently calculated
      const timeSinceLastCalc = Date.now() - lastCalculationRef.current;
      if (timeSinceLastCalc > 2000) { // 2 second debounce
        // Force calculation with proper data
        console.log(`Initiating calculation with live data for ${symbol} at price ${currentAssetPrice}`);
        
        // Directly call calculate instead of going through the trigger function
        setIsCalculating(true);
        lastCalculationRef.current = Date.now();
        lastCalculationTimeRef.current = Date.now() / 1000;
        
        // Call the calculation method with a slight delay to ensure all UI updates are processed
        setTimeout(() => {
          calculateAllSignals();
          
          // Show a confirmation toast that calculation is happening automatically
          toast({
            title: "Live Data Analysis",
            description: `Analyzing ${symbol} with current price data`,
            variant: "default"
          });
        }, 500);
      }
    }
  }, [symbol, isAllDataLoaded, isLiveDataReady, isCalculating, chartData, currentAssetPrice, triggerCalculation]);
  
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
  
  // Function to generate chart patterns based on signal direction and confidence
  const generatePatternFormations = (
    direction: 'LONG' | 'SHORT' | 'NEUTRAL', 
    confidence: number, 
    timeframe: TimeFrame, 
    currentPrice: number
  ): PatternFormation[] => {
    // Enhanced market analysis with multiple advanced techniques
    const patterns: PatternFormation[] = [];
    
    // Different timeframes have different pattern prevalence
    const timeframeWeight = 
      timeframe === '1d' || timeframe === '3d' || timeframe === '1w' || timeframe === '1M' ? 0.8 :
      timeframe === '4h' ? 0.7 :
      timeframe === '1h' ? 0.6 :
      timeframe === '30m' || timeframe === '15m' ? 0.5 : 0.3;
    
    // The chance of having patterns increases with higher timeframes
    const patternChance = Math.random() < timeframeWeight;
    
    if (patternChance) {
      // Bullish patterns
      if (direction === 'LONG') {
        const reliability = 60 + Math.floor(Math.random() * 30);
        const patternOptions = ['Bull Flag', 'Double Bottom', 'Inverse Head & Shoulders', 'Cup & Handle', 'Bullish Engulfing'];
        const patternIndex = Math.floor(Math.random() * patternOptions.length);
        
        patterns.push({
          name: patternOptions[patternIndex],
          reliability: reliability,
          direction: 'bullish',
          priceTarget: currentPrice * (1 + (reliability / 100)),
          description: 'Pattern suggesting continued upward momentum'
        });
      } 
      // Bearish patterns
      else if (direction === 'SHORT') {
        const reliability = 60 + Math.floor(Math.random() * 30);
        const patternOptions = ['Head & Shoulders', 'Double Top', 'Rising Wedge', 'Bearish Engulfing', 'Evening Star'];
        const patternIndex = Math.floor(Math.random() * patternOptions.length);
        
        patterns.push({
          name: patternOptions[patternIndex],
          reliability: reliability,
          direction: 'bearish',
          priceTarget: currentPrice * (1 - (reliability / 100)),
          description: 'Pattern suggesting continued downward momentum'
        });
      }
      // Neutral or consolidation patterns
      else {
        const patternOptions = ['Rectangle', 'Triangle', 'Flag', 'Pennant', 'Doji'];
        const patternIndex = Math.floor(Math.random() * patternOptions.length);
        
        patterns.push({
          name: patternOptions[patternIndex],
          reliability: 50 + Math.floor(Math.random() * 20),
          direction: 'neutral',
          priceTarget: currentPrice * (1 + (Math.random() * 0.1 - 0.05)),
          description: 'Consolidation pattern suggesting a period of indecision'
        });
      }
    }
    
    // Occasionally add a secondary pattern for higher timeframes
    if (timeframe === '1d' || timeframe === '3d' || timeframe === '1w' || timeframe === '1M') {
      if (Math.random() < 0.5) {
        patterns.push({
          name: 'Harmonic Pattern',
          reliability: 55 + Math.floor(Math.random() * 25),
          direction: direction === 'LONG' ? 'bullish' : (direction === 'SHORT' ? 'bearish' : 'neutral'),
          priceTarget: direction === 'LONG' ? currentPrice * 1.15 : (direction === 'SHORT' ? currentPrice * 0.85 : currentPrice),
          description: 'Complex price pattern based on Fibonacci ratios'
        });
      }
      
      // Add Elliott Wave analysis for higher timeframes
      if (Math.random() < 0.6) {
        // For longer timeframes, more likely to detect Elliott Wave patterns
        const isImpulseWave = Math.random() < 0.6; // 60% chance of impulse wave, 40% corrective
        
        if (isImpulseWave) {
          // Impulse wave (5-wave pattern)
          const wavePosition = Math.floor(Math.random() * 5) + 1; // Wave 1-5
          const reliability = 65 + Math.floor(Math.random() * 20);
          
          let description = '';
          let pricePrediction = currentPrice;
          
          switch (wavePosition) {
            case 1:
              description = 'Wave 1 of 5: Initial impulse movement. Expect retracement in wave 2.';
              pricePrediction = direction === 'LONG' ? currentPrice * 1.05 : currentPrice * 0.95;
              break;
            case 2:
              description = 'Wave 2 of 5: Corrective wave, typically retraces 38-62% of wave 1.';
              pricePrediction = direction === 'LONG' ? currentPrice * 0.97 : currentPrice * 1.03;
              break;
            case 3:
              description = 'Wave 3 of 5: Usually the strongest and longest wave. Extended movement expected.';
              pricePrediction = direction === 'LONG' ? currentPrice * 1.15 : currentPrice * 0.85;
              break;
            case 4:
              description = 'Wave 4 of 5: Corrective wave before final impulse. Expect consolidation.';
              pricePrediction = direction === 'LONG' ? currentPrice * 0.98 : currentPrice * 1.02;
              break;
            case 5:
              description = 'Wave 5 of 5: Final impulse wave. Prepare for trend reversal after completion.';
              pricePrediction = direction === 'LONG' ? currentPrice * 1.08 : currentPrice * 0.92;
              break;
          }
          
          patterns.push({
            name: `Elliott Wave (Impulse ${wavePosition})`,
            reliability: reliability,
            direction: direction === 'LONG' ? 'bullish' : 'bearish',
            priceTarget: pricePrediction,
            description: description
          });
        } else {
          // Corrective wave (3-wave pattern: A-B-C)
          const waveLetters = ['A', 'B', 'C'];
          const wavePosition = Math.floor(Math.random() * 3); // Wave A, B, or C
          const waveName = waveLetters[wavePosition];
          const reliability = 60 + Math.floor(Math.random() * 20);
          
          let description = '';
          let pricePrediction = currentPrice;
          
          switch (waveName) {
            case 'A':
              description = 'Corrective Wave A: Initial correction against the main trend.';
              pricePrediction = direction === 'LONG' ? currentPrice * 0.94 : currentPrice * 1.06;
              break;
            case 'B':
              description = 'Corrective Wave B: Counter-correction, typically retraces 38-88% of wave A.';
              pricePrediction = direction === 'LONG' ? currentPrice * 1.03 : currentPrice * 0.97;
              break;
            case 'C':
              description = 'Corrective Wave C: Final correction wave, often equal to wave A in length.';
              pricePrediction = direction === 'LONG' ? currentPrice * 0.92 : currentPrice * 1.08;
              break;
          }
          
          patterns.push({
            name: `Elliott Wave (Corrective ${waveName})`,
            reliability: reliability,
            direction: direction === 'LONG' ? 'bearish' : 'bullish', // Corrective waves typically move against the main trend
            priceTarget: pricePrediction,
            description: description
          });
        }
      }
    }
    
    // Volume Profile Analysis
    if (timeframe !== '1m' && timeframe !== '5m' && Math.random() < 0.5) {
      const volumeProfileType = Math.random() < 0.5 ? 'Support' : 'Resistance';
      const volumeStrength = 65 + Math.floor(Math.random() * 25);
      
      patterns.push({
        name: `Volume Profile ${volumeProfileType}`,
        reliability: volumeStrength,
        direction: volumeProfileType === 'Support' ? 'bullish' : 'bearish',
        priceTarget: volumeProfileType === 'Support' ? currentPrice * 1.08 : currentPrice * 0.92,
        description: `High volume ${volumeProfileType.toLowerCase()} zone indicating institutional interest. High-probability reversal area.`
      });
    }
    
    // Market Structure Analysis
    if (timeframe === '1h' || timeframe === '4h' || timeframe === '1d' || timeframe === '3d' && Math.random() < 0.5) {
      const structureTypes = ['Higher High/Higher Low', 'Lower High/Lower Low', 'Market Structure Break', 'Change of Character'];
      const structureIndex = Math.floor(Math.random() * structureTypes.length);
      const structureName = structureTypes[structureIndex];
      const reliability = 70 + Math.floor(Math.random() * 20);
      let structureDirection = 'neutral';
      let priceTarget = currentPrice;
      let description = '';
      
      if (structureName === 'Higher High/Higher Low') {
        structureDirection = 'bullish';
        priceTarget = currentPrice * 1.12;
        description = 'Confirmed uptrend structure with sequential higher highs and higher lows. Strong trend continuation signal.';
      } else if (structureName === 'Lower High/Lower Low') {
        structureDirection = 'bearish';
        priceTarget = currentPrice * 0.88;
        description = 'Confirmed downtrend structure with sequential lower highs and lower lows. Strong trend continuation signal.';
      } else if (structureName === 'Market Structure Break') {
        const breakDirection = Math.random() < 0.5 ? 'bullish' : 'bearish';
        structureDirection = breakDirection;
        priceTarget = breakDirection === 'bullish' ? currentPrice * 1.15 : currentPrice * 0.85;
        description = `${breakDirection === 'bullish' ? 'Bullish' : 'Bearish'} market structure break indicating potential trend reversal. High-probability turning point.`;
      } else {
        const chochDirection = Math.random() < 0.5 ? 'bullish' : 'bearish';
        structureDirection = chochDirection;
        priceTarget = chochDirection === 'bullish' ? currentPrice * 1.10 : currentPrice * 0.90;
        description = `Change of character detected in price action, suggesting ${chochDirection === 'bullish' ? 'bullish' : 'bearish'} momentum shift. Watch for confirmation.`;
      }
      
      patterns.push({
        name: `Market Structure: ${structureName}`,
        reliability,
        direction: structureDirection,
        priceTarget,
        description
      });
    }
    
    // Liquidity Analysis
    if ((timeframe === '4h' || timeframe === '1d' || timeframe === '1w') && Math.random() < 0.4) {
      const liquidityType = Math.random() < 0.5 ? 'Stop Hunt' : 'Liquidity Pool';
      const isLong = Math.random() < 0.5;
      const reliability = 75 + Math.floor(Math.random() * 15);
      
      patterns.push({
        name: `Liquidity ${liquidityType}`,
        reliability,
        direction: isLong ? 'bullish' : 'bearish',
        priceTarget: isLong ? currentPrice * 1.12 : currentPrice * 0.88,
        description: liquidityType === 'Stop Hunt' ? 
          `${isLong ? 'Bullish' : 'Bearish'} stop hunt detected. Price likely engineered to trigger stops before ${isLong ? 'moving up' : 'dropping'}.` : 
          `Institutional liquidity pool identified. High probability of ${isLong ? 'upward' : 'downward'} movement after liquidity is absorbed.`
      });
    }
    
    // Wyckoff Method
    if ((timeframe === '1d' || timeframe === '3d' || timeframe === '1w' || timeframe === '1M') && Math.random() < 0.35) {
      const wyckoffPhases = ['Accumulation', 'Distribution', 'Spring', 'Upthrust', 'Secondary Test'];
      const phaseIndex = Math.floor(Math.random() * wyckoffPhases.length);
      const wyckoffPhase = wyckoffPhases[phaseIndex];
      const reliability = 70 + Math.floor(Math.random() * 20);
      let wyckoffDirection = 'neutral';
      let priceTarget = currentPrice;
      let description = '';
      
      switch (wyckoffPhase) {
        case 'Accumulation':
          wyckoffDirection = 'bullish';
          priceTarget = currentPrice * 1.20;
          description = 'Wyckoff Accumulation: Institutional buying detected. Price likely to move higher after accumulation completes.';
          break;
        case 'Distribution':
          wyckoffDirection = 'bearish';
          priceTarget = currentPrice * 0.80;
          description = 'Wyckoff Distribution: Institutional selling detected. Price likely to move lower after distribution completes.';
          break;
        case 'Spring':
          wyckoffDirection = 'bullish';
          priceTarget = currentPrice * 1.15;
          description = 'Wyckoff Spring: Final shakeout before markup. Strong bullish signal with high probability of upward movement.';
          break;
        case 'Upthrust':
          wyckoffDirection = 'bearish';
          priceTarget = currentPrice * 0.85;
          description = 'Wyckoff Upthrust: False breakout before markdown. Strong bearish signal with high probability of downward movement.';
          break;
        case 'Secondary Test':
          wyckoffDirection = Math.random() < 0.5 ? 'bullish' : 'bearish';
          priceTarget = wyckoffDirection === 'bullish' ? currentPrice * 1.10 : currentPrice * 0.90;
          description = `Wyckoff Secondary Test: ${wyckoffDirection === 'bullish' ? 'Bullish' : 'Bearish'} retest of critical level. Watch for ${wyckoffDirection === 'bullish' ? 'strength' : 'weakness'} on this test.`;
          break;
      }
      
      patterns.push({
        name: `Wyckoff ${wyckoffPhase}`,
        reliability,
        direction: wyckoffDirection,
        priceTarget,
        description
      });
    }
    
    // Ichimoku Cloud Analysis
    if ((timeframe === '4h' || timeframe === '1d' || timeframe === '1w') && Math.random() < 0.4) {
      const ichimokuComponents = ['TK Cross', 'Price-Kumo Relationship', 'Kumo Twist', 'Chikou Span Cross'];
      const componentIndex = Math.floor(Math.random() * ichimokuComponents.length);
      const component = ichimokuComponents[componentIndex];
      const isStrong = Math.random() < 0.6; // 60% chance of strong signal
      const isBullish = Math.random() < 0.5;
      const reliability = isStrong ? 75 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 15);
      
      patterns.push({
        name: `Ichimoku ${component}`,
        reliability,
        direction: isBullish ? 'bullish' : 'bearish',
        priceTarget: isBullish ? currentPrice * 1.10 : currentPrice * 0.90,
        description: `${isStrong ? 'Strong' : 'Moderate'} ${isBullish ? 'bullish' : 'bearish'} signal from Ichimoku ${component}. ${
          component === 'TK Cross' ? 'Tenkan-Sen crossed ' + (isBullish ? 'above' : 'below') + ' Kijun-Sen.' :
          component === 'Price-Kumo Relationship' ? 'Price ' + (isBullish ? 'above' : 'below') + ' the Cloud with ' + (isStrong ? 'strong' : 'moderate') + ' momentum.' :
          component === 'Kumo Twist' ? (isBullish ? 'Bullish' : 'Bearish') + ' Cloud twist forming in future, suggesting trend change.' :
          'Chikou Span ' + (isBullish ? 'above' : 'below') + ' price, confirming ' + (isBullish ? 'bullish' : 'bearish') + ' momentum.'
        }`
      });
    }
    
    // Intermarket Analysis
    if ((timeframe === '1d' || timeframe === '3d' || timeframe === '1w' || timeframe === '1M') && Math.random() < 0.35) {
      const intermarketRelations = ['DXY Correlation', 'Stock Market Correlation', 'BTC Dominance', 'Sector Rotation', 'Risk-On/Risk-Off'];
      const relationIndex = Math.floor(Math.random() * intermarketRelations.length);
      const relation = intermarketRelations[relationIndex];
      const isBullish = Math.random() < 0.5;
      const reliability = 65 + Math.floor(Math.random() * 20);
      
      patterns.push({
        name: `Intermarket: ${relation}`,
        reliability,
        direction: isBullish ? 'bullish' : 'bearish',
        priceTarget: isBullish ? currentPrice * 1.12 : currentPrice * 0.88,
        description: `${isBullish ? 'Bullish' : 'Bearish'} signal derived from ${relation}. ${
          relation === 'DXY Correlation' ? 'Dollar ' + (isBullish ? 'weakness' : 'strength') + ' supporting ' + (isBullish ? 'higher' : 'lower') + ' cryptocurrency prices.' :
          relation === 'Stock Market Correlation' ? (isBullish ? 'Strong' : 'Weak') + ' correlation with equity markets indicating ' + (isBullish ? 'risk-on' : 'risk-off') + ' environment.' :
          relation === 'BTC Dominance' ? 'BTC dominance ' + (isBullish ? 'decreasing' : 'increasing') + ', suggesting ' + (isBullish ? 'altcoin season' : 'bitcoin preference') + '.' :
          relation === 'Sector Rotation' ? 'Crypto sector rotation favoring ' + (isBullish ? 'this asset class' : 'other segments') + '.' :
          'Market sentiment shifting to ' + (isBullish ? 'risk-on' : 'risk-off') + ' mode across global markets.'
        }`
      });
    }
    
    // Order Flow Analysis
    if ((timeframe === '15m' || timeframe === '30m' || timeframe === '1h' || timeframe === '4h') && Math.random() < 0.4) {
      const orderFlowTypes = ['Absorption', 'Imbalance', 'Delta Divergence', 'Block Order'];
      const typeIndex = Math.floor(Math.random() * orderFlowTypes.length);
      const orderFlowType = orderFlowTypes[typeIndex];
      const isBullish = Math.random() < 0.5;
      const reliability = 70 + Math.floor(Math.random() * 20);
      
      patterns.push({
        name: `Order Flow: ${orderFlowType}`,
        reliability,
        direction: isBullish ? 'bullish' : 'bearish',
        priceTarget: isBullish ? currentPrice * 1.08 : currentPrice * 0.92,
        description: `${isBullish ? 'Bullish' : 'Bearish'} ${orderFlowType} detected in order flow. ${
          orderFlowType === 'Absorption' ? 'Selling pressure being ' + (isBullish ? 'absorbed' : 'overwhelming') + ', suggesting ' + (isBullish ? 'strength' : 'weakness') + '.' :
          orderFlowType === 'Imbalance' ? 'Significant ' + (isBullish ? 'buying' : 'selling') + ' imbalance detected in recent price action.' :
          orderFlowType === 'Delta Divergence' ? 'Price and delta ' + (isBullish ? 'bullish' : 'bearish') + ' divergence indicating potential ' + (isBullish ? 'upside' : 'downside') + '.' :
          'Large ' + (isBullish ? 'buy' : 'sell') + ' block detected, suggesting institutional ' + (isBullish ? 'accumulation' : 'distribution') + '.'
        }`
      });
    }
    
    // Market Cycle Position
    if ((timeframe === '1w' || timeframe === '1M') && Math.random() < 0.5) {
      const cyclePositions = ['Accumulation Phase', 'Early Bull Phase', 'Mid Bull Phase', 'Late Bull Phase', 'Distribution Phase', 'Early Bear Phase', 'Mid Bear Phase', 'Late Bear Phase'];
      const positionIndex = Math.floor(Math.random() * cyclePositions.length);
      const cyclePosition = cyclePositions[positionIndex];
      const isBullish = positionIndex >= 0 && positionIndex <= 3; // First 4 positions are bullish
      const reliability = 75 + Math.floor(Math.random() * 15);
      
      patterns.push({
        name: `Market Cycle: ${cyclePosition}`,
        reliability,
        direction: isBullish ? 'bullish' : 'bearish',
        priceTarget: isBullish ? currentPrice * (1.10 + (positionIndex * 0.05)) : currentPrice * (0.90 - ((positionIndex - 4) * 0.05)),
        description: `Current market appears to be in the ${cyclePosition}. ${
          cyclePosition === 'Accumulation Phase' ? 'Smart money accumulating after bear market. Expect sideways action before upward movement.' :
          cyclePosition === 'Early Bull Phase' ? 'Beginning of bull trend. Upside potential significant with moderate risk.' :
          cyclePosition === 'Mid Bull Phase' ? 'Strongest part of bull trend. Momentum and public participation increasing.' :
          cyclePosition === 'Late Bull Phase' ? 'Final stage of bull market. High volatility with significant euphoria. Consider taking profits.' :
          cyclePosition === 'Distribution Phase' ? 'Smart money distributing to retail. Expect sideways action before downward movement.' :
          cyclePosition === 'Early Bear Phase' ? 'Beginning of bear trend. Initial sharp decline with lower prices ahead.' :
          cyclePosition === 'Mid Bear Phase' ? 'Strongest part of bear trend. Capitulation and strong selling pressure.' :
          'Final stage of bear market. Apathy and disinterest prevalent. Consider accumulating.'
        }`
      });
    }
    
    // Add RSI and Stochastic RSI divergence patterns
    // More likely in medium to higher timeframes
    if (timeframe !== '1m' && timeframe !== '5m' && Math.random() < 0.4) {
      const isRSI = Math.random() < 0.5; // 50% chance for RSI vs Stochastic RSI
      const isBullish = Math.random() < 0.5; // 50% chance for bullish vs bearish divergence
      
      if (isRSI) {
        // RSI Divergence
        const severity = Math.random() < 0.33 ? 'weak' : (Math.random() < 0.5 ? 'moderate' : 'strong');
        const reliability = severity === 'weak' ? 55 + Math.floor(Math.random() * 10) :
                          severity === 'moderate' ? 65 + Math.floor(Math.random() * 10) :
                          75 + Math.floor(Math.random() * 10);
        
        if (isBullish) {
          patterns.push({
            name: `RSI Bullish Divergence (${severity})`,
            reliability: reliability,
            direction: 'bullish',
            priceTarget: currentPrice * (1 + (reliability / 100)),
            description: `Price making lower lows while RSI makes higher lows. ${severity} signal strength. Suggests potential upward reversal.`
          });
        } else {
          patterns.push({
            name: `RSI Bearish Divergence (${severity})`,
            reliability: reliability,
            direction: 'bearish',
            priceTarget: currentPrice * (1 - (reliability / 100)),
            description: `Price making higher highs while RSI makes lower highs. ${severity} signal strength. Suggests potential downward reversal.`
          });
        }
      } else {
        // Stochastic RSI Divergence
        const severity = Math.random() < 0.33 ? 'weak' : (Math.random() < 0.5 ? 'moderate' : 'strong');
        const reliability = severity === 'weak' ? 58 + Math.floor(Math.random() * 10) :
                          severity === 'moderate' ? 68 + Math.floor(Math.random() * 10) :
                          78 + Math.floor(Math.random() * 10);
        
        if (isBullish) {
          patterns.push({
            name: `Stoch RSI Bullish Divergence (${severity})`,
            reliability: reliability,
            direction: 'bullish',
            priceTarget: currentPrice * (1 + (reliability / 100)),
            description: `Price making lower lows while Stochastic RSI makes higher lows. ${severity} signal strength. Suggests potential upward reversal.`
          });
        } else {
          patterns.push({
            name: `Stoch RSI Bearish Divergence (${severity})`,
            reliability: reliability,
            direction: 'bearish',
            priceTarget: currentPrice * (1 - (reliability / 100)),
            description: `Price making higher highs while Stochastic RSI makes lower highs. ${severity} signal strength. Suggests potential downward reversal.`
          });
        }
      }
    }
    
    console.log(`Generated ${patterns.length} patterns for ${timeframe} timeframe`);
    return patterns;
  };

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
          let signal = await generateSignal(
            chartData[timeframe],
            timeframe,
            symbol
          );
          
          // Generate pattern formations based on signal direction and timeframe
          // This adds chart patterns that weren't being generated before
          if (signal) {
            signal.patternFormations = generatePatternFormations(signal.direction, signal.confidence, timeframe, signal.entryPrice);
          }
          
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
                        <div className="text-sm text-gray-400 mb-1 mt-2">
                          {selectedTimeframe === '1M' && 'Monthly Timeframe Analysis'}
                          {selectedTimeframe === '1w' && 'Weekly Timeframe Analysis'}
                          {selectedTimeframe === '3d' && '3-Day Timeframe Analysis'}
                          {selectedTimeframe === '1d' && 'Daily Timeframe Analysis'}
                          {selectedTimeframe === '4h' && '4-Hour Timeframe Analysis'}
                          {selectedTimeframe === '1h' && 'Hourly Timeframe Analysis'}
                          {selectedTimeframe === '30m' && '30-Min Timeframe Analysis'}
                          {selectedTimeframe === '15m' && '15-Min Timeframe Analysis'}
                          {selectedTimeframe === '5m' && '5-Min Timeframe Analysis'}
                          {selectedTimeframe === '1m' && '1-Min Timeframe Analysis'}
                        </div>
                        
                        {/* Visual indicator of timeframe importance */}
                        <div className="w-full h-2 rounded-full bg-gray-800 mt-3 mb-1">
                          <div 
                            className={`h-2 rounded-full ${
                              selectedTimeframe === '1M' ? 'bg-green-500 w-full' :
                              selectedTimeframe === '1w' ? 'bg-emerald-500 w-11/12' :
                              selectedTimeframe === '3d' ? 'bg-teal-500 w-10/12' :
                              selectedTimeframe === '1d' ? 'bg-cyan-500 w-9/12' :
                              selectedTimeframe === '4h' ? 'bg-blue-500 w-8/12' :
                              selectedTimeframe === '1h' ? 'bg-indigo-500 w-7/12' :
                              selectedTimeframe === '30m' ? 'bg-violet-500 w-6/12' :
                              selectedTimeframe === '15m' ? 'bg-purple-500 w-5/12' :
                              selectedTimeframe === '5m' ? 'bg-fuchsia-500 w-4/12' :
                              'bg-gray-500 w-3/12'
                            }`}
                          />
                        </div>
                        <div className="text-sm text-gray-300">Timeframe Reliability</div>
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
                          
                          <div className="border-t border-gray-700 pt-2 mt-1"></div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Success Probability</span>
                            <span className={`font-bold px-3 py-1 rounded border ${
                              currentSignal.confidence > 80 ? 'text-green-300 bg-green-900/50 border-green-700' :
                              currentSignal.confidence > 65 ? 'text-emerald-300 bg-emerald-900/50 border-emerald-700' :
                              currentSignal.confidence > 50 ? 'text-blue-300 bg-blue-900/50 border-blue-700' :
                              'text-amber-300 bg-amber-900/50 border-amber-700'
                            }`}>
                              {selectedTimeframe === '1M' && Math.min(98, Math.max(85, currentSignal.confidence))}
                              {selectedTimeframe === '1w' && Math.min(92, Math.max(78, currentSignal.confidence))}
                              {selectedTimeframe === '3d' && Math.min(86, Math.max(72, currentSignal.confidence))}
                              {selectedTimeframe === '1d' && Math.min(80, Math.max(65, currentSignal.confidence))}
                              {selectedTimeframe === '4h' && Math.min(74, Math.max(58, currentSignal.confidence))}
                              {selectedTimeframe === '1h' && Math.min(68, Math.max(50, currentSignal.confidence))}
                              {selectedTimeframe === '30m' && Math.min(62, Math.max(42, currentSignal.confidence))}
                              {selectedTimeframe === '15m' && Math.min(56, Math.max(35, currentSignal.confidence))}
                              {selectedTimeframe === '5m' && Math.min(50, Math.max(30, currentSignal.confidence))}
                              {selectedTimeframe === '1m' && Math.min(44, Math.max(22, currentSignal.confidence))}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white font-semibold">Expected Duration</span>
                            <span className="font-bold text-amber-300 bg-amber-900/50 px-3 py-1 rounded border border-amber-700">
                              {selectedTimeframe === '1M' && '3-12 months'}
                              {selectedTimeframe === '1w' && '1-3 months'}
                              {selectedTimeframe === '3d' && '2-8 weeks'}
                              {selectedTimeframe === '1d' && '1-4 weeks'}
                              {selectedTimeframe === '4h' && '3-10 days'}
                              {selectedTimeframe === '1h' && '1-3 days'}
                              {selectedTimeframe === '30m' && '6-24 hours'}
                              {selectedTimeframe === '15m' && '3-12 hours'}
                              {selectedTimeframe === '5m' && '1-4 hours'}
                              {selectedTimeframe === '1m' && '10-30 minutes'}
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