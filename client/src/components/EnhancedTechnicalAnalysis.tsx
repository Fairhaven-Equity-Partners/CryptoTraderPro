/**
 * Enhanced Technical Analysis Component
 * Displays real technical indicators using historical data
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

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
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Enhanced Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Activity className="h-5 w-5" />
            Technical Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Unable to load technical analysis data. Historical data may be insufficient.
          </p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  const getSignalColor = (direction: string) => {
    switch (direction) {
      case 'LONG': return 'bg-green-500';
      case 'SHORT': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'BULLISH' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
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
    <div className="space-y-6">
      {/* Main Signal Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Enhanced Technical Analysis - {symbol}
            </div>
            <Badge className={getSignalColor(data.signal.direction)}>
              {data.signal.direction} {data.signal.confidence}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Info */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold">{formatPrice(data.currentPrice)}</p>
              <p className={`text-sm ${data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(data.change24h)} (24h)
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                {getTrendIcon(data.analysis.trend)}
                <span className="text-sm font-medium">{data.analysis.trend}</span>
              </div>
              <p className="text-sm text-gray-600">{data.analysis.momentum} Momentum</p>
            </div>
          </div>

          {/* Signal Confidence */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Signal Confidence</span>
              <span>{data.signal.confidence}%</span>
            </div>
            <Progress value={data.signal.confidence} className="h-2" />
          </div>

          {/* Signal Reasoning */}
          <div>
            <h4 className="text-sm font-medium mb-2">Analysis Reasoning:</h4>
            <ul className="space-y-1">
              {data.signal.reasoning.map((reason, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* RSI */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">RSI (14)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{data.indicators.rsi.toFixed(1)}</span>
                <Badge variant={data.indicators.rsi > 70 ? 'destructive' : data.indicators.rsi < 30 ? 'default' : 'secondary'}>
                  {data.indicators.rsi > 70 ? 'Overbought' : data.indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                </Badge>
              </div>
              <Progress value={data.indicators.rsi} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* MACD */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">MACD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{data.indicators.macd.toFixed(2)}</span>
                <Badge variant={data.indicators.macd > data.indicators.signal ? 'default' : 'destructive'}>
                  {data.indicators.macd > data.indicators.signal ? 'Bullish' : 'Bearish'}
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                Signal: {data.indicators.signal.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moving Averages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Moving Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>EMA(12):</span>
                <span className="font-medium">{formatPrice(data.indicators.ema12)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>SMA(20):</span>
                <span className="font-medium">{formatPrice(data.indicators.sma20)}</span>
              </div>
              <Badge variant={data.indicators.ema12 > data.indicators.sma20 ? 'default' : 'destructive'} className="w-full justify-center">
                {data.indicators.ema12 > data.indicators.sma20 ? 'Bullish Cross' : 'Bearish Cross'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Bollinger Bands */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bollinger Bands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Upper:</span>
                <span className="font-medium">{formatPrice(data.indicators.upperBB)}</span>
              </div>
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-bold">{formatPrice(data.currentPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lower:</span>
                <span className="font-medium">{formatPrice(data.indicators.lowerBB)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stochastic */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Stochastic %K</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{data.indicators.stochK.toFixed(1)}</span>
                <Badge variant={data.indicators.stochK > 80 ? 'destructive' : data.indicators.stochK < 20 ? 'default' : 'secondary'}>
                  {data.indicators.stochK > 80 ? 'Overbought' : data.indicators.stochK < 20 ? 'Oversold' : 'Neutral'}
                </Badge>
              </div>
              <Progress value={data.indicators.stochK} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Support/Resistance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Target className="h-4 w-4" />
              Support & Resistance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Resistance:</span>
                <span className="font-medium text-red-600">{formatPrice(data.analysis.resistance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current:</span>
                <span className="font-bold">{formatPrice(data.currentPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Support:</span>
                <span className="font-medium text-green-600">{formatPrice(data.analysis.support)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Market Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Trend Analysis</p>
              <p className="text-gray-600">{data.analysis.trend} trend confirmed by moving averages</p>
            </div>
            <div>
              <p className="font-medium">Momentum</p>
              <p className="text-gray-600">{data.analysis.momentum} momentum indicators</p>
            </div>
            <div>
              <p className="font-medium">Volatility</p>
              <p className="text-gray-600">{data.analysis.volatility} volatility environment</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}