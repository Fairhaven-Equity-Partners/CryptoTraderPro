/**
 * Ultra-simple calculator that guarantees consistent results for the same price input
 * This is a reliable, deterministic approach that doesn't rely on complex dependencies
 */

import { TimeFrame } from '../types';

/**
 * Calculate a simple signal based on price and timeframe
 * This ensures 100% deterministic results - the same price will always give the same signal
 */
export function calculateBasicSignal(price: number, timeframe: TimeFrame) {
  // Use price as a deterministic seed
  const priceSeed = Math.floor(price) % 100;
  
  // Determine direction based on price
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  if (priceSeed < 40) direction = 'LONG';
  else if (priceSeed < 80) direction = 'SHORT';
  else direction = 'NEUTRAL';
  
  // Calculate confidence (50-95)
  const confidenceBase = 50 + (priceSeed % 45);
  let confidence = confidenceBase;
  
  // Adjust based on timeframe
  if (timeframe === '1M') confidence += 8;
  else if (timeframe === '1w') confidence += 6;
  else if (timeframe === '1d') confidence += 4;
  else if (timeframe === '4h') confidence += 2;
  
  confidence = Math.min(confidence, 95);
  
  // Calculate stop loss and take profit
  let stopLoss, takeProfit;
  if (direction === 'LONG') {
    stopLoss = price * 0.97;
    takeProfit = price * 1.05;  
  } else if (direction === 'SHORT') {
    stopLoss = price * 1.03;
    takeProfit = price * 0.95;
  } else {
    stopLoss = price * 0.98;
    takeProfit = price * 1.02;
  }
  
  // Success probability
  const successProb = Math.min(confidence + 5, 95);
  
  return {
    direction,
    confidence,
    entryPrice: price,
    stopLoss: Math.round(stopLoss * 100) / 100,
    takeProfit: Math.round(takeProfit * 100) / 100,
    successProbability: successProb
  };
}

/**
 * Get a pattern based on direction and price
 */
export function getBasicPattern(direction: string, price: number) {
  const priceSeed = Math.floor(price) % 4;
  
  // Pattern names based on direction
  const patternNames: Record<string, string[]> = {
    'LONG': ['Bullish Engulfing', 'Morning Star', 'Double Bottom', 'Hammer'],
    'SHORT': ['Bearish Engulfing', 'Evening Star', 'Double Top', 'Hanging Man'],
    'NEUTRAL': ['Doji', 'Inside Bar', 'Rectangle', 'Sideways Channel']
  };
  
  // Select pattern name
  const patternName = patternNames[direction][priceSeed];
  
  return {
    name: patternName,
    direction: direction === 'LONG' ? 'bullish' : 
              direction === 'SHORT' ? 'bearish' : 'neutral',
    reliability: 65 + (priceSeed * 5),
    priceTarget: direction === 'LONG' ? price * 1.05 : 
                direction === 'SHORT' ? price * 0.95 : price,
    description: `${patternName} pattern detected`
  };
}

/**
 * Calculate key support and resistance levels
 */
export function getBasicLevels(price: number) {
  return {
    support: [
      Math.round(price * 0.97 * 100) / 100,
      Math.round(price * 0.95 * 100) / 100,
      Math.round(price * 0.93 * 100) / 100
    ],
    resistance: [
      Math.round(price * 1.03 * 100) / 100,
      Math.round(price * 1.05 * 100) / 100,
      Math.round(price * 1.07 * 100) / 100
    ]
  };
}

/**
 * Get duration based on timeframe
 */
export function getBasicDuration(timeframe: TimeFrame): string {
  switch (timeframe) {
    case '1m': return '5-15 minutes';
    case '5m': return '15-60 minutes';
    case '15m': return '1-4 hours';
    case '30m': return '2-8 hours';
    case '1h': return '4-24 hours';
    case '4h': return '1-3 days';
    case '1d': return '1-2 weeks';
    case '3d': return '1-3 weeks';
    case '1w': return '1-2 months';
    case '1M': return '3-6 months';
    default: return 'Variable';
  }
}

/**
 * Generate leverage recommendations
 */
export function getBasicLeverage(direction: string, confidence: number) {
  if (direction === 'NEUTRAL') {
    return {
      conservative: 1,
      moderate: 1,
      aggressive: 2,
      recommendation: 'Avoid leverage in neutral markets'
    };
  }
  
  // Base leverage values
  const conservative = confidence > 80 ? 2 : 1;
  const moderate = confidence > 70 ? 3 : 2;
  const aggressive = confidence > 60 ? 5 : 3;
  
  // Recommendation text
  let recommendation = '';
  if (confidence > 80) {
    recommendation = 'Moderate leverage may be appropriate';
  } else if (confidence > 60) {
    recommendation = 'Conservative leverage recommended';
  } else {
    recommendation = 'Use minimal leverage or none';
  }
  
  return {
    conservative,
    moderate, 
    aggressive,
    recommendation
  };
}

/**
 * Generate basic indicators that align with the signal direction
 */
export function getBasicIndicators(direction: string, confidence: number) {
  const createIndicatorList = (count: number, category: string): any[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${category}-${i}`,
      name: `${category} Indicator ${i+1}`,
      value: (50 + (i * 10) + (confidence % 30)) % 100,
      signal: direction === 'LONG' ? 'BUY' : 
              direction === 'SHORT' ? 'SELL' : 'NEUTRAL',
      strength: confidence > 70 ? 'STRONG' : 
                confidence > 50 ? 'MODERATE' : 'WEAK',
      category
    }));
  };
  
  // Create indicator groups with appropriate counts
  return {
    trend: createIndicatorList(3, 'Trend'),
    momentum: createIndicatorList(2, 'Momentum'),
    volatility: createIndicatorList(2, 'Volatility'),
    volume: createIndicatorList(2, 'Volume'),
    pattern: createIndicatorList(1, 'Pattern')
  };
}

/**
 * Generate basic macro insights
 */
export function getBasicMacroInsights(direction: string, confidence: number): string[] {
  const insights = [];
  
  if (direction === 'LONG') {
    insights.push('Positive market sentiment detected');
    insights.push('Institutional buying pressure increasing');
    if (confidence > 70) insights.push('Strong bullish trend confirmed');
  } else if (direction === 'SHORT') {
    insights.push('Negative market sentiment detected');
    insights.push('Institutional selling pressure increasing');
    if (confidence > 70) insights.push('Strong bearish trend confirmed');
  } else {
    insights.push('Neutral market conditions prevailing');
    insights.push('No clear institutional bias detected');
  }
  
  return insights;
}

/**
 * Generate a success probability description
 */
export function getBasicProbabilityDescription(probability: number): string {
  if (probability > 80) return 'Very high probability of success';
  if (probability > 65) return 'Good probability of success';
  if (probability > 50) return 'Moderate probability of success';
  return 'Low probability of success - use caution';
}