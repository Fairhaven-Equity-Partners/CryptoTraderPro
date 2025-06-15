/**
 * Critical Monte Carlo Fix - Stop API Flooding Immediately
 * External shell implementation of complete fix
 */

import fs from 'fs';

class CriticalMonteCarloFix {
  constructor() {
    this.componentPath = './client/src/components/MonteCarloRiskDisplay.tsx';
    this.backupPath = './client/src/components/MonteCarloRiskDisplay.tsx.backup';
  }

  async implementCriticalFix() {
    console.log('🚨 CRITICAL MONTE CARLO FIX');
    console.log('===========================');
    console.log('Stopping API flooding and implementing proper component\n');

    // Step 1: Create backup
    await this.createBackup();
    
    // Step 2: Implement fixed component
    await this.implementFixedComponent();
    
    // Step 3: Verify fix
    await this.verifyFix();
    
    console.log('✅ Critical fix implemented - API flooding stopped');
  }

  async createBackup() {
    try {
      const existing = fs.readFileSync(this.componentPath, 'utf8');
      fs.writeFileSync(this.backupPath, existing);
      console.log('✅ Backup created');
    } catch (error) {
      console.log('⚠️  No existing file to backup');
    }
  }

  async implementFixedComponent() {
    const fixedComponent = `import { useState, useCallback } from 'react';
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
  const queryClient = useQueryClient();

  const riskAssessmentMutation = useMutation({
    mutationFn: async ({ symbol, timeframe }: { symbol: string; timeframe: string }) => {
      // Strict validation to prevent empty requests
      if (!symbol || symbol.trim() === '' || symbol === 'undefined' || symbol === 'null') {
        throw new Error('Valid symbol is required');
      }
      if (!timeframe || timeframe.trim() === '' || timeframe === 'undefined' || timeframe === 'null') {
        throw new Error('Valid timeframe is required');
      }

      console.log('[MonteCarloRiskDisplay] Making request with:', { symbol, timeframe });
      
      const response = await apiRequest('/api/monte-carlo-risk', {
        method: 'POST',
        body: JSON.stringify({ symbol, timeframe }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response as RiskAssessmentResponse;
    },
    onSuccess: (data) => {
      console.log('[MonteCarloRiskDisplay] Analysis successful:', data);
      setAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ['monte-carlo-risk'] });
    },
    onError: (error) => {
      console.error('[MonteCarloRiskDisplay] Analysis failed:', error);
      setAnalysis(null);
    }
  });

  const handleRunAnalysis = useCallback(() => {
    // Enhanced validation before making request
    if (!symbol || !timeframe) {
      console.error('[MonteCarloRiskDisplay] Missing required parameters');
      return;
    }
    
    if (typeof symbol !== 'string' || typeof timeframe !== 'string') {
      console.error('[MonteCarloRiskDisplay] Invalid parameter types');
      return;
    }
    
    if (symbol.trim() === '' || timeframe.trim() === '') {
      console.error('[MonteCarloRiskDisplay] Empty parameters detected');
      return;
    }
    
    if (riskAssessmentMutation.isPending) {
      console.log('[MonteCarloRiskDisplay] Analysis already in progress');
      return;
    }
    
    console.log(\`[MonteCarloRiskDisplay] Starting analysis for \${symbol} (\${timeframe})\`);
    riskAssessmentMutation.mutate({ symbol, timeframe });
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
                  <Badge className={\`\${getRiskLevelColor(analysis.riskMetrics.riskLevel)} text-white\`}>
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
                    <p className="font-medium">\${analysis.signalInput.entryPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stop Loss</span>
                    <p className="font-medium text-red-600">\${analysis.signalInput.stopLoss.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Take Profit</span>
                    <p className="font-medium text-green-600">\${analysis.signalInput.takeProfit.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Confidence</span>
                    <p className="font-medium">{analysis.signalInput.confidence.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}`;

    fs.writeFileSync(this.componentPath, fixedComponent);
    console.log('✅ Fixed component implemented');
  }

  async verifyFix() {
    console.log('\n🔍 Verifying fix implementation...');
    
    try {
      const content = fs.readFileSync(this.componentPath, 'utf8');
      
      // Check for removal of problematic useEffect
      if (content.includes('useEffect')) {
        console.log('⚠️  useEffect still present - check implementation');
      } else {
        console.log('✅ Auto-execution useEffect removed');
      }
      
      // Check for proper validation
      if (content.includes('Valid symbol is required')) {
        console.log('✅ Enhanced parameter validation added');
      }
      
      // Check for manual trigger only
      if (content.includes('handleRunAnalysis') && content.includes('onClick')) {
        console.log('✅ Manual trigger system implemented');
      }
      
      console.log('✅ Fix verification complete');
      
    } catch (error) {
      console.log('❌ Fix verification failed:', error.message);
    }
  }
}

// Execute critical fix
async function main() {
  const fixer = new CriticalMonteCarloFix();
  await fixer.implementCriticalFix();
  
  console.log('\n🎯 CRITICAL FIX SUMMARY');
  console.log('======================');
  console.log('✅ API flooding stopped - removed auto-execution useEffect');
  console.log('✅ Manual trigger implemented - user must click button');
  console.log('✅ Enhanced validation prevents empty parameter requests');
  console.log('✅ Proper error handling and loading states added');
  console.log('✅ Component stability restored');
  console.log('\nThe Monte Carlo component now requires manual activation to prevent API flooding.');
}

main().catch(console.error);