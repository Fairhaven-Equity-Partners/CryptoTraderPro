import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TimeFrame } from '../types';
import { Indicator, IndicatorSignal, IndicatorStrength } from '../lib/indicators';
import { getMaxLeverageForTimeframe } from '../lib/technicalIndicators';

// Type definitions
interface AdvancedSignal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  optimalRiskReward: number;
  recommendedLeverage: number;
  signalStrength: IndicatorStrength;
  patternFormations: PatternFormation[];
  recommendations: string[];
  indicators: {
    trend: Indicator[];
    momentum: Indicator[];
    volatility: Indicator[];
    volume: Indicator[];
    pattern: Indicator[];
    supports?: number[];
    resistances?: number[];
    pivots?: number[];
    atr?: number;
  };
  macroClassification: string;
}

interface PatternFormation {
  name: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: 'weak' | 'moderate' | 'strong';
  description: string;
}

interface TradeRecommendation {
  action: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  riskReward: number;
  leverage: number;
  confidence: number;
  timeframe: TimeFrame;
  reasons: string[];
}

interface PriceLevelDisplayProps {
  label: string;
  value: number | undefined;
  timeframe: TimeFrame;
  colorClass: string;
}

interface AdvancedSignalDashboardProps {
  symbol: string;
  onTimeframeSelect?: (timeframe: TimeFrame) => void;
}

// Component for displaying price levels
const PriceLevelDisplay = memo(({ label, value, timeframe, colorClass }: PriceLevelDisplayProps) => {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-300">{label}</span>
      <span className={`font-bold ${colorClass} bg-black/30 rounded border border-gray-700 px-2 py-0.5`}>
        {value !== undefined ? value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) : 'N/A'}
      </span>
    </div>
  );
});

// Main component
export default function AdvancedSignalDashboard({ 
  symbol, 
  onTimeframeSelect 
}: AdvancedSignalDashboardProps) {
  // State
  const [timeframe, setTimeframe] = useState<TimeFrame>('1D');
  const [signals, setSignals] = useState<{ [key in TimeFrame]?: AdvancedSignal }>({});
  const [currentSignal, setCurrentSignal] = useState<AdvancedSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Process signals for a specific timeframe
  const processTimeframeSignal = useCallback((
    priceData: any, 
    timeframe: TimeFrame, 
    priceMultiplier = 1
  ): AdvancedSignal => {
    // Simulate calculating direction (In reality, this would be based on complex technical analysis)
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    
    // Higher timeframes more likely to have definitive signals
    const timeframeWeight = timeframe === '1M' ? 0.8 :
                            timeframe === '1W' ? 0.7 :
                            timeframe === '3D' ? 0.6 :
                            timeframe === '1D' ? 0.5 :
                            timeframe === '4H' ? 0.4 :
                            timeframe === '1H' ? 0.3 : 0.2;
    
    // Generate a consistent but different direction based on combination of symbol and timeframe
    const consistencyHash = (symbol.charCodeAt(0) + timeframe.charCodeAt(0)) % 100;
    
    if (consistencyHash > 60) {
      direction = 'LONG';
    } else if (consistencyHash < 40) {
      direction = 'SHORT';
    } else {
      direction = 'NEUTRAL';
    }
    
    // Confidence score based on timeframe and hash
    let confidence = 50 + (timeframeWeight * 30) + ((consistencyHash % 20) - 10);
    
    // Enforce bounds
    confidence = Math.max(30, Math.min(95, confidence));
    
    // Determine signal strength based on confidence
    let signal: IndicatorSignal = direction === 'LONG' ? 'BUY' : 
                                 direction === 'SHORT' ? 'SELL' : 'NEUTRAL';
    
    let strength: IndicatorStrength = 'MODERATE';
    if (confidence > 70) strength = 'STRONG';
    else if (confidence < 45) strength = 'WEAK';
    
    // Get current price
    const currentPrice = (priceData?.close || 100) * priceMultiplier;
    
    // Calculate entry price with a small random offset
    const entryDeviation = (Math.sin(consistencyHash) * 0.01) * currentPrice;
    const entryPrice = currentPrice + entryDeviation;
    
    // Calculate take profit and stop loss
    const volatilityFactor = timeframe === '1M' ? 0.10 :
                            timeframe === '1W' ? 0.08 :
                            timeframe === '3D' ? 0.06 :
                            timeframe === '1D' ? 0.05 :
                            timeframe === '4H' ? 0.03 :
                            timeframe === '1H' ? 0.02 : 0.01;
                            
    const atr = volatilityFactor * currentPrice;
    
    // Stop loss placement based on direction
    const stopLossMultiplier = (confidence / 100) * (timeframeWeight * 2);
    const stopLoss = direction === 'LONG' 
      ? entryPrice - (atr * stopLossMultiplier)
      : direction === 'SHORT'
        ? entryPrice + (atr * stopLossMultiplier)
        : entryPrice * (direction === 'LONG' ? 0.95 : 1.05);
    
    // Take profit based on risk-reward ratio
    const riskRewardRatio = 1.5 + (confidence / 100);
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const rewardAmount = riskAmount * riskRewardRatio;
    
    const takeProfit = direction === 'LONG'
      ? entryPrice + rewardAmount
      : direction === 'SHORT'
        ? entryPrice - rewardAmount
        : entryPrice * (direction === 'LONG' ? 1.05 : 0.95);
    
    // Generate support and resistance levels
    const supportBase = currentPrice * 0.95;
    const resistanceBase = currentPrice * 1.05;
    
    const supports = [
      supportBase * 0.99,  // Weak support
      supportBase * 0.97,  // Medium support
      supportBase * 0.95   // Strong support
    ];
    
    const resistances = [
      resistanceBase * 1.01, // Weak resistance
      resistanceBase * 1.03, // Medium resistance
      resistanceBase * 1.05  // Strong resistance
    ];
    
    // Get recommended leverage based on timeframe and confidence
    const maxLeverage = getMaxLeverageForTimeframe(timeframe);
    const recommendedLeverage = Math.max(1, Math.floor((maxLeverage * confidence) / 100));
    
    // Generate a few mock pattern formations
    const patternOptions = [
      { name: 'Bullish Engulfing', direction: 'bullish', strength: 'strong' },
      { name: 'Bearish Engulfing', direction: 'bearish', strength: 'strong' },
      { name: 'Morning Star', direction: 'bullish', strength: 'strong' },
      { name: 'Evening Star', direction: 'bearish', strength: 'strong' },
      { name: 'Hammer', direction: 'bullish', strength: 'moderate' },
      { name: 'Shooting Star', direction: 'bearish', strength: 'moderate' },
      { name: 'Doji', direction: 'neutral', strength: 'weak' },
      { name: 'Dragonfly Doji', direction: 'bullish', strength: 'moderate' },
      { name: 'Gravestone Doji', direction: 'bearish', strength: 'moderate' },
      { name: 'Bullish Harami', direction: 'bullish', strength: 'moderate' },
      { name: 'Bearish Harami', direction: 'bearish', strength: 'moderate' },
      { name: 'Piercing Line', direction: 'bullish', strength: 'moderate' },
      { name: 'Dark Cloud Cover', direction: 'bearish', strength: 'moderate' }
    ];
    
    // Select patterns based on our direction bias
    const patternFormations = patternOptions
      .filter(p => 
        (direction === 'LONG' && p.direction === 'bullish') ||
        (direction === 'SHORT' && p.direction === 'bearish') ||
        (direction === 'NEUTRAL' && p.direction === 'neutral') ||
        (Math.random() < 0.1) // Small chance of contradictory pattern
      )
      .slice(0, 2) // Take at most 2 patterns
      .map(p => ({
        ...p,
        description: `Detected ${p.name} pattern on ${timeframe} timeframe`
      }));
    
    // Generate indicator signals for each category
    const generateCategoryIndicators = (
      category: string, 
      count: number,
      bullishBias: number // 0 to 1, higher means more bullish signals
    ): Indicator[] => {
      const indicators = [];
      
      const options = [
        { name: 'MACD', signal: 'BUY', strength: 'STRONG' },
        { name: 'RSI', signal: 'BUY', strength: 'MODERATE' },
        { name: 'Stochastic', signal: 'BUY', strength: 'WEAK' },
        { name: 'Bollinger Bands', signal: 'BUY', strength: 'MODERATE' },
        { name: 'Ichimoku Cloud', signal: 'BUY', strength: 'STRONG' },
        { name: 'Parabolic SAR', signal: 'BUY', strength: 'MODERATE' },
        { name: 'ADX', signal: 'NEUTRAL', strength: 'MODERATE' },
        { name: 'Moving Average', signal: 'BUY', strength: 'MODERATE' },
        { name: 'OBV', signal: 'BUY', strength: 'MODERATE' },
        { name: 'ATR', signal: 'NEUTRAL', strength: 'WEAK' },
        { name: 'CCI', signal: 'BUY', strength: 'MODERATE' },
        { name: 'Williams %R', signal: 'BUY', strength: 'MODERATE' },
        { name: 'MFI', signal: 'BUY', strength: 'STRONG' },
        { name: 'Awesome Oscillator', signal: 'BUY', strength: 'MODERATE' },
      ];
      
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * options.length);
        const indicator = { ...options[randomIndex] };
        
        // Adjust signal based on direction bias
        if (Math.random() > bullishBias) {
          indicator.signal = indicator.signal === 'BUY' ? 'SELL' : 
                           indicator.signal === 'SELL' ? 'BUY' : 'NEUTRAL';
        }
        
        // For "NEUTRAL" overall signal, make most indicators more mixed
        if (direction === 'NEUTRAL') {
          if (Math.random() < 0.5) {
            indicator.signal = Math.random() < 0.5 ? 'BUY' : 'SELL';
            indicator.strength = 'WEAK';
          } else {
            indicator.signal = 'NEUTRAL';
          }
        }
        
        indicators.push(indicator);
      }
      
      return indicators;
    };
    
    // Bias toward our overall signal direction
    const bullishBias = direction === 'LONG' ? 0.8 : 
                       direction === 'SHORT' ? 0.2 : 0.5;
    
    // Generate technical indicators by category
    const indicators = {
      trend: generateCategoryIndicators('trend', 4, bullishBias),
      momentum: generateCategoryIndicators('momentum', 5, bullishBias),
      volatility: generateCategoryIndicators('volatility', 2, bullishBias),
      volume: generateCategoryIndicators('volume', 3, bullishBias),
      pattern: generateCategoryIndicators('pattern', 2, bullishBias),
      supports,
      resistances,
      pivots: [currentPrice * 0.975, currentPrice, currentPrice * 1.025],
      atr
    };
    
    // Generate trade recommendations
    const generateRecommendations = (): string[] => {
      const results = [];
      
      if (direction === 'LONG') {
        results.push(`Enter long position at ${entryPrice.toFixed(2)} with ${recommendedLeverage}x leverage`);
        results.push(`Set stop loss at ${stopLoss.toFixed(2)} (${((stopLoss - entryPrice) / entryPrice * 100).toFixed(2)}%)`);
        results.push(`Take profit at ${takeProfit.toFixed(2)} (${((takeProfit - entryPrice) / entryPrice * 100).toFixed(2)}%)`);
      } else if (direction === 'SHORT') {
        results.push(`Enter short position at ${entryPrice.toFixed(2)} with ${recommendedLeverage}x leverage`);
        results.push(`Set stop loss at ${stopLoss.toFixed(2)} (${((stopLoss - entryPrice) / entryPrice * 100).toFixed(2)}%)`);
        results.push(`Take profit at ${takeProfit.toFixed(2)} (${((takeProfit - entryPrice) / entryPrice * 100).toFixed(2)}%)`);
      } else {
        results.push(`Current market conditions suggest waiting for clearer signals`);
        results.push(`Monitor key levels: Support at ${supportBase.toFixed(2)} and Resistance at ${resistanceBase.toFixed(2)}`);
      }
      
      // Add pattern-based recommendations
      patternFormations.forEach(pattern => {
        if (pattern.strength === 'strong') {
          results.push(`${pattern.name} pattern detected - ${pattern.direction === 'bullish' ? 'strong bullish' : pattern.direction === 'bearish' ? 'strong bearish' : 'neutral'} signal`);
        }
      });
      
      // Add technical indicator-based recommendations
      const strongTrendIndicators = indicators.trend.filter(i => i.strength === 'STRONG');
      const strongMomentumIndicators = indicators.momentum.filter(i => i.strength === 'STRONG');
      
      if (strongTrendIndicators.length > 0) {
        const bullishCount = strongTrendIndicators.filter(i => i.signal === 'BUY').length;
        const bearishCount = strongTrendIndicators.filter(i => i.signal === 'SELL').length;
        
        if (bullishCount > bearishCount) {
          results.push(`${bullishCount} strong bullish trend indicators suggest potential upside momentum`);
        } else if (bearishCount > bullishCount) {
          results.push(`${bearishCount} strong bearish trend indicators suggest potential downside momentum`);
        }
      }
      
      if (strongMomentumIndicators.length > 0) {
        const bullishCount = strongMomentumIndicators.filter(i => i.signal === 'BUY').length;
        const bearishCount = strongMomentumIndicators.filter(i => i.signal === 'SELL').length;
        
        if (bullishCount > bearishCount) {
          results.push(`Momentum indicators confirm bullish bias - potential for trend continuation`);
        } else if (bearishCount > bullishCount) {
          results.push(`Momentum indicators confirm bearish bias - potential for trend continuation`);
        }
      }
      
      return results;
    };
    
    // Determine market classification
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      const results: string[] = [];
      
      // Look through all indicator categories
      for (const category of ['trend', 'momentum', 'volatility', 'volume']) {
        const indicators = primarySignal.indicators[category as keyof typeof primarySignal.indicators];
        if (Array.isArray(indicators)) {
          // Find strong signals that match the overall direction
          const matchingIndicators = indicators.filter(ind => {
            // Type guard to ensure we're dealing with an Indicator type not a number
            if (typeof ind === 'object' && ind !== null && 'signal' in ind && 'strength' in ind) {
              return (direction === 'LONG' && ind.signal === 'BUY' && ind.strength === 'STRONG') ||
                    (direction === 'SHORT' && ind.signal === 'SELL' && ind.strength === 'STRONG');
            }
            return false;
          });
          
          // Add up to 2 indicators from each category
          matchingIndicators.slice(0, 2).forEach(ind => {
            if (typeof ind === 'object' && ind !== null && 'name' in ind) {
              results.push(`${ind.name} shows ${direction === 'LONG' ? 'bullish' : 'bearish'} momentum`);
            }
          });
        }
      }
      
      // Add support/resistance indicators
      if (direction === 'LONG') {
        results.push(`Price bounced from support level`);
      } else if (direction === 'SHORT') {
        results.push(`Price rejected at resistance level`);
      }
      
      return results;
    };
    
    const macroTrends = [
      'Ranging Market', 'Bullish Expansion', 'Bearish Contraction', 
      'Consolidation Phase', 'Breakout Zone', 'Distribution Phase',
      'Accumulation Phase', 'Risk-On Environment', 'Risk-Off Environment'
    ];
    
    const macroIndex = (symbol.length + timeframe.length + direction.length) % macroTrends.length;
    const macroClassification = macroTrends[macroIndex];
    
    const advancedSignal: AdvancedSignal = {
      direction,
      confidence,
      entryPrice,
      stopLoss,
      takeProfit,
      optimalRiskReward: riskRewardRatio,
      recommendedLeverage,
      signalStrength: strength,
      patternFormations,
      recommendations: generateRecommendations(),
      indicators,
      macroClassification
    };
    
    return advancedSignal;
  }, []);
  
  const generateTradeRecommendation = useCallback((timeframe: TimeFrame) => {
    const signal = signals[timeframe];
    if (!signal) return null;
    
    const findInfluentialIndicators = (primarySignal: AdvancedSignal): string[] => {
      const consensusDirection = primarySignal.direction;
      const results: string[] = [];
      
      // Look through all indicator categories
      for (const category of ['trend', 'momentum', 'volatility', 'volume']) {
        const indicators = primarySignal.indicators[category as keyof typeof primarySignal.indicators];
        if (Array.isArray(indicators)) {
          // Find strong signals that match the overall direction
          const matchingIndicators = indicators.filter(ind => {
            // Type guard to ensure we're dealing with an Indicator type not a number
            if (typeof ind === 'object' && ind !== null && 'signal' in ind && 'strength' in ind) {
              return (consensusDirection === 'LONG' && ind.signal === 'BUY' && ind.strength === 'STRONG') ||
                    (consensusDirection === 'SHORT' && ind.signal === 'SELL' && ind.strength === 'STRONG');
            }
            return false;
          });
          
          // Add up to 2 indicators from each category
          matchingIndicators.slice(0, 2).forEach(ind => {
            if (typeof ind === 'object' && ind !== null && 'name' in ind) {
              results.push(`${ind.name} shows ${consensusDirection === 'LONG' ? 'bullish' : 'bearish'} momentum`);
            }
          });
        }
      }
      
      // Add pattern-based indications
      signal.patternFormations.forEach(pattern => {
        if ((consensusDirection === 'LONG' && pattern.direction === 'bullish') ||
            (consensusDirection === 'SHORT' && pattern.direction === 'bearish')) {
          results.push(`${pattern.name} pattern confirms ${consensusDirection.toLowerCase()} bias`);
        }
      });
      
      // Add support/resistance indicators
      if (consensusDirection === 'LONG') {
        results.push(`Price above key support level`);
      } else if (consensusDirection === 'SHORT') {
        results.push(`Price below key resistance level`);
      }
      
      return results;
    };
    
    const recommendation: TradeRecommendation = {
      action: signal.direction === 'LONG' ? 'BUY' : 
              signal.direction === 'SHORT' ? 'SELL' : 'WAIT',
      entry: formatCurrency(signal.entryPrice),
      stopLoss: formatCurrency(signal.stopLoss),
      takeProfit: formatCurrency(signal.takeProfit),
      riskReward: Math.round(signal.optimalRiskReward * 100) / 100,
      leverage: signal.recommendedLeverage,
      confidence: signal.confidence,
      timeframe,
      reasons: findInfluentialIndicators(signal)
    };
    
    return recommendation;
  }, [signals]);
  
  const updateRecommendationForTimeframe = useCallback((timeframe: TimeFrame) => {
    setCurrentSignal(signals[timeframe] || null);
  }, [signals]);
  
  const handleTimeframeSelect = useCallback((timeframe: TimeFrame) => {
    setTimeframe(timeframe);
    updateRecommendationForTimeframe(timeframe);
    
    if (onTimeframeSelect) {
      onTimeframeSelect(timeframe);
    }
  }, [updateRecommendationForTimeframe, onTimeframeSelect]);
  
  function formatCurrency(price: number): string {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  
  function getSignalBgClass(direction: string): string {
    return direction === 'LONG' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700' :
           direction === 'SHORT' ? 'bg-rose-900/50 text-rose-300 border-rose-700' :
           'bg-gray-800/50 text-gray-300 border-gray-700';
  }
  
  // Mock loading signal data
  useEffect(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      const mockPriceData = {
        symbol,
        close: symbol === 'BTC/USDT' ? 50000 :
               symbol === 'ETH/USDT' ? 3000 :
               symbol === 'SOL/USDT' ? 100 :
               symbol === 'BNB/USDT' ? 400 : 50
      };
      
      const priceMultiplier = 
        symbol === 'BTC/USDT' ? 10 :
        symbol === 'ETH/USDT' ? 0.9 :
        symbol === 'SOL/USDT' ? 1.5 :
        symbol === 'BNB/USDT' ? 1.2 : 1;
      
      const timeframes: TimeFrame[] = ['15M', '1H', '4H', '1D', '3D', '1W', '1M'];
      
      const generatedSignals = timeframes.reduce((acc, tf) => ({
        ...acc,
        [tf]: processTimeframeSignal(mockPriceData, tf, priceMultiplier)
      }), {});
      
      setSignals(generatedSignals as { [key in TimeFrame]?: AdvancedSignal });
      setCurrentSignal(generatedSignals['1D'] as AdvancedSignal);
      setIsLoading(false);
    }, 1000);
  }, [symbol, processTimeframeSignal]);
  
  return (
    <div className="w-full bg-gray-950 text-white rounded-lg p-4 border border-gray-800 overflow-hidden">
      {isLoading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-lg text-gray-400">Loading signal data...</div>
        </div>
      ) : (
        <>
          {/* Header & Timeframe Selection */}
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Signal Dashboard</h2>
              
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-1">
                <Tabs defaultValue={timeframe} className="w-fit" onValueChange={(value) => handleTimeframeSelect(value as TimeFrame)}>
                  <TabsList className="grid grid-cols-7 bg-gray-800">
                    <TabsTrigger value="15M" className="text-xs">15M</TabsTrigger>
                    <TabsTrigger value="1H" className="text-xs">1H</TabsTrigger>
                    <TabsTrigger value="4H" className="text-xs">4H</TabsTrigger>
                    <TabsTrigger value="1D" className="text-xs">1D</TabsTrigger>
                    <TabsTrigger value="3D" className="text-xs">3D</TabsTrigger>
                    <TabsTrigger value="1W" className="text-xs">1W</TabsTrigger>
                    <TabsTrigger value="1M" className="text-xs">1M</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {currentSignal && (
            <>
              {/* Main Dashboard Layout */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Signal Summary & Statistics */}
                <div className="space-y-4">
                  {/* Signal Direction Card */}
                  <div className={`p-4 rounded-lg border ${getSignalBgClass(currentSignal.direction)}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-lg font-bold">
                        {currentSignal.direction === 'LONG' ? 'BULLISH' : 
                         currentSignal.direction === 'SHORT' ? 'BEARISH' : 'NEUTRAL'}
                      </div>
                      <Badge variant="outline" className="font-bold text-white border-white/50">
                        {timeframe}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            currentSignal.direction === 'LONG' ? 'bg-emerald-500' : 
                            currentSignal.direction === 'SHORT' ? 'bg-rose-500' : 
                            'bg-blue-500'
                          }`}
                          style={{ width: `${currentSignal.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm">{currentSignal.confidence}%</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-white/70">Entry Price</div>
                        <div className="font-bold text-md">
                          {formatCurrency(currentSignal.entryPrice)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-white/70">R/R Ratio</div>
                        <div className="font-bold text-md">
                          {Math.round(currentSignal.optimalRiskReward * 100) / 100}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Management */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-3">
                    <h3 className="text-white font-bold text-sm">Risk Management</h3>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Risk/Reward</span>
                      <span className="font-bold text-blue-400 bg-blue-900/30 px-3 py-1 rounded border border-blue-800">
                        {currentSignal?.optimalRiskReward ? Math.round(currentSignal.optimalRiskReward * 100) / 100 : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Recommended Leverage</span>
                      <span className="font-bold text-purple-400 bg-purple-900/30 px-3 py-1 rounded border border-purple-800">
                        {currentSignal?.recommendedLeverage ? `${currentSignal.recommendedLeverage}x` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold">Position Sizing</span>
                      <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-1 rounded border border-amber-800">
                        5-10% of Capital
                      </span>
                    </div>
                  </div>
                  
                  {/* Pattern Formations & Indicators */}
                  <div className="space-y-4">
                    {/* Pattern Formations */}
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-white font-bold text-sm mb-2">Pattern Formations</h3>
                      
                      {currentSignal?.patternFormations && currentSignal.patternFormations.length > 0 ? (
                        <div className="space-y-3">
                          {currentSignal.patternFormations.slice(0, 2).map((pattern, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-medium text-white">{pattern.name}</span>
                                <Badge 
                                  variant="outline"
                                  className={`
                                    ${pattern.direction === 'bullish' ? 'text-emerald-500 border-emerald-500 bg-emerald-900/20' : 
                                      pattern.direction === 'bearish' ? 'text-rose-500 border-rose-500 bg-rose-900/20' : 
                                        'text-slate-400 border-slate-500 bg-slate-900/20'}
                                  `}
                                >
                                  {pattern.direction}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400">{pattern.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No pattern formations detected</div>
                      )}
                    </div>
                    
                    {/* Technical Indicators */}
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <h3 className="text-white font-bold text-sm mb-3">Technical Indicators</h3>
                      
                      {/* Key Indicators Table */}
                      <div className="space-y-2">
                        {currentSignal && currentSignal.indicators ? 
                          Object.entries(currentSignal.indicators)
                            .filter(([category]) => {
                              return (
                                !['supports', 'resistances'].includes(category) && 
                                Array.isArray(currentSignal.indicators[category as keyof typeof currentSignal.indicators])
                              );
                            })
                            .slice(0, 3) // Only show first three indicator categories
                            .flatMap(([category, items]) => (
                              Array.isArray(items) 
                                ? items.slice(0, 3).map((indicator: any, i: number) => (
                                    <div 
                                      key={`${category}-${i}`} 
                                      className="flex justify-between items-center text-sm border-b border-gray-700/50 pb-1"
                                    >
                                      <span className="text-gray-300 font-medium">
                                        {indicator.name || `${category.charAt(0).toUpperCase() + category.slice(1)} ${i+1}`}
                                      </span>
                                      
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          indicator.signal === 'BUY'
                                            ? 'text-emerald-500 border-emerald-500 bg-emerald-900/20'
                                            : indicator.signal === 'SELL'
                                            ? 'text-rose-500 border-rose-500 bg-rose-900/20'
                                            : 'text-slate-400 border-slate-500 bg-slate-900/20'
                                        }
                                      >
                                        {indicator.signal} {indicator.strength && `(${indicator.strength.charAt(0)})`}
                                      </Badge>
                                    </div>
                                  ))
                                : []
                            ))
                          : <div className="text-gray-400 text-sm">No indicator data available</div>
                        }
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="flex flex-col space-y-1">
                          <span className="text-white font-semibold text-xs">Market Condition:</span>
                          <Badge variant="outline" className="bg-teal-900/30 text-teal-400 border-teal-500 px-2 py-1 font-medium text-xs w-fit">
                            {currentSignal?.macroClassification || "Neutral"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Price Levels & Trade Setup */}
                <div className="space-y-4">
                  {/* Price Levels Card */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-white font-bold text-sm mb-3">Key Price Levels</h3>
                    
                    <div className="space-y-4">
                      {/* Resistance Levels */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase">Resistance</h4>
                        {currentSignal?.indicators?.resistances?.slice(0, 3).map((level, i) => (
                          <PriceLevelDisplay 
                            key={`resistance-${i}`}
                            label={`R${3-i}`}
                            value={level}
                            timeframe={timeframe}
                            colorClass={`text-rose-${300 + i*100}`}
                          />
                        ))}
                      </div>
                      
                      <Separator className="bg-gray-800" />
                      
                      {/* Entry & Target */}
                      <div className="space-y-2">
                        <PriceLevelDisplay 
                          label="Take Profit"
                          value={currentSignal?.takeProfit}
                          timeframe={timeframe}
                          colorClass={currentSignal?.direction === 'LONG' ? 'text-emerald-300' : 'text-rose-300'}
                        />
                        
                        <PriceLevelDisplay 
                          label="Entry"
                          value={currentSignal?.entryPrice}
                          timeframe={timeframe}
                          colorClass="text-blue-300"
                        />
                        
                        <PriceLevelDisplay 
                          label="Stop Loss"
                          value={currentSignal?.stopLoss}
                          timeframe={timeframe}
                          colorClass={currentSignal?.direction === 'LONG' ? 'text-rose-300' : 'text-emerald-300'}
                        />
                      </div>
                      
                      <Separator className="bg-gray-800" />
                      
                      {/* Support Levels */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-500 uppercase">Support</h4>
                        {currentSignal?.indicators?.supports?.slice(0, 3).map((level, i) => (
                          <PriceLevelDisplay 
                            key={`support-${i}`}
                            label={`S${i+1}`}
                            value={level}
                            timeframe={timeframe}
                            colorClass={`text-emerald-${500 - i*100}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Trade Setup */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white font-bold text-sm">Trade Recommendation</h3>
                      
                      <div className="flex items-center space-x-1">
                        <Badge variant={currentSignal?.confidence >= 70 ? "default" : "outline"} 
                               className={`
                                ${currentSignal?.confidence >= 70 
                                  ? 'bg-green-900/50 text-green-300 hover:bg-green-900/50' 
                                  : 'text-gray-400 border-gray-600'} 
                                  text-xs`
                               }>
                          High
                        </Badge>
                        <Badge variant={currentSignal?.confidence >= 45 && currentSignal?.confidence < 70 ? "default" : "outline"} 
                               className={`
                                ${currentSignal?.confidence >= 45 && currentSignal?.confidence < 70
                                  ? 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/50' 
                                  : 'text-gray-400 border-gray-600'} 
                                  text-xs`
                               }>
                          Med
                        </Badge>
                        <Badge variant={currentSignal?.confidence < 45 ? "default" : "outline"} 
                               className={`
                                ${currentSignal?.confidence < 45 
                                  ? 'bg-red-900/50 text-red-300 hover:bg-red-900/50' 
                                  : 'text-gray-400 border-gray-600'} 
                                  text-xs`
                               }>
                          Low
                        </Badge>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-md border ${
                      currentSignal?.direction === 'LONG' 
                        ? 'bg-emerald-900/20 border-emerald-700' 
                        : currentSignal?.direction === 'SHORT'
                          ? 'bg-rose-900/20 border-rose-700'
                          : 'bg-gray-800/50 border-gray-700'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-lg font-bold">
                          {currentSignal?.direction === 'LONG' ? 'BUY' : 
                           currentSignal?.direction === 'SHORT' ? 'SELL' : 'HOLD'}
                        </div>
                        <div className="text-sm opacity-80">
                          {timeframe} Timeframe
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                        <div>
                          <div className="text-white/60">Entry</div>
                          <div className="font-bold">{formatCurrency(currentSignal?.entryPrice || 0)}</div>
                        </div>
                        <div>
                          <div className="text-white/60">Target</div>
                          <div className="font-bold">{formatCurrency(currentSignal?.takeProfit || 0)}</div>
                        </div>
                        <div>
                          <div className="text-white/60">Stop</div>
                          <div className="font-bold">{formatCurrency(currentSignal?.stopLoss || 0)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Supporting Evidence</h4>
                      <ul className="space-y-1">
                        {currentSignal?.recommendations?.slice(0, 3).map((reason, i) => (
                          <li key={i} className="text-sm text-gray-300 flex">
                            <span className="mr-2">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}