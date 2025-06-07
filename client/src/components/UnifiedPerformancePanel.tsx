import React from 'react';
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";

// Types for technical analysis data
interface TechnicalAnalysisData {
  success: boolean;
  symbol: string;
  currentPrice: number;
  change24h: number;
  signal: {
    direction: string;
    confidence: number;
  };
  analysis: {
    trend: string;
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
}

// Types for performance metrics
interface PerformanceMetrics {
  indicators: Array<{
    indicator: string;
    hitRate: number;
    signalQuality: number;
  }>;
  timeframes: Array<{
    timeframe: string;
    actualAccuracy: number;
  }>;
  symbols: Array<{
    symbol: string;
    avgAccuracy: number;
  }>;
}

interface Props {
  symbol: string;
}

export default function UnifiedPerformancePanel({ symbol }: Props) {
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

  if (isLoading) {
    return (
      <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/80 to-gray-950/90 rounded-lg border border-gray-700">
        <div className="text-xs text-slate-400">Loading performance analysis...</div>
      </div>
    );
  }

  const getSignalColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-400';
      case 'SHORT': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getBestTimeframe = () => {
    if (!performanceData?.timeframes || performanceData.timeframes.length === 0) return 'N/A';
    return performanceData.timeframes[0].timeframe;
  };

  const getTopIndicator = () => {
    if (!performanceData?.indicators || performanceData.indicators.length === 0) return 'RSI';
    return performanceData.indicators[0].indicator;
  };

  const getAIRecommendation = () => {
    if (!technicalData?.success) return 'Analyzing market conditions';
    const confidence = technicalData.signal.confidence;
    if (confidence > 75) return 'Strong signal detected';
    if (confidence > 50) return 'Moderate signal strength';
    return 'Low confidence signal';
  };

  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/80 to-gray-950/90 rounded-lg border border-gray-700">
      <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
        📊 Performance Analysis
        <Badge className="bg-blue-900/20 text-blue-400 border-blue-800 text-xs px-2 py-0.5">
          Live
        </Badge>
      </h4>
      
      {/* Technical Analysis Summary */}
      {technicalData?.success && (
        <div className="mb-3 p-2 bg-gray-900/50 rounded border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-300">Signal</span>
            <span className={`text-xs font-semibold ${getSignalColor(technicalData.signal.direction)}`}>
              {technicalData.signal.direction} {technicalData.signal.confidence}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-white">{formatPrice(technicalData.currentPrice)}</p>
              <p className={`text-xs ${technicalData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(technicalData.change24h)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                {technicalData.analysis.trend === 'BULLISH' ? 
                  <TrendingUp className="h-3 w-3 text-green-400" /> : 
                  <TrendingDown className="h-3 w-3 text-red-400" />
                }
                <span className="text-xs text-slate-300">{technicalData.analysis.trend}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Indicators Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {technicalData?.success && (
          <>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">RSI:</span>
                <span className={`font-semibold ${
                  technicalData.indicators.rsi > 70 ? 'text-red-400' : 
                  technicalData.indicators.rsi < 30 ? 'text-green-400' : 'text-white'
                }`}>{technicalData.indicators.rsi.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">MACD:</span>
                <span className={`font-semibold ${
                  technicalData.indicators.macd > technicalData.indicators.signal ? 'text-green-400' : 'text-red-400'
                }`}>{technicalData.indicators.macd.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">EMA vs SMA:</span>
                <span className={`font-semibold ${
                  technicalData.indicators.ema12 > technicalData.indicators.sma20 ? 'text-green-400' : 'text-red-400'
                }`}>{(technicalData.indicators.ema12 / technicalData.indicators.sma20 * 100 - 100).toFixed(2)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Stochastic:</span>
                <span className={`font-semibold ${
                  technicalData.indicators.stochK > 80 ? 'text-red-400' : 
                  technicalData.indicators.stochK < 20 ? 'text-green-400' : 'text-white'
                }`}>{technicalData.indicators.stochK.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Best Timeframe:</span>
                <span className="text-green-400 font-semibold">{getBestTimeframe()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Top Indicator:</span>
                <span className="text-blue-400 font-semibold">{getTopIndicator()}</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* AI Insights */}
      <div className="mt-2 text-xs text-slate-400">
        {getAIRecommendation()} • System continuously learns from prediction accuracy
      </div>
    </div>
  );
}