import { 
  ChartData, 
  TimeFrame, 
  LeverageParams, 
  LeverageResult,
  Indicator,
  IndicatorSignal,
  IndicatorStrength
} from '../types';
import * as indicators from './indicators';
import { calculateSafeLeverage } from './calculations';

// Advanced signal types
export interface AdvancedSignal {
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100 score
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  recommendedLeverage: number;
  indicators: {
    trend: Indicator[];
    momentum: Indicator[];
    volatility: Indicator[];
    volume: Indicator[];
    pattern: Indicator[];
  };
  patternFormations: PatternFormation[];
  supportResistance: Level[];
  optimalRiskReward: number;
  predictedMovement: {
    percentChange: number;
    timeEstimate: string;
  };
}

export interface PatternFormation {
  name: string;
  reliability: number; // 0-100
  direction: 'bullish' | 'bearish' | 'neutral';
  priceTarget: number;
  description: string;
}

export interface Level {
  type: 'support' | 'resistance';
  price: number;
  strength: number; // 0-100
  sourceTimeframes: TimeFrame[];
}

export interface TradeRecommendation {
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100 confidence score
  timeframeSummary: {
    timeframe: TimeFrame;
    confidence: number;
    direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  }[];
  entry: {
    ideal: number;
    range: [number, number];
  };
  exit: {
    takeProfit: number[];   // Multiple take profit levels
    stopLoss: number;
    trailingStopActivation: number; // Price level to activate trailing stop
    trailingStopPercent: number;    // Percentage for trailing stop
  };
  leverage: {
    conservative: number;
    moderate: number;
    aggressive: number;
    recommendation: string;
  };
  riskManagement: {
    positionSizeRecommendation: string;
    maxRiskPercentage: number;
    potentialRiskReward: number;
    winProbability: number;
  };
  keyIndicators: string[];  // Most influential indicators for this signal
  summary: string;          // Human-readable summary
}

// Weight configurations for different aspects of analysis
interface SignalWeights {
  trend: number;
  momentum: number;
  volatility: number;
  volume: number;
  pattern: number;
  timeframeAlignment: number;
  supportResistance: number;
  marketCondition: number;
}

// Default weights optimized for crypto market
const DEFAULT_WEIGHTS: SignalWeights = {
  trend: 25,
  momentum: 20,
  volatility: 10,
  volume: 15,
  pattern: 10,
  timeframeAlignment: 10,
  supportResistance: 5,
  marketCondition: 5
};

// Market condition/environment assessment
enum MarketEnvironment {
  TRENDING_BULL = 'TRENDING_BULL',
  TRENDING_BEAR = 'TRENDING_BEAR',
  RANGING_HIGH_VOL = 'RANGING_HIGH_VOL',
  RANGING_LOW_VOL = 'RANGING_LOW_VOL',
  BREAKOUT = 'BREAKOUT',
  BREAKDOWN = 'BREAKDOWN',
  REVERSING_UP = 'REVERSING_UP',
  REVERSING_DOWN = 'REVERSING_DOWN'
}

/**
 * Analyzes market environment to adjust weights
 */
function detectMarketEnvironment(data: ChartData[], timeframe: TimeFrame): MarketEnvironment {
  const lastIndex = data.length - 1;
  const lookbackPeriod = Math.min(50, data.length - 1);
  
  // Get ADX to check trend strength
  const adx = indicators.calculateADX(data, 14);
  const adxValue = Array.isArray(adx.adx) ? adx.adx[lastIndex] : 0;
  
  // Calculate short and long EMAs for trend direction
  const prices = data.map(d => d.close);
  const ema20 = indicators.calculateEMA(prices, 20);
  const ema50 = indicators.calculateEMA(prices, 50);
  
  // Calculate ATR for volatility
  const atr = indicators.calculateATR(data, 14);
  const atrPercent = atr / data[lastIndex].close * 100;
  
  // Get current candle and previous candles
  const currentCandle = data[lastIndex];
  const prevCandle = data[lastIndex - 1];
  const prevCandles = data.slice(lastIndex - lookbackPeriod, lastIndex);
  
  // Calculate price range over lookback period
  const highPrices = prevCandles.map(c => c.high);
  const lowPrices = prevCandles.map(c => c.low);
  const highestPrice = Math.max(...highPrices);
  const lowestPrice = Math.min(...lowPrices);
  const priceRange = (highestPrice - lowestPrice) / lowestPrice * 100;
  
  // Check if we're near the highest or lowest price
  const nearHigh = (highestPrice - currentCandle.close) / highestPrice < 0.03; // within 3% of high
  const nearLow = (currentCandle.close - lowestPrice) / currentCandle.close < 0.03; // within 3% of low
  
  // Detect breakouts - price exceeding previous high with increased volume
  const breakoutVolume = currentCandle.volume > (data.slice(lastIndex - 5, lastIndex).reduce((sum, candle) => sum + candle.volume, 0) / 5) * 1.5;
  const priceBreakout = currentCandle.close > highestPrice && breakoutVolume;
  const priceBreakdown = currentCandle.close < lowestPrice && breakoutVolume;
  
  // Check trend direction
  const uptrend = ema20[lastIndex] > ema50[lastIndex];
  const downtrend = ema20[lastIndex] < ema50[lastIndex];
  
  // Check for potential reversal patterns
  const potentialReversalUp = downtrend && nearLow && currentCandle.close > prevCandle.close 
    && (currentCandle.close - currentCandle.open) / (currentCandle.high - currentCandle.low) > 0.6;
  
  const potentialReversalDown = uptrend && nearHigh && currentCandle.close < prevCandle.close 
    && (currentCandle.open - currentCandle.close) / (currentCandle.high - currentCandle.low) > 0.6;
  
  // Determine the market environment
  if (priceBreakout) {
    return MarketEnvironment.BREAKOUT;
  } else if (priceBreakdown) {
    return MarketEnvironment.BREAKDOWN;
  } else if (potentialReversalUp) {
    return MarketEnvironment.REVERSING_UP;
  } else if (potentialReversalDown) {
    return MarketEnvironment.REVERSING_DOWN;
  } else if (adxValue > 25) {
    if (uptrend) {
      return MarketEnvironment.TRENDING_BULL;
    } else {
      return MarketEnvironment.TRENDING_BEAR;
    }
  } else {
    if (atrPercent > 3) {
      return MarketEnvironment.RANGING_HIGH_VOL;
    } else {
      return MarketEnvironment.RANGING_LOW_VOL;
    }
  }
}

/**
 * Calculate confidence score for a specific timeframe
 */
export function calculateTimeframeConfidence(
  chartData: ChartData[],
  timeframe: TimeFrame,
  weights: SignalWeights = DEFAULT_WEIGHTS
): AdvancedSignal {
  if (chartData.length < 50) {
    throw new Error('Insufficient data for analysis');
  }
  
  const lastCandle = chartData[chartData.length - 1];
  const lastPrice = lastCandle.close;
  
  // Detect market environment
  const environment = detectMarketEnvironment(chartData, timeframe);
  
  // Get basic indicators
  const calculatedIndicators = indicators.analyzeIndicators(chartData);
  
  // Organize indicators by category
  const categorizedIndicators = {
    trend: calculatedIndicators.filter(i => i.category === 'TREND'),
    momentum: calculatedIndicators.filter(i => i.category === 'MOMENTUM'),
    volatility: calculatedIndicators.filter(i => i.category === 'VOLATILITY'),
    volume: calculatedIndicators.filter(i => i.category === 'VOLUME'),
    pattern: [] // We don't have pattern as a category type currently
  };
  
  // Calculate category scores
  const scores = {
    trend: calculateCategoryScore(categorizedIndicators.trend),
    momentum: calculateCategoryScore(categorizedIndicators.momentum),
    volatility: calculateCategoryScore(categorizedIndicators.volatility),
    volume: calculateCategoryScore(categorizedIndicators.volume),
    pattern: calculateCategoryScore(categorizedIndicators.pattern)
  };
  
  // Calculate support/resistance levels
  const levels = detectSupportResistanceLevels(chartData, lastPrice);
  const levelsScore = calculateLevelsScore(levels, lastPrice);
  
  // Detect chart patterns
  const patterns = detectChartPatterns(chartData);
  
  // Calculate weighted score and direction
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    const weight = weights[category as keyof SignalWeights] || 0;
    totalScore += score.value * weight;
    totalWeight += weight;
  }
  
  // Add support/resistance factor
  totalScore += levelsScore * weights.supportResistance;
  totalWeight += weights.supportResistance;
  
  // Add market environment factor
  const environmentScore = getEnvironmentScore(environment);
  totalScore += environmentScore * weights.marketCondition;
  totalWeight += weights.marketCondition;
  
  // Calculate final confidence score
  const confidence = Math.round(totalScore / totalWeight);
  
  // Determine overall direction
  const direction = scores.trend.direction === 'NEUTRAL' 
    ? scores.momentum.direction 
    : scores.trend.direction;
  
  // Calculate recommended risk parameters
  const volatility = indicators.calculateATR(chartData, 14) / lastPrice;
  const atrPoints = indicators.calculateATR(chartData, 14);
  
  // Calculate entry, stop loss, and take profit based on ATR
  const entryPrice = lastPrice;
  
  // Calculate stop loss and take profit
  let stopLoss, takeProfit;
  if (direction === 'LONG') {
    stopLoss = Math.max(lastPrice - atrPoints * 2, 0);
    takeProfit = lastPrice + atrPoints * 3;
  } else if (direction === 'SHORT') {
    stopLoss = lastPrice + atrPoints * 2;
    takeProfit = Math.max(lastPrice - atrPoints * 3, 0);
  } else {
    // For neutral signals, set symmetric stop loss and take profit
    stopLoss = lastPrice - atrPoints * 1.5;
    takeProfit = lastPrice + atrPoints * 1.5;
  }
  
  // Calculate recommended leverage based on volatility and direction strength
  const riskParams: LeverageParams = {
    positionSize: 1000, // Default position size
    riskPercentage: 1, // Default 1% risk
    entryPrice: lastPrice,
    stopLoss: stopLoss,
    takeProfit: takeProfit
  };
  
  const leverageResult = calculateSafeLeverage(riskParams);
  
  // Adjust recommended leverage by confidence level
  let recommendedLeverage = direction === 'NEUTRAL' 
    ? 1 
    : Math.min(parseFloat(leverageResult.recommendedLeverage), 20); // Cap at 20x
  
  // Scale down leverage if confidence is low
  if (confidence < 70) {
    recommendedLeverage = Math.max(1, recommendedLeverage * (confidence / 100));
  }
  
  // Calculate predicted movement
  const predictedPercent = direction === 'LONG' 
    ? (takeProfit - lastPrice) / lastPrice * 100 
    : (lastPrice - takeProfit) / lastPrice * 100;
  
  // Calculate time estimate based on timeframe
  let timeEstimate = '';
  switch (timeframe) {
    case '1m': timeEstimate = '5-15 minutes'; break;
    case '5m': timeEstimate = '15-60 minutes'; break;
    case '15m': timeEstimate = '1-4 hours'; break;
    case '30m': timeEstimate = '3-8 hours'; break;
    case '1h': timeEstimate = '6-24 hours'; break;
    case '4h': timeEstimate = '1-3 days'; break;
    case '1d': timeEstimate = '1-2 weeks'; break;
    case '1w': timeEstimate = '1-2 months'; break;
    case '1M': timeEstimate = '3-6 months'; break;
    default: timeEstimate = 'unknown';
  }
  
  return {
    timeframe,
    direction,
    confidence,
    entryPrice,
    stopLoss,
    takeProfit,
    recommendedLeverage,
    indicators: categorizedIndicators,
    patternFormations: patterns,
    supportResistance: levels,
    optimalRiskReward: direction === 'NEUTRAL' ? 1 : Math.abs((takeProfit - lastPrice) / (lastPrice - stopLoss)),
    predictedMovement: {
      percentChange: Math.abs(predictedPercent),
      timeEstimate
    }
  };
}

/**
 * Generate a trade recommendation based on multi-timeframe analysis
 */
export function generateTradeRecommendation(
  symbol: string,
  timeframeSignals: AdvancedSignal[]
): TradeRecommendation {
  // At least 3 timeframes are required for a reliable recommendation
  if (timeframeSignals.length < 3) {
    throw new Error('At least 3 timeframes are required for trade recommendation');
  }
  
  // Group signals by direction
  const directionGroups = {
    LONG: timeframeSignals.filter(s => s.direction === 'LONG'),
    SHORT: timeframeSignals.filter(s => s.direction === 'SHORT'),
    NEUTRAL: timeframeSignals.filter(s => s.direction === 'NEUTRAL')
  };
  
  // Weight timeframes (higher weight for longer timeframes)
  const timeframeWeights: Record<TimeFrame, number> = {
    '1m': 0.3,
    '5m': 0.5,
    '15m': 0.7,
    '30m': 0.8,
    '1h': 1.0,
    '4h': 1.5,
    '1d': 2.0,
    '1w': 2.5,
    '1M': 3.0
  };
  
  // Calculate weighted scores for each direction
  let longScore = 0;
  let shortScore = 0;
  let totalWeight = 0;
  
  timeframeSignals.forEach(signal => {
    const weight = timeframeWeights[signal.timeframe] || 1;
    totalWeight += weight;
    
    if (signal.direction === 'LONG') {
      longScore += signal.confidence * weight;
    } else if (signal.direction === 'SHORT') {
      shortScore += signal.confidence * weight;
    }
  });
  
  // Normalize scores to 0-100 range
  longScore = Math.round(longScore / totalWeight);
  shortScore = Math.round(shortScore / totalWeight);
  
  // Determine overall direction and confidence
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  let confidence: number;
  
  if (Math.abs(longScore - shortScore) < 15) {
    direction = 'NEUTRAL';
    confidence = 50 - Math.abs(longScore - shortScore);
  } else if (longScore > shortScore) {
    direction = 'LONG';
    confidence = longScore;
  } else {
    direction = 'SHORT';
    confidence = shortScore;
  }
  
  // Check timeframe alignment - if higher timeframes contradict lower ones, reduce confidence
  const lowerTimeframes = ['1m', '5m', '15m', '30m', '1h'];
  const higherTimeframes = ['4h', '1d', '1w', '1M'];
  
  const lowerSignals = timeframeSignals.filter(s => lowerTimeframes.includes(s.timeframe));
  const higherSignals = timeframeSignals.filter(s => higherTimeframes.includes(s.timeframe));
  
  if (lowerSignals.length > 0 && higherSignals.length > 0) {
    const lowerDir = getMajorityDirection(lowerSignals);
    const higherDir = getMajorityDirection(higherSignals);
    
    if (lowerDir !== higherDir && higherDir !== 'NEUTRAL') {
      confidence = Math.max(40, confidence - 20);
    }
  }
  
  // Get base timeframe data (use 1h as the reference)
  const hourTimeframe = timeframeSignals.find(s => s.timeframe === '1h') || timeframeSignals[0];
  
  // Calculate entry range
  const entryIdeal = hourTimeframe.entryPrice;
  const atrPercent = Math.abs((hourTimeframe.stopLoss - hourTimeframe.entryPrice) / hourTimeframe.entryPrice);
  
  const entryRange: [number, number] = direction === 'LONG'
    ? [entryIdeal * (1 - atrPercent * 0.3), entryIdeal * (1 + atrPercent * 0.1)]
    : [entryIdeal * (1 - atrPercent * 0.1), entryIdeal * (1 + atrPercent * 0.3)];
  
  // Calculate multiple take profit levels
  const takeProfitLevels = direction === 'LONG' 
    ? [
        hourTimeframe.entryPrice * (1 + atrPercent * 1.5),  // TP1
        hourTimeframe.entryPrice * (1 + atrPercent * 3),    // TP2
        hourTimeframe.entryPrice * (1 + atrPercent * 5)     // TP3
      ]
    : [
        hourTimeframe.entryPrice * (1 - atrPercent * 1.5),  // TP1
        hourTimeframe.entryPrice * (1 - atrPercent * 3),    // TP2
        hourTimeframe.entryPrice * (1 - atrPercent * 5)     // TP3
      ];
  
  // Leverage recommendations
  const conservativeLeverage = Math.max(1, Math.floor(hourTimeframe.recommendedLeverage * 0.5));
  const moderateLeverage = Math.max(1, Math.floor(hourTimeframe.recommendedLeverage * 0.8));
  const aggressiveLeverage = Math.max(1, Math.ceil(hourTimeframe.recommendedLeverage * 1.0));
  
  // Win probability calculation (simplified)
  const winProbability = Math.min(90, 45 + (confidence / 2));
  
  // Create summary of key indicators
  const keyIndicators: string[] = [];
  
  // Find most reliable indicators
  const allIndicators = [
    ...hourTimeframe.indicators.trend,
    ...hourTimeframe.indicators.momentum,
    ...hourTimeframe.indicators.volatility,
    ...hourTimeframe.indicators.volume,
    ...hourTimeframe.indicators.pattern
  ];
  
  const strongIndicators = allIndicators
    .filter(i => i.strength === 'STRONG' && i.signal === (direction === 'LONG' ? 'BUY' : 'SELL'))
    .map(i => i.name);
  
  keyIndicators.push(...strongIndicators.slice(0, 3));
  
  // Add pattern information if available
  if (hourTimeframe.patternFormations.length > 0) {
    const relevantPatterns = hourTimeframe.patternFormations
      .filter(p => p.direction === (direction === 'LONG' ? 'bullish' : 'bearish') && p.reliability > 60)
      .map(p => p.name);
    
    keyIndicators.push(...relevantPatterns.slice(0, 2));
  }
  
  // Generate human-readable summary
  let summary = `${direction === 'LONG' ? 'Bullish' : direction === 'SHORT' ? 'Bearish' : 'Neutral'} `;
  summary += `signal on ${symbol} with ${confidence}% confidence. `;
  
  if (direction !== 'NEUTRAL') {
    summary += `Recommended ${direction.toLowerCase()} entry around ${formatPrice(entryIdeal)}. `;
    summary += `Set stop loss at ${formatPrice(hourTimeframe.stopLoss)} `;
    summary += `and take profit targets at ${formatPrice(takeProfitLevels[0])}, ${formatPrice(takeProfitLevels[1])}, and ${formatPrice(takeProfitLevels[2])}. `;
    summary += `Consider using ${direction === 'LONG' ? conservativeLeverage : moderateLeverage}x leverage for moderate risk.`;
  } else {
    summary += `Current market conditions suggest waiting for clearer signals before entering a trade.`;
  }
  
  // Create the final recommendation
  return {
    symbol,
    direction,
    confidence,
    timeframeSummary: timeframeSignals.map(s => ({
      timeframe: s.timeframe,
      confidence: s.confidence,
      direction: s.direction
    })),
    entry: {
      ideal: entryIdeal,
      range: entryRange
    },
    exit: {
      takeProfit: takeProfitLevels,
      stopLoss: hourTimeframe.stopLoss,
      trailingStopActivation: takeProfitLevels[0], // Activate trailing stop at first take profit
      trailingStopPercent: 1.5 // 1.5% trailing stop
    },
    leverage: {
      conservative: conservativeLeverage,
      moderate: moderateLeverage,
      aggressive: aggressiveLeverage,
      recommendation: confidence > 75 
        ? `${moderateLeverage}x` 
        : confidence > 60 
          ? `${conservativeLeverage}x` 
          : "1x or avoid leverage"
    },
    riskManagement: {
      positionSizeRecommendation: `${Math.min(Math.max(confidence / 10, 5), 15)}% of available capital`,
      maxRiskPercentage: 1.5,
      potentialRiskReward: hourTimeframe.optimalRiskReward,
      winProbability
    },
    keyIndicators,
    summary
  };
}

// HELPER FUNCTIONS

/**
 * Calculate score for a category of indicators
 */
function calculateCategoryScore(categoryIndicators: Indicator[]): { value: number, direction: 'LONG' | 'SHORT' | 'NEUTRAL' } {
  if (categoryIndicators.length === 0) {
    return { value: 50, direction: 'NEUTRAL' };
  }
  
  let longPoints = 0;
  let shortPoints = 0;
  let neutralPoints = 0;
  let totalPoints = 0;
  
  categoryIndicators.forEach(indicator => {
    // Strength coefficient
    const strengthCoef = indicator.strength === 'STRONG' ? 1.5 : 
                         indicator.strength === 'MODERATE' ? 1.0 : 0.5;
                         
    const points = 10 * strengthCoef;
    totalPoints += points;
    
    if (indicator.signal === 'BUY') {
      longPoints += points;
    } else if (indicator.signal === 'SELL') {
      shortPoints += points;
    } else {
      neutralPoints += points;
    }
  });
  
  // Calculate percentage scores
  const longScore = (longPoints / totalPoints) * 100;
  const shortScore = (shortPoints / totalPoints) * 100;
  
  // Determine direction
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  let value: number;
  
  if (Math.abs(longScore - shortScore) < 20) {
    direction = 'NEUTRAL';
    value = 50;
  } else if (longScore > shortScore) {
    direction = 'LONG';
    value = Math.round(50 + (longScore - shortScore) / 2);
  } else {
    direction = 'SHORT';
    value = Math.round(50 + (shortScore - longScore) / 2);
  }
  
  return { value, direction };
}

/**
 * Detect support and resistance levels
 */
function detectSupportResistanceLevels(data: ChartData[], currentPrice: number): Level[] {
  const levels: Level[] = [];
  const priceRange = 0.05; // 5% price range for grouping levels
  
  // Find swing highs and lows
  for (let i = 5; i < data.length - 5; i++) {
    // Check for swing high (local maximum)
    if (data[i].high > data[i-1].high && 
        data[i].high > data[i-2].high && 
        data[i].high > data[i+1].high && 
        data[i].high > data[i+2].high) {
      
      // Check if this level is near an existing one
      const price = data[i].high;
      const existingLevel = levels.find(l => 
        Math.abs(l.price - price) / price < priceRange && l.type === 'resistance'
      );
      
      if (existingLevel) {
        // Strengthen existing level
        existingLevel.strength += 5;
      } else {
        // Add new resistance level
        levels.push({
          type: 'resistance',
          price,
          strength: 60,
          sourceTimeframes: ['1h']  // Placeholder
        });
      }
    }
    
    // Check for swing low (local minimum)
    if (data[i].low < data[i-1].low && 
        data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && 
        data[i].low < data[i+2].low) {
      
      // Check if this level is near an existing one
      const price = data[i].low;
      const existingLevel = levels.find(l => 
        Math.abs(l.price - price) / price < priceRange && l.type === 'support'
      );
      
      if (existingLevel) {
        // Strengthen existing level
        existingLevel.strength += 5;
      } else {
        // Add new support level
        levels.push({
          type: 'support',
          price,
          strength: 60,
          sourceTimeframes: ['1h']  // Placeholder
        });
      }
    }
  }
  
  // Strengthen levels that have been tested multiple times
  data.forEach(candle => {
    levels.forEach(level => {
      const priceThreshold = level.price * 0.005; // 0.5% threshold
      
      if (level.type === 'resistance' && 
          Math.abs(candle.high - level.price) < priceThreshold) {
        level.strength += 2;
      } else if (level.type === 'support' && 
                Math.abs(candle.low - level.price) < priceThreshold) {
        level.strength += 2;
      }
    });
  });
  
  // Cap strength at 100
  levels.forEach(level => {
    level.strength = Math.min(level.strength, 100);
  });
  
  // Sort by strength
  return levels.sort((a, b) => b.strength - a.strength);
}

/**
 * Calculate a score based on support/resistance levels
 */
function calculateLevelsScore(levels: Level[], currentPrice: number): number {
  if (levels.length === 0) return 50;
  
  // Find nearest support and resistance
  const supports = levels.filter(l => l.type === 'support' && l.price < currentPrice)
    .sort((a, b) => b.price - a.price);
    
  const resistances = levels.filter(l => l.type === 'resistance' && l.price > currentPrice)
    .sort((a, b) => a.price - b.price);
  
  const nearestSupport = supports[0];
  const nearestResistance = resistances[0];
  
  if (!nearestSupport || !nearestResistance) return 50;
  
  // Calculate distance to nearest levels as percentage
  const distToSupport = (currentPrice - nearestSupport.price) / currentPrice;
  const distToResistance = (nearestResistance.price - currentPrice) / currentPrice;
  
  // If very close to resistance, bearish signal
  if (distToResistance < 0.01 && nearestResistance.strength > 70) {
    return 30;
  }
  
  // If very close to support, bullish signal
  if (distToSupport < 0.01 && nearestSupport.strength > 70) {
    return 70;
  }
  
  // Calculate relative position in range
  const rangePosition = distToSupport / (distToSupport + distToResistance);
  
  // Lower in the range (closer to support) = more bullish
  return Math.round(50 - (rangePosition - 0.5) * 40);
}

/**
 * Detect chart patterns
 */
function detectChartPatterns(data: ChartData[]): PatternFormation[] {
  // This is a placeholder for more sophisticated pattern recognition
  // In a real implementation, this would use computer vision or 
  // mathematical algorithms to detect patterns like head and shoulders,
  // double tops, etc.
  const patterns: PatternFormation[] = [];
  const lastCandle = data[data.length - 1];
  const lastPrice = lastCandle.close;
  
  // Basic trend detection for demonstration
  const prices = data.map(d => d.close);
  const sma20 = indicators.calculateSMA(prices, 20);
  const sma50 = indicators.calculateSMA(prices, 50);
  
  const last20Trend = sma20[sma20.length - 1] > sma20[sma20.length - 5];
  const last50Trend = sma50[sma50.length - 1] > sma50[sma50.length - 10];
  
  // Simple crossover detection
  const currentCrossed = sma20[sma20.length - 1] > sma50[sma50.length - 1];
  const previousCrossed = sma20[sma20.length - 2] > sma50[sma50.length - 2];
  
  if (currentCrossed && !previousCrossed) {
    patterns.push({
      name: "Golden Cross",
      reliability: 75,
      direction: "bullish",
      priceTarget: lastPrice * 1.1,
      description: "SMA20 crossed above SMA50, indicating potential uptrend"
    });
  } else if (!currentCrossed && previousCrossed) {
    patterns.push({
      name: "Death Cross",
      reliability: 75,
      direction: "bearish",
      priceTarget: lastPrice * 0.9,
      description: "SMA20 crossed below SMA50, indicating potential downtrend"
    });
  }
  
  // Detect potential double bottom (very simplified)
  const recentLows = [];
  for (let i = 10; i < data.length - 10; i++) {
    if (data[i].low < data[i-1].low && 
        data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && 
        data[i].low < data[i+2].low) {
      recentLows.push({ index: i, price: data[i].low });
    }
  }
  
  if (recentLows.length >= 2) {
    const lastTwoLows = recentLows.slice(-2);
    const priceDiff = Math.abs(lastTwoLows[0].price - lastTwoLows[1].price) / lastTwoLows[0].price;
    const indexDiff = lastTwoLows[1].index - lastTwoLows[0].index;
    
    if (priceDiff < 0.03 && indexDiff > 10 && indexDiff < 30) {
      patterns.push({
        name: "Double Bottom",
        reliability: 70,
        direction: "bullish",
        priceTarget: lastPrice * 1.15,
        description: "Two similar lows indicating potential reversal from downtrend"
      });
    }
  }
  
  return patterns;
}

/**
 * Get score adjustment based on market environment
 */
function getEnvironmentScore(environment: MarketEnvironment): number {
  switch (environment) {
    case MarketEnvironment.TRENDING_BULL:
      return 70;
    case MarketEnvironment.TRENDING_BEAR:
      return 30;
    case MarketEnvironment.RANGING_HIGH_VOL:
      return 45;
    case MarketEnvironment.RANGING_LOW_VOL:
      return 50;
    case MarketEnvironment.BREAKOUT:
      return 75;
    case MarketEnvironment.BREAKDOWN:
      return 25;
    case MarketEnvironment.REVERSING_UP:
      return 65;
    case MarketEnvironment.REVERSING_DOWN:
      return 35;
    default:
      return 50;
  }
}

/**
 * Get the majority direction from an array of signals
 */
function getMajorityDirection(signals: AdvancedSignal[]): 'LONG' | 'SHORT' | 'NEUTRAL' {
  let longCount = 0;
  let shortCount = 0;
  let neutralCount = 0;
  
  signals.forEach(signal => {
    if (signal.direction === 'LONG') longCount++;
    else if (signal.direction === 'SHORT') shortCount++;
    else neutralCount++;
  });
  
  if (longCount > shortCount && longCount > neutralCount) return 'LONG';
  if (shortCount > longCount && shortCount > neutralCount) return 'SHORT';
  return 'NEUTRAL';
}

/**
 * Format price for display
 */
function formatPrice(price: number): string {
  if (price > 1000) {
    return `$${price.toFixed(0)}`;
  } else if (price > 100) {
    return `$${price.toFixed(2)}`;
  } else if (price > 1) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
}