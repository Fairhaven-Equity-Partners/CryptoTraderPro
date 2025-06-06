import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

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

export default function PerformanceDashboard() {
  const { data: metrics, isLoading, error } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/performance-metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card className="w-full border-gray-800 bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Analytics
          </CardTitle>
          <CardDescription className="text-gray-400">
            Loading prediction accuracy metrics...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="w-full border-gray-800 bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Analytics
          </CardTitle>
          <CardDescription className="text-red-400">
            Performance data will be available after sufficient predictions are recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            The system needs at least 10 completed predictions to generate meaningful performance analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatLastUpdated = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Timeframe Performance */}
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Timeframe Performance
          </CardTitle>
          <CardDescription className="text-gray-400">
            Accuracy across different timeframes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.timeframes.length > 0 ? (
            metrics.timeframes.slice(0, 5).map((tf) => (
              <div key={tf.timeframe} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {tf.timeframe}
                  </Badge>
                  <span className="text-sm text-gray-300">
                    {tf.successfulSignals}/{tf.totalSignals} predictions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    tf.hitRate >= 0.6 ? 'text-green-400' : 
                    tf.hitRate >= 0.4 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(tf.hitRate)}
                  </span>
                  {tf.hitRate >= 0.5 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No timeframe data available yet</p>
          )}
        </CardContent>
      </Card>

      {/* Top Indicators */}
      <Card className="border-gray-800 bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indicator Performance
          </CardTitle>
          <CardDescription className="text-gray-400">
            Most accurate technical indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.indicators.length > 0 ? (
            metrics.indicators.slice(0, 5).map((indicator) => (
              <div key={indicator.indicator} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">
                    {indicator.indicator.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <div className="text-xs text-gray-400">
                    {indicator.successfulPredictions}/{indicator.totalPredictions} hits
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    indicator.hitRate >= 0.6 ? 'text-green-400' : 
                    indicator.hitRate >= 0.4 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(indicator.hitRate)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {indicator.averageReturn > 0 ? '+' : ''}{indicator.averageReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No indicator data available yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-gray-800 bg-gray-900 text-white lg:col-span-2">
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription className="text-gray-400">
            AI-generated suggestions to improve prediction accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recommendations.length > 0 ? (
            <div className="space-y-2">
              {metrics.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Recommendations will appear after the system analyzes prediction patterns
            </p>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Last updated: {formatLastUpdated(metrics.lastUpdated)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}