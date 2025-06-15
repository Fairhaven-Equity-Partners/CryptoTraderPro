/**
 * Frontend Monte Carlo Fix - External Shell Testing
 * Fix frontend error handling and improve user experience
 */

class FrontendMonteCarloFix {
  constructor() {
    this.baseUrl = 'http://localhost:5000';
  }

  async implementFrontendFix() {
    console.log('🔧 IMPLEMENTING FRONTEND MONTE CARLO FIX');
    console.log('=======================================');
    console.log('Fixing frontend error handling and user experience\n');

    // Test current API response first
    await this.testCurrentAPIResponse();
    
    // Generate improved component
    await this.generateImprovedComponent();
    
    console.log('✅ Frontend fix implementation complete');
  }

  async testCurrentAPIResponse() {
    console.log('📊 Testing Current API Response');
    console.log('===============================');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/monte-carlo-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'BTC/USDT', timeframe: '1d' })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response Structure:');
        console.log(`- success: ${data.success}`);
        console.log(`- riskMetrics present: ${!!data.riskMetrics}`);
        console.log(`- signalInput present: ${!!data.signalInput}`);
        
        if (data.riskMetrics) {
          console.log(`- Risk Level: ${data.riskMetrics.riskLevel}`);
          console.log(`- Expected Return: ${data.riskMetrics.expectedReturn.toFixed(2)}%`);
          console.log(`- Win Probability: ${data.riskMetrics.winProbability.toFixed(1)}%`);
        }
        
        console.log('\n✅ Backend is working correctly - issue is in frontend handling');
      } else {
        console.log(`❌ API error: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
    }
    
    console.log('');
  }

  async generateImprovedComponent() {
    console.log('🎯 Generating Improved Frontend Component');
    console.log('========================================');
    
    const improvedComponent = `import { useState, useCallback } from 'react';
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
  };
  timestamp: string;
}

interface MonteCarloRiskDisplayProps {
  symbol?: string;
  timeframe?: string;
}

export function MonteCarloRiskDisplay({ symbol = 'BTC/USDT', timeframe = '1d' }: MonteCarloRiskDisplayProps) {
  const [analysis, setAnalysis] = useState<RiskAssessmentResponse | null>(null);
  const [isManuallyTriggered, setIsManuallyTriggered] = useState(false);
  const queryClient = useQueryClient();

  const riskAssessmentMutation = useMutation({
    mutationFn: async ({ symbol, timeframe }: { symbol: string; timeframe: string }) => {
      // Enhanced validation
      if (!symbol?.trim() || !timeframe?.trim()) {
        throw new Error('Symbol and timeframe are required');
      }

      console.log('[MonteCarloRiskDisplay] Starting analysis for', symbol, timeframe);
      
      try {
        const response = await apiRequest('/api/monte-carlo-risk', {
          method: 'POST',
          body: JSON.stringify({ symbol: symbol.trim(), timeframe: timeframe.trim() }),
          headers: { 'Content-Type': 'application/json' }
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
        
        // Enhanced error handling
        if (error instanceof Error) {
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
          }
          if (error.message.includes('400')) {
            throw new Error('Invalid request parameters. Please check symbol and timeframe.');
          }
          if (error.message.includes('500')) {
            throw new Error('Server error occurred. Please try again later.');
          }
          throw error;
        }
        
        throw new Error('Network error occurred. Please check your connection.');
      }
    },
    onSuccess: (data) => {
      console.log('[MonteCarloRiskDisplay] Analysis successful:', data);
      setAnalysis(data);
      setIsManuallyTriggered(false);
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
      setIsManuallyTriggered(false);
    }
  });

  const handleRunAnalysis = useCallback(() => {
    // Prevent multiple simultaneous requests
    if (riskAssessmentMutation.isPending) {
      console.log('[MonteCarloRiskDisplay] Analysis already in progress');
      return;
    }

    // Enhanced validation
    if (!symbol?.trim() || !timeframe?.trim()) {
      console.error('[MonteCarloRiskDisplay] Missing required parameters');
      return;
    }

    console.log('[MonteCarloRiskDisplay] User triggered analysis for', symbol, timeframe);
    setIsManuallyTriggered(true);
    setAnalysis(null); // Clear previous results
    
    riskAssessmentMutation.mutate({ 
      symbol: symbol.trim(), 
      timeframe: timeframe.trim() 
    });
  }, [symbol, timeframe, riskAssessmentMutation]);

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

  const formatNumber = (num: number, decimals: number = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  const formatCurrency = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monte Carlo Risk Assessment
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{symbol}</Badge>
            <Badge variant="secondary">{timeframe}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Advanced risk analysis using 1000+ Monte Carlo simulations
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Run Analysis" to start institutional-grade risk assessment
            </p>
          </div>
          <Button 
            onClick={handleRunAnalysis}
            disabled={riskAssessmentMutation.isPending || !symbol?.trim() || !timeframe?.trim()}
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
                Run Analysis
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
                : 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={handleRunAnalysis} 
              variant="outline" 
              size="sm" 
              className="mt-2"
              disabled={riskAssessmentMutation.isPending}
            >
              Try Again
            </Button>
          </div>
        )}

        {analysis && analysis.riskMetrics && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Risk Assessment Complete</span>
              </div>
              <Badge className={\`\${getRiskLevelColor(analysis.riskMetrics.riskLevel)} text-white\`}>
                {getRiskLevelText(analysis.riskMetrics.riskLevel)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Risk Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Expected Return</span>
                    <span className="text-sm font-medium">
                      {formatNumber(analysis.riskMetrics.expectedReturn)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Value at Risk (95%)</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatNumber(analysis.riskMetrics.var95)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max Drawdown</span>
                    <span className="text-sm font-medium text-red-600">
                      {formatNumber(analysis.riskMetrics.maxDrawdown)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sharpe Ratio</span>
                    <span className="text-sm font-medium">
                      {formatNumber(analysis.riskMetrics.sharpeRatio, 3)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Success Probability</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Win Probability</span>
                  </div>
                  <Progress value={analysis.riskMetrics.winProbability} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">{formatNumber(analysis.riskMetrics.winProbability, 1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Risk Score</span>
                  </div>
                  <Progress value={analysis.riskMetrics.riskScore} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span className="font-medium">{formatNumber(analysis.riskMetrics.riskScore, 0)}/100</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>

            {analysis.signalInput && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">Trade Parameters</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry Price</span>
                    <p className="font-medium">{formatCurrency(analysis.signalInput.entryPrice)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop Loss</span>
                    <p className="font-medium text-red-600">{formatCurrency(analysis.signalInput.stopLoss)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Take Profit</span>
                    <p className="font-medium text-green-600">{formatCurrency(analysis.signalInput.takeProfit)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence</span>
                    <p className="font-medium">{formatNumber(analysis.signalInput.confidence, 1)}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Analysis completed at {new Date(analysis.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {!analysis && !riskAssessmentMutation.error && !riskAssessmentMutation.isPending && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Ready for Risk Analysis
            </h3>
            <p className="text-sm text-muted-foreground">
              Click "Run Analysis" to perform Monte Carlo simulation with 1000+ iterations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}`;

    console.log('✅ Generated improved component with:');
    console.log('- Enhanced error handling and validation');
    console.log('- Better user feedback and loading states');
    console.log('- Improved data formatting and display');
    console.log('- Manual trigger only (no auto-execution)');
    console.log('- Comprehensive error messages for users');
    console.log('- Rate limiting awareness');
    
    console.log('\n📝 Writing improved component to file...');
    
    // Write the improved component
    require('fs').writeFileSync('./client/src/components/MonteCarloRiskDisplay.tsx', improvedComponent);
    
    console.log('✅ Component updated successfully');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute frontend fix
async function main() {
  const fix = new FrontendMonteCarloFix();
  await fix.implementFrontendFix();
}

main().catch(console.error);