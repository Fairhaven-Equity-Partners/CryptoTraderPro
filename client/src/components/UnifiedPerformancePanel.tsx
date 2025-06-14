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
  selectedTimeframe: string;
  signals: Record<string, any>;
}

export default function UnifiedPerformancePanel({ symbol, selectedTimeframe, signals }: Props) {
  const { data: technicalData, isLoading: techLoading } = useQuery<TechnicalAnalysisData>({
    queryKey: ['/api/technical-analysis', symbol, selectedTimeframe],
    queryFn: () => fetch(`/api/technical-analysis/${encodeURIComponent(symbol)}?timeframe=${selectedTimeframe}`).then(res => res.json()),
    refetchInterval: 30000,
  });

  const { data: performanceData, isLoading: perfLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/performance-metrics', selectedTimeframe],
    queryFn: () => fetch(`/api/performance-metrics?timeframe=${selectedTimeframe}`).then(res => res.json()),
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

  // Get timeframe-specific signal data
  const currentSignal = signals[selectedTimeframe];
  
  const getBestTimeframe = () => {
    if (!performanceData?.timeframes || performanceData.timeframes.length === 0) return selectedTimeframe;
    return performanceData.timeframes[0].timeframe;
  };

  const getTopIndicator = () => {
    if (!performanceData?.indicators || performanceData.indicators.length === 0) return 'RSI';
    return performanceData.indicators[0].indicator;
  };

  const getAIRecommendation = () => {
    if (!currentSignal) return `Analyzing ${selectedTimeframe} timeframe`;
    const confidence = currentSignal.confidence || 0;
    const direction = currentSignal.direction || 'NEUTRAL';
    
    if (confidence > 75) return `Strong ${direction} signal on ${selectedTimeframe}`;
    if (confidence > 50) return `Moderate ${direction} signal on ${selectedTimeframe}`;
    return `Low confidence on ${selectedTimeframe}`;
  };

  const getTimeframeSpecificData = () => {
    if (!currentSignal) return null;
    
    return {
      confidence: currentSignal.confidence || 0,
      direction: currentSignal.direction || 'NEUTRAL',
      entryPrice: currentSignal.entryPrice || 0,
      stopLoss: currentSignal.stopLoss || 0,
      takeProfit: currentSignal.takeProfit || 0,
      successProbability: currentSignal.successProbability || 0
    };
  };

  return (
    <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/80 to-gray-950/90 rounded-lg border border-gray-700">
      <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
        📊 Performance Analysis - {selectedTimeframe.toUpperCase()}
        <Badge className="bg-blue-900/20 text-blue-400 border-blue-800 text-xs px-2 py-0.5">
          {currentSignal ? 'Active' : 'Pending'}
        </Badge>
      </h4>
      
      {/* Technical Analysis Summary - Always show for consistency */}
      <div className="mb-3 p-2 bg-gray-900/50 rounded border border-gray-800">
        {technicalData?.success ? (
          <>
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
          </>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-slate-400">Loading {selectedTimeframe.toUpperCase()} technical analysis...</p>
          </div>
        )}
      </div>

      {/* Key Indicators Grid - Always show for consistency */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {technicalData?.success ? (
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
              {currentSignal && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Signal Confidence:</span>
                    <span className={`font-semibold ${
                      currentSignal.confidence > 75 ? 'text-green-400' : 
                      currentSignal.confidence > 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{currentSignal.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Direction:</span>
                    <span className={`font-semibold ${
                      currentSignal.direction === 'LONG' ? 'text-green-400' : 
                      currentSignal.direction === 'SHORT' ? 'text-red-400' : 'text-slate-400'
                    }`}>{currentSignal.direction}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-300">Top Indicator:</span>
                <span className="text-blue-400 font-semibold">{getTopIndicator()}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">RSI:</span>
                <span className="text-slate-400">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">MACD:</span>
                <span className="text-slate-400">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">EMA vs SMA:</span>
                <span className="text-slate-400">--</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Stochastic:</span>
                <span className="text-slate-400">--</span>
              </div>
              {currentSignal && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Signal Confidence:</span>
                    <span className={`font-semibold ${
                      currentSignal.confidence > 75 ? 'text-green-400' : 
                      currentSignal.confidence > 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{currentSignal.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Direction:</span>
                    <span className={`font-semibold ${
                      currentSignal.direction === 'LONG' ? 'text-green-400' : 
                      currentSignal.direction === 'SHORT' ? 'text-red-400' : 'text-slate-400'
                    }`}>{currentSignal.direction}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-300">Top Indicator:</span>
                <span className="text-blue-400 font-semibold">{getTopIndicator()}</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Timeframe-Specific Signal Data - Always show for consistency */}
      <div className="mt-3 p-2 bg-gray-900/50 rounded border border-gray-800">
        <h5 className="text-green-300 font-medium text-xs mb-2">📈 {selectedTimeframe.toUpperCase()} Signal Levels</h5>
        {currentSignal ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Entry:</span>
              <span className="text-white font-medium">${currentSignal.entryPrice?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Success Rate:</span>
              <span className="text-green-400 font-medium">{currentSignal.successProbability || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stop Loss:</span>
              <span className="text-red-400 font-medium">${currentSignal.stopLoss?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Take Profit:</span>
              <span className="text-green-400 font-medium">${currentSignal.takeProfit?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-2">
            Signal calculating for {selectedTimeframe.toUpperCase()} timeframe...
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="mt-2 text-xs text-slate-400">
        {getAIRecommendation()} • System continuously learns from prediction accuracy
      </div>
    </div>
  );
}