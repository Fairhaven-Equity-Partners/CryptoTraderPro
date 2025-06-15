
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Activity, BarChart3, Eye, Brain } from 'lucide-react';

interface EnhancedMarketStructureProps {
  symbol: string;
  timeframe: string;
  onPatternChange?: (patterns: any[]) => void;
}

export function EnhancedMarketStructureAnalysis({ 
  symbol, 
  timeframe, 
  onPatternChange 
}: EnhancedMarketStructureProps) {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('overview');

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

  const renderPatternAnalysis = () => {
    if (patternQuery.isLoading) {
      return <div className="text-center py-4">Analyzing patterns...</div>;
    }

    if (patternQuery.error || !patternQuery.data?.patterns) {
      return <div className="text-center py-4 text-red-400">Pattern analysis unavailable</div>;
    }

    const patterns = patternQuery.data.patterns;
    const totalPatterns = patterns.length;
    const strongPatterns = patterns.filter(p => p.strength === 'STRONG').length;

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
          {patterns.slice(0, 3).map((pattern, index) => (
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
          <Brain className="h-5 w-5 text-blue-400" />
          Enhanced Market Structure Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeAnalysisTab} onValueChange={setActiveAnalysisTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="overview" className="text-gray-300">Pattern Analysis</TabsTrigger>
            <TabsTrigger value="confluence" className="text-gray-300">Multi-Timeframe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
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