import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Activity, BarChart3, Eye } from 'lucide-react';

interface PatternResult {
  type: string;
  category: string;
  signal: string;
  confidence: number;
  description: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  timeframe: string;
  pair: string;
  timestamp: string;
}

interface PatternAnalysisResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  currentPrice: number;
  timestamp: string;
  patternAnalysis: {
    patterns: PatternResult[];
    summary: {
      totalPatterns: number;
      bullishSignals: number;
      bearishSignals: number;
      neutralSignals: number;
      averageConfidence: number;
      strongPatterns: number;
    };
    insights: {
      primarySignal: string;
      confidence: number;
      reasoning: string[];
      recommendations: string[];
    };
  };
  systemRating: number;
  confidence: number;
}

interface ConfluenceAnalysisResponse {
  success: boolean;
  symbol: string;
  timestamp: string;
  confluenceAnalysis: {
    overallDirection: string;
    confluenceStrength: number;
    averageConfidence: number;
    timeframeResults: Array<{
      timeframe: string;
      patterns: number;
      bullishSignals: number;
      bearishSignals: number;
      confidence: number;
      primarySignal: string;
    }>;
    summary: {
      totalBullishSignals: number;
      totalBearishSignals: number;
      analyzedTimeframes: number;
    };
  };
  systemRating: number;
}

interface PatternAnalysisDisplayProps {
  symbol?: string;
  timeframe?: string;
}

export function PatternAnalysisDisplay({ symbol = 'BTC/USDT', timeframe = '1d' }: PatternAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState('patterns');

  const patternQuery = useQuery({
    queryKey: ['pattern-analysis', symbol, timeframe],
    queryFn: async (): Promise<PatternAnalysisResponse> => {
      const response = await fetch(`/api/pattern-analysis/${encodeURIComponent(symbol)}?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch pattern analysis');
      return response.json();
    },
    refetchInterval: 30000,
    enabled: !!symbol
  });

  const confluenceQuery = useQuery({
    queryKey: ['confluence-analysis', symbol],
    queryFn: async (): Promise<ConfluenceAnalysisResponse> => {
      const response = await fetch(`/api/confluence-analysis/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Failed to fetch confluence analysis');
      return response.json();
    },
    refetchInterval: 60000,
    enabled: !!symbol
  });

  const getSignalIcon = (signal: string) => {
    if (signal.includes('bullish') || signal.includes('buy') || signal.includes('bounce')) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (signal.includes('bearish') || signal.includes('sell') || signal.includes('pullback')) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-yellow-500" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'STRONG': return 'bg-green-500';
      case 'MODERATE': return 'bg-yellow-500';
      case 'WEAK': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'BULLISH': return 'text-green-600 bg-green-50';
      case 'BEARISH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Advanced Pattern Analysis
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{symbol}</Badge>
              <Badge variant="secondary">{timeframe}</Badge>
              {patternQuery.data && (
                <Badge variant="default" className="bg-blue-600">
                  Rating: {patternQuery.data.systemRating}/100
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patterns">Pattern Detection</TabsTrigger>
              <TabsTrigger value="confluence">Multi-Timeframe</TabsTrigger>
              <TabsTrigger value="insights">Market Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="patterns" className="space-y-4">
              {patternQuery.isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Analyzing patterns...</p>
                </div>
              )}

              {patternQuery.data && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-center">
                          {patternQuery.data.patternAnalysis.summary.totalPatterns}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">Total Patterns</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-center text-green-600">
                          {patternQuery.data.patternAnalysis.summary.bullishSignals}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">Bullish Signals</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-center text-red-600">
                          {patternQuery.data.patternAnalysis.summary.bearishSignals}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">Bearish Signals</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {patternQuery.data.patternAnalysis.patterns.map((pattern, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getSignalIcon(pattern.signal)}
                                <h4 className="font-semibold capitalize">
                                  {pattern.type.replace(/_/g, ' ')}
                                </h4>
                                <Badge variant="outline" className={getStrengthColor(pattern.strength)}>
                                  {pattern.strength}
                                </Badge>
                                <Badge variant="secondary">{pattern.category}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {pattern.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Confidence:</span>
                                <Progress 
                                  value={pattern.confidence * 100} 
                                  className="w-20 h-2" 
                                />
                                <span className={`text-xs font-medium ${getConfidenceColor(pattern.confidence * 100)}`}>
                                  {(pattern.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {patternQuery.isError && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">Failed to load pattern analysis</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="confluence" className="space-y-4">
              {confluenceQuery.isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Analyzing confluence...</p>
                </div>
              )}

              {confluenceQuery.data && (
                <>
                  <Card className="border-2 border-blue-200">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Multi-Timeframe Confluence</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-lg px-4 py-2 ${getDirectionColor(confluenceQuery.data.confluenceAnalysis.overallDirection)}`}
                          >
                            {confluenceQuery.data.confluenceAnalysis.overallDirection}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-2xl font-bold">
                              {confluenceQuery.data.confluenceAnalysis.confluenceStrength}%
                            </div>
                            <div className="text-sm text-muted-foreground">Confluence Strength</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">
                              {confluenceQuery.data.systemRating}/100
                            </div>
                            <div className="text-sm text-muted-foreground">System Rating</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {confluenceQuery.data.confluenceAnalysis.timeframeResults.map((tf, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="text-center space-y-2">
                            <h4 className="font-semibold">{tf.timeframe}</h4>
                            <Badge 
                              variant="outline"
                              className={getDirectionColor(tf.primarySignal)}
                            >
                              {tf.primarySignal}
                            </Badge>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Patterns:</span>
                                <span className="font-medium">{tf.patterns}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Bullish:</span>
                                <span className="font-medium text-green-600">{tf.bullishSignals}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Bearish:</span>
                                <span className="font-medium text-red-600">{tf.bearishSignals}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Confidence:</span>
                                <span className={`font-medium ${getConfidenceColor(tf.confidence)}`}>
                                  {tf.confidence}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {confluenceQuery.isError && (
                <div className="text-center py-8">
                  <p className="text-sm text-red-600">Failed to load confluence analysis</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              {patternQuery.data && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Market Insights & Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Primary Signal</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-lg px-4 py-2 ${getDirectionColor(patternQuery.data.patternAnalysis.insights.primarySignal)}`}
                        >
                          {patternQuery.data.patternAnalysis.insights.primarySignal}
                        </Badge>
                        <div className="mt-2">
                          <Progress 
                            value={patternQuery.data.patternAnalysis.insights.confidence} 
                            className="w-full h-3" 
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Confidence: {patternQuery.data.patternAnalysis.insights.confidence}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Reasoning</h4>
                        <ul className="space-y-1">
                          {patternQuery.data.patternAnalysis.insights.reasoning.map((reason, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {patternQuery.data.patternAnalysis.insights.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <span className="text-green-500 mt-1">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}