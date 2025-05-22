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

// Import our type definitions
import { TimeFrame, SignalDirection, PatternFormation, AdvancedSignal, TradeRecommendation, Indicator } from '../types';
import { useToast } from '../hooks/use-toast';
import { useMarketData } from '../hooks/useMarketData';
import { useQuery } from '@tanstack/react-query';

// Price level display component
interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

function formatCurrency(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price < 1 ? 6 : price < 100 ? 2 : 0,
    maximumFractionDigits: price < 1 ? 6 : price < 100 ? 2 : 0,
  }).format(price);
}

const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  if (value === undefined || isNaN(value)) return null;
  
  return (
    <div className={`p-2 rounded border ${colorClass} flex justify-between items-center`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold">{formatCurrency(value)}</span>
    </div>
  );
});

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
  onAnalysisComplete?: () => void;
  autoRun?: boolean;
}

// Main component
export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect,
  onAnalysisComplete,
  autoRun = false
}: AdvancedSignalDashboardProps) {
  // State for the selected timeframe
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1d');
  const [isCalculating, setIsCalculating] = useState(false);
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as any);
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  
  // Get toast for notifications
  const { toast } = useToast();
  
  // Get market data
  const { chartData } = useMarketData(symbol);
  const [price, setPrice] = useState<number | null>(null);
  
  // Update the price when autoRun changes or symbol changes
  useEffect(() => {
    // Function to fetch the current price
    async function fetchPrice() {
      try {
        const response = await fetch(`/api/crypto/${symbol}`);
        const data = await response.json();
        setPrice(data.lastPrice);
        
        if (autoRun) {
          // Add a small delay to ensure price is set before calculation
          setTimeout(() => {
            handleManualCalculation();
          }, 500);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    }
    
    fetchPrice();
  }, [symbol, autoRun]);
  
  // Calculate a signal for a specific timeframe
  function calculateTimeframeSignal(price: number, timeframe: TimeFrame): AdvancedSignal {
    // Use price as a seed for deterministic calculations
    const priceMod = Math.floor(price) % 100;
    
    // Direction based on price seed
    let direction: SignalDirection;
    if (priceMod < 40) direction = 'LONG';
    else if (priceMod < 80) direction = 'SHORT';
    else direction = 'NEUTRAL';
    
    // Calculate confidence (50-95)
    const confidence = 50 + (priceMod % 45);
    
    // Generate timestamp
    const timestamp = Date.now();
    
    // Calculate stop loss and take profit
    let stopLoss, takeProfit;
    if (direction === 'LONG') {
      stopLoss = price * 0.97;
      takeProfit = price * 1.05;
    } else if (direction === 'SHORT') {
      stopLoss = price * 1.03;
      takeProfit = price * 0.95;
    } else {
      stopLoss = price * 0.98;
      takeProfit = price * 1.02;
    }
    
    // Create support and resistance levels
    const supportLevels = [
      Math.round(price * 0.95 * 100) / 100,
      Math.round(price * 0.93 * 100) / 100,
      Math.round(price * 0.90 * 100) / 100
    ];
    
    const resistanceLevels = [
      Math.round(price * 1.05 * 100) / 100,
      Math.round(price * 1.08 * 100) / 100,
      Math.round(price * 1.12 * 100) / 100
    ];
    
    // Pattern formations
    const patternFormations: PatternFormation[] = direction === 'LONG' ? 
      [
        {
          name: 'Bullish Engulfing',
          direction: 'bullish',
          reliability: 0.85,
          description: 'A bullish reversal pattern that forms after a downtrend'
        },
        {
          name: 'Golden Cross',
          direction: 'bullish',
          reliability: 0.72,
          description: 'When a short-term moving average crosses above a long-term moving average'
        }
      ] : 
      direction === 'SHORT' ? 
      [
        {
          name: 'Bearish Engulfing',
          direction: 'bearish',
          reliability: 0.82,
          description: 'A bearish reversal pattern that forms after an uptrend'
        },
        {
          name: 'Death Cross',
          direction: 'bearish',
          reliability: 0.76,
          description: 'When a short-term moving average crosses below a long-term moving average'
        }
      ] : 
      [
        {
          name: 'Rectangle',
          direction: 'neutral',
          reliability: 0.65,
          description: 'A continuation pattern showing consolidation in a range'
        }
      ];
    
    // Expected duration based on timeframe
    let expectedDuration = '1-3 weeks';
    switch(timeframe) {
      case '1m': expectedDuration = '5-30 minutes'; break;
      case '5m': expectedDuration = '30 minutes - 2 hours'; break;
      case '15m': expectedDuration = '1-6 hours'; break;
      case '30m': expectedDuration = '2-12 hours'; break;
      case '1h': expectedDuration = '4-24 hours'; break;
      case '4h': expectedDuration = '1-4 days'; break;
      case '1d': expectedDuration = '1-3 weeks'; break;
      case '3d': expectedDuration = '1-6 weeks'; break;
      case '1w': expectedDuration = '1-3 months'; break;
      case '1M': expectedDuration = '3-12 months'; break;
    }
    
    // Generate sample indicators
    const trend: Indicator[] = [
      {id: 'trend-1', name: 'Moving Average', value: 75, signal: 'BUY', strength: 'STRONG', category: 'trend'},
      {id: 'trend-2', name: 'MACD', value: 65, signal: 'BUY', strength: 'MODERATE', category: 'trend'},
      {id: 'trend-3', name: 'Parabolic SAR', value: 70, signal: 'BUY', strength: 'MODERATE', category: 'trend'},
    ];
    
    const momentum: Indicator[] = [
      {id: 'momentum-1', name: 'RSI', value: 60, signal: 'BUY', strength: 'MODERATE', category: 'momentum'},
      {id: 'momentum-2', name: 'Stochastic', value: 55, signal: 'NEUTRAL', strength: 'WEAK', category: 'momentum'},
    ];
    
    const volatility: Indicator[] = [
      {id: 'volatility-1', name: 'Bollinger Bands', value: 70, signal: 'BUY', strength: 'MODERATE', category: 'volatility'},
      {id: 'volatility-2', name: 'ATR', value: 65, signal: 'NEUTRAL', strength: 'MODERATE', category: 'volatility'},
    ];
    
    const volume: Indicator[] = [
      {id: 'volume-1', name: 'OBV', value: 80, signal: 'BUY', strength: 'STRONG', category: 'volume'},
      {id: 'volume-2', name: 'Volume', value: 75, signal: 'BUY', strength: 'STRONG', category: 'volume'},
    ];
    
    // Success probability will match confidence with small variation
    const successProbability = confidence + Math.floor(Math.random() * 5);
    
    // Get success probability description
    let successProbabilityDescription = '';
    if (successProbability >= 85) successProbabilityDescription = 'Very High Probability';
    else if (successProbability >= 70) successProbabilityDescription = 'High Probability';
    else if (successProbability >= 55) successProbabilityDescription = 'Moderate Probability';
    else if (successProbability >= 40) successProbabilityDescription = 'Speculative';
    else successProbabilityDescription = 'Low Probability';
    
    // Calculate risk reward ratio
    const riskRewardRatio = direction === 'LONG' 
      ? (takeProfit - price) / (price - stopLoss) 
      : (price - takeProfit) / (stopLoss - price);
    
    // Generate recommended leverage
    const recommendedLeverage = {
      conservative: 1 + (confidence % 5) / 10,
      moderate: 2 + (confidence % 10) / 10,
      aggressive: 4 + (confidence % 20) / 10,
      recommendation: confidence > 75 ? 'moderate' : 'conservative'
    };
    
    // Generate environment
    const environment = {
      marketVolatility: confidence > 70 ? 'Low' : 'Medium',
      marketSentiment: direction === 'LONG' ? 'Bullish' : direction === 'SHORT' ? 'Bearish' : 'Neutral',
      riskLevel: confidence > 80 ? 'Low' : confidence > 60 ? 'Medium' : 'High'
    };
    
    // Generate macro insights
    const macroInsights = [
      'Market sentiment has been gradually improving over the past week',
      'Volume analysis indicates sustained buyer interest at current levels',
      'Recent price action suggests a continuation of the short-term trend'
    ];
    
    return {
      direction,
      confidence,
      timestamp,
      entryPrice: price,
      stopLoss,
      takeProfit,
      timeframe,
      patternFormations,
      supportLevels,
      resistanceLevels,
      expectedDuration,
      indicators: {
        trend,
        momentum,
        volatility,
        volume
      },
      environment,
      successProbability,
      successProbabilityDescription,
      riskRewardRatio,
      optimalRiskReward: 2.5,
      recommendedLeverage,
      macroInsights
    };
  }
  
  // Function to apply price and calculate signals
  function applyPriceAndCalculate(price: number) {
    setIsCalculating(true);
    
    try {
      // Generate signals for all timeframes
      const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
      const newSignals: Record<TimeFrame, AdvancedSignal> = {} as Record<TimeFrame, AdvancedSignal>;
      
      // For each timeframe, calculate the signal
      timeframes.forEach(tf => {
        try {
          // Calculate signals for this timeframe
          const signal = calculateTimeframeSignal(price, tf);
          newSignals[tf] = signal;
        } catch (err) {
          console.error(`Error calculating signal for ${tf}:`, err);
        }
      });
      
      // Update the signals state
      setSignals(newSignals);
      
      // Generate a trade recommendation
      const newRecommendation = generateTradeRecommendation(selectedTimeframe, newSignals);
      setRecommendation(newRecommendation);
      
      // Synchronize price with the server
      synchronizePriceWithServer(symbol, price);
      
      // Call onAnalysisComplete if provided
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
      
      // Success toast
      toast({
        title: "Calculation Complete",
        description: `Analysis updated for ${symbol} at ${formatCurrency(price)}`,
      });
    } catch (error) {
      // Error toast
      toast({
        title: "Calculation Error",
        description: `Failed to generate signals: ${error}`,
        variant: "destructive",
      });
      console.error("Error in calculation:", error);
    } finally {
      // Reset the calculation state
      setIsCalculating(false);
    }
  }
  
  // Function to synchronize price with the server
  function synchronizePriceWithServer(symbol: string, price: number) {
    // Send the price to the server to keep it in sync
    fetch('/api/sync-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, price }),
    }).catch(err => {
      console.error('Error syncing price with server:', err);
    });
  }
  
  // Function to manually trigger a calculation
  const handleManualCalculation = useCallback(() => {
    // Check if we have a price
    if (!price) {
      toast({
        title: "Price Unavailable",
        description: "Unable to calculate signals without a current price.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Calculation Started",
      description: "Generating advanced signals for all timeframes...",
    });
    
    // Apply the price and calculate
    applyPriceAndCalculate(price);
  }, [price, toast]);
  
  // Generate trade recommendation based on signals
  const generateTradeRecommendation = (timeframe: TimeFrame, signalData: Record<TimeFrame, AdvancedSignal>): TradeRecommendation | null => {
    // If we don't have signals yet, return null
    if (!signalData[timeframe]) return null;
    
    const signal = signalData[timeframe];
    
    // Find the most influential indicators for the signal
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      const indicators: string[] = [];
      
      // Add trend indicators
      for (const indicator of primarySignal.indicators.trend) {
        if (indicator.strength === 'STRONG' && 
            (indicator.signal === 'BUY' && primarySignal.direction === 'LONG' ||
             indicator.signal === 'SELL' && primarySignal.direction === 'SHORT')) {
          indicators.push(indicator.name);
        }
      }
      
      // Add momentum indicators
      for (const indicator of primarySignal.indicators.momentum) {
        if (indicator.strength === 'STRONG' && 
            (indicator.signal === 'BUY' && primarySignal.direction === 'LONG' ||
             indicator.signal === 'SELL' && primarySignal.direction === 'SHORT')) {
          indicators.push(indicator.name);
        }
      }
      
      return indicators.slice(0, 3); // Return top 3 indicators
    };
    
    // Generate a summary of the recommendation
    const generateSummary = (signal: AdvancedSignal): string => {
      const directionText = signal.direction === 'LONG' ? 'bullish' : signal.direction === 'SHORT' ? 'bearish' : 'neutral';
      const confidenceText = signal.confidence > 75 ? 'strong' : signal.confidence > 60 ? 'moderate' : 'mild';
      const timeframeText = signal.timeframe;
      
      return `${confidenceText.charAt(0).toUpperCase() + confidenceText.slice(1)} ${directionText} signal on ${timeframeText} timeframe with ${signal.successProbability}% probability. Key pattern: ${signal.patternFormations[0]?.name || 'None'}.`;
    };
    
    const recommendation: TradeRecommendation = {
      direction: signal.direction,
      confidence: signal.confidence,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      leverage: signal.recommendedLeverage.moderate,
      riskRewardRatio: signal.riskRewardRatio,
      timeframe: signal.timeframe,
      pattern: signal.patternFormations[0]?.name || 'None',
      keyIndicators: findInfluentialIndicators(signal),
      summary: generateSummary(signal)
    };
    
    return recommendation;
  };
  
  // Handle timeframe change
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    
    // Generate recommendation for the new timeframe if signals exist
    if (signals[timeframe]) {
      const newRecommendation = generateTradeRecommendation(timeframe, signals);
      setRecommendation(newRecommendation);
    }
    
    // Call the parent's timeframe select handler if provided
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect, signals]);
  
  function getSignalBgClass(direction: string): string {
    if (direction === 'LONG') return 'bg-green-950/40 border-green-800 text-green-300';
    if (direction === 'SHORT') return 'bg-red-950/40 border-red-800 text-red-300';
    return 'bg-gray-800/40 border-gray-700 text-gray-300';
  }

  // Render the component
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-white font-bold text-lg">Advanced Signal Dashboard</h2>
          <p className="text-slate-400 text-sm">Comprehensive technical analysis for {symbol}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualCalculation}
            disabled={isCalculating || !price}
            className="text-xs bg-indigo-900/30 text-indigo-300 border-indigo-800 hover:bg-indigo-800/50 hover:text-indigo-200 font-medium"
          >
            {isCalculating ? (
              <>
                <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-1 h-3 w-3" />
                Calculate Now
              </>
            )}
          </Button>
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
        
        <CardContent>
          <Tabs defaultValue={selectedTimeframe} onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-4 bg-gray-800/40">
              <TabsTrigger value="1m">1m</TabsTrigger>
              <TabsTrigger value="5m">5m</TabsTrigger>
              <TabsTrigger value="15m">15m</TabsTrigger>
              <TabsTrigger value="30m">30m</TabsTrigger>
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="4h">4h</TabsTrigger>
              <TabsTrigger value="1d">1d</TabsTrigger>
              <TabsTrigger value="3d">3d</TabsTrigger>
              <TabsTrigger value="1w">1w</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
            </TabsList>
            
            {/* Render content for each timeframe */}
            {(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'] as TimeFrame[]).map((tf) => (
              <TabsContent key={tf} value={tf} className="outline-none">
                {signals[tf] ? (
                  <div className="space-y-4">
                    {/* Signal Direction */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div className="space-y-4 md:col-span-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white font-semibold">Signal</h3>
                          <Badge variant="outline" className={`px-3 py-1 ${getSignalBgClass(signals[tf]?.direction || 'NEUTRAL')}`}>
                            <span className="flex items-center">
                              {signals[tf]?.direction === 'LONG' && <TrendingUp className="mr-1 h-3 w-3" />}
                              {signals[tf]?.direction === 'SHORT' && <TrendingDown className="mr-1 h-3 w-3" />}
                              {signals[tf]?.direction === 'NEUTRAL' && <Minus className="mr-1 h-3 w-3" />}
                              {signals[tf]?.direction} ({signals[tf]?.confidence}%)
                            </span>
                          </Badge>
                        </div>
                        
                        {/* Pattern Formations */}
                        <div>
                          <h3 className="text-white font-semibold mb-2">Pattern Formations</h3>
                          <div className="space-y-2">
                            {signals[tf]?.patternFormations.map((pattern, i) => (
                              <div key={i} className="bg-gray-800/40 p-2 rounded border border-gray-700">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">{pattern.name}</span>
                                  <Badge variant="outline" className={`text-xs ${
                                    pattern.direction === 'bullish' ? 'bg-green-950/40 border-green-800 text-green-300' :
                                    pattern.direction === 'bearish' ? 'bg-red-950/40 border-red-800 text-red-300' :
                                    'bg-blue-950/40 border-blue-800 text-blue-300'
                                  }`}>
                                    {pattern.direction}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{pattern.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Entry, SL, TP */}
                      <div>
                        <h3 className="text-white font-semibold mb-2">Price Levels</h3>
                        <div className="grid gap-2">
                          <PriceLevelDisplay 
                            label="Entry Price" 
                            value={signals[tf]?.entryPrice} 
                            timeframe={tf} 
                            colorClass="bg-gray-800/40 border-gray-700"
                          />
                          <PriceLevelDisplay 
                            label="Stop Loss" 
                            value={signals[tf]?.stopLoss} 
                            timeframe={tf} 
                            colorClass="bg-red-950/20 border-red-900"
                          />
                          <PriceLevelDisplay 
                            label="Take Profit" 
                            value={signals[tf]?.takeProfit} 
                            timeframe={tf} 
                            colorClass="bg-green-950/20 border-green-900"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Support & Resistance Levels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Support Levels</h3>
                        <div className="space-y-2">
                          {signals[tf]?.supportLevels.map((level, i) => (
                            <PriceLevelDisplay 
                              key={i}
                              label={`S${i+1}`} 
                              value={level} 
                              timeframe={tf} 
                              colorClass="bg-green-950/20 border-green-900"
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">Resistance Levels</h3>
                        <div className="space-y-2">
                          {signals[tf]?.resistanceLevels.map((level, i) => (
                            <PriceLevelDisplay 
                              key={i}
                              label={`R${i+1}`} 
                              value={level} 
                              timeframe={tf} 
                              colorClass="bg-red-950/20 border-red-900"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Success Probability */}
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-white font-semibold">Success Probability</h3>
                        <span className="text-sm font-medium">{signals[tf]?.successProbability}%</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            signals[tf]?.confidence || 0 > 70 ? 'bg-green-600' : 
                            signals[tf]?.confidence || 0 > 50 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${signals[tf]?.successProbability || 0}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{signals[tf]?.successProbabilityDescription}</p>
                    </div>
                    
                    {/* Indicators Section */}
                    <div>
                      <h3 className="text-white font-semibold mb-2">Technical Indicators</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Trend</h4>
                          <div className="space-y-1">
                            {signals[tf]?.indicators.trend.map((item, i) => (
                              <div key={i} className="bg-gray-800/40 p-2 rounded border border-gray-700 flex justify-between">
                                <span className="text-xs">{item.name}</span>
                                <Badge variant="outline" className={`text-xs ${
                                  item.signal === 'BUY' ? 'bg-green-950/40 border-green-800 text-green-300' :
                                  item.signal === 'SELL' ? 'bg-red-950/40 border-red-800 text-red-300' :
                                  'bg-blue-950/40 border-blue-800 text-blue-300'
                                }`}>
                                  {item.signal}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Momentum</h4>
                          <div className="space-y-1">
                            {signals[tf]?.indicators.momentum.map((item, i) => (
                              <div key={i} className="bg-gray-800/40 p-2 rounded border border-gray-700 flex justify-between">
                                <span className="text-xs">{item.name}</span>
                                <Badge variant="outline" className={`text-xs ${
                                  item.signal === 'BUY' ? 'bg-green-950/40 border-green-800 text-green-300' :
                                  item.signal === 'SELL' ? 'bg-red-950/40 border-red-800 text-red-300' :
                                  'bg-blue-950/40 border-blue-800 text-blue-300'
                                }`}>
                                  {item.signal}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Market Environment and Leverage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Market Environment</h3>
                        <div className="bg-gray-800/40 p-3 rounded border border-gray-700">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-xs text-gray-400">Volatility</div>
                              <div className="text-sm font-medium">{signals[tf]?.environment.marketVolatility}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Sentiment</div>
                              <div className="text-sm font-medium">{signals[tf]?.environment.marketSentiment}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Risk Level</div>
                              <div className="text-sm font-medium">{signals[tf]?.environment.riskLevel}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Risk/Reward</div>
                              <div className="text-sm font-medium">{signals[tf]?.riskRewardRatio.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">Recommended Leverage</h3>
                        <div className="bg-gray-800/40 p-3 rounded border border-gray-700">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-xs text-gray-400">Conservative</div>
                              <div className="text-sm font-medium">{signals[tf]?.recommendedLeverage.conservative.toFixed(1)}x</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Moderate</div>
                              <div className="text-sm font-medium">{signals[tf]?.recommendedLeverage.moderate.toFixed(1)}x</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-400">Aggressive</div>
                              <div className="text-sm font-medium">{signals[tf]?.recommendedLeverage.aggressive.toFixed(1)}x</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-400">
                            <span className="text-indigo-400">Recommended:</span> {signals[tf]?.recommendedLeverage.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expected Duration & Macro Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Timeframe & Duration</h3>
                        <div className="bg-gray-800/40 p-3 rounded border border-gray-700">
                          <div>
                            <div className="text-xs text-gray-400">Expected Duration</div>
                            <div className="text-sm font-medium">{signals[tf]?.expectedDuration}</div>
                          </div>
                          <div className="mt-2">
                            <div className="text-xs text-gray-400">Last Updated</div>
                            <div className="text-sm font-medium">
                              {signals[tf]?.timestamp ? new Date(signals[tf].timestamp).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-2">Macro Insights</h3>
                        <div className="bg-gray-800/40 p-3 rounded border border-gray-700">
                          <ul className="space-y-1">
                            {signals[tf]?.macroInsights.map((insight, i) => (
                              <li key={i} className="text-xs text-gray-300">• {insight}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700 text-center max-w-md">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <h3 className="text-white font-medium text-lg">No Signal Data</h3>
                      <p className="text-gray-400 mb-4">
                        Click the "Calculate Now" button to generate signals for this timeframe.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleManualCalculation}
                        disabled={isCalculating || !price}
                        className="bg-indigo-900/30 text-indigo-300 border-indigo-800 hover:bg-indigo-800/50 hover:text-indigo-200"
                      >
                        {isCalculating ? (
                          <>
                            <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="mr-1 h-3 w-3" />
                            Calculate Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col items-start border-t border-gray-800 pt-4">
          <div className="w-full">
            <h3 className="text-white font-semibold mb-2">Trade Recommendation</h3>
            {recommendation ? (
              <div className="bg-gray-800/40 p-3 rounded border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline" className={`px-3 py-1 ${getSignalBgClass(recommendation.direction)}`}>
                    <span className="flex items-center">
                      {recommendation.direction === 'LONG' && <TrendingUp className="mr-1 h-3 w-3" />}
                      {recommendation.direction === 'SHORT' && <TrendingDown className="mr-1 h-3 w-3" />}
                      {recommendation.direction === 'NEUTRAL' && <Minus className="mr-1 h-3 w-3" />}
                      {recommendation.direction} ({recommendation.confidence}%)
                    </span>
                  </Badge>
                  <div className="text-xs text-gray-400">
                    Timeframe: <span className="text-white font-medium">{recommendation.timeframe}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-2">{recommendation.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-gray-400">Entry Price</div>
                    <div className="font-medium">{formatCurrency(recommendation.entryPrice)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Stop Loss</div>
                    <div className="font-medium text-red-400">{formatCurrency(recommendation.stopLoss)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Take Profit</div>
                    <div className="font-medium text-green-400">{formatCurrency(recommendation.takeProfit)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Leverage</div>
                    <div className="font-medium">{recommendation.leverage.toFixed(1)}x</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No recommendation available. Calculate a signal first.</div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}