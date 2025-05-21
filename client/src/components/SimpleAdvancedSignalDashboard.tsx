/**
 * SIMPLE ADVANCED SIGNAL DASHBOARD
 * 
 * This is a completely rebuilt version that uses a single, simple calculation
 * mechanism that runs only once when data is fetched every 3 minutes.
 */

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Clock, RefreshCw } from 'lucide-react';
import { calculateTimeframe } from '@/lib/advancedSignals';
import { TimeFrame } from '@/lib/types';
import { type AdvancedSignal, TradeRecommendation } from '@/lib/types';
import { initializeSimpleCalcSystem, onCalculation, getFormattedCountdown } from '@/lib/simpleCalcSystem';

// Component props
interface SimpleAdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

// Main component
export default function SimpleAdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect
}: SimpleAdvancedSignalDashboardProps) {
  // State
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(TimeFrame.FOUR_HOUR);
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as Record<TimeFrame, AdvancedSignal | null>);
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [lastCalcTime, setLastCalcTime] = useState<number>(Date.now());
  const [countdown, setCountdown] = useState<string>("3:00");
  const [isAllDataLoaded, setIsAllDataLoaded] = useState<boolean>(false);
  const [supportLevels, setSupportLevels] = useState<(number | undefined)[]>([]);
  const [resistanceLevels, setResistanceLevels] = useState<(number | undefined)[]>([]);
  
  // Refs
  const priceRef = useRef<number>(0);
  const calcSystemInitialized = useRef<boolean>(false);
  
  // Initialize the simple calculation system
  useEffect(() => {
    if (!calcSystemInitialized.current) {
      initializeSimpleCalcSystem();
      calcSystemInitialized.current = true;
      console.log("[SIMPLE-DASHBOARD] Simple calculation system initialized");
    }
    
    // Set up price update listener (for display only, not calculations)
    const fetchDisplayPrice = async () => {
      try {
        const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
        if (!response.ok) throw new Error('Failed to fetch price');
        
        const data = await response.json();
        if (data && data.price) {
          setCurrentPrice(data.price);
          priceRef.current = data.price;
        }
      } catch (error) {
        console.error('[SIMPLE-DASHBOARD] Error fetching price for display:', error);
      }
    };
    
    // Initial price fetch
    fetchDisplayPrice();
    
    // Set up price display refresh every 15 seconds (no calculations, just display)
    const displayInterval = setInterval(fetchDisplayPrice, 15000);
    
    // Start counting down to next calculation
    const countdownInterval = setInterval(() => {
      setCountdown(getFormattedCountdown());
    }, 1000);
    
    // Set up calculation listener for when the 3-minute mark is reached
    const unsubscribeFromCalcs = onCalculation((price) => {
      console.log(`[SIMPLE-DASHBOARD] Received calculation trigger with price ${price}`);
      
      if (isAllDataLoaded && !isCalculating) {
        setIsCalculating(true);
        setLastCalcTime(Date.now());
        
        // Do ONE calculation for all timeframes
        calculateAllSignals(price).then((newSignals) => {
          setSignals(newSignals);
          updateRecommendationForTimeframe(selectedTimeframe);
          setIsCalculating(false);
        });
      }
    });
    
    // Check if all data is loaded
    const checkDataLoaded = () => {
      // Logic to determine if data is ready for calculation
      setIsAllDataLoaded(true);
    };
    
    // Check data loaded status every second until loaded
    const dataLoadedCheck = setInterval(() => {
      if (!isAllDataLoaded) {
        checkDataLoaded();
      } else {
        clearInterval(dataLoadedCheck);
      }
    }, 1000);
    
    // Cleanup
    return () => {
      clearInterval(displayInterval);
      clearInterval(countdownInterval);
      clearInterval(dataLoadedCheck);
      unsubscribeFromCalcs();
    };
  }, [symbol, isAllDataLoaded, isCalculating, selectedTimeframe]);
  
  // Calculate all signals for all timeframes
  async function calculateAllSignals(price: number): Promise<Record<TimeFrame, AdvancedSignal | null>> {
    console.log(`[SIMPLE-DASHBOARD] Starting ONE calculation for ${symbol} with price ${price}`);
    
    const newSignals: Record<TimeFrame, AdvancedSignal | null> = {};
    
    // Calculate signals for all timeframes
    for (const timeframe of Object.values(TimeFrame)) {
      try {
        newSignals[timeframe] = await calculateTimeframe(symbol, timeframe, price);
      } catch (err) {
        console.error(`[SIMPLE-DASHBOARD] Error calculating signal for ${timeframe}:`, err);
        newSignals[timeframe] = null;
      }
    }
    
    console.log(`[SIMPLE-DASHBOARD] Calculation complete - generated ${Object.values(newSignals).filter(Boolean).length} signals`);
    
    // Extract support and resistance levels from the selected timeframe
    updateSupportAndResistanceLevels(newSignals[selectedTimeframe]);
    
    return newSignals;
  }
  
  // Update support and resistance levels
  const updateSupportAndResistanceLevels = useCallback((signal: AdvancedSignal | null) => {
    if (!signal) return;
    
    // Extract support levels (strong, medium, weak)
    const support = [
      signal.levels?.strongSupport,
      signal.levels?.mediumSupport,
      signal.levels?.weakSupport
    ];
    
    // Extract resistance levels (strong, medium, weak)
    const resistance = [
      signal.levels?.strongResistance,
      signal.levels?.mediumResistance,
      signal.levels?.weakResistance
    ];
    
    setSupportLevels(support);
    setResistanceLevels(resistance);
  }, []);
  
  // Generate trade recommendation
  const generateTradeRecommendation = useCallback((timeframe: TimeFrame) => {
    const signal = signals[timeframe];
    if (!signal) return null;
    
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      // Logic to determine influential indicators
      return signal.indicators
        .filter(ind => ind.weight > 0.6)
        .map(ind => ind.name)
        .slice(0, 3);
    };
    
    const recommendation: TradeRecommendation = {
      direction: signal.direction,
      confidence: signal.strength,
      priceTarget: signal.priceTarget,
      stopLoss: signal.stopLoss,
      timeframe,
      influentialIndicators: findInfluentialIndicators(signal),
      expectedVolatility: signal.volatility,
      suggestedLeverage: calculateSuggestedLeverage(signal.volatility, signal.strength),
      summary: `${signal.direction === 'LONG' ? 'Buy' : signal.direction === 'SHORT' ? 'Sell' : 'Hold'} ${symbol} with ${signal.strength > 80 ? 'high' : signal.strength > 60 ? 'moderate' : 'low'} confidence.`
    };
    
    return recommendation;
  }, [signals, symbol]);
  
  // Calculate suggested leverage based on volatility and signal strength
  const calculateSuggestedLeverage = (volatility: number, strength: number): number => {
    // Lower volatility and higher strength = higher safe leverage
    const baseMultiplier = strength / 100; // 0 to 1
    const volatilityFactor = 1 - (volatility / 100); // 1 to 0
    
    // Calculate safe leverage (between 1x and 10x)
    const leverage = 1 + Math.round((baseMultiplier * volatilityFactor) * 9);
    
    return Math.min(10, Math.max(1, leverage));
  };
  
  // Update recommendation when timeframe changes
  const updateRecommendationForTimeframe = useCallback((timeframe: TimeFrame) => {
    const newRecommendation = generateTradeRecommendation(timeframe);
    setRecommendation(newRecommendation);
    
    // Also update support/resistance levels
    updateSupportAndResistanceLevels(signals[timeframe]);
  }, [generateTradeRecommendation, signals, updateSupportAndResistanceLevels]);
  
  // Handle timeframe selection
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [updateRecommendationForTimeframe, onTimeframeSelect]);
  
  // Format currency 
  function formatCurrency(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
  
  // Render component
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
        <Tabs defaultValue={TimeFrame.FOUR_HOUR} className="w-full" onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value={TimeFrame.FIFTEEN_MINUTE}>15m</TabsTrigger>
            <TabsTrigger value={TimeFrame.THIRTY_MINUTE}>30m</TabsTrigger>
            <TabsTrigger value={TimeFrame.ONE_HOUR}>1h</TabsTrigger>
            <TabsTrigger value={TimeFrame.FOUR_HOUR}>4h</TabsTrigger>
            <TabsTrigger value={TimeFrame.ONE_DAY}>1d</TabsTrigger>
            <TabsTrigger value={TimeFrame.ONE_WEEK}>1w</TabsTrigger>
            <TabsTrigger value={TimeFrame.ONE_MONTH}>1M</TabsTrigger>
          </TabsList>
          
          {/* Content for each timeframe */}
          {Object.values(TimeFrame).map((timeframe) => (
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
                            {recommendation.influentialIndicators?.map((indicator, i) => (
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

// Support/resistance level display component
interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  const formattedValue = value 
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    : '-';
    
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <Badge className={`${colorClass} font-mono`}>{formattedValue}</Badge>
    </div>
  );
});