import { 
  ChartData, 
  TimeFrame, 
  LeverageParams, 
  LeverageResult,
  Indicator,
  IndicatorSignal,
  IndicatorStrength,
  SignalDirection
} from '../types';
import * as indicators from './indicators';
import { calculateSafeLeverage } from './calculations';
import { calculateHMA, calculateWMA } from './indicators';

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
 * Calculates the score for a category of indicators
 * @returns {Object} with direction and numerical value
 */
function calculateCategoryScore(indicators: Indicator[]): { direction: SignalDirection, value: number } {
  if (!indicators || indicators.length === 0) {
    return { direction: 'NEUTRAL', value: 50 };
  }
  
  let buyCount = 0;
  let sellCount = 0;
  let totalCount = 0;
  let strengthSum = 0;
  
  // Map strength to numerical values
  const strengthValues = {
    'WEAK': 0.5,
    'MODERATE': 1.0,
    'STRONG': 1.5,
    'HIGH': 2.0,
    'LOW': 0.3,
    null: 1.0
  };
  
  indicators.forEach(indicator => {
    const weight = strengthValues[indicator.strength || null];
    totalCount += weight;
    
    if (indicator.signal === 'BUY') {
      buyCount += weight;
    } else if (indicator.signal === 'SELL') {
      sellCount += weight;
    }
    
    // Add to strength sum for average calculation later
    strengthSum += weight;
  });
  
  // Calculate percentages
  const buyPercentage = totalCount > 0 ? (buyCount / totalCount) * 100 : 0;
  const sellPercentage = totalCount > 0 ? (sellCount / totalCount) * 100 : 0;
  
  // Determine direction and value
  let direction: SignalDirection = 'NEUTRAL';
  let value = 50;
  
  if (buyPercentage > sellPercentage + 20) {
    direction = 'LONG';
    value = 50 + (buyPercentage / 2);
  } else if (sellPercentage > buyPercentage + 20) {
    direction = 'SHORT';
    value = 50 - (sellPercentage / 2);
  } else {
    // Neutral zone with slight bias
    const bias = buyPercentage - sellPercentage;
    value = 50 + bias / 2;
  }
  
  // Ensure value is within 0-100 range
  value = Math.max(0, Math.min(100, value));
  
  return { direction, value: Math.round(value) };
}

/**
 * Detects support and resistance levels from chart data
 */
function detectSupportResistanceLevels(chartData: ChartData[], currentPrice: number): Level[] {
  if (chartData.length < 30) {
    return [];
  }
  
  const levels: Level[] = [];
  const priceMap = new Map<number, { count: number, strength: number }>();
  const pricePrecision = 2; // Round to this many decimal places to group similar prices
  
  // Function to round price to specified precision for grouping
  const roundPrice = (price: number): number => {
    const multiplier = Math.pow(10, pricePrecision);
    return Math.round(price * multiplier) / multiplier;
  };
  
  // Analyze price data to find potential levels
  chartData.forEach(candle => {
    // Check highs and lows for resistance and support
    const highRounded = roundPrice(candle.high);
    const lowRounded = roundPrice(candle.low);
    
    if (!priceMap.has(highRounded)) {
      priceMap.set(highRounded, { count: 0, strength: 0 });
    }
    if (!priceMap.has(lowRounded)) {
      priceMap.set(lowRounded, { count: 0, strength: 0 });
    }
    
    priceMap.get(highRounded)!.count += 1;
    priceMap.get(lowRounded)!.count += 1;
  });
  
  // Process map to find significant levels
  const entries = Array.from(priceMap.entries());
  const significantLevelThreshold = Math.max(2, Math.floor(chartData.length / 100)); // Adaptive threshold
  
  // Sort by price for easier analysis
  entries.sort((a, b) => a[0] - b[0]);
  
  // Find clusters of price levels
  const significantLevels: { price: number, count: number }[] = [];
  let currentCluster: { prices: number[], counts: number[] } = { prices: [], counts: [] };
  
  // Function to process a completed cluster
  const processCluster = () => {
    if (currentCluster.prices.length > 0) {
      // Calculate weighted average price for the cluster
      const totalWeight = currentCluster.counts.reduce((sum, count) => sum + count, 0);
      const weightedSum = currentCluster.prices.reduce((sum, price, index) => 
        sum + price * currentCluster.counts[index], 0);
      
      const avgPrice = weightedSum / totalWeight;
      const totalCount = currentCluster.counts.reduce((sum, count) => sum + count, 0);
      
      // Only include if significant
      if (totalCount >= significantLevelThreshold) {
        significantLevels.push({ price: avgPrice, count: totalCount });
      }
    }
  };
  
  const clusterThreshold = 0.005; // 0.5% price difference for clustering
  
  for (let i = 0; i < entries.length; i++) {
    const [price, { count }] = entries[i];
    
    // Skip if count is too low
    if (count < significantLevelThreshold / 2) {
      continue;
    }
    
    // Check if this price should be part of the current cluster
    if (currentCluster.prices.length === 0 || 
        Math.abs(price - currentCluster.prices[currentCluster.prices.length - 1]) / price < clusterThreshold) {
      // Add to current cluster
      currentCluster.prices.push(price);
      currentCluster.counts.push(count);
    } else {
      // Process previous cluster and start a new one
      processCluster();
      currentCluster = { prices: [price], counts: [count] };
    }
  }
  
  // Process the last cluster
  processCluster();
  
  // Convert significant levels to support/resistance levels
  significantLevels.forEach(({ price, count }) => {
    // Calculate strength based on touch count and recency
    const touchCountMax = Math.max(...significantLevels.map(l => l.count));
    const strengthBase = Math.min(100, (count / touchCountMax) * 100);
    
    // Determine if it's support or resistance based on current price
    const type = price < currentPrice ? 'support' : 'resistance';
    
    // Adjust strength based on proximity to current price
    const proximityFactor = 1 - Math.min(0.8, Math.abs(price - currentPrice) / currentPrice);
    const strength = Math.round(strengthBase * proximityFactor);
    
    // Add to levels if strength is significant
    if (strength > 30) {
      levels.push({
        type,
        price,
        strength,
        sourceTimeframes: ['1h', '4h', '1d'] // Default timeframes (would be more accurate with actual timeframe data)
      });
    }
  });
  
  // Sort by strength, descending
  return levels.sort((a, b) => b.strength - a.strength).slice(0, 5); // Limit to top 5 levels
}

/**
 * Calculate a score based on support/resistance levels
 */
function calculateLevelsScore(levels: Level[], currentPrice: number): number {
  if (levels.length === 0) {
    return 50; // Neutral score if no levels
  }
  
  // Find nearest support and resistance
  let nearestSupport: Level | null = null;
  let nearestResistance: Level | null = null;
  
  for (const level of levels) {
    if (level.type === 'support' && level.price < currentPrice) {
      if (!nearestSupport || level.price > nearestSupport.price) {
        nearestSupport = level;
      }
    } else if (level.type === 'resistance' && level.price > currentPrice) {
      if (!nearestResistance || level.price < nearestResistance.price) {
        nearestResistance = level;
      }
    }
  }
  
  // Calculate distances to nearest levels
  const distToSupport = nearestSupport 
    ? (currentPrice - nearestSupport.price) / currentPrice 
    : 1;
  
  const distToResistance = nearestResistance 
    ? (nearestResistance.price - currentPrice) / currentPrice 
    : 1;
  
  // Calculate strength of nearest levels
  const supportStrength = nearestSupport ? nearestSupport.strength / 100 : 0;
  const resistanceStrength = nearestResistance ? nearestResistance.strength / 100 : 0;
  
  // Score calculation - closer to support = more bullish, closer to resistance = more bearish
  let score = 50;
  
  if (distToSupport < distToResistance) {
    // Closer to support - bullish signal
    const ratio = Math.min(1, distToResistance / distToSupport);
    const bullishness = (1 - (distToSupport * 10)) * supportStrength * ratio;
    score = 50 + bullishness * 50;
  } else {
    // Closer to resistance - bearish signal
    const ratio = Math.min(1, distToSupport / distToResistance);
    const bearishness = (1 - (distToResistance * 10)) * resistanceStrength * ratio;
    score = 50 - bearishness * 50;
  }
  
  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Detect chart patterns from price data
 */
function detectChartPatterns(chartData: ChartData[]): PatternFormation[] {
  if (chartData.length < 30) {
    return [];
  }
  
  const patterns: PatternFormation[] = [];
  const lastCandle = chartData[chartData.length - 1];
  const lastPrice = lastCandle.close;
  
  // Look for chart patterns on recent data (last 20 candles)
  const recentData = chartData.slice(-20);
  
  // Head and Shoulders pattern (bearish reversal)
  const detectHeadAndShoulders = (): PatternFormation | null => {
    if (recentData.length < 10) return null;
    
    // Simplified head and shoulders detection
    // Find local high points
    const highPoints: { index: number, price: number }[] = [];
    
    for (let i = 1; i < recentData.length - 1; i++) {
      if (recentData[i].high > recentData[i-1].high && 
          recentData[i].high > recentData[i+1].high) {
        highPoints.push({ index: i, price: recentData[i].high });
      }
    }
    
    // Need at least 3 high points
    if (highPoints.length < 3) return null;
    
    // Look for potential head and shoulders pattern
    for (let i = 0; i < highPoints.length - 2; i++) {
      const leftShoulder = highPoints[i];
      const head = highPoints[i+1];
      const rightShoulder = highPoints[i+2];
      
      // Check if head is higher than both shoulders
      if (head.price > leftShoulder.price && 
          head.price > rightShoulder.price &&
          // Check if shoulders are roughly at the same level (within 5%)
          Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.05) {
        
        // Check for neckline (support level)
        const necklinePrice = Math.min(
          recentData[leftShoulder.index + 1].low, 
          recentData[head.index + 1].low
        );
        
        // Pattern is valid if current price is near or below neckline
        if (lastPrice <= necklinePrice * 1.02) {
          // Calculate a more reasonable price target considering current price levels
          // Use percentage-based targets - measure percent from head to neckline
          const headToNeckPct = (head.price - necklinePrice) / head.price;
          // Apply same percentage below the neckline to get target
          const priceTarget = necklinePrice * (1 - headToNeckPct);
          
          return {
            name: 'Head and Shoulders',
            reliability: 75,
            direction: 'bearish',
            priceTarget: Math.max(lastPrice * 0.85, priceTarget), // Set minimum to 85% of current price
            description: 'Bearish reversal pattern with price target around ' + formatPrice(priceTarget)
          };
        }
      }
    }
    
    return null;
  };
  
  // Inverse Head and Shoulders pattern (bullish reversal)
  const detectInverseHeadAndShoulders = (): PatternFormation | null => {
    if (recentData.length < 10) return null;
    
    // Find local low points
    const lowPoints: { index: number, price: number }[] = [];
    
    for (let i = 1; i < recentData.length - 1; i++) {
      if (recentData[i].low < recentData[i-1].low && 
          recentData[i].low < recentData[i+1].low) {
        lowPoints.push({ index: i, price: recentData[i].low });
      }
    }
    
    // Need at least 3 low points
    if (lowPoints.length < 3) return null;
    
    // Look for potential inverse head and shoulders pattern
    for (let i = 0; i < lowPoints.length - 2; i++) {
      const leftShoulder = lowPoints[i];
      const head = lowPoints[i+1];
      const rightShoulder = lowPoints[i+2];
      
      // Check if head is lower than both shoulders
      if (head.price < leftShoulder.price && 
          head.price < rightShoulder.price &&
          // Check if shoulders are roughly at the same level (within 5%)
          Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price < 0.05) {
        
        // Check for neckline (resistance level)
        const necklinePrice = Math.max(
          recentData[leftShoulder.index + 1].high, 
          recentData[head.index + 1].high
        );
        
        // Pattern is valid if current price is near or above neckline
        if (lastPrice >= necklinePrice * 0.98) {
          // Calculate a more reasonable price target considering current price levels
          // Use percentage-based targets - measure percent from head to neckline
          const headToNeckPct = (necklinePrice - head.price) / head.price;
          // Apply same percentage above the neckline to get target
          const priceTarget = necklinePrice * (1 + headToNeckPct);
          
          return {
            name: 'Inverse Head and Shoulders',
            reliability: 75,
            direction: 'bullish',
            priceTarget: Math.min(lastPrice * 1.15, priceTarget), // Cap to 15% above current price
            description: 'Bullish reversal pattern with price target around ' + formatPrice(priceTarget)
          };
        }
      }
    }
    
    return null;
  };
  
  // Double Top pattern (bearish reversal)
  const detectDoubleTop = (): PatternFormation | null => {
    if (recentData.length < 10) return null;
    
    // Find peaks
    const peaks: { index: number, price: number }[] = [];
    
    for (let i = 1; i < recentData.length - 1; i++) {
      if (recentData[i].high > recentData[i-1].high && 
          recentData[i].high > recentData[i+1].high) {
        peaks.push({ index: i, price: recentData[i].high });
      }
    }
    
    // Check for double top
    for (let i = 0; i < peaks.length - 1; i++) {
      const firstPeak = peaks[i];
      const secondPeak = peaks[i+1];
      
      // Check if peaks are at similar levels (within 2%)
      if (Math.abs(firstPeak.price - secondPeak.price) / firstPeak.price < 0.02 &&
          // Ensure there's some distance between peaks
          secondPeak.index - firstPeak.index >= 3) {
        
        // Find the lowest point between the peaks
        let lowestPoint = Infinity;
        for (let j = firstPeak.index + 1; j < secondPeak.index; j++) {
          lowestPoint = Math.min(lowestPoint, recentData[j].low);
        }
        
        // Check if current price is below the neckline (lowest point)
        if (lastPrice < lowestPoint) {
          // Calculate a more reasonable price target considering current price levels
          // Use percentage-based targets - measure percent from peak to lowest point
          const peakToLowPct = (firstPeak.price - lowestPoint) / firstPeak.price;
          // Apply same percentage below the lowest point to get target
          const priceTarget = lowestPoint * (1 - peakToLowPct);
          
          return {
            name: 'Double Top',
            reliability: 70,
            direction: 'bearish',
            priceTarget: Math.max(lastPrice * 0.85, priceTarget), // Set minimum to 85% of current price
            description: 'Bearish reversal pattern with price target around ' + formatPrice(priceTarget)
          };
        }
      }
    }
    
    return null;
  };
  
  // Double Bottom pattern (bullish reversal)
  const detectDoubleBottom = (): PatternFormation | null => {
    if (recentData.length < 10) return null;
    
    // Find bottoms
    const bottoms: { index: number, price: number }[] = [];
    
    for (let i = 1; i < recentData.length - 1; i++) {
      if (recentData[i].low < recentData[i-1].low && 
          recentData[i].low < recentData[i+1].low) {
        bottoms.push({ index: i, price: recentData[i].low });
      }
    }
    
    // Check for double bottom
    for (let i = 0; i < bottoms.length - 1; i++) {
      const firstBottom = bottoms[i];
      const secondBottom = bottoms[i+1];
      
      // Check if bottoms are at similar levels (within 2%)
      if (Math.abs(firstBottom.price - secondBottom.price) / firstBottom.price < 0.02 &&
          // Ensure there's some distance between bottoms
          secondBottom.index - firstBottom.index >= 3) {
        
        // Find the highest point between the bottoms
        let highestPoint = -Infinity;
        for (let j = firstBottom.index + 1; j < secondBottom.index; j++) {
          highestPoint = Math.max(highestPoint, recentData[j].high);
        }
        
        // Check if current price is above the neckline (highest point)
        if (lastPrice > highestPoint) {
          // Calculate a more reasonable price target considering current price levels
          // Use percentage-based targets - measure percent from bottom to highest point
          const bottomToHighPct = (highestPoint - firstBottom.price) / firstBottom.price;
          // Apply same percentage above the highest point to get target
          const priceTarget = highestPoint * (1 + bottomToHighPct);
          
          return {
            name: 'Double Bottom',
            reliability: 70,
            direction: 'bullish',
            priceTarget: Math.min(lastPrice * 1.15, priceTarget), // Cap to 15% above current price
            description: 'Bullish reversal pattern with price target around ' + formatPrice(priceTarget)
          };
        }
      }
    }
    
    return null;
  };
  
  // Detect patterns
  const headAndShoulders = detectHeadAndShoulders();
  if (headAndShoulders) patterns.push(headAndShoulders);
  
  const inverseHeadAndShoulders = detectInverseHeadAndShoulders();
  if (inverseHeadAndShoulders) patterns.push(inverseHeadAndShoulders);
  
  const doubleTop = detectDoubleTop();
  if (doubleTop) patterns.push(doubleTop);
  
  const doubleBottom = detectDoubleBottom();
  if (doubleBottom) patterns.push(doubleBottom);
  
  return patterns;
}

/**
 * Get a score based on market environment
 */
function getEnvironmentScore(environment: MarketEnvironment): number {
  switch (environment) {
    case MarketEnvironment.TRENDING_BULL:
      return 75;
    case MarketEnvironment.TRENDING_BEAR:
      return 25;
    case MarketEnvironment.RANGING_HIGH_VOL:
      return 50;
    case MarketEnvironment.RANGING_LOW_VOL:
      return 45;
    case MarketEnvironment.BREAKOUT:
      return 80;
    case MarketEnvironment.BREAKDOWN:
      return 20;
    case MarketEnvironment.REVERSING_UP:
      return 65;
    case MarketEnvironment.REVERSING_DOWN:
      return 35;
    default:
      return 50;
  }
}

/**
 * Get majority direction from a set of signals
 */
function getMajorityDirection(signals: AdvancedSignal[]): SignalDirection {
  if (signals.length === 0) return 'NEUTRAL';
  
  let longCount = 0;
  let shortCount = 0;
  
  signals.forEach(signal => {
    if (signal.direction === 'LONG') longCount++;
    else if (signal.direction === 'SHORT') shortCount++;
  });
  
  if (longCount > shortCount) return 'LONG';
  if (shortCount > longCount) return 'SHORT';
  return 'NEUTRAL';
}

/**
 * Format price with appropriate precision
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toFixed(2);
  } else if (price >= 100) {
    return price.toFixed(3);
  } else if (price >= 1) {
    return price.toFixed(4);
  } else {
    return price.toFixed(8);
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
    pattern: calculatedIndicators.filter(i => i.category === 'PATTERN')
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
    case '3d': timeEstimate = '2-4 weeks'; break;
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
    '3d': 2.3,
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
  const higherTimeframes = ['4h', '1d', '3d', '1w', '1M'];
  
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

// End of file - All helper functions are already defined above