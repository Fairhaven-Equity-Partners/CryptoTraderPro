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

const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{label}:</span>
      <span className={`text-sm font-bold ${colorClass}`}>${formatCurrency(value || 0)}</span>
    </div>
  );
});

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect 
}: AdvancedSignalDashboardProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<TimeFrame>('4h');
  const [lastCalculationTime, setLastCalculationTime] = useState<Date | null>(null);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [tradeRecommendation, setTradeRecommendation] = useState<TradeRecommendation | null>(null);
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as Record<TimeFrame, AdvancedSignal | null>);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: priceData, isLoading: priceLoading } = useMarketData(symbol);
  
  // Fetch signals data from the server
  const { data: signalData, isLoading: signalsLoading, refetch: refetchSignals } = useQuery({
    queryKey: ['signals', symbol],
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
  
  // Process incoming price updates in real time
  useEffect(() => {
    const handleLivePriceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.symbol === symbol && event.detail.price) {
        // First, check if we have any signals loaded
        if (Object.keys(signals).length === 0) {
          console.log("💯 IMMEDIATE CALCULATION TRIGGERED for", symbol, "with price", event.detail.price);
          calculateSignalsForAllTimeframes();
        }
      }
    };

    // Listen for price updates
    window.addEventListener('priceUpdate' as any, handleLivePriceUpdate);
    
    return () => {
      window.removeEventListener('priceUpdate' as any, handleLivePriceUpdate);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [symbol, signals]);
  
  // Initial signal calculation
  useEffect(() => {
    calculateSignalsForAllTimeframes();
    
    // Set up auto-refresh every 90 seconds
    const refreshInterval = setInterval(() => {
      const now = new Date();
      console.log(`Scheduled signal refresh at ${now.toLocaleTimeString()}`);
      calculateSignalsForAllTimeframes();
    }, 90000);
    
    return () => clearInterval(refreshInterval);
  }, [symbol]);
  
  // Calculate signals for all timeframes
  const calculateSignalsForAllTimeframes = async () => {
    setIsPending(true);
    try {
      // Placeholder for API call to calculate signals
      console.log(`Calculating signals for ${symbol} across all timeframes`);
      
      // In a production app, these signals would come from a real API
      const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
      const newSignals: Record<TimeFrame, AdvancedSignal | null> = {} as Record<TimeFrame, AdvancedSignal | null>;
      
      // For demonstration purposes only 
      // We'll generate signals for all timeframes to simulate the real calculation
      for (const timeframe of timeframes) {
        const calculatedSignal = await generateSignal(symbol, timeframe);
        if (calculatedSignal) {
          newSignals[timeframe] = calculatedSignal;
        }
      }
      
      // Store the calculated signals
      setSignals(newSignals);
      
      // Calculate trade recommendation based on the signals
      const recommendation = generateTradeRecommendation(activeTimeframe);
      setTradeRecommendation(recommendation);
      
      // Track calculation times
      const now = new Date();
      setLastCalculationTime(now);
      
      const nextUpdate = new Date(now.getTime() + 90000); // 90 seconds
      setNextUpdateTime(nextUpdate);
      
      // Set up countdown timer
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      
      setCountdown(90);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error calculating signals:", error);
    } finally {
      setIsPending(false);
    }
  };
  
  // Generate the trade recommendation based on all available signals
  const generateTradeRecommendation = useCallback((timeframe: TimeFrame) => {
    if (!signals || Object.keys(signals).length === 0) {
      return null;
    }
    
    // Get the available timeframes that have signals
    const availableTimeframes = Object.keys(signals).filter(
      tf => signals[tf as TimeFrame] !== null
    ) as TimeFrame[];
    
    if (availableTimeframes.length === 0) {
      return null;
    }
    
    console.log(`Found ${availableTimeframes.length} valid signals for recommendation for ${symbol}`);
    
    // Get the primary signal for the selected timeframe
    const primarySignal = signals[timeframe];
    
    if (!primarySignal) {
      return null;
    }
    
    console.log(`Updating trade recommendation for ${timeframe} timeframe`);
    
    // Find the most influential indicators for this recommendation
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      const indicators: string[] = [];
      
      // Add indicators based on what influenced this signal most
      if (primarySignal.indicators.rsi && primarySignal.indicators.rsi > 70) {
        indicators.push('RSI Overbought');
      } else if (primarySignal.indicators.rsi && primarySignal.indicators.rsi < 30) {
        indicators.push('RSI Oversold');
      }
      
      if (primarySignal.indicators.macd && primarySignal.indicators.macd.histogram > 0 && 
          primarySignal.indicators.macd.value > primarySignal.indicators.macd.signal) {
        indicators.push('MACD Bullish Crossover');
      } else if (primarySignal.indicators.macd && primarySignal.indicators.macd.histogram < 0 && 
                primarySignal.indicators.macd.value < primarySignal.indicators.macd.signal) {
        indicators.push('MACD Bearish Crossover');
      }
      
      // Add a pattern if available
      if (primarySignal.patternFormations && primarySignal.patternFormations.length > 0) {
        indicators.push(primarySignal.patternFormations[0].name);
      }
      
      // Add a support/resistance level if price is near one
      if (primarySignal.supportResistance && primarySignal.supportResistance.length > 0) {
        const nearbyLevel = primarySignal.supportResistance.find(level => 
          Math.abs(level.price - primarySignal.entryPrice) / primarySignal.entryPrice < 0.02
        );
        if (nearbyLevel) {
          indicators.push(`Near ${nearbyLevel.type} level`);
        }
      }
      
      // Ensure we return at least some indicators
      if (indicators.length < 2) {
        if (primarySignal.direction === 'LONG') {
          indicators.push('Bullish momentum');
        } else if (primarySignal.direction === 'SHORT') {
          indicators.push('Bearish momentum');
        } else {
          indicators.push('Consolidation');
        }
      }
      
      return indicators.slice(0, 3); // Return top 3 indicators
    };
    
    // Generate a human-readable summary of the recommendation
    const generateSummary = (signal: AdvancedSignal): string => {
      let summary = '';
      
      if (signal.direction === 'LONG') {
        summary = `Bullish signal on ${symbol} (${timeframe}) with ${signal.confidence}% confidence. `;
        summary += `Entry at $${formatCurrency(signal.entryPrice)} with stop loss at $${formatCurrency(signal.stopLoss)}. `;
        summary += `Target price: $${formatCurrency(signal.takeProfit)}. `;
        summary += `Recommended leverage: ${signal.recommendedLeverage}x.`;
      } else if (signal.direction === 'SHORT') {
        summary = `Bearish signal on ${symbol} (${timeframe}) with ${signal.confidence}% confidence. `;
        summary += `Entry at $${formatCurrency(signal.entryPrice)} with stop loss at $${formatCurrency(signal.stopLoss)}. `;
        summary += `Target price: $${formatCurrency(signal.takeProfit)}. `;
        summary += `Recommended leverage: ${signal.recommendedLeverage}x.`;
      } else {
        summary = `Neutral outlook for ${symbol} (${timeframe}). No clear trading opportunity at this time. `;
        summary += `Current price: $${formatCurrency(signal.entryPrice)}. `;
        summary += `Consider waiting for a clearer signal to develop.`;
      }
      
      return summary;
    };
    
    // Build the recommendation object
    const recommendation: TradeRecommendation = {
      symbol,
      direction: primarySignal.direction,
      confidence: primarySignal.confidence,
      timeframeSummary: availableTimeframes.map(tf => ({
        timeframe: tf,
        confidence: signals[tf]?.confidence || 0,
        direction: signals[tf]?.direction || 'NEUTRAL'
      })),
      entry: {
        ideal: primarySignal.entryPrice,
        range: [
          primarySignal.entryPrice * 0.99,
          primarySignal.entryPrice * 1.01
        ]
      },
      exit: {
        takeProfit: [
          primarySignal.takeProfit * 0.7,
          primarySignal.takeProfit * 0.85,
          primarySignal.takeProfit
        ],
        stopLoss: primarySignal.stopLoss,
        trailingStopActivation: (primarySignal.takeProfit + primarySignal.entryPrice) / 2,
        trailingStopPercent: 1.5
      },
      leverage: {
        conservative: Math.max(1, Math.floor(primarySignal.recommendedLeverage * 0.5)),
        moderate: primarySignal.recommendedLeverage,
        aggressive: Math.ceil(primarySignal.recommendedLeverage * 1.5),
        recommendation: `${primarySignal.recommendedLeverage}x leverage recommended based on volatility and risk assessment`
      },
      riskManagement: {
        positionSizeRecommendation: '2% of account balance',
        maxRiskPercentage: 1.5,
        potentialRiskReward: primarySignal.direction === 'NEUTRAL' ? 1 : 
          (Math.abs(primarySignal.takeProfit - primarySignal.entryPrice) / 
           Math.abs(primarySignal.stopLoss - primarySignal.entryPrice)),
        winProbability: primarySignal.confidence / 100
      },
      keyIndicators: findInfluentialIndicators(primarySignal),
      summary: generateSummary(primarySignal)
    };
    
    return recommendation;
  }, [symbol, signals]);
  
  // Update the recommendation when the active timeframe changes
  const updateRecommendationForTimeframe = useCallback((timeframe: TimeFrame) => {
    const recommendation = generateTradeRecommendation(timeframe);
    setTradeRecommendation(recommendation);
  }, [generateTradeRecommendation]);
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setActiveTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    
    // Call the parent's onTimeframeSelect callback if provided
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [updateRecommendationForTimeframe, onTimeframeSelect]);
  
  // Helper functions for formatting and display
  function formatCurrency(price: number): string {
    if (isNaN(price) || price === undefined || price === null) return "N/A";
    
    // Format based on the price range
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toFixed(0);
  }
  
  function getSignalBgClass(direction: string): string {
    if (direction === 'LONG') return 'bg-green-500';
    if (direction === 'SHORT') return 'bg-red-500';
    return 'bg-gray-400';
  }
  
  // Get the current signal for the active timeframe
  const currentSignal = signals[activeTimeframe] || null;
  
  // Manually create support and resistance levels if they're not available
  const supportLevels = [
    { level: 'Strong', price: (currentSignal?.entryPrice || 0) * 0.97 },
    { level: 'Medium', price: (currentSignal?.entryPrice || 0) * 0.95 },
    { level: 'Weak', price: (currentSignal?.entryPrice || 0) * 0.92 }
  ];
  
  const resistanceLevels = [
    { level: 'Weak', price: (currentSignal?.entryPrice || 0) * 1.03 },
    { level: 'Medium', price: (currentSignal?.entryPrice || 0) * 1.05 },
    { level: 'Strong', price: (currentSignal?.entryPrice || 0) * 1.08 }
  ];
  
  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Timeframe selector tabs */}
      <div className="w-full">
        <Tabs defaultValue={activeTimeframe} className="w-full" onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Market Analysis: {symbol}
              </h2>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={isPending}
                  onClick={() => calculateSignalsForAllTimeframes()}
                >
                  <RefreshCcw className="mr-1 h-3 w-3" />
                  Refresh
                </Button>
              </div>
            </div>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 h-auto">
              <TabsTrigger value="1m" className="text-xs">1m</TabsTrigger>
              <TabsTrigger value="5m" className="text-xs">5m</TabsTrigger>
              <TabsTrigger value="15m" className="text-xs">15m</TabsTrigger>
              <TabsTrigger value="30m" className="text-xs">30m</TabsTrigger>
              <TabsTrigger value="1h" className="text-xs">1h</TabsTrigger>
              <TabsTrigger value="4h" className="text-xs">4h</TabsTrigger>
              <TabsTrigger value="1d" className="text-xs">1d</TabsTrigger>
              <TabsTrigger value="3d" className="text-xs">3d</TabsTrigger>
              <TabsTrigger value="1w" className="text-xs">1w</TabsTrigger>
              <TabsTrigger value="1M" className="text-xs">1M</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab content for each timeframe */}
          {(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'] as TimeFrame[]).map((tf) => (
            <TabsContent key={tf} value={tf} className="space-y-4 mt-2">
              {/* Signal analysis card */}
              <Card className="border-none shadow-md backdrop-blur-xl bg-black/80">
                <CardContent className="p-4">
                  {/* Main signal display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left column - Signal overview */}
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-white">Signal: {tf}</h3>
                          {isPending && <div className="animate-spin">⟳</div>}
                        </div>
                        <div>
                          {currentSignal?.direction === 'LONG' && 
                            <Badge className="bg-green-600" variant="outline">
                              <ArrowUpRight className="mr-1 h-3 w-3" />
                              LONG
                            </Badge>
                          }
                          {currentSignal?.direction === 'SHORT' && 
                            <Badge className="bg-red-600" variant="outline">
                              <ArrowDownRight className="mr-1 h-3 w-3" />
                              SHORT
                            </Badge>
                          }
                          {currentSignal?.direction === 'NEUTRAL' && 
                            <Badge className="bg-gray-600" variant="outline">
                              <Minus className="mr-1 h-3 w-3" />
                              NEUTRAL
                            </Badge>
                          }
                        </div>
                      </div>
                      
                      {/* Success probability */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-300">Success Probability:</span>
                          <span className="text-sm font-bold">
                            {currentSignal?.direction === 'NEUTRAL' 
                              ? "50% (Balanced)" 
                              : `${currentSignal?.confidence || 0}%`
                            }
                          </span>
                        </div>
                        <Progress 
                          value={currentSignal?.direction === 'NEUTRAL' ? 50 : currentSignal?.confidence} 
                          className={`h-2 ${
                            currentSignal?.direction === 'LONG' 
                              ? 'bg-green-900' 
                              : currentSignal?.direction === 'SHORT' 
                                ? 'bg-red-900' 
                                : 'bg-gray-700'
                          }`}
                          indicatorClassName={
                            currentSignal?.direction === 'LONG' 
                              ? 'bg-green-500' 
                              : currentSignal?.direction === 'SHORT' 
                                ? 'bg-red-500' 
                                : 'bg-gray-400'
                          }
                        />
                      </div>
                      
                      {/* Key price levels */}
                      <div className="space-y-2 mt-2">
                        <h4 className="text-sm font-semibold text-gray-300">Key Price Levels</h4>
                        <div className="grid grid-cols-1 gap-1">
                          <PriceLevelDisplay 
                            label="Entry Price" 
                            value={currentSignal?.entryPrice} 
                            timeframe={tf}
                            colorClass="text-white"
                          />
                          <PriceLevelDisplay 
                            label="Stop Loss" 
                            value={currentSignal?.stopLoss} 
                            timeframe={tf}
                            colorClass="text-red-400"
                          />
                          <PriceLevelDisplay 
                            label="Take Profit" 
                            value={currentSignal?.takeProfit} 
                            timeframe={tf}
                            colorClass="text-green-400"
                          />
                        </div>
                      </div>
                      
                      {/* Risk and reward */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-300">Risk Management</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-gray-500">Recommended Leverage</p>
                            <p className="text-base font-bold">
                              {currentSignal?.recommendedLeverage || 1}x
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Risk Level</p>
                            <p className="text-base font-bold">
                              {currentSignal?.direction === 'NEUTRAL' 
                                ? 'LOW' 
                                : currentSignal?.riskLevel || 'MEDIUM'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right column - Price levels and key indicators */}
                    <div className="flex flex-col space-y-4">
                      {/* Support/Resistance Levels */}
                      <div className="space-y-2">
                        <h3 className="text-white font-bold text-sm">Key Price Levels</h3>
                        
                        {/* Resistance Levels */}
                        <div>
                          <div className="text-gray-300 text-xs font-semibold mb-1">Resistance Levels</div>
                          <div className="space-y-1">
                            {resistanceLevels.map((level, i) => (
                              <div key={`res-${i}`} className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">{level.level}</span>
                                <span className="text-red-400 font-medium">
                                  ${formatCurrency(level.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Support Levels */}
                        <div className="mt-2">
                          <div className="text-gray-300 text-xs font-semibold mb-1">Support Levels</div>
                          <div className="space-y-1">
                            {supportLevels.map((level, i) => (
                              <div key={`sup-${i}`} className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">{level.level}</span>
                                <span className="text-green-400 font-medium">
                                  ${formatCurrency(level.price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Pattern Recognition */}
                      <div className="space-y-2">
                        <h3 className="text-white font-bold text-sm">Pattern Recognition</h3>
                        <div className="space-y-1">
                          {currentSignal?.patternFormations && currentSignal.patternFormations.length > 0 ? (
                            currentSignal.patternFormations.slice(0, 3).map((pattern, i) => (
                              <div key={`pattern-${i}`} className="flex flex-col space-y-1 bg-gray-900/50 p-2 rounded">
                                <div className="flex justify-between">
                                  <span className="text-xs font-semibold">{pattern.name}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      pattern.direction === 'bullish' 
                                        ? 'bg-green-900/50 text-green-300' 
                                        : pattern.direction === 'bearish' 
                                          ? 'bg-red-900/50 text-red-300' 
                                          : 'bg-gray-700/50 text-gray-300'
                                    }
                                  >
                                    {pattern.direction}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-400">Reliability:</span>
                                  <span className="text-xs text-white">{pattern.reliability}%</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{pattern.description}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-gray-500 italic">No significant patterns detected</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Macro insights if available */}
                  {currentSignal?.macroInsights && currentSignal.macroInsights.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded">
                      <h3 className="text-white font-bold text-sm mb-2">Market Insights</h3>
                      <ul className="list-disc list-inside text-xs text-gray-300">
                        {currentSignal.macroInsights.map((insight, i) => (
                          <li key={`insight-${i}`}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}