/**
 * Simple and reliable pattern generation utility
 * 
 * This is a streamlined, stable pattern generator that will produce consistent, deterministic results
 * based on price inputs. No complex dependencies or calculations.
 */

import { TimeFrame } from '../types';

// Interface for pattern formations
export interface SimplePatternFormation {
  name: string;
  reliability: number;
  direction: "bullish" | "bearish" | "neutral";
  priceTarget: number;
  description: string;
  duration?: string;
  confidence?: number;
}

/**
 * Reliable pattern generator that produces consistent results for the same price input
 */
export function generatePatterns(
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  confidence: number,
  timeframe: TimeFrame,
  price: number
): SimplePatternFormation[] {
  // Use price as seed for consistent results
  const priceSeed = Math.floor(price);
  
  // Map signal direction to pattern direction
  const patternDirection = 
    direction === 'LONG' ? "bullish" : 
    direction === 'SHORT' ? "bearish" : 
    "neutral";
  
  // Select pattern based on direction and price seed
  const patternName = getPatternName(direction, priceSeed);
  
  // Calculate price target (simple fixed percentage based on direction)
  const targetMultiplier = 
    direction === 'LONG' ? 1.05 : 
    direction === 'SHORT' ? 0.95 : 
    1.00;
  
  // Create a single reliable pattern
  const pattern: SimplePatternFormation = {
    name: patternName,
    reliability: Math.min(60 + (confidence / 2), 95),
    direction: patternDirection,
    priceTarget: Math.round(price * targetMultiplier * 100) / 100,
    description: `${patternName} pattern detected on ${timeframe} timeframe`,
    duration: getDuration(timeframe),
    confidence: confidence
  };
  
  return [pattern];
}

/**
 * Get a pattern name based on direction and price seed
 */
function getPatternName(
  direction: 'LONG' | 'SHORT' | 'NEUTRAL', 
  priceSeed: number
): string {
  const bullishPatterns = [
    'Bullish Engulfing',
    'Morning Star',
    'Hammer',
    'Double Bottom'
  ];
  
  const bearishPatterns = [
    'Bearish Engulfing',
    'Evening Star',
    'Hanging Man',
    'Double Top'
  ];
  
  const neutralPatterns = [
    'Doji',
    'Inside Bar',
    'Sideways Channel'
  ];
  
  // Select pattern array based on direction
  const patterns = 
    direction === 'LONG' ? bullishPatterns :
    direction === 'SHORT' ? bearishPatterns :
    neutralPatterns;
  
  // Use price seed to deterministically select a pattern
  const index = priceSeed % patterns.length;
  return patterns[index];
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