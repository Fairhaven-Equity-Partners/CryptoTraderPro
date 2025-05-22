/**
 * Advanced Signal Stabilization System
 * 
 * Prevents signals from drastically changing between price updates, 
 * especially for weekly and monthly timeframes.
 */

import { TimeFrame } from '../types';

// Define the signal direction types
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

/**
 * Stabilize a weekly timeframe signal
 * 
 * Weekly signals should not flip direction unless there's very strong evidence
 * (85%+ confidence in the new direction)
 * 
 * @param previousDirection Previous signal direction
 * @param newDirection New calculated direction
 * @param previousConfidence Previous confidence level (0-100)
 * @param newConfidence New calculated confidence level (0-100)
 * @returns Stabilized direction and confidence
 */
export function stabilizeWeeklySignal(
  previousDirection: SignalDirection,
  newDirection: SignalDirection,
  previousConfidence: number,
  newConfidence: number
): { direction: SignalDirection, confidence: number } {
  
  // If directions match, only allow small confidence changes (max 10%)
  if (previousDirection === newDirection) {
    // Limit confidence changes to prevent sudden jumps
    if (Math.abs(previousConfidence - newConfidence) > 10) {
      const adjustment = newConfidence > previousConfidence ? 5 : -5;
      return {
        direction: newDirection,
        confidence: previousConfidence + adjustment
      };
    }
    
    // Directions match and confidence change is reasonable
    return { direction: newDirection, confidence: newConfidence };
  }
  
  // If the new direction is different, require high confidence (85%+)
  // for it to override the previous direction
  if (newConfidence >= 85) {
    console.log(`Weekly signal changed from ${previousDirection} to ${newDirection} with high confidence (${newConfidence}%)`);
    return { direction: newDirection, confidence: newConfidence };
  }
  
  // Not enough confidence to change direction
  // Keep previous direction but allow slight confidence adjustment
  console.log(`Weekly signal direction change rejected (${previousDirection} -> ${newDirection}): insufficient confidence (${newConfidence}%)`);
  const adjustment = newConfidence > previousConfidence ? 5 : -5;
  return {
    direction: previousDirection,
    confidence: Math.max(50, Math.min(95, previousConfidence + adjustment))
  };
}

/**
 * Stabilize a monthly timeframe signal
 * 
 * Monthly signals should almost never flip direction on a single price update
 * unless there's extremely strong evidence (90%+ confidence)
 * 
 * @param previousDirection Previous signal direction
 * @param newDirection New calculated direction
 * @param previousConfidence Previous confidence level (0-100)
 * @param newConfidence New calculated confidence level (0-100)
 * @returns Stabilized direction and confidence
 */
export function stabilizeMonthlySignal(
  previousDirection: SignalDirection,
  newDirection: SignalDirection,
  previousConfidence: number,
  newConfidence: number
): { direction: SignalDirection, confidence: number } {
  
  // If directions match, only allow very small confidence changes (max 5%)
  if (previousDirection === newDirection) {
    // Limit confidence changes to prevent sudden jumps
    if (Math.abs(previousConfidence - newConfidence) > 5) {
      const adjustment = newConfidence > previousConfidence ? 2 : -2;
      return {
        direction: newDirection,
        confidence: previousConfidence + adjustment
      };
    }
    
    // Directions match and confidence change is reasonable
    return { direction: newDirection, confidence: newConfidence };
  }
  
  // If the new direction is different, require extremely high confidence (90%+)
  // for it to override the previous direction
  if (newConfidence >= 90) {
    console.log(`Monthly signal changed from ${previousDirection} to ${newDirection} with very high confidence (${newConfidence}%)`);
    return { direction: newDirection, confidence: newConfidence };
  }
  
  // Not enough confidence to change direction
  // Keep previous direction but allow slight confidence adjustment
  console.log(`Monthly signal direction change rejected (${previousDirection} -> ${newDirection}): insufficient confidence (${newConfidence}%)`);
  const adjustment = newConfidence > previousConfidence ? 2 : -2;
  return {
    direction: previousDirection,
    confidence: Math.max(50, Math.min(95, previousConfidence + adjustment))
  };
}

// Tracking the most recent signals for each symbol and timeframe
// This helps maintain stability over multiple price updates
const signalHistory: Record<string, Record<TimeFrame, { direction: SignalDirection, confidence: number }>> = {};

/**
 * Tracks and stabilizes signals for a given symbol and timeframe
 * 
 * @param symbol The cryptocurrency symbol
 * @param timeframe The timeframe for the signal
 * @param newDirection The new calculated signal direction
 * @param newConfidence The new calculated confidence level
 * @returns Stabilized direction and confidence values
 */
export function getStabilizedSignal(
  symbol: string,
  timeframe: TimeFrame,
  newDirection: SignalDirection,
  newConfidence: number
): { direction: SignalDirection, confidence: number } {
  
  // Initialize signal history for this symbol if it doesn't exist
  if (!signalHistory[symbol]) {
    signalHistory[symbol] = {} as Record<TimeFrame, { direction: SignalDirection, confidence: number }>;
  }
  
  // If this is the first signal for this timeframe, just store it
  if (!signalHistory[symbol][timeframe]) {
    const result = { direction: newDirection, confidence: newConfidence };
    signalHistory[symbol][timeframe] = result;
    return result;
  }
  
  // Get the previous signal
  const previousSignal = signalHistory[symbol][timeframe];
  
  // Apply stabilization based on timeframe
  let stabilized: { direction: SignalDirection, confidence: number };
  
  if (timeframe === '1w') {
    // Stabilize weekly signals
    stabilized = stabilizeWeeklySignal(
      previousSignal.direction,
      newDirection,
      previousSignal.confidence,
      newConfidence
    );
  } else if (timeframe === '1M') {
    // Stabilize monthly signals (even more strict)
    stabilized = stabilizeMonthlySignal(
      previousSignal.direction,
      newDirection,
      previousSignal.confidence,
      newConfidence
    );
  } else {
    // For other timeframes, just use the new values
    stabilized = { direction: newDirection, confidence: newConfidence };
  }
  
  // Update signal history
  signalHistory[symbol][timeframe] = stabilized;
  
  return stabilized;
}