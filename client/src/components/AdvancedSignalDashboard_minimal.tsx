import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TimeFrame, AdvancedSignal } from '@/lib/types';

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
  const [recommendation, setRecommendation] = useState<any>(null);
  const { toast } = useToast();

  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

  // Handle synchronized calculation events
  useEffect(() => {
    const handleSynchronizedCalculationEvent = (event: CustomEvent) => {
      const { symbol: eventSymbol, signals: eventSignals } = event.detail;
      if (eventSymbol === symbol && eventSignals) {
        console.log(`[SignalDashboard] Received synchronized signals for ${symbol}`);
        setSignals(eventSignals);
        
        // Generate recommendation
        const validSignalCount = Object.values(eventSignals).filter(s => s !== null).length;
        if (validSignalCount > 0) {
          toast({
            title: "Auto-Calculation Complete",
            description: `Updated ${validSignalCount} signals for ${symbol}`,
            variant: "default",
            duration: 5000
          });
        }
      }
    };

    window.addEventListener('synchronizedCalculationComplete', handleSynchronizedCalculationEvent as EventListener);
    return () => {
      window.removeEventListener('synchronizedCalculationComplete', handleSynchronizedCalculationEvent as EventListener);
    };
  }, [symbol, toast]);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Advanced Signal Analysis - {symbol}
            <Badge variant={isCalculating ? "default" : "secondary"}>
              {isCalculating ? "Calculating..." : "Ready"}
            </Badge>
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
              </Button>
            ))}
          </div>

          {/* Current Signal Display */}
          {currentSignal && (
            <Card className={`${getSignalBgClass(currentSignal.direction)} border`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Direction</p>
                    <p className="font-semibold">{currentSignal.direction}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="font-semibold">{Math.round(currentSignal.confidence)}%</p>
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
              </CardContent>
            </Card>
          )}

          {/* Signal Summary */}
          <div className="grid grid-cols-5 gap-2">
            {timeframes.map((tf) => {
              const signal = signals[tf];
              return (
                <div
                  key={tf}
                  className={`p-2 rounded text-center text-xs ${
                    signal 
                      ? getSignalBgClass(signal.direction)
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  <div className="font-medium">{tf}</div>
                  <div className="text-xs">
                    {signal ? signal.direction : 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}