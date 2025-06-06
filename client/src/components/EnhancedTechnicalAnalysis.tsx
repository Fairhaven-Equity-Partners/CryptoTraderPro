/**
 * Enhanced Technical Analysis Component
 * Displays real technical indicators using historical data
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

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

interface Props {
  symbol: string;
}

export function EnhancedTechnicalAnalysis({ symbol }: Props) {
  const { data, isLoading, error, refetch } = useQuery<TechnicalAnalysisData>({
    queryKey: ['/api/technical-analysis', symbol],
    queryFn: () => fetch(`/api/technical-analysis/${encodeURIComponent(symbol)}`).then(res => res.json()),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardContent className="p-3">
          <div className="text-xs text-gray-400">Loading technical analysis...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.success) {
    return (
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs">Technical Analysis Error</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-gray-400 mb-2">
            Unable to load technical analysis data.
          </p>
          <button 
            onClick={() => refetch()} 
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'text-green-400';
      case 'SHORT': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'BULLISH' ? 
      <TrendingUp className="h-3 w-3 text-green-400" /> : 
      <TrendingDown className="h-3 w-3 text-red-400" />;
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

  return (
    <div className="space-y-2">
      {/* Compact Signal Card */}
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center justify-between">
            <span>Technical Analysis</span>
            <span className={`text-xs font-mono ${getSignalColor(data.signal.direction)}`}>
              {data.signal.direction} {data.signal.confidence}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <div>
              <p className="text-sm font-mono">{formatPrice(data.currentPrice)}</p>
              <p className={`text-xs font-mono ${data.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(data.change24h)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                {getTrendIcon(data.analysis.trend)}
                <span className="text-xs font-mono">{data.analysis.trend}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Technical Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="text-xs font-mono text-gray-400">RSI</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">{data.indicators.rsi.toFixed(1)}</span>
              <div className={`w-2 h-2 rounded-full ${
                data.indicators.rsi > 70 ? 'bg-red-400' : 
                data.indicators.rsi < 30 ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="text-xs font-mono text-gray-400">MACD</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">{data.indicators.macd.toFixed(1)}</span>
              <div className={`w-2 h-2 rounded-full ${
                data.indicators.macd > data.indicators.signal ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="text-xs font-mono text-gray-400">EMA</div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono">${data.indicators.ema12.toFixed(0)}</span>
              <div className={`w-2 h-2 rounded-full ${
                data.indicators.ema12 > data.indicators.sma20 ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-2">
            <div className="text-xs font-mono text-gray-400">STOCH</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono">{data.indicators.stochK.toFixed(1)}</span>
              <div className={`w-2 h-2 rounded-full ${
                data.indicators.stochK > 80 ? 'bg-red-400' : 
                data.indicators.stochK < 20 ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}