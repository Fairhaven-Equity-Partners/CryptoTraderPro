import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Filter } from 'lucide-react';

interface MarketSignal {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  timeframe: string;
  volume: number;
  marketCap: number;
}

interface HeatmapProps {
  onAssetSelect?: (symbol: string) => void;
}

export default function MarketHeatmap({ onAssetSelect }: HeatmapProps) {
  const [marketData, setMarketData] = useState<MarketSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [sortBy, setSortBy] = useState<'signal' | 'change' | 'volume'>('signal');

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Simulate market-wide signal analysis
      const cryptoSymbols = [
        { symbol: 'BTC/USDT', name: 'Bitcoin', cap: 2000000000000 },
        { symbol: 'ETH/USDT', name: 'Ethereum', cap: 300000000000 },
        { symbol: 'XRP/USDT', name: 'Ripple', cap: 120000000000 },
        { symbol: 'ADA/USDT', name: 'Cardano', cap: 35000000000 },
        { symbol: 'SOL/USDT', name: 'Solana', cap: 60000000000 },
        { symbol: 'DOT/USDT', name: 'Polkadot', cap: 15000000000 },
        { symbol: 'MATIC/USDT', name: 'Polygon', cap: 10000000000 },
        { symbol: 'AVAX/USDT', name: 'Avalanche', cap: 12000000000 },
        { symbol: 'LINK/USDT', name: 'Chainlink', cap: 8000000000 },
        { symbol: 'BNB/USDT', name: 'Binance Coin', cap: 90000000000 },
        { symbol: 'DOGE/USDT', name: 'Dogecoin', cap: 15000000000 },
        { symbol: 'LTC/USDT', name: 'Litecoin', cap: 8000000000 },
        { symbol: 'UNI/USDT', name: 'Uniswap', cap: 7000000000 },
        { symbol: 'ATOM/USDT', name: 'Cosmos', cap: 4000000000 },
        { symbol: 'FIL/USDT', name: 'Filecoin', cap: 3000000000 },
        { symbol: 'ICP/USDT', name: 'Internet Computer', cap: 5000000000 }
      ];

      const signals = ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL'] as const;
      const timeframes = ['1h', '4h', '1d', '3d', '1w'];

      const mockData: MarketSignal[] = cryptoSymbols.map(crypto => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: Math.random() * 100000 + 100,
        change24h: (Math.random() - 0.5) * 20, // -10% to +10%
        signal: signals[Math.floor(Math.random() * signals.length)],
        confidence: Math.random() * 40 + 60, // 60-100%
        timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
        volume: Math.random() * 1000000000 + 10000000, // 10M - 1B
        marketCap: crypto.cap
      }));

      setMarketData(mockData);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'bg-green-600 text-white';
      case 'BUY': return 'bg-green-400 text-white';
      case 'NEUTRAL': return 'bg-gray-400 text-white';
      case 'SELL': return 'bg-red-400 text-white';
      case 'STRONG_SELL': return 'bg-red-600 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 5) return 'text-green-600 font-bold';
    if (change > 0) return 'text-green-500';
    if (change < -5) return 'text-red-600 font-bold';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const filteredData = marketData.filter(asset => {
    if (filter === 'buy') return asset.signal === 'BUY' || asset.signal === 'STRONG_BUY';
    if (filter === 'sell') return asset.signal === 'SELL' || asset.signal === 'STRONG_SELL';
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'signal':
        const signalOrder = { 'STRONG_BUY': 5, 'BUY': 4, 'NEUTRAL': 3, 'SELL': 2, 'STRONG_SELL': 1 };
        return signalOrder[b.signal] - signalOrder[a.signal];
      case 'change':
        return Math.abs(b.change24h) - Math.abs(a.change24h);
      case 'volume':
        return b.volume - a.volume;
      default:
        return 0;
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Market-Wide Signal Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMarketData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All Signals</TabsTrigger>
              <TabsTrigger value="buy">Buy Signals</TabsTrigger>
              <TabsTrigger value="sell">Sell Signals</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="signal">Signal Strength</option>
                <option value="change">Price Change</option>
                <option value="volume">Volume</option>
              </select>
            </div>
          </div>

          <TabsContent value={filter} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sortedData.map((asset) => (
                <Card 
                  key={asset.symbol}
                  className="cursor-pointer hover:shadow-md transition-shadow border"
                  onClick={() => onAssetSelect?.(asset.symbol)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{asset.symbol.split('/')[0]}</div>
                        <div className="text-xs text-gray-500">{asset.name}</div>
                      </div>
                      <Badge className={`${getSignalColor(asset.signal)} text-xs px-2 py-1`}>
                        {asset.signal.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Price:</span>
                        <span className="text-sm font-medium">
                          ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">24h Change:</span>
                        <span className={`text-sm ${getChangeColor(asset.change24h)}`}>
                          {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Confidence:</span>
                        <span className="text-sm font-medium">{asset.confidence.toFixed(0)}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Timeframe:</span>
                        <span className="text-sm">{asset.timeframe}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Volume:</span>
                        <span className="text-xs">
                          ${(asset.volume / 1000000).toFixed(0)}M
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No assets found matching the current filter
          </div>
        )}
      </CardContent>
    </Card>
  );
}