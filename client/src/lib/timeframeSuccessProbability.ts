/**
 * Timeframe-based Success Probability Enhancement System
 * 
 * This module adjusts signal success probabilities based on timeframe, confidence level,
 * and alignment with higher timeframes to provide more accurate trading probabilities.
 */

import { TimeFrame } from '../types';

/**
 * Calculate enhanced success probability based on timeframe and confidence
 * Optimized version with lookup tables and fewer calculations
 * 
 * @param timeframe Signal timeframe
 * @param confidence Base confidence level (0-100)
 * @param direction Signal direction (LONG, SHORT, NEUTRAL)
 * @param higherTimeframeAlignment Whether signal aligns with higher timeframe signals
 * @returns Enhanced success probability (0-100)
 */
export function calculateTimeframeSuccessProbability(
  timeframe: TimeFrame,
  confidence: number,
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  higherTimeframeAlignment: boolean = false
): number {
  // Use static lookup tables for common calculations
  
  // Precalculated timeframe boosts (static values)
  const TIMEFRAME_BOOSTS: Record<TimeFrame, number> = {
    '1M': 0.25,  // +25% for monthly signals
    '1w': 0.23,  // +23% for weekly signals
    '3d': 0.20,  // +20% for 3-day signals
    '1d': 0.18,  // +18% for daily signals
    '4h': 0.15,  // +15% for 4-hour signals
    '1h': 0.12,  // +12% for 1-hour signals
    '30m': 0.10, // +10% for 30-minute signals
    '15m': 0.08, // +8% for 15-minute signals
    '5m': 0.05,  // +5% for 5-minute signals
    '1m': 0.03   // +3% for 1-minute signals
  };
  
  // Precalculated minimum thresholds (static values)
  const MIN_THRESHOLDS: Record<TimeFrame, number> = {
    '1M': 70,  // Monthly signals have at least 70% probability if directional
    '1w': 65,  // Weekly signals have at least 65% probability if directional
    '3d': 62,  // 3-day signals have at least 62% probability if directional
    '1d': 60,  // Daily signals have at least 60% probability if directional
    '4h': 55,  // 4-hour signals have at least 55% probability if directional
    '1h': 50,  // 1-hour signals have at least 50% probability if directional
    '30m': 45, // 30-min signals have at least 45% probability if directional
    '15m': 42, // 15-min signals have at least 42% probability if directional
    '5m': 40,  // 5-min signals have at least 40% probability if directional
    '1m': 40   // 1-min signals have at least 40% probability if directional
  };
  
  // Fast path for neutral signals (simplified calculation)
  if (direction === 'NEUTRAL') {
    return Math.min(60, Math.round(confidence * 0.6));
  }
  
  // Get timeframe boost from lookup table
  const boost = TIMEFRAME_BOOSTS[timeframe] || 0;
  
  // Calculate base probability with simplified logic for directional signals
  let baseProbability: number;
  if (confidence < 50) {
    baseProbability = confidence * 0.8;
  } else if (confidence < 80) {
    baseProbability = 40 + (confidence - 50);
  } else {
    baseProbability = 70 + (confidence - 80) * 0.7;
  }
  
  // Apply boost with single multiplication
  let result = baseProbability * (1 + boost);
  
  // Apply alignment bonus with single conditional
  if (higherTimeframeAlignment) {
    result *= 1.12;
  }
  
  // Apply minimum threshold using lookup table
  const minThreshold = MIN_THRESHOLDS[timeframe] || 40;
  if (result < minThreshold) {
    result = minThreshold;
  }
  
  // Apply maximum cap (98%)
  if (result > 98) {
    result = 98;
  }
  
  // Return rounded result
  return Math.round(result);
}

/**
 * Check if a signal aligns with the majority of higher timeframe signals
 * 
 * @param direction Current signal direction
 * @param higherTimeframeDirections Array of higher timeframe directions
 * @returns True if current direction aligns with majority of higher timeframes
 */
export function checkHigherTimeframeAlignment(
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  higherTimeframeDirections: ('LONG' | 'SHORT' | 'NEUTRAL')[]
): boolean {
  if (direction === 'NEUTRAL' || higherTimeframeDirections.length === 0) {
    return false;
  }
  
  // Count how many higher timeframes have the same direction
  const alignedCount = higherTimeframeDirections.filter(d => d === direction).length;
  
  // Calculate if majority align (at least 50%)
  return alignedCount / higherTimeframeDirections.length >= 0.5;
}

/**
 * Get all timeframes higher than the specified timeframe
 * 
 * @param timeframe Current timeframe
 * @returns Array of higher timeframes
 */
export function getHigherTimeframes(timeframe: TimeFrame): TimeFrame[] {
  const allTimeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  const currentIndex = allTimeframes.indexOf(timeframe);
  
  if (currentIndex === -1 || currentIndex === allTimeframes.length - 1) {
    return []; // No higher timeframes
  }
  
  return allTimeframes.slice(currentIndex + 1);
}

/**
 * Get appropriate success probability description based on probability value
 * 
 * @param probability Success probability value (0-100)
 * @returns Descriptive text for the probability
 */
export function getSuccessProbabilityDescription(probability: number): string {
  if (probability >= 90) {
    return "Very High Probability";
  } else if (probability >= 80) {
    return "High Probability";
  } else if (probability >= 70) {
    return "Good Probability";
  } else if (probability >= 60) {
    return "Moderate Probability";
  } else if (probability >= 50) {
    return "Fair Probability";
  } else if (probability >= 40) {
    return "Speculative";
  } else {
    return "Low Probability";
  }
}