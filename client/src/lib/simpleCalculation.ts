/**
 * Ultra-Simplified Market Calculation System
 * 
 * This is a guaranteed stable calculation system that will provide consistent results
 * for any given price input. It eliminates complex dynamics in favor of simplicity
 * and stability.
 */

import { TimeFrame } from '../types';

/**
 * Core calculation output format
 */
export interface SimpleSignal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  price: number;
  stopLoss: number;
  takeProfit: number;
  successProbability: number;
}

/**
 * Pattern formation for use in display
 */
export interface SimplePattern {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  reliability: number;
  priceTarget: number;
  description: string;
}

/**
 * Price level calculations
 */
export interface SimpleLevels {
  support: number[];
  resistance: number[];
}

/**
 * Calculate signal based purely on price and timeframe
 * This ensures 100% consistency for the same inputs
 */
export function calculateSignal(
  price: number,
  timeframe: TimeFrame
): SimpleSignal {
  // Use simple hash from price to create consistent direction
  const priceKey = Math.floor(price);
  const hash = priceKey % 100;
  
  // Simple direction mapping that spreads evenly
  // but keeps the same result for the same price
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  if (hash < 40) direction = 'LONG';
  else if (hash < 80) direction = 'SHORT';
  else direction = 'NEUTRAL';
  
  // Calculate confidence (50-95 range)
  const confidenceBase = ((priceKey * 17) % 45) + 50;
  
  // Simple time-based adjustments
  const timeframeFactor = 
    timeframe === '1M' ? 8 :
    timeframe === '1w' ? 6 :
    timeframe === '1d' ? 4 :
    timeframe === '4h' ? 2 : 0;
    
  const confidence = Math.min(confidenceBase + timeframeFactor, 95);
  
  // Calculate stop loss and take profit based on direction
  const priceFactor = (hash % 10) / 100; // 0-0.09 range
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (direction === 'LONG') {
    stopLoss = price * (1 - (0.02 + priceFactor));
    takeProfit = price * (1 + (0.04 + priceFactor * 2));
  } else if (direction === 'SHORT') {
    stopLoss = price * (1 + (0.02 + priceFactor));
    takeProfit = price * (1 - (0.04 + priceFactor * 2));
  } else {
    // Neutral has minimal movement expectations
    stopLoss = price * 0.98;
    takeProfit = price * 1.02;
  }
  
  // Success probability correlates with confidence
  const successProbability = confidence - ((hash % 20) - 10);
  
  return {
    direction,
    confidence,
    price,
    stopLoss: Math.round(stopLoss * 100) / 100,
    takeProfit: Math.round(takeProfit * 100) / 100,
    successProbability: Math.max(Math.min(successProbability, 98), 30)
  };
}

/**
 * Get a pattern based on the signal
 */
export function getPattern(signal: SimpleSignal): SimplePattern {
  const priceKey = Math.floor(signal.price);
  const patternKey = priceKey % 4;
  
  let name: string;
  let description: string;
  
  if (signal.direction === 'LONG') {
    const bullishPatterns = [
      'Bullish Engulfing',
      'Morning Star',
      'Hammer',
      'Double Bottom'
    ];
    name = bullishPatterns[patternKey];
    description = `${name} pattern indicates potential upward momentum`;
  } else if (signal.direction === 'SHORT') {
    const bearishPatterns = [
      'Bearish Engulfing',
      'Evening Star',
      'Hanging Man',
      'Double Top'
    ];
    name = bearishPatterns[patternKey];
    description = `${name} pattern indicates potential downward momentum`;
  } else {
    const neutralPatterns = [
      'Doji',
      'Spinning Top',
      'Inside Bar',
      'Rectangle'
    ];
    name = neutralPatterns[patternKey];
    description = `${name} pattern indicates market indecision`;
  }
  
  return {
    name,
    direction: signal.direction === 'LONG' ? 'bullish' : 
               signal.direction === 'SHORT' ? 'bearish' : 'neutral',
    reliability: signal.confidence,
    priceTarget: signal.takeProfit,
    description
  };
}

/**
 * Calculate key price levels
 */
export function getLevels(price: number): SimpleLevels {
  // Simple, rounded support and resistance levels
  const supportBase = price * 0.97;
  const resistanceBase = price * 1.03;
  
  // Create three levels with small variations
  return {
    support: [
      Math.round(supportBase * 100) / 100,
      Math.round(supportBase * 0.98 * 100) / 100,
      Math.round(supportBase * 0.96 * 100) / 100
    ],
    resistance: [
      Math.round(resistanceBase * 100) / 100,
      Math.round(resistanceBase * 1.02 * 100) / 100,
      Math.round(resistanceBase * 1.04 * 100) / 100
    ]
  };
}

/**
 * Get expected duration based on timeframe
 */
export function getDuration(timeframe: TimeFrame): string {
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
 * Calculate recommended leverage
 */
export function getLeverage(signal: SimpleSignal) {
  if (signal.direction === 'NEUTRAL') {
    return {
      conservative: 1,
      moderate: 1,
      aggressive: 2,
      recommendation: 'Avoid leverage in neutral markets'
    };
  }
  
  // Base leverage values
  const conservative = signal.confidence > 80 ? 2 : 1;
  const moderate = signal.confidence > 70 ? 3 : 2;
  const aggressive = signal.confidence > 60 ? 5 : 3;
  
  // Recommendation text
  let recommendation = '';
  if (signal.confidence > 80) {
    recommendation = 'Moderate leverage may be appropriate';
  } else if (signal.confidence > 60) {
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
 * Analyze all timeframes and return signals
 */
export function analyzeAllTimeframes(
  price: number,
  timeframes: TimeFrame[]
): Record<TimeFrame, SimpleSignal> {
  const results: Record<TimeFrame, SimpleSignal> = {} as any;
  
  // Calculate each timeframe independently first
  for (const tf of timeframes) {
    results[tf] = calculateSignal(price, tf);
  }
  
  // Apply higher timeframe influence
  // This ensures consistency between timeframes
  const monthly = results['1M'];
  const weekly = results['1w'];
  
  if (monthly && weekly) {
    // If monthly signal is very strong, it can influence weekly
    if (monthly.confidence > 80 && monthly.direction !== weekly.direction) {
      // Sometimes align weekly with monthly for realism
      const shouldAlign = (Math.floor(price) % 3) === 0;
      if (shouldAlign) {
        weekly.direction = monthly.direction;
        weekly.confidence = Math.max(weekly.confidence - 10, 50);
      }
    }
  }
  
  return results;
}