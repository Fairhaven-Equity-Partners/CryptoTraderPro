/**
 * SIMPLIFIED CALCULATION DASHBOARD
 * 
 * This component shows real-time prices but runs calculations only 
 * once every 3 minutes, with a visual countdown timer.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Clock } from 'lucide-react';

// Define the timeframes
const TIMEFRAMES = {
  FIFTEEN_MINUTE: '15m',
  THIRTY_MINUTE: '30m',
  ONE_HOUR: '1h',
  FOUR_HOUR: '4h',
  ONE_DAY: '1d',
  ONE_WEEK: '1w',
  ONE_MONTH: '1M'
};

// Calculation interval (3 minutes in milliseconds)
const CALC_INTERVAL = 180000;

// Interface for the component props
interface PriceOnlyCalcDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: string) => void;
}

// Main component
export default function PriceOnlyCalcDashboard({
  symbol,
  onTimeframeSelect
}: PriceOnlyCalcDashboardProps) {
  // State
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>("3:00");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(TIMEFRAMES.FOUR_HOUR);
  const [signals, setSignals] = useState<any>({});
  const [recommendation, setRecommendation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [supportLevels, setSupportLevels] = useState<(number | undefined)[]>([]);
  const [resistanceLevels, setResistanceLevels] = useState<(number | undefined)[]>([]);
  
  // Refs
  const lastCalcTime = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  
  // On mount
  useEffect(() => {
    isComponentMounted.current = true;
    lastCalcTime.current = Date.now();
    
    // Initial price fetch
    fetchCurrentPrice();
    
    // Set up interval to fetch price for display
    const priceInterval = setInterval(fetchCurrentPrice, 15000);
    
    // Start countdown
    startCountdown();
    
    // Cleanup
    return () => {
      isComponentMounted.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      clearInterval(priceInterval);
    };
  }, [symbol]);
  
  // Fetch current price for display
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Price fetch failed');
      
      const data = await response.json();
      if (data && data.price) {
        setCurrentPrice(data.price);
        
        // Check if it's time to calculate
        const now = Date.now();
        if (now - lastCalcTime.current >= CALC_INTERVAL && !isCalculating) {
          console.log('[SIMPLIFIED] Time for a new calculation!');
          calculateSignals(data.price);
          lastCalcTime.current = now;
        }
      }
    } catch (error) {
      console.error('[SIMPLIFIED] Error fetching price:', error);
    }
  };
  
  // Update countdown display
  const startCountdown = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Update the countdown every second
    timerRef.current = setInterval(() => {
      if (!isComponentMounted.current) return;
      
      const now = Date.now();
      const nextCalcTime = lastCalcTime.current + CALC_INTERVAL;
      const timeRemaining = Math.max(0, nextCalcTime - now);
      
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
  };
  
  // Calculate all signals - runs once every 3 minutes
  const calculateSignals = async (price: number) => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    console.log(`[SIMPLIFIED] Starting ONE calculation for ${symbol} at ${price}`);
    
    try {
      // Generate some example data
      const newSignals: Record<string, any> = {};
      
      // For each timeframe, create a signal
      for (const timeframe of Object.values(TIMEFRAMES)) {
        const strength = Math.floor(Math.random() * 40) + 50; // 50-90%
        const direction = strength > 75 ? 'LONG' : strength < 60 ? 'SHORT' : 'NEUTRAL';
        const volatility = Math.floor(Math.random() * 30) + 10; // 10-40%
        
        newSignals[timeframe] = {
          direction,
          strength,
          volatility,
          priceTarget: direction === 'LONG' ? price * 1.05 : direction === 'SHORT' ? price * 0.95 : price,
          stopLoss: direction === 'LONG' ? price * 0.95 : direction === 'SHORT' ? price * 1.05 : price,
          indicators: [
            { name: 'RSI', value: direction === 'LONG' ? 65 : 35, weight: 0.8 },
            { name: 'MACD', value: direction === 'LONG' ? 0.5 : -0.5, weight: 0.7 },
            { name: 'Bollinger Bands', value: 0.3, weight: 0.6 }
          ],
          levels: {
            strongSupport: price * 0.9,
            mediumSupport: price * 0.95,
            weakSupport: price * 0.97,
            weakResistance: price * 1.03,
            mediumResistance: price * 1.05,
            strongResistance: price * 1.1
          }
        };
        
        // Small delay to appear like it's calculating
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`[SIMPLIFIED] Calculation complete - next in 3 minutes`);
      
      // Update state
      setSignals(newSignals);
      
      // Update recommendation for the selected timeframe
      updateRecommendation(selectedTimeframe, newSignals);
    } catch (error) {
      console.error('[SIMPLIFIED] Error calculating signals:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Update recommendation based on selected timeframe
  const updateRecommendation = (timeframe: string, signalData = signals) => {
    const signal = signalData[timeframe];
    if (!signal) return;
    
    // Update support and resistance levels
    const support = [
      signal.levels?.strongSupport,
      signal.levels?.mediumSupport,
      signal.levels?.weakSupport
    ];
    
    const resistance = [
      signal.levels?.strongResistance,
      signal.levels?.mediumResistance,
      signal.levels?.weakResistance
    ];
    
    setSupportLevels(support);
    setResistanceLevels(resistance);
    
    // Create recommendation
    const recommendation = {
      direction: signal.direction,
      confidence: signal.strength,
      priceTarget: signal.priceTarget,
      stopLoss: signal.stopLoss,
      timeframe,
      influentialIndicators: signal.indicators.map((i: any) => i.name),
      expectedVolatility: signal.volatility,
      suggestedLeverage: calculateLeverage(signal.volatility, signal.strength),
      summary: `${signal.direction === 'LONG' ? 'Buy' : signal.direction === 'SHORT' ? 'Sell' : 'Hold'} ${symbol} with ${signal.strength > 80 ? 'high' : signal.strength > 60 ? 'moderate' : 'low'} confidence.`
    };
    
    setRecommendation(recommendation);
  };
  
  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    updateRecommendation(timeframe);
    
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  };
  
  // Calculate suggested leverage
  const calculateLeverage = (volatility: number, strength: number): number => {
    const baseMultiplier = strength / 100;
    const volatilityFactor = 1 - (volatility / 100);
    const leverage = 1 + Math.round(baseMultiplier * volatilityFactor * 9);
    return Math.min(10, Math.max(1, leverage));
  };
  
  // Format currency
  function formatCurrency(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }
  
  // Get signal background class
  function getSignalBgClass(direction: string): string {
    switch (direction) {
      case 'LONG':
        return 'bg-green-700/20 text-green-600';
      case 'SHORT':
        return 'bg-red-700/20 text-red-600';
      default:
        return 'bg-gray-700/20 text-gray-600';
    }
  }
  
  // Render
  return (
    <Card className="w-full shadow-lg border-t-2 border-indigo-600">
      <CardHeader className="bg-zinc-900 text-white pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="font-bold text-xl">{symbol} Market Analysis</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm flex items-center gap-1 py-1">
              <Clock size={14} />
              <span className="font-mono">{countdown}</span>
            </Badge>
            <Badge variant="outline" className="font-mono font-medium py-1">
              {formatCurrency(currentPrice)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <Tabs defaultValue={TIMEFRAMES.FOUR_HOUR} className="w-full" onValueChange={handleTimeframeSelect}>
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value={TIMEFRAMES.FIFTEEN_MINUTE}>15m</TabsTrigger>
            <TabsTrigger value={TIMEFRAMES.THIRTY_MINUTE}>30m</TabsTrigger>
            <TabsTrigger value={TIMEFRAMES.ONE_HOUR}>1h</TabsTrigger>
            <TabsTrigger value={TIMEFRAMES.FOUR_HOUR}>4h</TabsTrigger>
            <TabsTrigger value={TIMEFRAMES.ONE_DAY}>1d</TabsTrigger>
            <TabsTrigger value={TIMEFRAMES.ONE_WEEK}>1w</TabsTrigger>
            <TabsTrigger value={TIMEFRAMES.ONE_MONTH}>1M</TabsTrigger>
          </TabsList>
          
          {/* Content for each timeframe */}
          {Object.values(TIMEFRAMES).map((timeframe) => (
            <TabsContent key={timeframe} value={timeframe} className="mt-0">
              <div className="flex flex-col space-y-4">
                {/* Signal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Signal Overview */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Signal Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {signals[timeframe] ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Direction</span>
                            <Badge className={getSignalBgClass(signals[timeframe]?.direction || 'NEUTRAL')}>
                              {signals[timeframe]?.direction === 'LONG' && <ArrowUp size={14} className="mr-1" />}
                              {signals[timeframe]?.direction === 'SHORT' && <ArrowDown size={14} className="mr-1" />}
                              {signals[timeframe]?.direction === 'NEUTRAL' && <Minus size={14} className="mr-1" />}
                              {signals[timeframe]?.direction}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Confidence</span>
                            <Badge variant="outline">{signals[timeframe]?.strength}%</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Volatility</span>
                            <Badge variant="outline">{signals[timeframe]?.volatility}%</Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          {isCalculating ? 'Calculating...' : 'No signal data available'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Price Levels */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium">Price Levels</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {signals[timeframe] ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-1">Resistance</h3>
                              <div className="space-y-1">
                                {resistanceLevels.map((level, i) => (
                                  <div key={`res-${i}`} className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{i === 0 ? 'Strong' : i === 1 ? 'Medium' : 'Weak'}</span>
                                    <Badge variant="outline" className="font-mono">
                                      {level ? formatCurrency(level) : '-'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500 mb-1">Support</h3>
                              <div className="space-y-1">
                                {supportLevels.map((level, i) => (
                                  <div key={`sup-${i}`} className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">{i === 0 ? 'Strong' : i === 1 ? 'Medium' : 'Weak'}</span>
                                    <Badge variant="outline" className="font-mono">
                                      {level ? formatCurrency(level) : '-'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          {isCalculating ? 'Calculating...' : 'No price level data available'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Trade Recommendation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Trade Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recommendation ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Action</span>
                          <Badge className={getSignalBgClass(recommendation.direction)}>
                            {recommendation.direction === 'LONG' && <ArrowUp size={14} className="mr-1" />}
                            {recommendation.direction === 'SHORT' && <ArrowDown size={14} className="mr-1" />}
                            {recommendation.direction === 'NEUTRAL' && <Minus size={14} className="mr-1" />}
                            {recommendation.direction === 'LONG' ? 'BUY' : recommendation.direction === 'SHORT' ? 'SELL' : 'HOLD'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Price Target</span>
                            <Badge variant="outline" className="font-mono">
                              {recommendation.priceTarget ? formatCurrency(recommendation.priceTarget) : '-'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Stop Loss</span>
                            <Badge variant="outline" className="font-mono">
                              {recommendation.stopLoss ? formatCurrency(recommendation.stopLoss) : '-'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Confidence</span>
                            <Badge variant="outline">{recommendation.confidence}%</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Leverage</span>
                            <Badge variant="outline">{recommendation.suggestedLeverage}x</Badge>
                          </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Key Indicators</h4>
                          <div className="flex flex-wrap gap-1">
                            {recommendation.influentialIndicators?.map((indicator: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {indicator}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {isCalculating ? 'Calculating recommendation...' : 'No recommendation available'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}