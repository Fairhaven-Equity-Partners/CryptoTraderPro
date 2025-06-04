import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertTriangle, Target } from 'lucide-react';

interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  riskScore: number;
  positions: Position[];
}

interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  allocation: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  direction: 'LONG' | 'SHORT';
}

interface RiskMetrics {
  portfolioRisk: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  correlation: number;
  diversificationScore: number;
}

export default function PortfolioManager() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('main');
  const [riskThreshold, setRiskThreshold] = useState(75);

  // Fetch portfolio data
  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ['/api/portfolios'],
    queryFn: () => fetch('/api/portfolios').then(res => res.json()),
    refetchInterval: 5000
  });

  // Fetch risk metrics
  const { data: riskMetrics } = useQuery({
    queryKey: ['/api/risk-metrics', selectedPortfolio],
    queryFn: () => fetch(`/api/risk-metrics/${selectedPortfolio}`).then(res => res.json()),
    refetchInterval: 10000
  });

  const currentPortfolio = portfolios.find((p: Portfolio) => p.id === selectedPortfolio);

  const calculatePortfolioMetrics = (portfolio: Portfolio) => {
    const totalPnL = portfolio.unrealizedPnL + portfolio.realizedPnL;
    const totalReturn = ((portfolio.totalValue - portfolio.totalInvested) / portfolio.totalInvested) * 100;
    const winRate = portfolio.positions.filter(p => p.unrealizedPnL > 0).length / portfolio.positions.length * 100;
    
    return { totalPnL, totalReturn, winRate };
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 30) return 'text-green-600';
    if (risk <= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading portfolio data...</div>;
  }

  if (!currentPortfolio) {
    return <div className="p-6 text-center">No portfolio data available</div>;
  }

  const metrics = calculatePortfolioMetrics(currentPortfolio);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio Manager</h1>
        <div className="flex gap-2">
          {portfolios.map((portfolio: Portfolio) => (
            <Button
              key={portfolio.id}
              variant={selectedPortfolio === portfolio.id ? 'default' : 'outline'}
              onClick={() => setSelectedPortfolio(portfolio.id)}
            >
              {portfolio.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentPortfolio.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.totalReturn.toFixed(2)}% from cost basis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            {metrics.totalPnL >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.totalPnL)}
            </div>
            <p className="text-xs text-muted-foreground">
              Realized: {formatCurrency(currentPortfolio.realizedPnL)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
            <Progress value={metrics.winRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${getRiskColor(currentPortfolio.riskScore)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(currentPortfolio.riskScore)}`}>
              {currentPortfolio.riskScore}/100
            </div>
            <Progress value={currentPortfolio.riskScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
              <CardDescription>
                {currentPortfolio.positions.length} positions • Total exposure: {formatCurrency(currentPortfolio.totalValue)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentPortfolio.positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.direction} • {position.timeframe}
                        </div>
                      </div>
                      <Badge variant={position.riskLevel === 'HIGH' ? 'destructive' : 
                                   position.riskLevel === 'MEDIUM' ? 'default' : 'secondary'}>
                        {position.riskLevel} RISK
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(position.size * position.currentPrice)}</div>
                      <div className={`text-sm ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(position.unrealizedPnL)} ({((position.currentPrice - position.entryPrice) / position.entryPrice * 100).toFixed(2)}%)
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Allocation</div>
                      <div className="font-medium">{position.allocation.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>Advanced risk metrics and portfolio health indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {riskMetrics && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{riskMetrics.sharpeRatio?.toFixed(2) || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{riskMetrics.maxDrawdown?.toFixed(1) || 'N/A'}%</div>
                      <div className="text-sm text-muted-foreground">Max Drawdown</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{riskMetrics.volatility?.toFixed(1) || 'N/A'}%</div>
                      <div className="text-sm text-muted-foreground">Volatility</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Diversification Score</span>
                      <span className="font-medium">{riskMetrics.diversificationScore?.toFixed(0) || 'N/A'}/100</span>
                    </div>
                    <Progress value={riskMetrics.diversificationScore || 0} />
                    
                    <div className="flex justify-between items-center">
                      <span>Portfolio Correlation</span>
                      <span className="font-medium">{riskMetrics.correlation?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <Progress value={(riskMetrics.correlation || 0) * 100} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>Portfolio distribution and concentration analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">By Position Size</h4>
                  {currentPortfolio.positions
                    .sort((a, b) => b.allocation - a.allocation)
                    .slice(0, 5)
                    .map((position, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{position.symbol}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={position.allocation} className="w-20" />
                          <span className="text-sm font-medium w-12">{position.allocation.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">By Risk Level</h4>
                  {['HIGH', 'MEDIUM', 'LOW'].map(risk => {
                    const count = currentPortfolio.positions.filter(p => p.riskLevel === risk).length;
                    const percentage = (count / currentPortfolio.positions.length) * 100;
                    return (
                      <div key={risk} className="flex justify-between items-center">
                        <span className="text-sm">{risk} Risk</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={percentage} className="w-20" />
                          <span className="text-sm font-medium w-12">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Historical performance and strategy effectiveness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Strategy Performance</h4>
                  {['1m', '5m', '15m', '1h', '4h', '1d'].map(timeframe => {
                    const positions = currentPortfolio.positions.filter(p => p.timeframe === timeframe);
                    const avgPnL = positions.reduce((acc, p) => acc + p.unrealizedPnL, 0) / positions.length;
                    return (
                      <div key={timeframe} className="flex justify-between items-center">
                        <span className="text-sm">{timeframe} Strategy</span>
                        <span className={`text-sm font-medium ${avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(avgPnL || 0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Direction Analysis</h4>
                  {['LONG', 'SHORT'].map(direction => {
                    const positions = currentPortfolio.positions.filter(p => p.direction === direction);
                    const totalPnL = positions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
                    const count = positions.length;
                    return (
                      <div key={direction} className="flex justify-between items-center">
                        <span className="text-sm">{direction} ({count})</span>
                        <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(totalPnL)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}