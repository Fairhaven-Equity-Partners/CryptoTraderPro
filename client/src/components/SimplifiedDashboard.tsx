import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { TrendingUp, TrendingDown, Minus, RefreshCcw } from "lucide-react";
import { TimeFrame } from '../types';
import { formatCurrency, formatPercentage } from '../lib/calculations';
import { useQuery } from '@tanstack/react-query';

interface MarketData {
  id: number;
  symbol: string;
  name: string;
  lastPrice: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  updatedAt: string;
}

interface TechnicalData {
  success: boolean;
  status: string;
  indicators?: {
    rsi?: number;
    macd?: number;
    sma20?: number;
    ema20?: number;
    stochastic?: number;
  };
}

interface AccuracyData {
  winRate: number;
  totalTrades: number;
  avgReturn: number;
  successfulTrades: number;
  failedTrades: number;
}

interface SimplifiedDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

const SimplifiedDashboard: React.FC<SimplifiedDashboardProps> = ({ 
  symbol, 
  onTimeframeSelect 
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch authentic market data
  const { data: marketData, isLoading: marketLoading } = useQuery<MarketData>({
    queryKey: ['/api/crypto', symbol],
    refetchInterval: 30000
  });

  // Fetch authentic technical analysis
  const { data: technicalData, isLoading: technicalLoading } = useQuery<TechnicalData>({
    queryKey: ['/api/technical-analysis', symbol],
    refetchInterval: 60000
  });

  // Fetch accuracy metrics
  const { data: accuracyData, isLoading: accuracyLoading } = useQuery<AccuracyData>({
    queryKey: ['/api/accuracy', symbol.replace('/', '/USDT').replace('/USDT/USDT', '/USDT')],
    refetchInterval: 30000
  });

  const timeframes: TimeFrame[] = ['15m', '1h', '4h', '1d', '3d', '1w'];

  const handleTimeframeChange = (value: string) => {
    const timeframe = value as TimeFrame;
    setSelectedTimeframe(timeframe);
    onTimeframeSelect?.(timeframe);
  };

  const handleManualCalculation = async () => {
    setIsCalculating(true);
    
    // Trigger immediate calculation
    const event = new CustomEvent('immediate-pair-calculation', {
      detail: { symbol, immediate: true, manual: true }
    });
    document.dispatchEvent(event);
    
    // Reset calculating state after delay
    setTimeout(() => setIsCalculating(false), 3000);
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'LONG':
      case 'BUY':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'SHORT':
      case 'SELL':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'LONG':
      case 'BUY':
        return 'text-green-400';
      case 'SHORT':
      case 'SELL':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (marketLoading) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Loading Market Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Overview */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{symbol} Analysis</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualCalculation}
              disabled={isCalculating}
              className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white"
            >
              {isCalculating ? (
                <RefreshCcw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCcw className="h-3 w-3 mr-1" />
              )}
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Information */}
          {marketData && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Current Price</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(marketData.lastPrice)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">24h Change</p>
                <p className={`text-lg font-semibold ${
                  marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(marketData.change24h)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Volume 24h</p>
                <p className="text-sm text-white">
                  {formatCurrency(marketData.volume24h)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Market Cap</p>
                <p className="text-sm text-white">
                  {formatCurrency(marketData.marketCap)}
                </p>
              </div>
            </div>
          )}

          {/* Technical Indicators */}
          {technicalData && technicalData.indicators && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Technical Indicators</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">RSI:</span>
                  <span className={`font-medium ${
                    (technicalData.indicators.rsi || 0) > 70 ? 'text-red-400' :
                    (technicalData.indicators.rsi || 0) < 30 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {technicalData.indicators.rsi?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MACD:</span>
                  <span className={`font-medium ${
                    (technicalData.indicators?.macd || 0) > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {technicalData.indicators?.macd?.toFixed(4) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SMA 20:</span>
                  <span className="text-white font-medium">
                    {technicalData.indicators.sma20 ? formatCurrency(technicalData.indicators.sma20) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMA 20:</span>
                  <span className="text-white font-medium">
                    {technicalData.indicators.ema20 ? formatCurrency(technicalData.indicators.ema20) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Accuracy Metrics */}
          {accuracyData && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Win Rate:</span>
                  <Badge variant="outline" className={`${
                    accuracyData.winRate >= 70 ? 'bg-green-900/20 text-green-400 border-green-800' :
                    accuracyData.winRate >= 50 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' :
                    'bg-red-900/20 text-red-400 border-red-800'
                  }`}>
                    {accuracyData.winRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Trades:</span>
                  <span className="text-white font-medium">{accuracyData.totalTrades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Return:</span>
                  <span className={`font-medium ${
                    accuracyData.avgReturn >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(accuracyData.avgReturn)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeframe Selection */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Timeframe Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full bg-gray-800">
              {timeframes.map((tf) => (
                <TabsTrigger
                  key={tf}
                  value={tf}
                  className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {timeframes.map((tf) => (
              <TabsContent key={tf} value={tf} className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Timeframe:</span>
                    <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800">
                      {tf}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Data Source:</span>
                    <span className="text-white">CoinMarketCap</span>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplifiedDashboard;