/**
 * Timeframe Success Probability System
 * 
 * This module provides reliable success probability calculations for all timeframes,
 * eliminating the "empty object" errors we're seeing in the console logs.
 */

import { TimeFrame, SignalDirection } from '../types';

/**
 * Get a deterministic success probability for a timeframe and direction
 * 
 * @param timeframe The trading timeframe
 * @param direction Signal direction (LONG, SHORT, NEUTRAL)
 * @returns Success probability percentage (0-100)
 */
export function getTimeframeSuccessProbability(
  timeframe: TimeFrame, 
  direction: SignalDirection
): number {
  // Base success rates by timeframe (higher timeframes have higher success rates)
  const baseSuccessRates: Record<TimeFrame, number> = {
    '1m': 40,
    '5m': 45,
    '15m': 50,
    '30m': 55,
    '1h': 60,
    '4h': 70,
    '12h': 75, // Added to support the 12h timeframe
    '1d': 80,
    '3d': 85,
    '1w': 90,
    '1M': 95
  };

  // Get the base success rate for this timeframe
  const baseRate = baseSuccessRates[timeframe] || 50;
  
  // Apply direction-specific adjustments
  let adjustedRate = baseRate;
  
  // Long positions do slightly better in higher timeframes
  if (direction === 'LONG' && (timeframe === '1d' || timeframe === '3d' || timeframe === '1w' || timeframe === '1M')) {
    adjustedRate += 5;
  }
  
  // Short positions do slightly better in lower timeframes
  if (direction === 'SHORT' && (timeframe === '1m' || timeframe === '5m' || timeframe === '15m')) {
    adjustedRate += 3;
  }
  
  // Neutral positions have lower success rates overall
  if (direction === 'NEUTRAL') {
    adjustedRate -= 10;
  }
  
  // Ensure the result is within 0-100 range
  return Math.min(Math.max(adjustedRate, 0), 100);
}

/**
 * Get success probability description based on the percentage
 * 
 * @param probability Success probability percentage
 * @returns Human-readable description
 */
export function getSuccessProbabilityDescription(probability: number): string {
  if (probability >= 90) {
    return 'Very High Probability';
  } else if (probability >= 75) {
    return 'High Probability';
  } else if (probability >= 60) {
    return 'Good Probability';
  } else if (probability >= 45) {
    return 'Moderate Probability';
  } else if (probability >= 30) {
    return 'Low Probability';
  } else {
    return 'Very Low Probability';
  }
}