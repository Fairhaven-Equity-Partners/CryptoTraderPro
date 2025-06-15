import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { AlertTriangle, TrendingUp, Shield, Target, BarChart3, Loader2 } from 'lucide-react';

interface MonteCarloResult {
  expectedReturn: number;
  var95: number;
  maxDrawdown: number;
  winProbability: number;
  riskScore: number;
  sharpeRatio: number;
  volatility: number;
  confidenceInterval: [number, number];
  riskLevel: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
}

interface RiskAssessmentResponse {
  success: boolean;
  symbol: string;
  timeframe: string;
  riskMetrics: MonteCarloResult;
  signalInput: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    confidence: number;
    direction: string;
    timeframe: string;
  };
  timestamp: string;
}

interface MonteCarloRiskDisplayProps {
  symbol?: string;
  timeframe?: string;
}

export function MonteCarloRiskDisplay({ symbol = 'BTC/USDT', timeframe = '1d' }: MonteCarloRiskDisplayProps) {
  const [analysis, setAnalysis] = useState<RiskAssessmentResponse | null>(null);
  const queryClient = useQueryClient();

  // Defensive parameter validation with fallbacks
  const validSymbol = symbol?.trim() || 'BTC/USDT';
  const validTimeframe = timeframe?.trim() || '1d';

  const riskAssessmentMutation = useMutation({
    mutationFn: async ({ symbol, timeframe }: { symbol: string; timeframe: string }) => {
      // Enhanced validation
      if (!symbol?.trim() || !timeframe?.trim()) {
        throw new Error('Symbol and timeframe are required');
      }

      console.log('[MonteCarloRiskDisplay] Starting analysis for', symbol, timeframe);
      
      try {
        const response = await apiRequest('/api/monte-carlo-risk', {
          symbol: symbol.trim(),
          timeframe: timeframe.trim()
        });

        console.log('[MonteCarloRiskDisplay] Raw response:', response);

        // Validate response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format received');
        }

        if (!response.success) {
          throw new Error(response.error || 'Analysis failed');
        }

        if (!response.riskMetrics) {
          throw new Error('Risk metrics missing from response');
        }

        if (!response.signalInput) {
          throw new Error('Signal input missing from response');
        }

        console.log('[MonteCarloRiskDisplay] Validation passed, response is valid');
        return response as RiskAssessmentResponse;

      } catch (error) {
        console.error('[MonteCarloRiskDisplay] Request error:', error);
        
        // Enhanced error categorization with detailed logging
        console.log('[MonteCarloRiskDisplay] Error details:', error);
        console.log('[MonteCarloRiskDisplay] Error type:', typeof error);
        
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          console.log('[MonteCarloRiskDisplay] Error message:', errorMessage);
          
          // Check for HTTP status codes at start of message (format: "429: Rate limit...")
          if (errorMessage.startsWith('429') || errorMessage.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Please wait before making another request.');
          }
          
          if (errorMessage.startsWith('404') || errorMessage.includes('no signals available') || errorMessage.includes('no market data')) {
            throw new Error('No market data available for this symbol/timeframe combination.');
          }
          
          if (errorMessage.startsWith('400') || errorMessage.includes('symbol required') || errorMessage.includes('invalid parameters')) {
            throw new Error('Invalid parameters. Please check your symbol and timeframe selection.');
          }
          
          if (errorMessage.startsWith('500') || errorMessage.includes('server error')) {
            throw new Error('Server error occurred. Please try again.');
          }
          
          if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('fetch')) {
            throw new Error('Check your internet connection.');
          }
          
          if (errorMessage.startsWith('400') || errorMessage.includes('symbol required') || errorMessage.includes('timeframe required')) {
            throw new Error('Invalid parameters. Please check your symbol and timeframe selection.');
          }
          
          if (errorMessage.startsWith('404') || errorMessage.includes('no signals available')) {
            throw new Error('No market data available for this symbol/timeframe combination.');
          }
          
          if (errorMessage.startsWith('500') || errorMessage.includes('server error')) {
            throw new Error('Server error occurred. Please try again in a moment.');
          }
          
          // Network/connection errors
          if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
            throw new Error('Network connection error. Please check your internet connection.');
          }
          
          // Response parsing errors
          if (errorMessage.includes('json') || errorMessage.includes('parse')) {
            throw new Error('Response parsing error. Please try again.');
          }
          
          // Use the original error message if it's descriptive
          if (error.message && error.message.length > 10) {
            throw error;
          }
        }
        
        // Fallback for unknown errors
        throw new Error('An unexpected error occurred. Please try again.');
      }
    },
    onSuccess: (data) => {
      console.log('[MonteCarloRiskDisplay] Analysis successful:', data);
      setAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ['monte-carlo-risk'] });
    },
    onError: (error) => {
      console.error('[MonteCarloRiskDisplay] Analysis failed:', error);
      console.error('[MonteCarloRiskDisplay] Error type:', typeof error);
      console.error('[MonteCarloRiskDisplay] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      setAnalysis(null);
    }
  });

  const handleRunAnalysis = useCallback(() => {
    // Use validated parameters with fallbacks
    const finalSymbol = validSymbol;
    const finalTimeframe = validTimeframe;
    
    if (riskAssessmentMutation.isPending) {
      console.log('[MonteCarloRiskDisplay] Analysis already in progress');
      return;
    }
    
    console.log(`[MonteCarloRiskDisplay] Starting analysis for ${finalSymbol} (${finalTimeframe})`);
    riskAssessmentMutation.mutate({ symbol: finalSymbol, timeframe: finalTimeframe });
  }, [validSymbol, validTimeframe, riskAssessmentMutation]);

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

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'VERY_LOW': return 'Very Low Risk';
      case 'LOW': return 'Low Risk';
      case 'MODERATE': return 'Moderate Risk';
      case 'HIGH': return 'High Risk';
      case 'VERY_HIGH': return 'Very High Risk';
      default: return 'Unknown Risk';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monte Carlo Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Current Symbol: <span className="font-medium">{symbol}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Timeframe: <span className="font-medium">{timeframe}</span>
            </p>
          </div>
          <Button 
            onClick={handleRunAnalysis}
            disabled={riskAssessmentMutation.isPending || !symbol || !timeframe}
            className="flex items-center gap-2"
          >
            {riskAssessmentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Run Risk Analysis
              </>
            )}
          </Button>
        </div>

        {riskAssessmentMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Analysis Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {riskAssessmentMutation.error instanceof Error 
                ? riskAssessmentMutation.error.message 
                : 'Unknown error occurred'}
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Level</span>
                  <Badge className={`${getRiskLevelColor(analysis.riskMetrics.riskLevel)} text-white`}>
                    {getRiskLevelText(analysis.riskMetrics.riskLevel)}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Expected Return</span>
                    <span className="text-sm font-medium">
                      {analysis.riskMetrics.expectedReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Value at Risk (95%)</span>
                    <span className="text-sm font-medium text-red-600">
                      {analysis.riskMetrics.var95.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max Drawdown</span>
                    <span className="text-sm font-medium text-red-600">
                      {analysis.riskMetrics.maxDrawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Volatility</span>
                    <span className="text-sm font-medium">
                      {analysis.riskMetrics.volatility.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sharpe Ratio</span>
                    <span className="text-sm font-medium">
                      {analysis.riskMetrics.sharpeRatio.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Win Probability</span>
                </div>
                <div className="space-y-2">
                  <Progress value={analysis.riskMetrics.winProbability} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{analysis.riskMetrics.winProbability.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Risk Score</span>
                </div>
                <div className="space-y-2">
                  <Progress value={analysis.riskMetrics.riskScore} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span className="font-medium">{analysis.riskMetrics.riskScore.toFixed(0)}/100</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>

            {analysis.signalInput && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Signal Parameters</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry Price</span>
                    <p className="font-medium">${analysis.signalInput.entryPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop Loss</span>
                    <p className="font-medium text-red-600">${analysis.signalInput.stopLoss.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Take Profit</span>
                    <p className="font-medium text-green-600">${analysis.signalInput.takeProfit.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence</span>
                    <p className="font-medium">{analysis.signalInput.confidence.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timeframe</span>
                    <p className="font-medium">{analysis.signalInput.timeframe}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}