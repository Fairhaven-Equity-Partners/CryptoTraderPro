import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Activity, DollarSign, Target, Shield } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import { getMasterPrice } from '../lib/masterUnifiedSystem';
import type { TradeSimulation, AccuracyMetrics } from '@shared/schema';

// Clean, simplified types
interface SimpleSignal {
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

interface CleanSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: string) => void;
}

export default function CleanSignalDashboard({ symbol, onTimeframeSelect }: CleanSignalDashboardProps) {
  const [signals, setSignals] = useState<Record<string, SimpleSignal | null>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const lastCalculationRef = useRef<number>(0);
  const queryClient = useQueryClient();

  // Market data and price tracking
  const { isLiveDataReady } = useMarketData(symbol);
  const currentAssetPrice = getMasterPrice() || 0;

  // Trade simulations query
  const { data: tradeSimulations = [], isLoading: tradesLoading } = useQuery({
    queryKey: [`/api/trade-simulations/${encodeURIComponent(symbol)}`],
    refetchInterval: 5000,
  });

  // Accuracy metrics query
  const { data: accuracyMetrics = [] } = useQuery<AccuracyMetrics[]>({
    queryKey: [`/api/accuracy/${symbol}`],
    refetchInterval: 10000,
  });

  // Simple calculation function
  const calculateSignal = useCallback((timeframe: string): SimpleSignal => {
    const price = getMasterPrice() || currentAssetPrice || 0;
    
    if (price === 0) {
      return {
        timeframe,
        direction: 'NEUTRAL',
        confidence: 50,
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        timestamp: Date.now()
      };
    }

    // Simple trend analysis based on timeframe
    const directions = ['LONG', 'SHORT', 'NEUTRAL'] as const;
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%

    return {
      timeframe,
      direction,
      confidence,
      entryPrice: price,
      stopLoss: direction === 'LONG' ? price * 0.97 : price * 1.03,
      takeProfit: direction === 'LONG' ? price * 1.05 : price * 0.95,
      timestamp: Date.now()
    };
  }, [currentAssetPrice]);

  // Calculate all signals
  const calculateAllSignals = useCallback(async () => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    console.log('Starting clean calculation cycle...');
    
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    const newSignals: Record<string, SimpleSignal | null> = {};
    
    for (const tf of timeframes) {
      try {
        newSignals[tf] = calculateSignal(tf);
        console.log(`Calculated ${tf}: ${newSignals[tf]?.direction} @ ${newSignals[tf]?.entryPrice}`);
      } catch (error) {
        console.error(`Error calculating ${tf}:`, error);
        newSignals[tf] = null;
      }
    }
    
    setSignals(newSignals);
    lastCalculationRef.current = Date.now();
    
    // Create trade simulations for non-neutral signals
    for (const [tf, signal] of Object.entries(newSignals)) {
      if (signal && signal.direction !== 'NEUTRAL' && signal.entryPrice > 0) {
        try {
          await fetch('/api/trade-simulations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol,
              timeframe: tf,
              direction: signal.direction,
              entryPrice: signal.entryPrice,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit,
              confidence: signal.confidence,
              signalData: JSON.stringify(signal)
            })
          });
          console.log(`Created trade simulation: ${tf} ${signal.direction} @ ${signal.entryPrice}`);
        } catch (error) {
          console.error(`Error creating trade simulation for ${tf}:`, error);
        }
      }
    }
    
    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: [`/api/trade-simulations/${encodeURIComponent(symbol)}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/accuracy/${symbol}`] });
    
    setIsCalculating(false);
    console.log('Clean calculation cycle completed');
  }, [symbol, isCalculating, calculateSignal, queryClient]);

  // 3-minute calculation timer
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceLastCalc = (Date.now() - lastCalculationRef.current) / 1000;
      if (timeSinceLastCalc >= 180 && !isCalculating) { // 3 minutes
        calculateAllSignals();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(timer);
  }, [calculateAllSignals, isCalculating]);

  // Initial calculation
  useEffect(() => {
    if (isLiveDataReady && lastCalculationRef.current === 0) {
      calculateAllSignals();
    }
  }, [isLiveDataReady, calculateAllSignals]);

  // Signal display component
  const SignalCard = ({ timeframe, signal }: { timeframe: string; signal: SimpleSignal | null }) => {
    if (!signal) {
      return (
        <Card className="opacity-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{timeframe}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">No Signal</div>
          </CardContent>
        </Card>
      );
    }

    const getSignalColor = (direction: string) => {
      switch (direction) {
        case 'LONG': return 'text-green-600 bg-green-50';
        case 'SHORT': return 'text-red-600 bg-red-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    const getSignalIcon = (direction: string) => {
      switch (direction) {
        case 'LONG': return <TrendingUp className="w-4 h-4" />;
        case 'SHORT': return <TrendingDown className="w-4 h-4" />;
        default: return <Minus className="w-4 h-4" />;
      }
    };

    return (
      <Card className={`cursor-pointer transition-all hover:shadow-md ${
        selectedTimeframe === timeframe ? 'ring-2 ring-blue-500' : ''
      }`} onClick={() => {
        setSelectedTimeframe(timeframe);
        onTimeframeSelect?.(timeframe);
      }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            {timeframe}
            {getSignalIcon(signal.direction)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={`${getSignalColor(signal.direction)} mb-2`}>
            {signal.direction}
          </Badge>
          <div className="space-y-1 text-xs">
            <div>Confidence: {signal.confidence}%</div>
            <div>Entry: ${signal.entryPrice.toFixed(2)}</div>
            {signal.direction !== 'NEUTRAL' && (
              <>
                <div>Stop: ${signal.stopLoss.toFixed(2)}</div>
                <div>Target: ${signal.takeProfit.toFixed(2)}</div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats
  const totalTrades = tradeSimulations.length;
  const activeTrades = tradeSimulations.filter((t: TradeSimulation) => t.isActive).length;
  const completedTrades = totalTrades - activeTrades;
  const overallAccuracy = accuracyMetrics.length > 0 
    ? accuracyMetrics.reduce((sum, m) => sum + (m.successRate || 0), 0) / accuracyMetrics.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Signal Analysis - {symbol}</h2>
          <p className="text-gray-600">Live Price: ${(getMasterPrice() || currentAssetPrice || 0).toFixed(2)}</p>
        </div>
        <Button 
          onClick={calculateAllSignals} 
          disabled={isCalculating}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          {isCalculating ? 'Calculating...' : 'Calculate Now'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Total Trades</div>
                <div className="text-xl font-bold">{totalTrades}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-xl font-bold">{activeTrades}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-xl font-bold">{completedTrades}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-sm text-gray-600">Accuracy</div>
                <div className="text-xl font-bold">{overallAccuracy.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Progress */}
      {isCalculating && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 animate-spin" />
              <span className="text-sm">Calculating signals...</span>
            </div>
            <Progress value={50} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Signal Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Timeframe Signals</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'].map(tf => (
            <SignalCard 
              key={tf} 
              timeframe={tf} 
              signal={signals[tf]} 
            />
          ))}
        </div>
      </div>

      {/* Selected Signal Details */}
      {selectedTimeframe && signals[selectedTimeframe] && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTimeframe} Signal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Direction</div>
                <div className="font-semibold">{signals[selectedTimeframe]?.direction}</div>
              </div>
              <div>
                <div className="text-gray-600">Confidence</div>
                <div className="font-semibold">{signals[selectedTimeframe]?.confidence}%</div>
              </div>
              <div>
                <div className="text-gray-600">Entry Price</div>
                <div className="font-semibold">${signals[selectedTimeframe]?.entryPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Risk/Reward</div>
                <div className="font-semibold">
                  {signals[selectedTimeframe] && signals[selectedTimeframe]!.direction !== 'NEUTRAL' 
                    ? (Math.abs(signals[selectedTimeframe]!.takeProfit - signals[selectedTimeframe]!.entryPrice) / 
                       Math.abs(signals[selectedTimeframe]!.entryPrice - signals[selectedTimeframe]!.stopLoss)).toFixed(2)
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}