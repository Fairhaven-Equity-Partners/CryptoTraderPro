import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Target, Clock, Zap, AlertTriangle, CheckCircle, XCircle, Minus, Calendar, Activity, Star, ArrowUp, ArrowDown, DollarSign, Percent, Users, Volume2, Shield, Eye, MousePointer, Layers, MapPin, Crosshair, Timer, Gauge, Signal, Wifi, WifiOff, Pause, Play, SkipForward, RotateCcw } from 'lucide-react';

// Import shared types
import { TimeFrame, IndicatorCategory, IndicatorSignal, IndicatorStrength, Indicator } from '../types';

interface AdvancedSignal {
  id: number;
  symbol: string;
  timeframe: TimeFrame;
  direction: string;
  confidence: number;
  strength: number;
  price: number;
  timestamp: Date | null;
  indicators?: {
    rsi?: { value: number; signal: string };
    macd?: { value: number; signal: number; histogram: number; trend: string };
    bollingerBands?: { upper: number; middle: number; lower: number; position: string };
    atr?: { value: number; signal: string };
    stochastic?: { k: number; d: number; signal: string };
    ultraPrecisionMetrics?: any;
    resistances?: number[];
    supports?: number[];
  };
  patternFormations?: PatternFormation[];
  optimalRiskReward?: number | { ideal: number };
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

interface PatternFormation {
  type: string;
  confidence: number;
  description: string;
  name?: string;
  reliability?: number;
  direction?: string;
}

interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

const PriceLevelDisplay = ({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  if (!value) return null;
  
  return (
    <div className={`p-1.5 rounded ${colorClass} border`}>
      <div className="text-xs font-semibold">{label}</div>
      <div className="text-sm font-bold">${value.toFixed(2)}</div>
      <div className="text-xs opacity-75">{timeframe}</div>
    </div>
  );
};

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
  const [signals, setSignals] = useState<{ [key in TimeFrame]?: AdvancedSignal }>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [asset, setAsset] = useState<any>(null);
  const [centralizedPrice, setCentralizedPrice] = useState<number | null>(null);
  
  const lastCalculationRef = useRef<number>(0);
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

  const currentSignal = signals[selectedTimeframe] || null;

  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    onTimeframeSelect?.(timeframe);
  }, [onTimeframeSelect]);

  function formatCurrency(price: number): string {
    if (price < 0.01) {
      return price.toFixed(6);
    } else if (price < 1) {
      return price.toFixed(4);
    } else if (price < 100) {
      return price.toFixed(2);
    } else {
      return price.toFixed(0);
    }
  }

  function getSignalBgClass(direction: string): string {
    switch (direction) {
      case 'BUY':
      case 'LONG':
        return 'bg-green-900/30 border-green-600';
      case 'SELL':
      case 'SHORT':
        return 'bg-red-900/30 border-red-600';
      default:
        return 'bg-gray-900/30 border-gray-600';
    }
  }

  return (
    <div className="space-y-4">
      {/* Market Analysis - Moved to top for priority */}
      <Card className="border border-gray-700 bg-gradient-to-b from-gray-900/80 to-gray-950/90 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-white flex items-center">
            Market Analysis
            {isCalculating && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-900/20 text-blue-400 border-blue-800">
                Calculating...
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-gray-100">
            Timeframe-specific signals and trading opportunities
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2">
          <Tabs 
            defaultValue={selectedTimeframe} 
            onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-7">
              {timeframes.map(tf => (
                <TabsTrigger 
                  key={tf} 
                  value={tf}
                  disabled={!signals[tf]}
                  className={!signals[tf] ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {tf}
                </TabsTrigger>
              ))}
            </TabsList>

            {timeframes.map(tf => (
              <TabsContent key={tf} value={tf} className="mt-4">
                {signals[tf] ? (
                  <div className="space-y-4">
                    {/* Signal Overview */}
                    <div className={`p-4 rounded-lg border-2 ${getSignalBgClass(signals[tf]!.direction)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={`${
                            signals[tf]!.direction === 'BUY' ? 'bg-green-900/50 text-green-300 border-green-600' :
                            signals[tf]!.direction === 'SELL' ? 'bg-red-900/50 text-red-300 border-red-600' :
                            'bg-gray-900/50 text-gray-300 border-gray-600'
                          } text-sm font-bold px-3 py-1`}>
                            {signals[tf]!.direction}
                          </Badge>
                          <span className="text-white text-lg font-bold">
                            {signals[tf]!.confidence}% Confidence
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-300 text-sm">Entry Price</div>
                          <div className="text-white text-lg font-bold">
                            ${formatCurrency(centralizedPrice || signals[tf]!.price)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-gray-400 text-xs">Strength</div>
                          <div className="text-white font-semibold">{signals[tf]!.strength}/100</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Timeframe</div>
                          <div className="text-white font-semibold">{tf}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-xs">Updated</div>
                          <div className="text-white font-semibold">
                            {signals[tf]!.timestamp ? new Date(signals[tf]!.timestamp!).toLocaleTimeString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    {signals[tf]!.indicators && (
                      <Card className="bg-gray-800/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-white">Technical Indicators</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {signals[tf]!.indicators!.rsi && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-sm">RSI</span>
                              <div className="text-right">
                                <span className="text-white font-medium">
                                  {signals[tf]!.indicators!.rsi!.value.toFixed(1)}
                                </span>
                                <Badge variant="outline" className={`ml-2 text-xs ${
                                  signals[tf]!.indicators!.rsi!.signal === 'BUY' ? 'text-green-400 border-green-500' :
                                  signals[tf]!.indicators!.rsi!.signal === 'SELL' ? 'text-red-400 border-red-500' :
                                  'text-gray-400 border-gray-500'
                                }`}>
                                  {signals[tf]!.indicators!.rsi!.signal}
                                </Badge>
                              </div>
                            </div>
                          )}
                          
                          {signals[tf]!.indicators!.macd && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-sm">MACD</span>
                              <div className="text-right">
                                <span className="text-white font-medium">
                                  {signals[tf]!.indicators!.macd!.value.toFixed(3)}
                                </span>
                                <Badge variant="outline" className={`ml-2 text-xs ${
                                  signals[tf]!.indicators!.macd!.trend === 'BULLISH' ? 'text-green-400 border-green-500' :
                                  signals[tf]!.indicators!.macd!.trend === 'BEARISH' ? 'text-red-400 border-red-500' :
                                  'text-gray-400 border-gray-500'
                                }`}>
                                  {signals[tf]!.indicators!.macd!.trend}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">No signal data available for {tf}</div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        
        <CardFooter className="text-xs text-gray-500 pt-2">
          Data updated {lastCalculationRef.current > 0 ? new Date(lastCalculationRef.current).toLocaleTimeString() : 'never'} 
          • Timeframe data from market sources
        </CardFooter>
      </Card>
    </div>
  );
}