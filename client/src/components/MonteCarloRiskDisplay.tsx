import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { AlertTriangle, TrendingUp, Shield, Target, BarChart3 } from 'lucide-react';

interface MonteCarloResult {
  expectedReturn: number;
  var95: number;
  maxDrawdown: number;
  winProbability: number;
  riskScore: number;
  sharpeRatio: number;
  confidenceInterval: [number, number];
  riskLevel: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
}

interface RiskAssessmentResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  riskAssessment: MonteCarloResult;
  signalInput: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    direction: string;
  };
  timestamp: string;
}

interface MonteCarloRiskDisplayProps {
  symbol?: string;
  timeframe?: string;
}

export function MonteCarloRiskDisplay({ symbol = 'BTC/USDT', timeframe = '1d' }: MonteCarloRiskDisplayProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const queryClient = useQueryClient();

  const riskAssessmentMutation = useMutation({
    mutationFn: async ({ symbol, timeframe }: { symbol: string; timeframe: string }) => {
      const response = await apiRequest('/api/monte-carlo-risk', {
        method: 'POST',
        body: JSON.stringify({ symbol, timeframe }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response as RiskAssessmentResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monte-carlo-risk', symbol, timeframe] });
    }
  });

  // Automatically run analysis when symbol or timeframe changes
  useEffect(() => {
    if (symbol && timeframe) {
      handleRunAnalysis();
    }
  }, [symbol, timeframe]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await riskAssessmentMutation.mutateAsync({ symbol, timeframe });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'VERY_LOW': return 'bg-green-500';
      case 'LOW': return 'bg-green-400';
      case 'MODERATE': return 'bg-yellow-500';
      case 'HIGH': return 'bg-orange-500';
      case 'VERY_HIGH': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  const formatNumber = (value: number, decimals = 2) => value.toFixed(decimals);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monte Carlo Risk Assessment
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{symbol}</Badge>
            <Badge variant="secondary">{timeframe}</Badge>
            <Button 
              onClick={handleRunAnalysis} 
              disabled={isAnalyzing || riskAssessmentMutation.isPending}
              size="sm"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </CardHeader>

        {riskAssessmentMutation.data && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Expected Return */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Expected Return</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {formatPercentage(riskAssessmentMutation.data.riskAssessment.expectedReturn)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    CI: {formatPercentage(riskAssessmentMutation.data.riskAssessment.confidenceInterval[0])} to{' '}
                    {formatPercentage(riskAssessmentMutation.data.riskAssessment.confidenceInterval[1])}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Score */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Risk Score</span>
                  </div>
                  <div className={`text-2xl font-bold mt-2 ${getRiskScoreColor(riskAssessmentMutation.data.riskAssessment.riskScore)}`}>
                    {formatNumber(riskAssessmentMutation.data.riskAssessment.riskScore)}
                  </div>
                  <Badge 
                    className={`mt-2 ${getRiskLevelColor(riskAssessmentMutation.data.riskAssessment.riskLevel)}`}
                  >
                    {riskAssessmentMutation.data.riskAssessment.riskLevel.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>

              {/* Win Probability */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Win Probability</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">
                    {formatNumber(riskAssessmentMutation.data.riskAssessment.winProbability)}%
                  </div>
                  <Progress 
                    value={riskAssessmentMutation.data.riskAssessment.winProbability} 
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* Value at Risk */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">VaR (95%)</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-2">
                    {formatPercentage(riskAssessmentMutation.data.riskAssessment.var95)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Max Drawdown: {formatPercentage(-riskAssessmentMutation.data.riskAssessment.maxDrawdown)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Signal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signal Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Direction</span>
                    <div className="text-lg font-semibold">
                      <Badge variant={
                        riskAssessmentMutation.data.signalInput.direction === 'LONG' ? 'default' : 
                        riskAssessmentMutation.data.signalInput.direction === 'SHORT' ? 'destructive' : 'secondary'
                      }>
                        {riskAssessmentMutation.data.signalInput.direction}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Entry Price</span>
                    <div className="text-lg font-semibold">
                      ${formatNumber(riskAssessmentMutation.data.signalInput.entryPrice, 2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Stop Loss</span>
                    <div className="text-lg font-semibold text-red-600">
                      ${formatNumber(riskAssessmentMutation.data.signalInput.stopLoss, 2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Take Profit</span>
                    <div className="text-lg font-semibold text-green-600">
                      ${formatNumber(riskAssessmentMutation.data.signalInput.takeProfit, 2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Sharpe Ratio</span>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(riskAssessmentMutation.data.riskAssessment.sharpeRatio, 3)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Risk-adjusted return measure
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Signal Confidence</span>
                    <div className="text-2xl font-bold text-green-600">
                      {riskAssessmentMutation.data.signalInput.confidence}%
                    </div>
                    <Progress 
                      value={riskAssessmentMutation.data.signalInput.confidence} 
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Analysis Timestamp</span>
                    <div className="text-sm font-medium">
                      {new Date(riskAssessmentMutation.data.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      1000 simulation iterations
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        )}

        {riskAssessmentMutation.isError && (
          <CardContent>
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Analysis Failed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Unable to perform Monte Carlo risk assessment. Please ensure signal data is available for {symbol}.
              </p>
            </div>
          </CardContent>
        )}

        {!riskAssessmentMutation.data && !riskAssessmentMutation.isError && (
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Monte Carlo Risk Assessment
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Run advanced risk simulation with 1000+ iterations to assess potential outcomes
              </p>
              <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}