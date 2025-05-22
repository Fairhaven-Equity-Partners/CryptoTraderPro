/**
 * Advanced Signal Stabilization System
 * 
 * Prevents signals from drastically changing between price updates, 
 * especially for weekly and monthly timeframes.
 */

import { TimeFrame } from '../types';

// Define the signal direction types
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

// Constants for signal stabilization
const WEEKLY_CONFIDENCE_THRESHOLD = 85;  // Minimum confidence to change weekly signal
const MONTHLY_CONFIDENCE_THRESHOLD = 90; // Minimum confidence to change monthly signal
const WEEKLY_MAX_CHANGE = 10;            // Maximum confidence change for weekly signals
const MONTHLY_MAX_CHANGE = 5;            // Maximum confidence change for monthly signals
const WEEKLY_ADJUSTMENT = 5;             // Standard adjustment for weekly signals
const MONTHLY_ADJUSTMENT = 2;            // Standard adjustment for monthly signals
const MIN_CONFIDENCE = 50;               // Minimum confidence level
const MAX_CONFIDENCE = 95;               // Maximum confidence level

// Signal stabilization configuration by timeframe
const timeframeConfig = {
  '1w': {
    confidenceThreshold: WEEKLY_CONFIDENCE_THRESHOLD,
    maxChange: WEEKLY_MAX_CHANGE,
    adjustment: WEEKLY_ADJUSTMENT
  },
  '1M': {
    confidenceThreshold: MONTHLY_CONFIDENCE_THRESHOLD,
    maxChange: MONTHLY_MAX_CHANGE,
    adjustment: MONTHLY_ADJUSTMENT
  }
};

/**
 * Stabilize a signal based on its timeframe configuration
 */
function stabilizeSignal(
  timeframe: '1w' | '1M',
  previousDirection: SignalDirection,
  newDirection: SignalDirection,
  previousConfidence: number,
  newConfidence: number
): { direction: SignalDirection, confidence: number } {
  // Get configuration for this timeframe
  const config = timeframeConfig[timeframe];
  
  // If directions match, only allow small confidence changes
  if (previousDirection === newDirection) {
    // Limit confidence changes to prevent sudden jumps
    if (Math.abs(previousConfidence - newConfidence) > config.maxChange) {
      const adjustment = newConfidence > previousConfidence ? config.adjustment : -config.adjustment;
      return {
        direction: newDirection,
        confidence: previousConfidence + adjustment
      };
    }
    
    // Directions match and confidence change is reasonable
    return { direction: newDirection, confidence: newConfidence };
  }
  
  // If the new direction is different, require high confidence
  // for it to override the previous direction
  if (newConfidence >= config.confidenceThreshold) {
    console.log(`${timeframe} signal changed from ${previousDirection} to ${newDirection} with high confidence (${newConfidence}%)`);
    return { direction: newDirection, confidence: newConfidence };
  }
  
  // Not enough confidence to change direction
  // Keep previous direction but allow slight confidence adjustment
  console.log(`${timeframe} signal direction change rejected (${previousDirection} -> ${newDirection}): insufficient confidence (${newConfidence}%)`);
  const adjustment = newConfidence > previousConfidence ? config.adjustment : -config.adjustment;
  return {
    direction: previousDirection,
    confidence: Math.max(MIN_CONFIDENCE, Math.min(MAX_CONFIDENCE, previousConfidence + adjustment))
  };
}

// Tracking the most recent signals for each symbol and timeframe using a Map for better performance
const signalHistory = new Map<string, Map<TimeFrame, { direction: SignalDirection, confidence: number }>>();

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
  // Get or create symbol history
  let symbolHistory = signalHistory.get(symbol);
  if (!symbolHistory) {
    symbolHistory = new Map();
    signalHistory.set(symbol, symbolHistory);
  }
  
  // If this is the first signal for this timeframe, just store it
  const previousSignal = symbolHistory.get(timeframe);
  if (!previousSignal) {
    const result = { direction: newDirection, confidence: newConfidence };
    symbolHistory.set(timeframe, result);
    return result;
  }
  
  // Apply stabilization based on timeframe
  let stabilized: { direction: SignalDirection, confidence: number };
  
  if (timeframe === '1w' || timeframe === '1M') {
    // Use the stabilizeSignal function for weekly and monthly signals
    stabilized = stabilizeSignal(
      timeframe,
      previousSignal.direction,
      newDirection,
      previousSignal.confidence,
      newConfidence
    );
    
    // Log before/after for monitoring
    console.log(`Before ${timeframe} stabilization: ${newDirection} (${newConfidence}%)`);
    console.log(`After ${timeframe} stabilization: ${stabilized.direction} (${stabilized.confidence}%)`);
  } else {
    // For other timeframes, just use the new values
    stabilized = { direction: newDirection, confidence: newConfidence };
  }
  
  // Update signal history
  symbolHistory.set(timeframe, stabilized);
  
  return stabilized;
}