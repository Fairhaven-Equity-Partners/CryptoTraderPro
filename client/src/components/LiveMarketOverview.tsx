import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface MarketPair {
  symbol: string;
  price: number;
  change24h: number;
}

interface PerformanceMetric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

const LiveMarketOverview: React.FC = () => {
  const { data: marketPairs, isLoading: marketLoading } = useQuery({
    queryKey: ['/api/crypto/all-pairs'],
    refetchInterval: 10000, // Update every 10 seconds for top priority
  });

  const { data: performanceMetrics, isLoading: perfLoading } = useQuery({
    queryKey: ['/api/performance-metrics'],
    refetchInterval: 30000, // Less frequent for summary metrics
  });

  const { data: signalCount } = useQuery({
    queryKey: ['/api/signals/BTC/USDT'],
    refetchInterval: 15000,
    select: (data) => Array.isArray(data) ? data.length : 0
  });

  const topPairs = React.useMemo(() => {
    if (!marketPairs || !Array.isArray(marketPairs)) return [];
    return marketPairs
      .filter((pair: MarketPair) => 
        pair && pair.symbol && ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT'].includes(pair.symbol)
      )
      .slice(0, 5);
  }, [marketPairs]);

  const formatPrice = (price: number, symbol: string) => {
    if (!price || typeof price !== 'number' || isNaN(price)) return 'N/A';
    if (symbol && symbol.includes('BTC')) return `$${price.toLocaleString()}`;
    if (price > 1000) return `$${price.toLocaleString()}`;
    if (price > 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change: number) => {
    if (!change || typeof change !== 'number' || isNaN(change)) return '0.00%';
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const getMarketSentiment = () => {
    if (!topPairs.length) return { label: 'Loading...', color: 'secondary' };
    
    const positiveCount = topPairs.filter((pair: MarketPair) => 
      pair && typeof pair.change24h === 'number' && pair.change24h > 0
    ).length;
    const ratio = positiveCount / topPairs.length;
    
    if (ratio >= 0.8) return { label: 'Very Bullish', color: 'green' };
    if (ratio >= 0.6) return { label: 'Bullish', color: 'green' };
    if (ratio >= 0.4) return { label: 'Neutral', color: 'yellow' };
    if (ratio >= 0.2) return { label: 'Bearish', color: 'red' };
    return { label: 'Very Bearish', color: 'red' };
  };

  const getPerformanceSummary = () => {
    if (!performanceMetrics || !performanceMetrics.indicators || !Array.isArray(performanceMetrics.indicators)) {
      return 'Loading...';
    }
    
    const winRateMetric = performanceMetrics.indicators.find((m: any) => 
      m && m.name && (m.name.toLowerCase().includes('accuracy') || m.name.toLowerCase().includes('win'))
    );
    
    return winRateMetric ? `${winRateMetric.value}${winRateMetric.unit || ''}` : 'N/A';
  };

  const sentiment = getMarketSentiment();
  const performanceSummary = getPerformanceSummary();

  if (marketLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Market Overview
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Top Cryptocurrency Prices */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {topPairs.map((pair: MarketPair) => (
            <div 
              key={pair.symbol} 
              className="flex flex-col items-center p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="font-semibold text-sm text-foreground">
                {pair.symbol.split('/')[0]}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {formatPrice(pair.currentPrice || pair.price, pair.symbol)}
              </div>
              <div className={`flex items-center gap-1 text-xs ${
                pair.change24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {pair.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatChange(pair.change24h)}
              </div>
            </div>
          ))}
        </div>

        {/* Market Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div>
              <div className="text-sm text-muted-foreground">Market Sentiment</div>
              <Badge 
                variant={sentiment.color === 'green' ? 'default' : 
                        sentiment.color === 'red' ? 'destructive' : 'secondary'}
                className="mt-1"
              >
                {sentiment.label}
              </Badge>
            </div>
            <Activity className={`h-6 w-6 ${
              sentiment.color === 'green' ? 'text-green-600' : 
              sentiment.color === 'red' ? 'text-red-600' : 'text-yellow-600'
            }`} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div>
              <div className="text-sm text-muted-foreground">Active Signals</div>
              <div className="text-lg font-semibold">{signalCount || 0}</div>
            </div>
            <Target className="h-6 w-6 text-blue-600" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
            <div>
              <div className="text-sm text-muted-foreground">Performance</div>
              <div className="text-lg font-semibold">{performanceSummary}</div>
            </div>
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveMarketOverview;