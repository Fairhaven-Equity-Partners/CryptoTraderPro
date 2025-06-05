import React, { useState, useEffect } from 'react';
import StatusBar from '../components/StatusBar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercentage, getPriceChangeClass } from '../lib/calculations';
import { useAssetList } from '../hooks/useMarketData';
import { ArrowDownRight, ArrowUpRight, DollarSign, LineChart, Percent, PieChart, Plus } from 'lucide-react';
import { SignalDirection } from '../types';
import { generateSignalSummary, generateTimeframeSignals } from '../lib/indicators';
import { Skeleton } from '@/components/ui/skeleton';

// Mock portfolio data
interface PortfolioAsset {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  allocation: number;
  signal: SignalDirection;
  signalStrength: number;
}

const Portfolio: React.FC = () => {
  const { assets, isLoading } = useAssetList();
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [portfolioChange, setPortfolioChange] = useState<number>(0);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading && assets.length > 0) {
      // In a real app, this would come from an API or state management
      // For this implementation, we'll create sample portfolio data
      setTimeout(() => {
        const samplePortfolio: PortfolioAsset[] = [
          {
            symbol: 'BTC/USDT',
            quantity: 0.05,
            entryPrice: 42000,
            currentPrice: assets.find(a => a.symbol === 'BTC/USDT')?.lastPrice || 0,
            allocation: 60,
            signal: 'LONG',
            signalStrength: 75
          },
          {
            symbol: 'ETH/USDT',
            quantity: 0.75,
            entryPrice: 2000,
            currentPrice: assets.find(a => a.symbol === 'ETH/USDT')?.lastPrice || 0,
            allocation: 30,
            signal: 'LONG',
            signalStrength: 60
          },
          {
            symbol: 'SOL/USDT',
            quantity: 5,
            entryPrice: 100,
            currentPrice: 123.45, // Fallback if not in assets
            allocation: 10,
            signal: 'NEUTRAL',
            signalStrength: 50
          }
        ];

        setPortfolioAssets(samplePortfolio);
        
        // Calculate total portfolio value
        const totalValue = samplePortfolio.reduce(
          (total, asset) => total + (asset.currentPrice * asset.quantity), 
          0
        );
        
        setPortfolioValue(totalValue);
        
        // Calculate portfolio change
        const initialValue = samplePortfolio.reduce(
          (total, asset) => total + (asset.entryPrice * asset.quantity), 
          0
        );
        
        const changePercent = ((totalValue - initialValue) / initialValue) * 100;
        setPortfolioChange(changePercent);
        
        setIsLoadingPortfolio(false);
      }, 1000);
    }
  }, [isLoading, assets]);

  // Style helpers
  const getChangeClass = (value: number) => {
    return value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-neutral';
  };

  return (
    <div className="flex flex-col h-screen">
      <StatusBar />
      
      <header className="bg-secondary px-4 py-3 shadow-md z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-xl font-semibold">Portfolio</h1>
          <Button variant="ghost" className="text-white">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pb-16">
        {/* Portfolio Summary */}
        <Card className="bg-secondary border-gray-700 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPortfolio ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-36 bg-gray-700" />
                <Skeleton className="h-6 w-24 bg-gray-700" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-white">
                  {formatCurrency(portfolioValue, 'USD')}
                </div>
                <div className={`flex items-center ${getChangeClass(portfolioChange)}`}>
                  {portfolioChange > 0 ? 
                    <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  }
                  <span className="text-sm font-medium">
                    {formatPercentage(portfolioChange)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Tabs */}
        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="assets" className="text-white">Assets</TabsTrigger>
            <TabsTrigger value="allocation" className="text-white">Allocation</TabsTrigger>
            <TabsTrigger value="signals" className="text-white">Signals</TabsTrigger>
          </TabsList>
          
          {/* Assets Tab */}
          <TabsContent value="assets">
            {isLoadingPortfolio ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-secondary border-gray-700">
                    <CardContent className="p-4">
                      <Skeleton className="h-20 w-full bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {portfolioAssets.map((asset) => {
                  const currentValue = asset.currentPrice * asset.quantity;
                  const initialValue = asset.entryPrice * asset.quantity;
                  const pnl = currentValue - initialValue;
                  const pnlPercent = (pnl / initialValue) * 100;
                  
                  return (
                    <Card key={asset.symbol} className="bg-secondary border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-medium">{asset.symbol}</h3>
                            <div className="text-sm text-neutral mt-1">
                              {asset.quantity} × {formatCurrency(asset.currentPrice, 'USD')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{formatCurrency(currentValue, 'USD')}</div>
                            <div className={`text-sm ${getChangeClass(pnlPercent)} mt-1`}>
                              {formatPercentage(pnlPercent)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            asset.signal === 'LONG' 
                              ? 'bg-success/20 text-success' 
                              : asset.signal === 'SHORT' 
                                ? 'bg-danger/20 text-danger' 
                                : 'bg-neutral/20 text-neutral'
                          }`}>
                            {asset.signal}
                          </span>
                          <div className="text-xs text-neutral">Signal Strength:</div>
                          <div className="flex-1">
                            <Progress 
                              value={asset.signalStrength} 
                              className={`h-1 ${
                                asset.signal === 'LONG' 
                                  ? 'bg-success' 
                                  : asset.signal === 'SHORT' 
                                    ? 'bg-danger' 
                                    : 'bg-neutral'
                              }`} 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* Allocation Tab */}
          <TabsContent value="allocation">
            {isLoadingPortfolio ? (
              <Card className="bg-secondary border-gray-700">
                <CardContent className="p-4 flex flex-col items-center">
                  <Skeleton className="h-40 w-40 rounded-full bg-gray-700 mb-4" />
                  <div className="space-y-2 w-full">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-8 w-full bg-gray-700" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-secondary border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-6">
                    <div className="relative h-40 w-40">
                      <PieChart className="h-40 w-40 text-accent" />
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-white text-lg font-medium">Allocation</span>
                        <span className="text-neutral text-sm">{portfolioAssets.length} assets</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {portfolioAssets.map((asset) => (
                      <div key={asset.symbol} className="flex items-center">
                        <div className={`h-3 w-3 rounded-full mr-2 ${
                          asset.symbol.includes('BTC') ? 'bg-chart-1' :
                          asset.symbol.includes('ETH') ? 'bg-chart-2' : 'bg-chart-3'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-white">{asset.symbol}</span>
                            <span className="text-white">{asset.allocation}%</span>
                          </div>
                          <Progress value={asset.allocation} className="h-1 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Signals Tab */}
          <TabsContent value="signals">
            {isLoadingPortfolio ? (
              <Card className="bg-secondary border-gray-700">
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full bg-gray-700 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-8 w-full bg-gray-700" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-secondary border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex justify-center items-center mb-6">
                    <div className="text-center">
                      <div className="text-lg text-white mb-1">Portfolio Signal Strength</div>
                      <div className="flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center">
                          <div className={`text-2xl font-bold ${
                            portfolioAssets.reduce((acc, asset) => acc + asset.signalStrength, 0) / portfolioAssets.length > 60
                              ? 'text-success'
                              : 'text-neutral'
                          }`}>
                            {Math.round(portfolioAssets.reduce((acc, asset) => acc + asset.signalStrength, 0) / portfolioAssets.length)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {portfolioAssets.map((asset) => (
                      <div key={asset.symbol} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white">{asset.symbol}</span>
                          <span className={`text-xs py-1 px-2 rounded ${
                            asset.signal === 'LONG' ? 'bg-success' : 
                            asset.signal === 'SHORT' ? 'bg-danger' : 'bg-neutral'
                          } text-white font-medium`}>
                            {asset.signal} {asset.signalStrength}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral">4h:</span>
                            <span className="text-success font-medium">LONG</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral">1d:</span>
                            <span className="text-success font-medium">LONG</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral">1w:</span>
                            <span className="text-success font-medium">LONG</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral">RSI:</span>
                            <span className="text-success font-medium">BUY</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Portfolio;
