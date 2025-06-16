import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingDown, AlertTriangle, BarChart } from 'lucide-react';

interface RiskMetrics {
  var95: number;
  sharpeRatio: number;
  maxDrawdown: number;
  expectedReturn: number;
  volatility: number;
  winProbability: number;
  riskScore: number;
  riskLevel: string;
  confidenceInterval: [number, number];
}

interface RiskAssessmentDashboardProps {
  symbol?: string;
  timeframe?: string;
}

const RiskAssessmentDashboard: React.FC<RiskAssessmentDashboardProps> = ({ symbol = 'BTC/USDT', timeframe = '1d' }) => {
  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ['/api/monte-carlo-risk', symbol],
    refetchInterval: 60000, // Update every minute for secondary priority
    queryFn: async () => {
      const response = await fetch('/api/monte-carlo-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe: '1d' })
      });
      if (!response.ok) throw new Error('Risk data unavailable');
      return response.json();
    },
    retry: 1,
  });

  const { data: portfolioData } = useQuery({
    queryKey: ['/api/performance-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/performance-metrics');
      if (!response.ok) throw new Error('Performance data unavailable');
      return response.json();
    },
    refetchInterval: 120000,
    retry: 1,
  });

  const riskMetrics = riskData?.riskMetrics as RiskMetrics;

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low':
        return 'bg-green-600 text-white';
      case 'moderate':
        return 'bg-yellow-600 text-white';
      case 'high':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getVolatilityLevel = (volatility: number) => {
    if (volatility < 15) return { level: 'Low', color: 'text-green-600' };
    if (volatility < 30) return { level: 'Moderate', color: 'text-yellow-600' };
    if (volatility < 50) return { level: 'High', color: 'text-orange-600' };
    return { level: 'Very High', color: 'text-red-600' };
  };

  const getSharpeRating = (sharpe: number) => {
    if (sharpe > 2) return { rating: 'Excellent', color: 'text-green-600' };
    if (sharpe > 1) return { rating: 'Good', color: 'text-blue-600' };
    if (sharpe > 0.5) return { rating: 'Acceptable', color: 'text-yellow-600' };
    return { rating: 'Poor', color: 'text-red-600' };
  };

  if (riskLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!riskMetrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Risk data temporarily unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  const volatilityInfo = getVolatilityLevel(riskMetrics.volatility);
  const sharpeInfo = getSharpeRating(riskMetrics.sharpeRatio);

  return (
    <Card className="w-full border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            Risk Assessment Dashboard
          </div>
          <Badge className={getRiskLevelColor(riskMetrics.riskLevel)}>
            {riskMetrics.riskLevel} Risk
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Portfolio Risk Metrics */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Portfolio Risk</h4>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">VaR 95%</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{riskMetrics.var95.toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">Daily risk</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Volatility</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{riskMetrics.volatility.toFixed(2)}%</div>
                <div className={`text-xs ${volatilityInfo.color}`}>{volatilityInfo.level}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Max Drawdown</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{riskMetrics.maxDrawdown.toFixed(2)}%</div>
                <div className="text-xs text-muted-foreground">Worst case</div>
              </div>
            </div>
          </div>

          {/* Performance Risk Metrics */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Risk-Adjusted Performance</h4>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Sharpe Ratio</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{riskMetrics.sharpeRatio.toFixed(3)}</div>
                <div className={`text-xs ${sharpeInfo.color}`}>{sharpeInfo.rating}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Win Probability</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{riskMetrics.winProbability.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Success rate</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Expected Return</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{riskMetrics.expectedReturn.toFixed(3)}%</div>
                <div className="text-xs text-muted-foreground">Daily avg</div>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Interval */}
        <div className="mt-4 p-3 rounded-lg bg-background border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">95% Confidence Interval</span>
            <Badge variant="outline" className="text-xs">Monte Carlo</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-600 font-medium">
              {riskMetrics.confidenceInterval[0].toFixed(3)}%
            </span>
            <span className="text-muted-foreground mx-2">to</span>
            <span className="text-green-600 font-medium">
              {riskMetrics.confidenceInterval[1].toFixed(3)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Risk Score Summary */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Risk Score</span>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold">{riskMetrics.riskScore.toFixed(0)}/100</div>
              <Badge 
                variant={riskMetrics.riskScore <= 40 ? 'default' : 
                        riskMetrics.riskScore <= 70 ? 'secondary' : 'destructive'}
              >
                {riskMetrics.riskScore <= 40 ? 'Conservative' : 
                 riskMetrics.riskScore <= 70 ? 'Balanced' : 'Aggressive'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskAssessmentDashboard;