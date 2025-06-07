import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Type definitions
export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '3d' | '1w' | '1M';

export interface AdvancedSignal {
  symbol: string;
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
}

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
  onAnalysisComplete?: () => void;
}

export default function AdvancedSignalDashboard({ 
  symbol,
  onTimeframeSelect,
  onAnalysisComplete
}: AdvancedSignalDashboardProps) {
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({
    "1m": null, "5m": null, "15m": null, "30m": null, "1h": null,
    "4h": null, "1d": null, "3d": null, "1w": null, "1M": null
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('4h');
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

  // Handle synchronized calculation events from backend
  useEffect(() => {
    const handleSynchronizedCalculationEvent = (event: CustomEvent) => {
      try {
        const { symbol: eventSymbol, signals: eventSignals } = event.detail;
        if (eventSymbol === symbol && eventSignals) {
          console.log(`[SignalDashboard] Received synchronized signals for ${symbol}`);
          setSignals(eventSignals);
          
          const validSignalCount = Object.values(eventSignals).filter(s => s !== null).length;
          if (validSignalCount > 0) {
            toast({
              title: "Auto-Calculation Complete",
              description: `Updated ${validSignalCount} signals for ${symbol}`,
              variant: "default",
              duration: 5000
            });
            onAnalysisComplete?.();
          }
        }
      } catch (error) {
        console.error('[SignalDashboard] Event handling error:', error);
      }
    };

    const handlePriceUpdate = (event: CustomEvent) => {
      try {
        const { symbol: eventSymbol } = event.detail;
        if (eventSymbol === symbol) {
          console.log(`[SignalDashboard] Price update received for ${symbol}`);
        }
      } catch (error) {
        console.error('[SignalDashboard] Price update error:', error);
      }
    };

    window.addEventListener('synchronizedCalculationComplete', handleSynchronizedCalculationEvent as EventListener);
    window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('synchronizedCalculationComplete', handleSynchronizedCalculationEvent as EventListener);
      window.removeEventListener('priceUpdate', handlePriceUpdate as EventListener);
    };
  }, [symbol, toast, onAnalysisComplete]);

  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    onTimeframeSelect?.(timeframe);
  }, [onTimeframeSelect]);

  const formatCurrency = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(price);
  };

  const getSignalBgClass = (direction: string): string => {
    switch (direction) {
      case 'LONG': return 'bg-green-500/10 border-green-500/30';
      case 'SHORT': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const currentSignal = signals[selectedTimeframe];
  const totalSignals = Object.values(signals).filter(s => s !== null).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Advanced Signal Analysis - {symbol}
            <div className="flex gap-2">
              <Badge variant="outline">{totalSignals}/10 Signals</Badge>
              <Badge variant={isCalculating ? "default" : "secondary"}>
                {isCalculating ? "Calculating..." : "Ready"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timeframe Selection */}
          <div className="flex flex-wrap gap-2">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={selectedTimeframe === tf ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeframeSelect(tf)}
                className="min-w-[60px]"
              >
                {tf}
                {signals[tf] && (
                  <span className={`ml-1 w-2 h-2 rounded-full ${
                    signals[tf]?.direction === 'LONG' ? 'bg-green-500' :
                    signals[tf]?.direction === 'SHORT' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                )}
              </Button>
            ))}
          </div>

          {/* Current Signal Display */}
          {currentSignal ? (
            <Card className={`${getSignalBgClass(currentSignal.direction)} border`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Direction</p>
                    <p className="font-semibold text-lg">{currentSignal.direction}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="font-semibold text-lg">{Math.round(currentSignal.confidence)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Price</p>
                    <p className="font-semibold">{formatCurrency(currentSignal.entryPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stop Loss</p>
                    <p className="font-semibold">{formatCurrency(currentSignal.stopLoss)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Take Profit</p>
                      <p className="font-semibold">{formatCurrency(currentSignal.takeProfit)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Signal Time</p>
                      <p className="font-semibold">
                        {new Date(currentSignal.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>No signal available for {selectedTimeframe} timeframe</p>
                <p className="text-sm mt-2">Automated calculations will generate signals every 4 minutes</p>
              </CardContent>
            </Card>
          )}

          {/* Signal Summary Grid */}
          <div className="grid grid-cols-5 gap-2">
            {timeframes.map((tf) => {
              const signal = signals[tf];
              return (
                <div
                  key={tf}
                  className={`p-3 rounded-lg text-center text-xs border cursor-pointer transition-all hover:scale-105 ${
                    signal 
                      ? getSignalBgClass(signal.direction)
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  } ${selectedTimeframe === tf ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => handleTimeframeSelect(tf)}
                >
                  <div className="font-medium">{tf}</div>
                  <div className="text-xs mt-1">
                    {signal ? (
                      <>
                        <div className="font-semibold">{signal.direction}</div>
                        <div className="text-xs opacity-75">{Math.round(signal.confidence)}%</div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">Pending</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Information */}
          <div className="text-sm text-muted-foreground text-center">
            Signals are automatically calculated every 4 minutes using authentic market data from CoinGecko API
          </div>
        </CardContent>
      </Card>
    </div>
  );
}