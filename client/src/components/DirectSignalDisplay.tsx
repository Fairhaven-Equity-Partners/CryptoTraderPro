import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { TimeFrame } from '../types';

interface BackendSignal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp?: number;
  indicators?: any;
}

interface DirectSignalDisplayProps {
  symbol: string;
  selectedTimeframe: TimeFrame;
}

export const DirectSignalDisplay: React.FC<DirectSignalDisplayProps> = ({ 
  symbol, 
  selectedTimeframe 
}) => {
  const [signals, setSignals] = useState<Record<TimeFrame, BackendSignal | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);

  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

  const fetchSignals = async () => {
    if (!symbol || isLoading) return;
    
    setIsLoading(true);
    const newSignals: Record<TimeFrame, BackendSignal | null> = {};
    let successCount = 0;

    console.log(`🔄 Fetching backend signals for ${symbol}`);

    // Fetch all signals in parallel
    const signalPromises = timeframes.map(async (timeframe) => {
      try {
        const response = await fetch(`/api/signal/${encodeURIComponent(symbol)}/${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.signal) {
            newSignals[timeframe] = data.signal;
            successCount++;
            console.log(`✅ ${symbol} ${timeframe}: ${data.signal.direction} @ ${data.signal.confidence}%`);
          } else {
            newSignals[timeframe] = null;
          }
        } else {
          newSignals[timeframe] = null;
        }
      } catch (error) {
        newSignals[timeframe] = null;
        console.error(`❌ Error fetching ${symbol} ${timeframe}:`, error);
      }
    });

    await Promise.all(signalPromises);
    
    setSignals(newSignals);
    setLastUpdate(Date.now());
    
    const longCount = Object.values(newSignals).filter(s => s?.direction === 'LONG').length;
    const shortCount = Object.values(newSignals).filter(s => s?.direction === 'SHORT').length;
    
    console.log(`🎯 Loaded ${successCount}/10 signals for ${symbol}: ${longCount} LONG, ${shortCount} SHORT`);
    setIsLoading(false);
  };

  useEffect(() => {
    if (symbol) {
      fetchSignals();
    }
  }, [symbol]);

  const getSignalIcon = (direction: string) => {
    switch (direction) {
      case 'LONG':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'SHORT':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSignalColor = (direction: string) => {
    switch (direction) {
      case 'LONG':
        return 'bg-green-500/20 text-green-700 border-green-200';
      case 'SHORT':
        return 'bg-red-500/20 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const validSignalCount = Object.values(signals).filter(s => s !== null).length;
  const selectedSignal = signals[selectedTimeframe];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">
          Backend Signals - {symbol}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSignals}
          disabled={isLoading}
          className="h-8"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(signals).filter(s => s?.direction === 'LONG').length}
            </div>
            <div className="text-sm text-muted-foreground">LONG</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(signals).filter(s => s?.direction === 'SHORT').length}
            </div>
            <div className="text-sm text-muted-foreground">SHORT</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              {validSignalCount}/10
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
        </div>

        {/* Selected Timeframe Signal */}
        {selectedSignal && (
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {getSignalIcon(selectedSignal.direction)}
                {selectedTimeframe} Signal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Direction:</span>
                <Badge className={getSignalColor(selectedSignal.direction)}>
                  {selectedSignal.direction}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Confidence:</span>
                  <span className="font-medium">{selectedSignal.confidence}%</span>
                </div>
                <Progress value={selectedSignal.confidence} className="h-2" />
              </div>
              {selectedSignal.entryPrice && (
                <div className="flex items-center justify-between text-sm">
                  <span>Entry Price:</span>
                  <span className="font-medium">${selectedSignal.entryPrice.toLocaleString()}</span>
                </div>
              )}
              {selectedSignal.indicators?.trend && selectedSignal.indicators.trend.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {selectedSignal.indicators.trend.length} technical indicators active
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Timeframes Grid */}
        <div className="grid grid-cols-5 gap-2">
          {timeframes.map((tf) => {
            const signal = signals[tf];
            const isSelected = tf === selectedTimeframe;
            
            return (
              <div
                key={tf}
                className={`p-2 rounded border text-center text-xs ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="font-medium">{tf}</div>
                {signal ? (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-center">
                      {getSignalIcon(signal.direction)}
                    </div>
                    <div className="text-xs font-medium">
                      {signal.confidence}%
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-gray-400">
                    No Signal
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status */}
        <div className="text-xs text-muted-foreground text-center">
          {lastUpdate > 0 && (
            <>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</>
          )}
        </div>
      </CardContent>
    </Card>
  );
};