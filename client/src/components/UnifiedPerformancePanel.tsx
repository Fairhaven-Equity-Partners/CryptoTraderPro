import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { TrendingUp, TrendingDown, Target, Activity, BarChart3, Eye, Brain, Gauge, Zap } from 'lucide-react';

interface UnifiedPerformancePanelProps {
  symbol?: string;
  timeframe?: string;
  onPatternChange?: (patterns: any[]) => void;
}

interface PerformanceIndicator {
  id: string;
  name: string;
  value: number | string;
  status: 'good' | 'warning' | 'critical';
  change: number;
  description?: string;
}

interface PatternResult {
  type: string;
  category: string;
  signal: string;
  confidence: number;
  description: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  timeframe: string;
}

export default function UnifiedPerformancePanel({ 
  symbol = 'BTC/USDT', 
  timeframe = '4h',
  onPatternChange 
}: UnifiedPerformancePanelProps) {
  const [activeTab, setActiveTab] = useState('performance');

  // Performance metrics query
  const performanceQuery = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/performance-metrics');
      if (!response.ok) throw new Error('Failed to fetch performance metrics');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Pattern analysis query
  const patternQuery = useQuery({
    queryKey: ['pattern-analysis', symbol, timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/enhanced-pattern-recognition/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch pattern analysis');
      return response.json();
    },
    refetchInterval: 30000,
    enabled: !!symbol
  });

  // Multi-timeframe confluence query
  const confluenceQuery = useQuery({
    queryKey: ['confluence-analysis', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/confluence-analysis/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Failed to fetch confluence analysis');
      return response.json();
    },
    refetchInterval: 60000,
    enabled: !!symbol
  });

  // Notify parent component of pattern changes for integration with auto-calculations
  useEffect(() => {
    if (patternQuery.data?.patterns && onPatternChange) {
      onPatternChange(patternQuery.data.patterns);
    }
  }, [patternQuery.data, onPatternChange]);

  const renderPerformanceMetrics = () => {
    if (performanceQuery.isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    if (performanceQuery.error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">⚠️ Performance Data Unavailable</div>
          <div className="text-gray-400 text-sm">
            {performanceQuery.error?.message || 'Unable to load performance metrics'}
          </div>
          <button 
            onClick={() => performanceQuery.refetch()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }

    const metrics = performanceQuery.data?.indicators || [];
    
    if (metrics.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">📊 No Performance Data</div>
          <div className="text-gray-500 text-sm">
            Performance metrics are being calculated...
          </div>
          <button 
            onClick={() => performanceQuery.refetch()}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.slice(0, 4).map((metric: PerformanceIndicator, index: number) => (
            <Card key={index} className="bg-secondary border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{metric.name}</p>
                    <p className="text-lg font-bold text-white">{metric.value}</p>
                    {metric.description && (
                      <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      metric.status === 'good' ? 'default' : 
                      metric.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {metric.status.toUpperCase()}
                    </Badge>
                    {metric.change !== undefined && metric.change !== 0 && (
                      <p className={`text-xs mt-1 ${metric.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change}%
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {metrics.length > 4 && (
          <div className="space-y-2">
            {metrics.slice(4).map((metric: PerformanceIndicator, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded border border-gray-700">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-300">{metric.name}</span>
                  {metric.description && (
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{metric.value}</span>
                  <Badge variant={
                    metric.status === 'good' ? 'default' : 
                    metric.status === 'warning' ? 'secondary' : 'destructive'
                  } className="text-xs">
                    {metric.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-gray-300">
              {performanceQuery.data?.lastUpdated ? 
                new Date(performanceQuery.data.lastUpdated).toLocaleTimeString() : 
                'Unknown'
              }
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPatternAnalysis = () => {
    if (patternQuery.isLoading) {
      return <div className="text-center py-4">Analyzing patterns...</div>;
    }

    if (patternQuery.error || !patternQuery.data?.patterns) {
      return <div className="text-center py-4 text-red-400">Pattern analysis unavailable</div>;
    }

    const patterns = patternQuery.data.patterns;
    const totalPatterns = patterns.length;
    const strongPatterns = patterns.filter((p: PatternResult) => p.strength === 'STRONG').length;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-secondary border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Patterns Detected</p>
                  <p className="text-lg font-bold text-white">{totalPatterns}</p>
                </div>
                <Eye className="h-5 w-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Strong Signals</p>
                  <p className="text-lg font-bold text-white">{strongPatterns}</p>
                </div>
                <Target className="h-5 w-5 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {patterns.slice(0, 3).map((pattern: PatternResult, index: number) => (
            <Card key={index} className="bg-secondary border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={pattern.signal === 'BUY' ? 'default' : pattern.signal === 'SELL' ? 'destructive' : 'secondary'}>
                        {pattern.signal}
                      </Badge>
                      <span className="text-sm font-medium text-white">{pattern.type}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{pattern.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{pattern.confidence}%</p>
                    <Badge variant="outline" className="text-xs">
                      {pattern.strength}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderConfluenceAnalysis = () => {
    if (confluenceQuery.isLoading) {
      return <div className="text-center py-4">Analyzing confluence...</div>;
    }

    if (confluenceQuery.error || !confluenceQuery.data?.confluenceAnalysis) {
      return <div className="text-center py-4 text-red-400">Confluence analysis unavailable</div>;
    }

    const confluence = confluenceQuery.data.confluenceAnalysis;

    return (
      <div className="space-y-4">
        <Card className="bg-secondary border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Multi-Timeframe Confluence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Overall Direction</span>
              <Badge variant={confluence.overallDirection === 'BULLISH' ? 'default' : 'destructive'}>
                {confluence.overallDirection}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Confluence Strength</span>
                <span className="text-white font-bold">{confluence.confluenceStrength}%</span>
              </div>
              <Progress value={confluence.confluenceStrength} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">{confluence.summary?.totalBullishSignals || 0}</p>
                <p className="text-xs text-gray-400">Bullish Signals</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-400">{confluence.summary?.totalBearishSignals || 0}</p>
                <p className="text-xs text-gray-400">Bearish Signals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card className="bg-secondary border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Gauge className="h-5 w-5 text-blue-400" />
          Performance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-700">
            <TabsTrigger value="performance" className="text-gray-300">Performance</TabsTrigger>
            <TabsTrigger value="patterns" className="text-gray-300">Pattern Analysis</TabsTrigger>
            <TabsTrigger value="confluence" className="text-gray-300">Multi-Timeframe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="mt-4">
            {renderPerformanceMetrics()}
          </TabsContent>
          
          <TabsContent value="patterns" className="mt-4">
            {renderPatternAnalysis()}
          </TabsContent>
          
          <TabsContent value="confluence" className="mt-4">
            {renderConfluenceAnalysis()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}