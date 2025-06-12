import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface SimpleSignal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  timeframe: string;
  price: number;
}

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

const CRYPTO_PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT',
  'SOL/USDT', 'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'SHIB/USDT',
  'AVAX/USDT', 'LINK/USDT', 'ATOM/USDT', 'UNI/USDT', 'LTC/USDT',
  'BCH/USDT', 'ALGO/USDT', 'XLM/USDT', 'VET/USDT', 'ICP/USDT',
  'FIL/USDT', 'TRX/USDT', 'ETC/USDT', 'THETA/USDT', 'XMR/USDT',
  'EOS/USDT', 'AAVE/USDT', 'MKR/USDT', 'COMP/USDT', 'YFI/USDT',
  'SNX/USDT', 'SUSHI/USDT', 'CRV/USDT', 'BAL/USDT', 'REN/USDT',
  'KNC/USDT', 'ZRX/USDT', 'BAND/USDT', 'STORJ/USDT', 'ANT/USDT',
  'NMR/USDT', 'LRC/USDT', 'BNT/USDT', 'REP/USDT', 'MLN/USDT',
  'MANA/USDT', 'ENJ/USDT', 'BAT/USDT', 'ZIL/USDT', 'HOT/USDT'
];

export default function SimpleSignalGrid() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [signals, setSignals] = useState<SimpleSignal[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSignals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/signals/${selectedTimeframe}`);
      if (response.ok) {
        const data = await response.json();
        setSignals(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SHORT':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SHORT':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Crypto Signals</h2>
          <p className="text-gray-600">
            {signals.length} signals • Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        <Button onClick={fetchSignals} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Timeframe Selector */}
      <div className="flex flex-wrap gap-2">
        {TIMEFRAMES.map((timeframe) => (
          <Button
            key={timeframe}
            variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe(timeframe)}
          >
            {timeframe}
          </Button>
        ))}
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CRYPTO_PAIRS.map((pair) => {
          const signal = signals.find(s => s.symbol === pair) || {
            symbol: pair,
            direction: 'NEUTRAL' as const,
            confidence: 50,
            timeframe: selectedTimeframe,
            price: 0
          };

          return (
            <Card key={pair} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">{pair}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(signal.direction)}
                    <Badge className={getDirectionColor(signal.direction)}>
                      {signal.direction}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Confidence</span>
                  <span className={`text-sm font-semibold ${getConfidenceColor(signal.confidence)}`}>
                    {signal.confidence}%
                  </span>
                </div>
                {signal.price > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Price</span>
                    <span className="text-sm font-mono">
                      ${signal.price.toFixed(4)}
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-400 text-center">
                  {selectedTimeframe} timeframe
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {signals.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No signals available for {selectedTimeframe}</p>
          <Button onClick={fetchSignals} className="mt-4">
            Load Signals
          </Button>
        </div>
      )}
    </div>
  );
}