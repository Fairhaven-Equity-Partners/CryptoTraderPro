import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Target, Activity, DollarSign, Clock, BarChart3, Calculator, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { unifiedCalculationCore } from '@/lib/unifiedCalculationCore';
import { formatCurrency } from '@/lib/utils';
import { TimeFrame, TIMEFRAMES } from '../types';

// Type definitions
interface AdvancedSignal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: TimeFrame;
  timestamp: number;
  successProbability: number;
  indicators: IndicatorGroups;
  patternFormations?: any[];
  supportResistance?: any;
  environment?: any;
  recommendedLeverage?: any;
  riskReward?: number;
  marketStructure?: any;
  volumeProfile?: any;
  macroInsights?: string[];
}

interface IndicatorGroups {
  trend: any[];
  momentum: any[];
  volume: any[];
  pattern: any[];
  volatility: any[];
}

interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  if (!value) return null;
  
  return (
    <div className="flex justify-between items-center text-xs border-b border-gray-700/50 pb-1">
      <span className="text-gray-400 font-medium">{label}</span>
      <div className="flex items-center space-x-2">
        <span className={`font-mono font-bold ${colorClass}`}>
          {formatCurrency(value)}
        </span>
        <Badge variant="outline" className="text-xs px-1 py-0">
          {timeframe}
        </Badge>
      </div>
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
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({
    "1m": null, "5m": null, "15m": null, "30m": null, "1h": null, 
    "4h": null, "1d": null, "3d": null, "1w": null, "1M": null
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculationRef] = useState({ current: 0 });

  // Data fetching
  const { data: chartData } = useQuery({
    queryKey: [`/api/crypto/${symbol}/chart`, symbol],
    refetchInterval: 30000,
  });

  const { data: currentAssetData } = useQuery({
    queryKey: [`/api/crypto/${symbol}`, symbol],
    refetchInterval: 15000,
  });

  const currentAssetPrice = currentAssetData?.currentPrice || 0;
  
  // Calculate signals when data changes
  const calculateAllSignals = useCallback(async () => {
    if (isCalculating || !chartData || !currentAssetPrice) return;
    
    setIsCalculating(true);
    lastCalculationRef.current = Date.now();
    
    try {
      const newSignals: Record<TimeFrame, AdvancedSignal | null> = { ...signals };
      
      for (const timeframe of TIMEFRAMES) {
        try {
          if (chartData[timeframe] && Array.isArray(chartData[timeframe]) && chartData[timeframe].length > 20) {
            const chartDataWithTimestamp = chartData[timeframe].map(d => ({
              ...d,
              timestamp: d.time || Date.now()
            }));
            
            unifiedCalculationCore.updateMarketData(symbol, timeframe, chartDataWithTimestamp);
            const unifiedSignal = unifiedCalculationCore.generateSignal(symbol, timeframe, currentAssetPrice);
            
            if (unifiedSignal) {
              const signal: AdvancedSignal = {
                ...unifiedSignal,
                indicators: {
                  trend: [
                    { 
                      id: 'ema_short', 
                      name: 'EMA Short', 
                      category: 'TREND', 
                      signal: unifiedSignal.indicators.ema.short > unifiedSignal.indicators.ema.medium ? 'BUY' : 'SELL',
                      strength: 'MODERATE',
                      value: unifiedSignal.indicators.ema.short 
                    },
                    { 
                      id: 'ema_medium', 
                      name: 'EMA Medium', 
                      category: 'TREND', 
                      signal: unifiedSignal.indicators.ema.medium > unifiedSignal.indicators.ema.long ? 'BUY' : 'SELL',
                      strength: 'MODERATE',
                      value: unifiedSignal.indicators.ema.medium 
                    }
                  ],
                  momentum: [
                    { 
                      id: 'rsi', 
                      name: 'RSI', 
                      category: 'MOMENTUM', 
                      signal: unifiedSignal.indicators.rsi.signal,
                      strength: unifiedSignal.indicators.rsi.strength,
                      value: unifiedSignal.indicators.rsi.value 
                    },
                    { 
                      id: 'macd', 
                      name: 'MACD', 
                      category: 'MOMENTUM', 
                      signal: unifiedSignal.indicators.macd.signal,
                      strength: unifiedSignal.indicators.macd.strength,
                      value: unifiedSignal.indicators.macd.value 
                    }
                  ],
                  volume: [],
                  pattern: [],
                  volatility: []
                },
                patternFormations: [],
                supportResistance: {
                  supports: unifiedSignal.indicators.supports,
                  resistances: unifiedSignal.indicators.resistances,
                  pivotPoints: [unifiedSignal.entryPrice]
                },
                environment: { 
                  trend: unifiedSignal.indicators.marketRegime === 'TRENDING_UP' ? 'BULLISH' : 
                         unifiedSignal.indicators.marketRegime === 'TRENDING_DOWN' ? 'BEARISH' : 'NEUTRAL',
                  volatility: unifiedSignal.indicators.marketRegime === 'HIGH_VOLATILITY' ? 'HIGH' : 
                             unifiedSignal.indicators.marketRegime === 'LOW_VOLATILITY' ? 'LOW' : 'NORMAL',
                  volume: 'NORMAL',
                  sentiment: 'NEUTRAL'
                },
                recommendedLeverage: {
                  conservative: 1,
                  moderate: 2,
                  aggressive: 3,
                  recommendation: 'conservative'
                },
                riskReward: Math.abs(unifiedSignal.takeProfit - unifiedSignal.entryPrice) / Math.abs(unifiedSignal.entryPrice - unifiedSignal.stopLoss),
                marketStructure: { 
                  trend: 'ACTIVE', 
                  phase: 'ACTIVE', 
                  strength: unifiedSignal.confidence 
                },
                volumeProfile: { 
                  volumeWeightedPrice: unifiedSignal.entryPrice, 
                  highVolumeNodes: [], 
                  lowVolumeNodes: [] 
                },
                macroInsights: unifiedSignal.macroInsights || []
              };
              
              newSignals[timeframe] = signal;
            }
          }
        } catch (error) {
          console.error(`Error calculating ${timeframe}:`, error);
          newSignals[timeframe] = null;
        }
      }
      
      setSignals(newSignals);
      
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [chartData, currentAssetPrice, symbol, isCalculating, signals]);

  // Auto-calculate on data changes
  useEffect(() => {
    if (chartData && currentAssetPrice && !isCalculating) {
      calculateAllSignals();
    }
  }, [chartData, currentAssetPrice, calculateAllSignals, isCalculating]);

  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [onTimeframeSelect]);

  function getSignalBgClass(direction: string): string {
    switch (direction) {
      case 'LONG': return 'bg-gradient-to-r from-green-900/20 to-green-800/30 border-green-600/50';
      case 'SHORT': return 'bg-gradient-to-r from-red-900/20 to-red-800/30 border-red-600/50';
      default: return 'bg-gradient-to-r from-gray-900/20 to-gray-800/30 border-gray-600/50';
    }
  }

  const currentSignal = signals[selectedTimeframe];

  return (
    <Card className="w-full bg-gray-950 border-gray-800 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            <span className="text-white font-bold">Advanced Signal Analysis</span>
            <Badge variant="outline" className="text-blue-400 border-blue-500">
              {symbol}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {isCalculating && (
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-sm font-medium">Calculating...</span>
              </div>
            )}
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              Live Analysis
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={selectedTimeframe} onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
          <TabsList className="grid grid-cols-10 w-full bg-gray-900 border border-gray-700">
            {TIMEFRAMES.map((tf) => (
              <TabsTrigger 
                key={tf} 
                value={tf} 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
              >
                {tf}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {TIMEFRAMES.map((timeframe) => (
            <TabsContent key={timeframe} value={timeframe} className="mt-4">
              {signals[timeframe] ? (
                <div className={`rounded-lg border p-4 ${getSignalBgClass(signals[timeframe]!.direction)}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Signal Direction */}
                    <div className="space-y-2">
                      <h3 className="text-white font-bold text-sm flex items-center">
                        {signals[timeframe]!.direction === 'LONG' && <TrendingUp className="h-4 w-4 mr-1 text-green-400" />}
                        {signals[timeframe]!.direction === 'SHORT' && <TrendingDown className="h-4 w-4 mr-1 text-red-400" />}
                        {signals[timeframe]!.direction === 'NEUTRAL' && <Minus className="h-4 w-4 mr-1 text-gray-400" />}
                        Signal Direction
                      </h3>
                      <div className="space-y-1">
                        <Badge variant="outline" className={`${
                          signals[timeframe]!.direction === 'LONG' ? 'text-green-400 border-green-500 bg-green-900/30' :
                          signals[timeframe]!.direction === 'SHORT' ? 'text-red-400 border-red-500 bg-red-900/30' :
                          'text-gray-400 border-gray-500 bg-gray-900/30'
                        } font-bold text-lg px-3 py-1`}>
                          {signals[timeframe]!.direction}
                        </Badge>
                        <div className="text-gray-300 text-xs">
                          Confidence: {Math.round(signals[timeframe]!.confidence)}%
                        </div>
                      </div>
                    </div>

                    {/* Price Levels */}
                    <div className="space-y-2">
                      <h3 className="text-white font-bold text-sm flex items-center">
                        <Target className="h-4 w-4 mr-1 text-blue-400" />
                        Price Levels
                      </h3>
                      <div className="space-y-1">
                        <PriceLevelDisplay 
                          label="Entry" 
                          value={signals[timeframe]!.entryPrice} 
                          timeframe={timeframe}
                          colorClass="text-blue-400"
                        />
                        <PriceLevelDisplay 
                          label="Stop Loss" 
                          value={signals[timeframe]!.stopLoss} 
                          timeframe={timeframe}
                          colorClass="text-red-400"
                        />
                        <PriceLevelDisplay 
                          label="Take Profit" 
                          value={signals[timeframe]!.takeProfit} 
                          timeframe={timeframe}
                          colorClass="text-green-400"
                        />
                      </div>
                    </div>

                    {/* Key Indicators */}
                    <div className="space-y-2">
                      <h3 className="text-white font-bold text-sm flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-purple-400" />
                        Key Indicators
                      </h3>
                      <div className="space-y-1">
                        {currentSignal?.indicators?.trend?.slice(0, 2).map((indicator, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{indicator.name}</span>
                            <Badge variant="outline" className={`${
                              indicator.signal === 'BUY' ? 'text-green-400 border-green-500 bg-green-900/30' :
                              indicator.signal === 'SELL' ? 'text-red-400 border-red-500 bg-red-900/30' :
                              'text-yellow-400 border-yellow-500 bg-yellow-900/30'
                            } text-xs px-1 py-0`}>
                              {indicator.signal} ({indicator.strength?.charAt(0) || 'M'})
                            </Badge>
                          </div>
                        ))}
                        {currentSignal?.indicators?.momentum?.slice(0, 2).map((indicator, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300">{indicator.name}</span>
                            <Badge variant="outline" className={`${
                              indicator.signal === 'BUY' ? 'text-green-400 border-green-500 bg-green-900/30' :
                              indicator.signal === 'SELL' ? 'text-red-400 border-red-500 bg-red-900/30' :
                              'text-yellow-400 border-yellow-500 bg-yellow-900/30'
                            } text-xs px-1 py-0`}>
                              {indicator.signal} ({indicator.strength?.charAt(0) || 'M'})
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Macro Insights */}
                  {signals[timeframe]!.macroInsights && signals[timeframe]!.macroInsights!.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <h3 className="text-white font-bold text-sm mb-2">Market Analysis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {signals[timeframe]!.macroInsights!.slice(0, 4).map((insight, i) => (
                          <div key={i} className="text-gray-300">• {insight}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No signal data available for {timeframe}</p>
                  <p className="text-xs mt-1">Waiting for sufficient market data...</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 pt-2">
        Data updated {lastCalculationRef.current > 0 ? new Date(lastCalculationRef.current).toLocaleTimeString() : 'never'} 
        • Live market analysis with institutional-grade indicators
      </CardFooter>
    </Card>
  );
}