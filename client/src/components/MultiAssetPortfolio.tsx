import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, AlertTriangle, BarChart3, PieChart, Activity } from 'lucide-react';

interface AssetAllocation {
  symbol: string;
  weight: number;
  currentPrice: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  correlation: number;
  volatility: number;
  sharpeRatio: number;
}

interface PortfolioMetrics {
  totalValue: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  diversificationScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxDrawdown: number;
}

interface CorrelationMatrix {
  [asset: string]: {
    [asset2: string]: number;
  };
}

export default function MultiAssetPortfolio() {
  const [portfolio, setPortfolio] = useState<AssetAllocation[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationMatrix>({});
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BNB/USDT']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rebalanceRecommendations, setRebalanceRecommendations] = useState<AssetAllocation[]>([]);

  const analyzePortfolio = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate portfolio analysis with realistic data
      const mockPortfolio: AssetAllocation[] = selectedAssets.map((symbol, index) => ({
        symbol,
        weight: 100 / selectedAssets.length, // Equal weight initially
        currentPrice: Math.random() * 100000 + 1000,
        recommendation: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)] as 'BUY' | 'SELL' | 'HOLD',
        confidence: Math.random() * 40 + 60, // 60-100%
        correlation: Math.random() * 0.8 + 0.1, // 0.1-0.9
        volatility: Math.random() * 0.3 + 0.1, // 10-40%
        sharpeRatio: Math.random() * 2 + 0.5 // 0.5-2.5
      }));

      // Calculate portfolio metrics
      const totalValue = mockPortfolio.reduce((sum, asset) => sum + (asset.currentPrice * asset.weight / 100), 0);
      const expectedReturn = mockPortfolio.reduce((sum, asset) => sum + (asset.sharpeRatio * asset.weight / 100), 0);
      const portfolioVolatility = Math.sqrt(
        mockPortfolio.reduce((sum, asset) => sum + Math.pow(asset.volatility * asset.weight / 100, 2), 0)
      );
      
      const portfolioMetrics: PortfolioMetrics = {
        totalValue,
        expectedReturn: expectedReturn * 100,
        volatility: portfolioVolatility * 100,
        sharpeRatio: expectedReturn / portfolioVolatility,
        diversificationScore: 100 - (mockPortfolio.reduce((sum, asset) => sum + asset.correlation, 0) / mockPortfolio.length * 100),
        riskLevel: portfolioVolatility < 0.15 ? 'LOW' : portfolioVolatility < 0.25 ? 'MEDIUM' : 'HIGH',
        maxDrawdown: Math.random() * 20 + 5 // 5-25%
      };

      // Generate correlation matrix
      const correlationMatrix: CorrelationMatrix = {};
      selectedAssets.forEach(asset1 => {
        correlationMatrix[asset1] = {};
        selectedAssets.forEach(asset2 => {
          if (asset1 === asset2) {
            correlationMatrix[asset1][asset2] = 1.0;
          } else {
            correlationMatrix[asset1][asset2] = Math.random() * 1.6 - 0.8; // -0.8 to 0.8
          }
        });
      });

      // Generate optimization recommendations
      const optimizedWeights = mockPortfolio.map(asset => ({
        ...asset,
        weight: Math.max(5, Math.min(40, asset.weight + (Math.random() - 0.5) * 20)) // 5-40% weight
      }));
      
      // Normalize weights to 100%
      const totalWeight = optimizedWeights.reduce((sum, asset) => sum + asset.weight, 0);
      optimizedWeights.forEach(asset => {
        asset.weight = (asset.weight / totalWeight) * 100;
      });

      setPortfolio(mockPortfolio);
      setMetrics(portfolioMetrics);
      setCorrelations(correlationMatrix);
      setRebalanceRecommendations(optimizedWeights);
      
    } catch (error) {
      console.error('Portfolio analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedAssets]);

  useEffect(() => {
    analyzePortfolio();
  }, [analyzePortfolio]);

  const addAsset = (symbol: string) => {
    if (!selectedAssets.includes(symbol)) {
      setSelectedAssets([...selectedAssets, symbol]);
    }
  };

  const removeAsset = (symbol: string) => {
    setSelectedAssets(selectedAssets.filter(s => s !== symbol));
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Multi-Asset Portfolio Analysis
            </CardTitle>
            <Button 
              onClick={analyzePortfolio} 
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="correlations">Correlations</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Expected Return</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.expectedReturn.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Volatility</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {metrics.volatility.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-gray-600">Sharpe Ratio</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {metrics.sharpeRatio.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm text-gray-600">Risk Level</span>
                      </div>
                      <div className={`text-2xl font-bold ${getRiskColor(metrics.riskLevel)}`}>
                        {metrics.riskLevel}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Diversification Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Portfolio Diversification</span>
                      <span className="font-bold">{metrics?.diversificationScore.toFixed(0)}%</span>
                    </div>
                    <Progress value={metrics?.diversificationScore || 0} className="h-2" />
                    <p className="text-sm text-gray-600">
                      Higher scores indicate better diversification across assets
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allocations" className="space-y-4">
              <div className="grid gap-4">
                {portfolio.map((asset) => (
                  <Card key={asset.symbol}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{asset.symbol}</div>
                          <Badge className={getRecommendationColor(asset.recommendation)}>
                            {asset.recommendation}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{asset.weight.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">
                            ${asset.currentPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Confidence: </span>
                          <span className="font-medium">{asset.confidence.toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Volatility: </span>
                          <span className="font-medium">{(asset.volatility * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Sharpe: </span>
                          <span className="font-medium">{asset.sharpeRatio.toFixed(2)}</span>
                        </div>
                      </div>
                      <Progress value={asset.weight} className="mt-2 h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="correlations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Correlation Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left p-2">Asset</th>
                          {selectedAssets.map(asset => (
                            <th key={asset} className="text-center p-2 min-w-16">
                              {asset.split('/')[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAssets.map(asset1 => (
                          <tr key={asset1}>
                            <td className="p-2 font-medium">{asset1.split('/')[0]}</td>
                            {selectedAssets.map(asset2 => {
                              const correlation = correlations[asset1]?.[asset2] || 0;
                              const color = correlation > 0.5 ? 'text-red-600' : 
                                           correlation < -0.2 ? 'text-green-600' : 'text-gray-600';
                              return (
                                <td key={asset2} className={`text-center p-2 ${color} font-medium`}>
                                  {correlation.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Correlation ranges from -1 (perfectly inverse) to +1 (perfectly correlated)</p>
                    <p>Lower correlations indicate better diversification</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Optimization Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Optimized allocations based on risk-adjusted returns and correlations:
                    </p>
                    
                    {rebalanceRecommendations.map((asset) => {
                      const currentWeight = portfolio.find(p => p.symbol === asset.symbol)?.weight || 0;
                      const change = asset.weight - currentWeight;
                      const isIncrease = change > 0;
                      
                      return (
                        <Card key={asset.symbol}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold">{asset.symbol}</span>
                                <div className="flex items-center gap-1">
                                  {isIncrease ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={`text-sm ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                                    {isIncrease ? '+' : ''}{change.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{asset.weight.toFixed(1)}%</div>
                                <div className="text-xs text-gray-500">
                                  Current: {currentWeight.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            <Progress value={asset.weight} className="mt-2 h-2" />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}