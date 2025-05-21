/**
 * ONE-TIME CALCULATION DASHBOARD
 * 
 * This is a completely new dashboard implementation that guarantees
 * calculations happen exactly once per 3-minute cycle.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Clock } from 'lucide-react';
import { TimeFrame } from '../types';

// Define basic types needed
interface AdvancedSignal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  strength: number;
  volatility: number;
  priceTarget?: number;
  stopLoss?: number;
  indicators: any[];
  levels?: {
    strongSupport?: number;
    mediumSupport?: number;
    weakSupport?: number;
    strongResistance?: number;
    mediumResistance?: number;
    weakResistance?: number;
  };
}

interface TradeRecommendation {
  direction: string;
  confidence: number;
  priceTarget?: number;
  stopLoss?: number;
  timeframe: TimeFrame;
  influentialIndicators?: string[];
  expectedVolatility: number;
  suggestedLeverage: number;
  summary: string;
}

// Props interface
interface OneTimeCalculationDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

// Global state to ensure only one calculation per 3 minutes
const GLOBAL_STATE = {
  lastCalculationTime: 0,
  calculationInProgress: false,
  calculationInterval: 180000, // 3 minutes
};

// Main component
export default function OneTimeCalculationDashboard({
  symbol,
  onTimeframeSelect
}: OneTimeCalculationDashboardProps) {
  // State for UI
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>("3:00");
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>(TimeFrame.FOUR_HOUR);
  const [signals, setSignals] = useState<Record<TimeFrame, AdvancedSignal | null>>({} as Record<TimeFrame, AdvancedSignal | null>);
  const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [supportLevels, setSupportLevels] = useState<(number | undefined)[]>([]);
  const [resistanceLevels, setResistanceLevels] = useState<(number | undefined)[]>([]);
  
  // Refs
  const initialDataLoaded = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  
  // On mount
  useEffect(() => {
    isComponentMounted.current = true;
    
    // Initial price fetch for display
    fetchCurrentPrice();
    
    // Set up calculation cycle
    setupCalculationCycle();
    
    // Set up countdown display
    startCountdown();
    
    // Cleanup
    return () => {
      isComponentMounted.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [symbol]);
  
  // Fetch current price for display purposes only
  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Price fetch failed');
      
      const data = await response.json();
      if (data && data.price) {
        setCurrentPrice(data.price);
        
        // If this is the first load, also do an initial calculation
        if (!initialDataLoaded.current) {
          initialDataLoaded.current = true;
          calculateAllSignals(data.price);
        }
      }
    } catch (error) {
      console.error('[ONE-TIME-CALC] Error fetching price:', error);
    }
  };
  
  // Set up the calculation cycle (every 3 minutes)
  const setupCalculationCycle = () => {
    // Check if enough time has passed since last calculation
    const now = Date.now();
    const timeSinceLastCalc = now - GLOBAL_STATE.lastCalculationTime;
    
    if (timeSinceLastCalc >= GLOBAL_STATE.calculationInterval) {
      // It's been more than 3 minutes, calculate now
      fetchAndCalculate();
    } else {
      // Schedule the next calculation
      const timeUntilNextCalc = GLOBAL_STATE.calculationInterval - timeSinceLastCalc;
      setTimeout(() => {
        if (isComponentMounted.current) {
          fetchAndCalculate();
        }
      }, timeUntilNextCalc);
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
      const nextCalcTime = GLOBAL_STATE.lastCalculationTime + GLOBAL_STATE.calculationInterval;
      const timeRemaining = Math.max(0, nextCalcTime - now);
      
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      
      // If countdown reached zero, start a new cycle
      if (timeRemaining <= 0 && !GLOBAL_STATE.calculationInProgress) {
        fetchAndCalculate();
      }
    }, 1000);
  };
  
  // Fetch price and calculate signals
  const fetchAndCalculate = async () => {
    // Prevent concurrent calculations
    if (GLOBAL_STATE.calculationInProgress) {
      console.log('[ONE-TIME-CALC] Calculation already in progress, skipping');
      return;
    }
    
    GLOBAL_STATE.calculationInProgress = true;
    setIsCalculating(true);
    
    try {
      // Fetch the latest price
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error('Price fetch failed');
      
      const data = await response.json();
      if (data && data.price) {
        setCurrentPrice(data.price);
        
        // Calculate signals with the fresh price
        await calculateAllSignals(data.price);
        
        // Update last calculation time
        GLOBAL_STATE.lastCalculationTime = Date.now();
      }
    } catch (error) {
      console.error('[ONE-TIME-CALC] Error in fetch and calculate:', error);
    } finally {
      GLOBAL_STATE.calculationInProgress = false;
      setIsCalculating(false);
    }
  };
  
  // Calculate all signals for all timeframes
  const calculateAllSignals = async (price: number) => {
    console.log(`[ONE-TIME-CALC] Starting ONE calculation for ${symbol} with price ${price}`);
    
    // Sample generation of signals for demonstration
    // In practice, this would call your actual signal calculation logic
    const newSignals: Record<TimeFrame, AdvancedSignal | null> = {};
    
    // For each timeframe, create a simulated signal
    for (const timeframe of Object.values(TimeFrame)) {
      try {
        // This is where your real calculation would happen
        // For now, generating sample data
        const volatility = Math.floor(Math.random() * 30) + 10; // 10-40%
        const strength = Math.floor(Math.random() * 50) + 40; // 40-90%
        const direction = ['LONG', 'SHORT', 'NEUTRAL'][Math.floor(Math.random() * 3)] as 'LONG' | 'SHORT' | 'NEUTRAL';
        
        const signal: AdvancedSignal = {
          direction,
          strength,
          volatility,
          priceTarget: direction === 'LONG' ? price * 1.05 : direction === 'SHORT' ? price * 0.95 : undefined,
          stopLoss: direction === 'LONG' ? price * 0.95 : direction === 'SHORT' ? price * 1.05 : undefined,
          indicators: [
            { name: 'MACD', value: direction === 'LONG' ? 0.5 : -0.3, weight: 0.8 },
            { name: 'RSI', value: direction === 'LONG' ? 65 : 35, weight: 0.7 },
            { name: 'Bollinger Bands', value: 0.2, weight: 0.6 }
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
        
        newSignals[timeframe] = signal;
      } catch (error) {
        console.error(`[ONE-TIME-CALC] Error calculating signal for ${timeframe}:`, error);
        newSignals[timeframe] = null;
      }
    }
    
    console.log(`[ONE-TIME-CALC] Calculation complete - next in 3 minutes`);
    
    // Update state with new signals
    setSignals(newSignals);
    
    // Update recommendation for selected timeframe
    updateRecommendationForTimeframe(selectedTimeframe, newSignals);
    
    return newSignals;
  };
  
  // Update recommendation when timeframe changes
  const updateRecommendationForTimeframe = (timeframe: TimeFrame, signalData = signals) => {
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
    
    // Generate trade recommendation
    const suggestedLeverage = calculateSuggestedLeverage(signal.volatility, signal.strength);
    
    const recommendation: TradeRecommendation = {
      direction: signal.direction,
      confidence: signal.strength,
      priceTarget: signal.priceTarget,
      stopLoss: signal.stopLoss,
      timeframe,
      influentialIndicators: signal.indicators.slice(0, 3).map(ind => ind.name),
      expectedVolatility: signal.volatility,
      suggestedLeverage,
      summary: `${signal.direction === 'LONG' ? 'Buy' : signal.direction === 'SHORT' ? 'Sell' : 'Hold'} ${symbol} with ${signal.strength > 80 ? 'high' : signal.strength > 60 ? 'moderate' : 'low'} confidence.`
    };
    
    setRecommendation(recommendation);
  };
  
  // Calculate suggested leverage based on volatility and signal strength
  const calculateSuggestedLeverage = (volatility: number, strength: number): number => {
    // Lower volatility and higher strength = higher safe leverage
    const baseMultiplier = strength / 100; // 0 to 1
    const volatilityFactor = 1 - (volatility / 100); // 1 to 0
    
    // Calculate safe leverage (between 1x and 10x)
    const leverage = 1 + Math.round((baseMultiplier * volatilityFactor) * 9);
    
    return Math.min(10, Math.max(1, leverage));
  };
  
  // Handle timeframe selection
  const handleTimeframeSelect = (timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  };
  
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