import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

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

export default function CompactPerformanceDashboard() {
  const { data: metrics, isLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/performance-metrics'],
    refetchInterval: 60000,
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardContent className="p-3">
            <div className="text-xs text-gray-400">Loading performance data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatLastUpdated = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Timeframe Performance - Ultra Compact */}
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-1">
            <Target className="h-3 w-3" />
            Timeframe Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="space-y-1">
            {metrics.timeframes.slice(0, 3).map((tf) => (
              <div key={tf.timeframe} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-300">{tf.timeframe}</span>
                <div className="flex items-center gap-1">
                  <span className={`font-mono ${
                    tf.actualAccuracy > 60 ? 'text-green-400' : 
                    tf.actualAccuracy > 45 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {tf.actualAccuracy}%
                  </span>
                  {tf.actualAccuracy > 60 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Indicators - Ultra Compact */}
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono flex items-center gap-1">
            <Target className="h-3 w-3" />
            Top Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="space-y-1">
            {metrics.indicators.slice(0, 3).map((indicator) => (
              <div key={indicator.indicator} className="flex items-center justify-between text-xs">
                <span className="font-mono text-gray-300">{indicator.indicator}</span>
                <span className={`font-mono ${
                  indicator.hitRate > 0.6 ? 'text-green-400' : 
                  indicator.hitRate > 0.5 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {Math.round(indicator.hitRate * 100)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations - Ultra Compact */}
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono">AI Optimization</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          {metrics.recommendations.length > 0 ? (
            <div className="space-y-1">
              {metrics.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-xs text-gray-300 leading-tight">
                  • {rec.substring(0, 60)}...
                </div>
              ))}
              <div className="text-xs text-gray-500 mt-1">
                Updated: {formatLastUpdated(metrics.lastUpdated)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">Analyzing patterns...</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}