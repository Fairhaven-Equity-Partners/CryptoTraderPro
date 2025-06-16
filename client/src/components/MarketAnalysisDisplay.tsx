import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';

const MarketAnalysisDisplay: React.FC = () => {
  const { data: patternData, isLoading: patternLoading } = useQuery({
    queryKey: ['/api/pattern-analysis/BTC/USDT'],
    refetchInterval: 30000,
  });

  const { data: confluenceData, isLoading: confluenceLoading } = useQuery({
    queryKey: ['/api/confluence-analysis/BTC/USDT'],
    refetchInterval: 30000,
  });

  const isLoading = patternLoading || confluenceLoading;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const patterns = patternData?.patternAnalysis?.patterns || [];
  const primaryPattern = patterns[0];
  const confluenceScore = confluenceData?.confluenceScore || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confluence Analysis */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Confluence Score</span>
          <Badge variant={confluenceScore > 70 ? "default" : confluenceScore > 40 ? "secondary" : "destructive"}>
            {confluenceScore}%
          </Badge>
        </div>

        {/* Primary Pattern */}
        {primaryPattern && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Primary Pattern</span>
              <Badge variant="outline">
                {primaryPattern.type?.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {primaryPattern.signal === 'bullish' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : primaryPattern.signal === 'bearish' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm text-muted-foreground">
                {primaryPattern.description}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Confidence</span>
              <span className="text-xs font-medium">
                {Math.round((primaryPattern.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Market Insights */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Patterns Found</span>
              <div className="font-medium">{patterns.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Confidence</span>
              <div className="font-medium">
                {patterns.length > 0 
                  ? Math.round(patterns.reduce((acc, p) => acc + (p.confidence || 0), 0) / patterns.length * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketAnalysisDisplay;