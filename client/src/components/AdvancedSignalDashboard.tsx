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
import { getSecondsUntilNextRefresh, getFormattedCountdown } from '../lib/finalPriceSystem';
import { getTimeframeSuccessProbability } from '../lib/timeframeSuccessProbability';
import { getCurrentMoonPhase, getMoonPhaseEmoji } from '../lib/moonPhase';
import { useCentralizedPrice } from '../lib/centralizedPriceManager';
import UnifiedPerformancePanel from './UnifiedPerformancePanel';
import { UnifiedMarketPanel } from './UnifiedMarketPanel';
import { SignalHeatMap } from './SignalHeatMap';
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
import { calculateOptimizedSignal, OptimizedSignalResult } from '../lib/optimizedTechnicalEngine';

import { generateStreamlinedSignal } from '../lib/streamlinedCalculationEngine';
import { recordPrediction, updateWithLivePrice, getActivePredictions } from '../lib/liveAccuracyTracker';
import { unifiedCalculationCore } from '../lib/unifiedCalculationCore';
import { 
  calculateEnhancedConfidence, 
  calculateSupportResistanceAdvanced,
  generatePriceLevels,
  analyzeMarketStructure
} from '../lib/enhancedSignalProcessing';
import { ultimateSystemManager } from '../lib/ultimateSystemManager';

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
  onAnalysisComplete?: () => void;
}

export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect, 
  onAnalysisComplete 
}: AdvancedSignalDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({
    '1m': null, '5m': null, '15m': null, '30m': null, '1h': null, '4h': null, 
    '12h': null, '1d': null, '3d': null, '1w': null, '1M': null
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  const [timeUntilNextCalc, setTimeUntilNextCalc] = useState(240);
  const [realAccuracy, setRealAccuracy] = useState({
    percentage: 0,
    correct: 0,
    total: 0,
    activeTrades: 0
  });

  const lastCalculationRef = useRef<number>(0);
  const calculationTriggeredRef = useRef<boolean>(false);
  const { toast } = useToast();
  
  // Use centralized price management
  const { centralizedPrice, asset, change24h } = useCentralizedPrice(symbol);
  const currentAssetPrice = centralizedPrice;

  // Chart data query
  const { data: chartData } = useQuery({
    queryKey: [`/api/technical-analysis/${encodeURIComponent(symbol)}`],
    refetchInterval: 30000
  });

  // Real-time accuracy tracking
  const { data: accuracyData } = useQuery({
    queryKey: [`/api/accuracy/${symbol.replace('/', '/').replace('/', '%2F')}`],
    refetchInterval: 5000
  });

  useEffect(() => {
    if (accuracyData) {
      setRealAccuracy(accuracyData);
    }
  }, [accuracyData]);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      const secondsUntilNext = getSecondsUntilNextRefresh();
      setTimeUntilNextCalc(secondsUntilNext);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Event listeners for synchronized calculations
  useEffect(() => {
    const handleSynchronizedCalculationEvent = (event: CustomEvent) => {
      if (event.detail?.symbol === symbol) {
        console.log(`[SignalDashboard] Received synchronized calculation event for ${symbol}`);
        const timeUntilNext = getSecondsUntilNextRefresh();
        if (timeUntilNext > 235) {
          console.log(`[SignalDashboard] Data ready for ${symbol} but calculation blocked by 4-minute timer (${timeUntilNext}s remaining)`);
          return;
        }
        performCalculation();
      }
    };

    const handlePriceUpdate = (event: CustomEvent) => {
      if (event.detail?.symbol === symbol) {
        console.log(`[AdvancedSignalDashboard] Centralized price update for ${symbol}: $${event.detail.price}`);
        const timeUntilNext = getSecondsUntilNextRefresh();
        if (timeUntilNext > 235) {
          console.log(`[SignalDashboard] Data ready for ${symbol} but calculation blocked by 4-minute timer (${timeUntilNext}s remaining)`);
          return;
        }
      }
    };

    const handleUltimateSystemTrigger = (event: CustomEvent) => {
      const { symbol: eventSymbol, action } = event.detail || {};
      if (eventSymbol === symbol && action === 'calculate') {
        console.log(`[SignalDashboard] Ultimate system trigger for ${symbol}`);
        performCalculation();
      }
    };

    document.addEventListener('synchronized-calculation', handleSynchronizedCalculationEvent as EventListener);
    document.addEventListener('centralized-price-update', handlePriceUpdate as EventListener);
    document.addEventListener('ultimate-system-trigger', handleUltimateSystemTrigger as EventListener);

    return () => {
      document.removeEventListener('synchronized-calculation', handleSynchronizedCalculationEvent as EventListener);
      document.removeEventListener('centralized-price-update', handlePriceUpdate as EventListener);
      document.removeEventListener('ultimate-system-trigger', handleUltimateSystemTrigger as EventListener);
    };
  }, [symbol]);

  // Main calculation function
  const performCalculation = useCallback(async () => {
    if (isCalculating || calculationTriggeredRef.current) {
      console.log(`[SignalDashboard] Calculation already in progress for ${symbol}, skipping`);
      return;
    }

    if (!chartData?.success || !chartData?.data) {
      console.log(`[SignalDashboard] No chart data available for ${symbol}, skipping calculation`);
      return;
    }

    try {
      calculationTriggeredRef.current = true;
      setIsCalculating(true);
      console.log(`[SignalDashboard] Starting comprehensive calculation for ${symbol}`);

      const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d', '3d', '1w', '1M'];
      const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };

      // Calculate signals for each timeframe with staggered delays
      const calculateTimeframe = async (timeframe: TimeFrame, delay: number = 0) => {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
          const optimizedResult = await calculateOptimizedSignal(symbol, timeframe, chartData.data);
          if (optimizedResult?.success && optimizedResult.signal) {
            newSignals[timeframe] = optimizedResult.signal;
            console.log(`📊 Enhanced signal calculated for ${symbol} ${timeframe}: ${optimizedResult.signal.direction} @ ${optimizedResult.signal.confidence}%`);
          }
        } catch (error) {
          console.error(`[SignalDashboard] Error calculating ${timeframe} signal:`, error);
        }
      };

      // Process timeframes in parallel with small delays
      await Promise.all([
        calculateTimeframe('1m', 0),
        calculateTimeframe('5m', 50),
        calculateTimeframe('15m', 100),
        calculateTimeframe('30m', 150),
        calculateTimeframe('1h', 200),
        calculateTimeframe('4h', 250),
        calculateTimeframe('12h', 300),
        calculateTimeframe('1d', 350),
        calculateTimeframe('3d', 400),
        calculateTimeframe('1w', 450),
        calculateTimeframe('1M', 500)
      ]);

      // Update signals state
      const alignedSignals = alignSignalsWithTimeframeHierarchy(newSignals);
      setSignals(alignedSignals);
      console.log('📊 setSignals call completed successfully');

      // Record predictions for accuracy tracking
      console.log(`Recording predictions using fresh fetched price: ${currentAssetPrice}`);
      Object.entries(alignedSignals).forEach(([tf, signal]) => {
        if (signal && signal.direction !== 'NEUTRAL') {
          recordPrediction(symbol, tf as TimeFrame, signal, currentAssetPrice);
          console.log(`Recorded prediction: ${tf} ${signal.direction} @ ${currentAssetPrice}`);
        }
      });

      lastCalculationRef.current = Date.now();

      // Dispatch calculation complete event
      document.dispatchEvent(new CustomEvent('synchronized-calculation', {
        detail: { symbol, timestamp: Date.now(), signalCount: Object.values(alignedSignals).filter(s => s !== null).length }
      }));

      // Count valid signals for logging
      const validSignalCount = Object.values(alignedSignals).filter(s => s !== null).length;

      // Show visual notification for auto-calculations
      if (validSignalCount > 0) {
        toast({
          title: "Auto-Calculation Complete",
          description: `Updated ${validSignalCount} signals for ${symbol} at ${new Date().toLocaleTimeString()}`,
          variant: "default", 
          duration: 10000
        });
      }
      console.log(`Found ${validSignalCount} valid signals for recommendation for ${symbol}`);

      // Generate a recommendation from the signals if we have enough data
      if (validSignalCount > 0) {
        console.log(`Updating trade recommendation for 4h timeframe`);
        const recommendation = generateTradeRecommendation('4h');
        setRecommendation(recommendation);
      }

      console.log(`Calculation process complete for ${symbol} - ${validSignalCount} signals generated`);
    } catch (error) {
      console.error('[SignalDashboard] Calculation process error:', error);
      setIsCalculating(false);
    } finally {
      setIsCalculating(false);
      calculationTriggeredRef.current = false;
    }
  }, [chartData, isCalculating, signals, symbol, currentAssetPrice, toast]);

  // Generate a trade recommendation based on signals across timeframes
  const generateTradeRecommendation = useCallback((timeframe: TimeFrame) => {
    const currentTimeframe = timeframe || selectedTimeframe;
    const signal = signals[currentTimeframe];

    if (!signal) {
      console.log(`No signal available for ${symbol} on ${currentTimeframe}`);
      return null;
    }

    return {
      symbol,
      timeframe: currentTimeframe,
      direction: signal.direction,
      confidence: signal.confidence,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      reasoning: `${signal.direction} signal on ${currentTimeframe} with ${signal.confidence}% confidence`,
      timestamp: Date.now()
    };
  }, [signals, selectedTimeframe, symbol]);

  const updateRecommendationForTimeframe = useCallback((timeframe: TimeFrame) => {
    const newRecommendation = generateTradeRecommendation(timeframe);
    setRecommendation(newRecommendation);
  }, [generateTradeRecommendation]);

  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [updateRecommendationForTimeframe, onTimeframeSelect]);

  // Format price for display
  function formatCurrency(price: number): string {
    if (price === 0) return 'N/A';
    if (price < 0.01) return price.toFixed(6);
    if (price < 0.1) return price.toFixed(5);
    if (price < 1) return price.toFixed(4);
    if (price < 10) return price.toFixed(3);
    if (price < 1000) return price.toFixed(2);
    if (price < 10000) return price.toFixed(1);
    return Math.round(price).toString();
  }

  // Get appropriate CSS classes for signal background
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
            <>
              <Badge variant="outline" className="text-xs bg-green-900/20 text-green-400 border-green-800 px-3 py-1">
                Auto-calculations active
              </Badge>
              <Badge variant="outline" className="text-xs bg-purple-900/20 text-purple-400 border-purple-800 px-3 py-1">
                Next: {Math.floor(timeUntilNextCalc / 60)}:{(timeUntilNextCalc % 60).toString().padStart(2, '0')}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Unified Market Panel - Consolidates 4 separate components */}
      <UnifiedMarketPanel
        symbol={symbol}
        selectedTimeframe={selectedTimeframe}
        signals={signals}
        currentAssetPrice={currentAssetPrice}
        change24h={change24h || 0}
        realAccuracy={realAccuracy}
        isCalculating={isCalculating}
      />

      {/* Signal Heatmap */}
      <SignalHeatMap 
        symbol={symbol} 
        selectedTimeframe={selectedTimeframe} 
        signals={signals} 
      />

      {/* Performance Panel */}
      <Card className="border border-gray-700 bg-gradient-to-b from-gray-900/80 to-gray-950/90 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            📊 Performance Analytics
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-2 py-0.5 text-xs">
              ENHANCED
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-300 text-sm">
            Real-time performance metrics and accuracy tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <UnifiedPerformancePanel symbol={symbol} selectedTimeframe={selectedTimeframe} signals={signals} />
        </CardContent>
        
        <CardFooter className="text-xs text-gray-500 pt-2">
          Data updated {lastCalculationRef.current > 0 ? new Date(lastCalculationRef.current).toLocaleTimeString() : 'never'} 
          • Timeframe data from market sources
        </CardFooter>
      </Card>
    </div>
  );
}