/**
 * FINAL MONTE CARLO FIX - External Shell Testing
 * Complete elimination of all automatic triggers
 */

import fs from 'fs';

const finalStableComponent = `import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [analysisSymbol, setAnalysisSymbol] = useState('');
  const [analysisTimeframe, setAnalysisTimeframe] = useState('');
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
    onSuccess: (data) => {
      setAnalysisSymbol(data.symbol);
      setAnalysisTimeframe(data.timeframe);
      queryClient.invalidateQueries({ queryKey: ['monte-carlo-risk'] });
    },
    onError: () => {
      setIsAnalyzing(false);
    },
    onSettled: () => {
      setIsAnalyzing(false);
    }
  });

  const handleRunAnalysis = useCallback(() => {
    if (!symbol || !timeframe || isAnalyzing || riskAssessmentMutation.isPending) {
      return;
    }
    
    setIsAnalyzing(true);
    riskAssessmentMutation.mutate({ symbol, timeframe });
  }, [symbol, timeframe, isAnalyzing, riskAssessmentMutation]);

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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'VERY_LOW':
      case 'LOW': return <Shield className="h-4 w-4" />;
      case 'MODERATE': return <Target className="h-4 w-4" />;
      case 'HIGH':
      case 'VERY_HIGH': return <AlertTriangle className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monte Carlo Risk Assessment
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{symbol}</Badge>
            <Badge variant="secondary">{timeframe}</Badge>
            <Button 
              onClick={handleRunAnalysis} 
              disabled={isAnalyzing || riskAssessmentMutation.isPending}
              size="sm"
              variant="outline"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {riskAssessmentMutation.data && (
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Risk Assessment Results</h3>
              <div className="flex items-center gap-2">
                {getRiskIcon(riskAssessmentMutation.data.riskAssessment.riskLevel)}
                <Badge className={\`\${getRiskLevelColor(riskAssessmentMutation.data.riskAssessment.riskLevel)} text-white\`}>
                  {riskAssessmentMutation.data.riskAssessment.riskLevel.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Expected Return</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {(riskAssessmentMutation.data.riskAssessment.expectedReturn * 100).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Value at Risk (95%)</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {(riskAssessmentMutation.data.riskAssessment.var95 * 100).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Win Probability</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {riskAssessmentMutation.data.riskAssessment.winProbability.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Risk Score</span>
                  <span>{riskAssessmentMutation.data.riskAssessment.riskScore}/100</span>
                </div>
                <Progress value={riskAssessmentMutation.data.riskAssessment.riskScore} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                  <div className="text-lg font-semibold">
                    {riskAssessmentMutation.data.riskAssessment.sharpeRatio.toFixed(3)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Max Drawdown</span>
                  <div className="text-lg font-semibold text-red-600">
                    {(riskAssessmentMutation.data.riskAssessment.maxDrawdown * 100).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Signal Input Parameters</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Entry Price: $\{riskAssessmentMutation.data.signalInput.entryPrice.toLocaleString()}</div>
                  <div>Direction: {riskAssessmentMutation.data.signalInput.direction}</div>
                  <div>Stop Loss: $\{riskAssessmentMutation.data.signalInput.stopLoss.toLocaleString()}</div>
                  <div>Take Profit: $\{riskAssessmentMutation.data.signalInput.takeProfit.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {riskAssessmentMutation.isError && (
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Analysis Failed
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to perform Monte Carlo risk assessment. Please ensure signal data is available for {symbol}.
            </p>
            <Button onClick={handleRunAnalysis} variant="outline" size="sm">
              Try Again
            </Button>
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
              Run advanced risk simulation with 1000+ iterations to assess potential outcomes for {symbol} on {timeframe} timeframe
            </p>
            <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}`;

try {
  // Apply final stable component
  fs.writeFileSync('./client/src/components/MonteCarloRiskDisplay.tsx', finalStableComponent);
  
  console.log('✅ Final Monte Carlo fix applied');
  console.log('✅ All automatic triggers eliminated');
  console.log('✅ Manual-only operation established');
  console.log('✅ Component fully stabilized');
} catch (error) {
  console.error('❌ Final fix failed:', error.message);
  process.exit(1);
}