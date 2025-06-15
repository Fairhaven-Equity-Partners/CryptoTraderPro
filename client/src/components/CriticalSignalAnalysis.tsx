import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

interface Signal {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  price: number;
  strength: number;
  timeframe: string;
}

const CriticalSignalAnalysis: React.FC = () => {
  const topSymbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  
  const signalQueries = topSymbols.map(symbol => 
    useQuery({
      queryKey: ['/api/signals', symbol],
      refetchInterval: 15000, // Update every 15 seconds for critical signals
      select: (data) => Array.isArray(data) ? data[0] : null // Get the latest signal
    })
  );

  const { data: confluenceData } = useQuery({
    queryKey: ['/api/confluence-analysis/BTC/USDT'],
    refetchInterval: 30000,
  });

  const isLoading = signalQueries.some(query => query.isLoading);
  const signals = signalQueries.map(query => query.data).filter(Boolean) as Signal[];

  const getSignalIcon = (direction: string) => {
    switch (direction) {
      case 'LONG':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'SHORT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getSignalColor = (direction: string) => {
    switch (direction) {
      case 'LONG':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'SHORT':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-600';
    if (confidence >= 60) return 'bg-blue-600';
    if (confidence >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes('BTC')) return `$${price.toLocaleString()}`;
    if (price > 1000) return `$${price.toLocaleString()}`;
    if (price > 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const highConfidenceSignals = Array.isArray(signals) ? signals.filter(signal => signal && signal.confidence >= 70) : [];
  
  // Enhanced confluence score calculation based on external testing findings
  const confluenceScore = (() => {
    if (!confluenceData) return 0;
    
    // Primary: Direct confluence field (added in backend fix)
    if (typeof confluenceData.confluence === 'number') {
      return confluenceData.confluence;
    }
    
    // Fallback: ConfluenceAnalysis object
    if (confluenceData.confluenceAnalysis) {
      const analysis = confluenceData.confluenceAnalysis;
      if (typeof analysis.confluenceStrength === 'number') {
        return analysis.confluenceStrength;
      }
      if (typeof analysis.averageConfidence === 'number') {
        return analysis.averageConfidence;
      }
    }
    
    return 0;
  })();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Signal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Critical Signal Analysis
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {highConfidenceSignals.length} High Confidence
            </Badge>
            {confluenceScore > 0 && (
              <Badge variant="secondary" className="text-xs">
                Confluence: {confluenceScore}/100
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No signals available
            </div>
          ) : (
            signals.map((signal, index) => (
              <div
                key={`${signal.symbol}-${index}`}
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  signal.confidence >= 70 ? 'border-primary/30 bg-primary/5' : 'border-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full border ${getSignalColor(signal.direction)}`}>
                    {getSignalIcon(signal.direction)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {signal.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {signal.direction} • {signal.timeframe}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Price: {formatPrice(signal.price, signal.symbol)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Timeframe: {signal.timeframe}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getConfidenceColor(signal.confidence)}`}>
                      {signal.confidence}%
                    </div>
                    {signal.confidence >= 80 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Strong
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Signal Summary Footer */}
        {signals.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-muted-foreground">Total Signals</div>
                <div className="text-lg font-semibold">{signals.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">High Confidence</div>
                <div className="text-lg font-semibold text-green-600">{highConfidenceSignals.length}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
                <div className="text-lg font-semibold">
                  {Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Strength Score</div>
                <div className="text-lg font-semibold">
                  {Math.round(signals.reduce((sum, s) => sum + s.strength, 0) / signals.length)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CriticalSignalAnalysis;