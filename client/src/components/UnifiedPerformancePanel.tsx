/**
 * Unified Performance Panel
 * Combines technical analysis and performance metrics with consistent styling
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Activity } from 'lucide-react';

interface TechnicalAnalysisData {
  success: boolean;
  symbol: string;
  currentPrice: number;
  change24h: number;
  signal: {
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    confidence: number;
    reasoning: string[];
  };
  indicators: {
    rsi: number;
    macd: number;
    signal: number;
    ema12: number;
    sma20: number;
    upperBB: number;
    lowerBB: number;
    stochK: number;
    atr: number;
  };
  analysis: {
    trend: 'BULLISH' | 'BEARISH';
    momentum: 'POSITIVE' | 'NEGATIVE';
    volatility: string;
    support: number;
    resistance: number;
  };
  timestamp: number;
}

interface PerformanceMetrics {
  indicators: Array<{
    indicator: string;
    hitRate: number;
    totalPredictions: number;
    successfulPredictions: number;
    averageReturn: number;
    confidenceAccuracy: number;
  }>;
  timeframes: Array<{
    timeframe: string;
    hitRate: number;
    totalSignals: number;
    successfulSignals: number;
    averageConfidence: number;
    actualAccuracy: number;
    performanceScore: number;
  }>;
  symbols: Array<{
    symbol: string;
    hitRate: number;
    signalQuality: number;
    bestTimeframes: string[];
  }>;
  recommendations: string[];
  lastUpdated: number;
}

interface Props {
  symbol: string;
}

export default function UnifiedPerformancePanel({ symbol }: Props) {
  console.log('[UnifiedPerformancePanel] Component loading for symbol:', symbol);
  
  const { data: technicalData, isLoading: techLoading } = useQuery<TechnicalAnalysisData>({
    queryKey: ['/api/technical-analysis', symbol],
    queryFn: () => fetch(`/api/technical-analysis/${encodeURIComponent(symbol)}`).then(res => res.json()),
    refetchInterval: 30000,
  });

  const { data: performanceData, isLoading: perfLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/performance-metrics'],
    refetchInterval: 60000,
  });

  const isLoading = techLoading || perfLoading;
  
  console.log('[UnifiedPerformancePanel] Data status:', { 
    techLoading, 
    perfLoading, 
    hasTechnicalData: !!technicalData, 
    hasPerformanceData: !!performanceData 
  });

  if (isLoading) {
    console.log('[UnifiedPerformancePanel] Rendering loading state');
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="text-xs font-mono text-gray-400">Loading unified performance data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('[UnifiedPerformancePanel] Rendering full component');

  const getSignalColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-400';
      case 'SHORT': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price > 1 ? 2 : 6
    }).format(price);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatLastUpdated = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-2">
      {/* Technical Analysis Header */}
      {technicalData?.success && (
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-gray-400">Technical Signal</span>
              <span className={`text-xs font-mono ${getSignalColor(technicalData.signal.direction)}`}>
                {technicalData.signal.direction} {technicalData.signal.confidence}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-mono">{formatPrice(technicalData.currentPrice)}</p>
                <p className={`text-xs font-mono ${technicalData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(technicalData.change24h)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {technicalData.analysis.trend === 'BULLISH' ? 
                    <TrendingUp className="h-3 w-3 text-green-400" /> : 
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  }
                  <span className="text-xs font-mono">{technicalData.analysis.trend}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Technical Indicators */}
        {technicalData?.success && (
          <>
            <Card className="border-gray-800 bg-gray-900 text-white">
              <CardContent className="p-2">
                <div className="text-xs font-mono text-gray-400">RSI</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono">{technicalData.indicators.rsi.toFixed(1)}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    technicalData.indicators.rsi > 70 ? 'bg-red-400' : 
                    technicalData.indicators.rsi < 30 ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900 text-white">
              <CardContent className="p-2">
                <div className="text-xs font-mono text-gray-400">MACD</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono">{technicalData.indicators.macd.toFixed(1)}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    technicalData.indicators.macd > technicalData.indicators.signal ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Performance Metrics */}
        {performanceData && (
          <>
            {/* Top Timeframe */}
            {performanceData.timeframes.length > 0 && (
              <Card className="border-gray-800 bg-gray-900 text-white">
                <CardContent className="p-2">
                  <div className="text-xs font-mono text-gray-400">Best TF</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">{performanceData.timeframes[0].timeframe}</span>
                    <span className={`text-xs font-mono ${
                      performanceData.timeframes[0].actualAccuracy > 60 ? 'text-green-400' : 
                      performanceData.timeframes[0].actualAccuracy > 45 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {performanceData.timeframes[0].actualAccuracy}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Indicator */}
            {performanceData.indicators.length > 0 && (
              <Card className="border-gray-800 bg-gray-900 text-white">
                <CardContent className="p-2">
                  <div className="text-xs font-mono text-gray-400">Best Ind</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">{performanceData.indicators[0].indicator}</span>
                    <span className={`text-xs font-mono ${
                      performanceData.indicators[0].hitRate > 0.6 ? 'text-green-400' : 
                      performanceData.indicators[0].hitRate > 0.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(performanceData.indicators[0].hitRate * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Performance Summary */}
      {performanceData && performanceData.timeframes.length > 0 && (
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="flex items-center gap-1 mb-2">
              <Activity className="h-3 w-3 text-gray-400" />
              <span className="text-xs font-mono text-gray-400">Performance Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {performanceData.timeframes.slice(0, 3).map((tf) => (
                <div key={tf.timeframe} className="text-center">
                  <div className="font-mono text-gray-400">{tf.timeframe}</div>
                  <div className={`font-mono ${
                    tf.actualAccuracy > 60 ? 'text-green-400' : 
                    tf.actualAccuracy > 45 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {tf.actualAccuracy}%
                  </div>
                </div>
              ))}
            </div>
            {performanceData.recommendations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-800">
                <div className="text-xs font-mono text-gray-300 leading-tight">
                  • {performanceData.recommendations[0].substring(0, 80)}...
                </div>
                <div className="text-xs font-mono text-gray-500 mt-1">
                  Updated: {formatLastUpdated(performanceData.lastUpdated)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}