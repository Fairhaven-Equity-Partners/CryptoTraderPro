import React from 'react';
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";

// Types for technical analysis data - Updated to match actual API response
interface TechnicalAnalysisData {
  success: boolean;
  symbol: string;
  currentPrice: number;
  timeframe: string;
  timestamp: string;
  dataSource: string;
  marketData: {
    volume24h: number;
    change24h: number;
    volatility: number;
  };
  indicators: {
    rsi: {
      value: number;
      signal: string;
      status: string;
      strength: string;
    };
    macd: {
      value: number;
      signal: number;
      histogram: number;
      crossover: string;
      strength: string;
    };
    ema: {
      value: number;
      signal: string;
      deviation: number;
    };
    sma: {
      value: number;
      signal: string;
      deviation: number;
    };
    stochastic: {
      k: number;
      d: number;
      signal: string;
      status: string;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
      position: string;
      squeeze: boolean;
    };
  };
  analysis: {
    trend: string;
    strength: string;
    recommendation: string;
    confidence: number;
  };
}

// Types for performance metrics - Updated to match actual API response
interface PerformanceMetrics {
  indicators: Array<{
    indicator: string;
    value: string | number;
    status: string;
    change: string;
  }>;
  timeframes?: Array<{
    timeframe: string;
    actualAccuracy: number;
  }>;
  symbols?: Array<{
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
    queryFn: () => fetch(`/api/technical-analysis/${encodeURIComponent(symbol)}?timeframe=${selectedTimeframe`}`).then(res => res.json()),
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

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '$0.00';
    return `$${price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })`}`;
  };

  const formatPercent = (percent: number | undefined) => {
    if (percent === undefined || percent === null) return '+0.00%';
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}`%`;
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
    if (!currentSignal) return `Analyzing ${selectedTimeframe} timefram`e`;
    const confidence = currentSignal.confidence || 0;
    const direction = currentSignal.direction || 'NEUTRAL';
    
    if (confidence > 75) return `Strong ${direction} signal on ${selectedTimeframe`}`;
    if (confidence > 50) return `Moderate ${direction} signal on ${selectedTimeframe`}`;
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
              <span className="text-xs text-slate-300">Analysis</span>
              <span className={`text-xs font-semibold ${
                technicalData.analysis?.recommendation === 'BUY' ? 'text-green-400' : 
                technicalData.analysis?.recommendation === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {technicalData.analysis?.recommendation || 'HOLD'} {Math.round(technicalData.analysis?.confidence || 0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-white">{formatPrice(technicalData.currentPrice || 0)}</p>
                <p className={`text-xs ${(technicalData.marketData?.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(technicalData.marketData?.change24h || 0)}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {technicalData.analysis?.trend === 'BULLISH' ? 
                    <TrendingUp className="h-3 w-3 text-green-400" /> : 
                    technicalData.analysis?.trend === 'BEARISH' ?
                    <TrendingDown className="h-3 w-3 text-red-400" /> :
                    <TrendingUp className="h-3 w-3 text-yellow-400" />
                  }
                  <span className="text-xs text-slate-300">{technicalData.analysis?.trend || 'SIDEWAYS'}</span>
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
                  (technicalData.indicators.rsi?.value || 0) > 70 ? 'text-red-400' : 
                  (technicalData.indicators.rsi?.value || 0) < 30 ? 'text-green-400' : 'text-white'
                }`}>{technicalData.indicators.rsi?.value?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">MACD:</span>
                <span className={`font-semibold ${
                  (technicalData.indicators.macd?.value || 0) > (technicalData.indicators.macd?.signal || 0) ? 'text-green-400' : 'text-red-400'
                }`}>{technicalData.indicators.macd?.value?.toFixed(3) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">EMA:</span>
                <span className={`font-semibold ${
                  (technicalData.indicators.ema?.value || 0) > (technicalData.indicators.sma?.value || 0) ? 'text-green-400' : 'text-red-400'
                }`}>${Math.round(technicalData.indicators.ema?.value || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Stochastic:</span>
                <span className=`{`font-semibold ${
                  (technicalData.indicators.stochastic?.k || 0) > 80 ? 'text-red-400' : 
                  (technicalData.indicators.stochastic?.k || 0) < 20 ? 'text-green-400' : 'text-white'
                }`}>{technicalData.indicators.stochastic?.k?.toFixed(1) || 'N/A'}%</span>
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

      {/* Performance Metrics Section */}
      {performanceData?.indicators && performanceData.indicators.length > 0 && (
        <div className="mt-3 p-2 bg-gray-900/50 rounded border border-gray-800">
          <h5 className="text-blue-300 font-medium text-xs mb-2">📊 Performance Analysis</h5>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {performanceData.indicators.map((indicator, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-slate-300">{indicator.indicator}:</span>
                <div className="flex items-center gap-1">
                  <span className=`{`font-medium ${
                    indicator.status === 'GOOD' ? 'text-green-400' : 
                    indicator.status === 'WARNING' ? 'text-yellow-400' : 
                    indicator.status === 'CRITICAL' ? 'text-red-400' : 'text-white'
                  }`}>
                    {typeof indicator.value === 'number' ? indicator.value.toFixed(1) : indicator.value}
                  </span>
                  <span className={`text-xs ${
                    indicator.change.includes('+') ? 'text-green-400' : 
                    indicator.change.includes('-') ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {indicator.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="mt-2 text-xs text-slate-400">
        {getAIRecommendation()} • System continuously learns from prediction accuracy
      </div>
    </div>
  );
}