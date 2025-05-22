/**
 * Timeframe-based Success Probability Enhancement System
 * 
 * This module adjusts signal success probabilities based on timeframe, confidence level,
 * and alignment with higher timeframes to provide more accurate trading probabilities.
 */

import { TimeFrame } from '../types';

/**
 * Calculate enhanced success probability based on timeframe and confidence
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
  // Base success probability derived from confidence
  // Starting with a conservative transformation of confidence to success probability
  let baseProbability = transformConfidenceToSuccessProbability(confidence, direction);
  
  // Timeframe-specific probability boost percentages
  const timeframeBoost = getTimeframeBoost(timeframe);
  
  // Apply timeframe-specific boost
  let enhancedProbability = baseProbability * (1 + timeframeBoost);
  
  // Apply higher timeframe alignment bonus if applicable
  if (higherTimeframeAlignment && direction !== 'NEUTRAL') {
    enhancedProbability *= 1.12; // 12% boost for alignment with higher timeframes
  }
  
  // Apply minimum thresholds based on timeframe
  const minThreshold = getMinimumThreshold(timeframe);
  
  // Ensure probability doesn't go below the timeframe-specific minimum threshold
  // But only if the signal is directional (not NEUTRAL)
  if (direction !== 'NEUTRAL' && enhancedProbability < minThreshold) {
    enhancedProbability = minThreshold;
  }
  
  // Cap at maximum realistic probability (never promise 100% certainty)
  const maxProbability = 98;
  enhancedProbability = Math.min(enhancedProbability, maxProbability);
  
  // For NEUTRAL signals, cap probability lower
  if (direction === 'NEUTRAL') {
    enhancedProbability = Math.min(enhancedProbability, 60);
  }
  
  return Math.round(enhancedProbability);
}

/**
 * Transform raw confidence score to base success probability
 * This uses a sigmoid-like curve for more realistic probability estimation
 */
function transformConfidenceToSuccessProbability(
  confidence: number, 
  direction: 'LONG' | 'SHORT' | 'NEUTRAL'
): number {
  if (direction === 'NEUTRAL') {
    // For neutral signals, base probability is lower
    return Math.min(50, confidence * 0.8);
  }
  
  // Apply a nonlinear transformation to account for market uncertainty
  // Below 50% confidence, probability drops more rapidly
  // Above 80% confidence, diminishing returns on probability
  if (confidence < 50) {
    return confidence * 0.8; // Below 50% confidence has less than proportional probability
  } else if (confidence < 80) {
    return 40 + (confidence - 50) * 1.0; // Mid-range has roughly proportional mapping
  } else {
    return 70 + (confidence - 80) * 0.7; // High confidence has diminishing returns
  }
}

/**
 * Get timeframe-specific probability boost percentage
 * Longer timeframes get higher boosts because they're inherently more reliable
 */
function getTimeframeBoost(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1M':
      return 0.25; // +25% for monthly signals
    case '1w':
      return 0.23; // +23% for weekly signals
    case '3d':
      return 0.20; // +20% for 3-day signals
    case '1d':
      return 0.18; // +18% for daily signals
    case '4h':
      return 0.15; // +15% for 4-hour signals
    case '1h':
      return 0.12; // +12% for 1-hour signals
    case '30m':
      return 0.10; // +10% for 30-minute signals
    case '15m':
      return 0.08; // +8% for 15-minute signals
    case '5m':
      return 0.05; // +5% for 5-minute signals
    case '1m':
      return 0.03; // +3% for 1-minute signals
    default:
      return 0.0;
  }
}

/**
 * Get timeframe-specific minimum success probability threshold
 * This ensures that even at lower confidence levels, longer timeframes
 * maintain reasonable minimum probability estimates
 */
function getMinimumThreshold(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1M':
      return 70; // Monthly signals have at least 70% probability if directional
    case '1w':
      return 65; // Weekly signals have at least 65% probability if directional
    case '3d':
      return 62; // 3-day signals have at least 62% probability if directional
    case '1d':
      return 60; // Daily signals have at least 60% probability if directional
    case '4h':
      return 55; // 4-hour signals have at least 55% probability if directional
    case '1h':
      return 50; // 1-hour signals have at least 50% probability if directional
    default:
      return 40; // Shorter timeframes have at least 40% probability if directional
  }
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