import { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TimeFrame, TIMEFRAMES } from '@shared/schema';
import { useMarketData } from '../hooks/useMarketData';
import { AdvancedSignal } from '../types';

interface ConsolidatedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

interface LiveSignalData {
  timeframe: string;
  direction: string;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  accuracy?: number;
  predictions?: number;
}

interface MarketMetrics {
  price: number;
  change24h: number;
  volatility: string;
  trend: string;
  volume: string;
}

export default function ConsolidatedSignalDashboard({ 
  symbol, 
  onTimeframeSelect 
}: ConsolidatedSignalDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [signals, setSignals] = useState<Record<string, AdvancedSignal>>({});
  const [currentAssetPrice, setCurrentAssetPrice] = useState<number>(0);

  const queryClient = useQueryClient();

  // Fetch current asset data
  const { data: assetData } = useQuery({
    queryKey: ['/api/crypto', symbol],
    refetchInterval: 15000,
  });

  // Fetch accuracy metrics
  const { data: accuracyData = [] } = useQuery({
    queryKey: ['/api/accuracy', symbol],
    refetchInterval: 30000,
  });

  // Listen for live price and signal updates
  useEffect(() => {
    const handleLivePriceUpdate = (event: CustomEvent) => {
      if (event.detail?.symbol === symbol && event.detail?.price) {
        setCurrentAssetPrice(event.detail.price);
      }
    };

    const handleSignalUpdate = (event: CustomEvent) => {
      if (event.detail?.symbol === symbol && event.detail?.signals) {
        setSignals(event.detail.signals);
      }
    };

    window.addEventListener('livePriceUpdate', handleLivePriceUpdate as EventListener);
    window.addEventListener('signalUpdate', handleSignalUpdate as EventListener);

    return () => {
      window.removeEventListener('livePriceUpdate', handleLivePriceUpdate as EventListener);
      window.removeEventListener('signalUpdate', handleSignalUpdate as EventListener);
    };
  }, [symbol]);

  useEffect(() => {
    if (assetData && typeof assetData === 'object' && 'currentPrice' in assetData) {
      const price = (assetData as any).currentPrice;
      if (typeof price === 'number') {
        setCurrentAssetPrice(price);
      }
    }
  }, [assetData]);

  const priceChange24h = (assetData && typeof assetData === 'object' && 'priceChange24h' in assetData) 
    ? Number((assetData as any).priceChange24h) || 0 
    : 0;

  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    onTimeframeSelect?.(timeframe);
  }, [onTimeframeSelect]);

  const formatCurrency = (price: number): string => {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const getSignalColor = (direction: string, confidence: number) => {
    if (confidence < 50) return 'text-gray-400 border-gray-500';
    return direction === 'LONG' 
      ? 'text-green-400 border-green-500' 
      : 'text-red-400 border-red-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-400';
    if (confidence >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTradingStrategy = (timeframe: string) => {
    if (['1m', '5m'].includes(timeframe)) return 'Scalping';
    if (['15m', '30m', '1h'].includes(timeframe)) return 'Swing';
    return 'Position';
  };

  const getDataFrequency = (timeframe: string) => {
    if (['1m', '5m', '15m', '30m'].includes(timeframe)) return 'High';
    if (['1h', '4h'].includes(timeframe)) return 'Medium';
    return 'Low';
  };

  const currentSignal = signals[selectedTimeframe];
  const currentAccuracy = Array.isArray(accuracyData) ? accuracyData.find((acc: any) => acc.timeframe === selectedTimeframe) : null;

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
              {symbol} Signal Analysis
              <Badge className="bg-blue-500 text-white font-semibold px-2 py-1 text-xs">
                LIVE
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm mt-1">
              Real-time market analysis with predictive accuracy tracking
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-white text-2xl font-bold">
              ${formatCurrency(currentAssetPrice || 0)}
            </div>
            <div className={`text-sm font-medium ${
              priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Timeframe Selection */}
        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeframeSelect(tf)}
              className={`text-xs ${
                selectedTimeframe === tf 
                  ? 'bg-blue-600 text-white border-blue-500' 
                  : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600/50'
              }`}
            >
              {tf}
            </Button>
          ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Signal Direction & Confidence */}
          <div className="col-span-2 bg-gradient-to-br from-slate-800/60 to-slate-700/40 rounded-lg p-4 border border-slate-600/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm font-medium">Signal</span>
              <Badge 
                variant="outline" 
                className={`text-xs font-bold ${getSignalColor(
                  currentSignal?.direction || 'NEUTRAL', 
                  currentSignal?.confidence || 0
                )}`}
              >
                {currentSignal?.direction || 'NEUTRAL'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs">Confidence</span>
                <span className={`text-sm font-bold ${getConfidenceColor(currentSignal?.confidence || 0)}`}>
                  {currentSignal?.confidence?.toFixed(1) || '0'}%
                </span>
              </div>
              <Progress 
                value={currentSignal?.confidence || 0} 
                className="h-2"
              />
            </div>
          </div>

          {/* Entry Price */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/30 rounded-lg p-4 border border-blue-500/30">
            <div className="text-blue-300 text-xs font-medium mb-1">Entry Price</div>
            <div className="text-white text-lg font-bold">
              ${formatCurrency(currentSignal?.entryPrice || currentAssetPrice)}
            </div>
            <div className="text-blue-200 text-xs mt-1">
              {getTradingStrategy(selectedTimeframe)}
            </div>
          </div>

          {/* Accuracy Metrics */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/30 rounded-lg p-4 border border-purple-500/30">
            <div className="text-purple-300 text-xs font-medium mb-1">Accuracy</div>
            <div className="text-white text-lg font-bold">
              {currentAccuracy?.accuracy?.toFixed(1) || '0'}%
            </div>
            <div className="text-purple-200 text-xs mt-1">
              {currentAccuracy?.totalPredictions || 0} predictions
            </div>
          </div>
        </div>

        {/* Price Targets */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-red-600/20 to-red-700/30 rounded-lg p-3 border border-red-500/30">
            <div className="text-red-300 text-xs font-medium mb-1">Stop Loss</div>
            <div className="text-white text-sm font-bold">
              ${formatCurrency(currentSignal?.stopLoss || 0)}
            </div>
            <div className="text-red-200 text-xs">
              Risk: {currentSignal?.stopLoss && currentSignal?.entryPrice 
                ? Math.abs((currentSignal.stopLoss - currentSignal.entryPrice) / currentSignal.entryPrice * 100).toFixed(1)
                : '0'}%
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/30 rounded-lg p-3 border border-green-500/30">
            <div className="text-green-300 text-xs font-medium mb-1">Take Profit</div>
            <div className="text-white text-sm font-bold">
              ${formatCurrency(currentSignal?.takeProfit || 0)}
            </div>
            <div className="text-green-200 text-xs">
              Reward: {currentSignal?.takeProfit && currentSignal?.entryPrice 
                ? Math.abs((currentSignal.takeProfit - currentSignal.entryPrice) / currentSignal.entryPrice * 100).toFixed(1)
                : '0'}%
            </div>
          </div>
        </div>

        {/* Market Conditions & Trading Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm">Market Conditions</h4>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Data Frequency</span>
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-500">
                  {getDataFrequency(selectedTimeframe)}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Volatility</span>
                <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500">
                  Medium
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Market Trend</span>
                <Badge variant="outline" className="text-xs text-green-400 border-green-500">
                  {currentSignal?.direction || 'Neutral'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm">Strategy Recommendations</h4>
            <div className="space-y-1 text-xs text-slate-300">
              {selectedTimeframe === '1m' || selectedTimeframe === '5m' ? (
                <>
                  <div>• Use tight stop losses for quick exits</div>
                  <div>• Focus on momentum scalping plays</div>
                  <div>• Confirm with higher timeframes</div>
                </>
              ) : selectedTimeframe === '15m' || selectedTimeframe === '30m' || selectedTimeframe === '1h' ? (
                <>
                  <div>• Balance risk with profit potential</div>
                  <div>• Technical patterns more reliable</div>
                  <div>• Wait for volume confirmation</div>
                </>
              ) : (
                <>
                  <div>• Use wider stops, higher targets</div>
                  <div>• Focus on trend following</div>
                  <div>• Lower noise, higher accuracy</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            disabled={!currentSignal || currentSignal.confidence < 60}
          >
            Execute Trade
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Set Alert
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}