/**
 * Signal Stabilizer Module
 * 
 * This module provides functions to enhance the stability of trading signals
 * by implementing buffer zones, hysteresis, and confidence adjustments.
 */

import { TimeFrame } from '../types';

// Define the signal direction types
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

// A simple class to store recent signal history
export class SignalHistory {
  private static instance: SignalHistory;
  private history: Map<string, Array<{timestamp: number, direction: SignalDirection, confidence: number}>>;
  
  private constructor() {
    this.history = new Map();
  }
  
  public static getInstance(): SignalHistory {
    if (!SignalHistory.instance) {
      SignalHistory.instance = new SignalHistory();
    }
    return SignalHistory.instance;
  }
  
  public addSignal(symbol: string, timeframe: TimeFrame, direction: SignalDirection, confidence: number): void {
    const key = `${symbol}-${timeframe}`;
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    
    const signals = this.history.get(key)!;
    signals.push({
      timestamp: Date.now(),
      direction,
      confidence
    });
    
    // Keep only the last 10 signals
    if (signals.length > 10) {
      signals.shift();
    }
  }
  
  public getRecentSignals(symbol: string, timeframe: TimeFrame, count: number = 5): Array<{timestamp: number, direction: SignalDirection, confidence: number}> {
    const key = `${symbol}-${timeframe}`;
    if (!this.history.has(key)) {
      return [];
    }
    
    const signals = this.history.get(key)!;
    return signals.slice(-count);
  }
  
  public getMostFrequentDirection(symbol: string, timeframe: TimeFrame, count: number = 5): {direction: SignalDirection, frequency: number} {
    const signals = this.getRecentSignals(symbol, timeframe, count);
    if (signals.length === 0) {
      return { direction: 'NEUTRAL', frequency: 0 };
    }
    
    const directionCounts = signals.reduce((acc, signal) => {
      acc[signal.direction] = (acc[signal.direction] || 0) + 1;
      return acc;
    }, {} as Record<SignalDirection, number>);
    
    let maxDirection: SignalDirection = 'NEUTRAL';
    let maxCount = 0;
    
    Object.entries(directionCounts).forEach(([direction, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxDirection = direction as SignalDirection;
      }
    });
    
    return { 
      direction: maxDirection, 
      frequency: maxCount / signals.length 
    };
  }
  
  public getAverageConfidence(symbol: string, timeframe: TimeFrame, count: number = 5): number {
    const signals = this.getRecentSignals(symbol, timeframe, count);
    if (signals.length === 0) {
      return 0;
    }
    
    const totalConfidence = signals.reduce((acc, signal) => acc + signal.confidence, 0);
    return totalConfidence / signals.length;
  }
}

/**
 * Apply hysteresis to signal direction to prevent rapid switching
 * @param currentDirection Current signal direction
 * @param calculatedDirection New calculated direction
 * @param confidence Confidence level of the new signal
 * @param timeframe Timeframe of the signal
 * @returns Stabilized signal direction
 */
export function stabilizeSignalDirection(
  symbol: string,
  timeframe: TimeFrame,
  currentDirection: SignalDirection,
  calculatedDirection: SignalDirection,
  confidence: number
): SignalDirection {
  const signalHistory = SignalHistory.getInstance();
  const recentSignals = signalHistory.getRecentSignals(symbol, timeframe);
  
  // If we have no history, use the calculated direction
  if (recentSignals.length === 0) {
    signalHistory.addSignal(symbol, timeframe, calculatedDirection, confidence);
    return calculatedDirection;
  }
  
  // Get the most frequent recent direction
  const { direction: mostFrequentDirection, frequency } = signalHistory.getMostFrequentDirection(symbol, timeframe);
  
  // Define hysteresis thresholds based on timeframe
  // Longer timeframes require more confirmation to change direction
  const hysteresisThreshold = getHysteresisThreshold(timeframe);
  
  // If the calculated direction matches the most frequent direction, keep it
  if (calculatedDirection === mostFrequentDirection) {
    signalHistory.addSignal(symbol, timeframe, calculatedDirection, confidence);
    return calculatedDirection;
  }
  
  // If the confidence is very high, accept the new direction immediately
  if (confidence > 90) {
    signalHistory.addSignal(symbol, timeframe, calculatedDirection, confidence);
    return calculatedDirection;
  }
  
  // For weekly and monthly timeframes, require even stronger confirmation
  if (timeframe === '1w' || timeframe === '1M') {
    // For these timeframes, require at least 3 signals in the same direction to change
    if (frequency < 0.7 || confidence < 75) {
      // Not enough confirmation - keep the current direction
      signalHistory.addSignal(symbol, timeframe, mostFrequentDirection, confidence);
      return mostFrequentDirection;
    }
  }
  
  // Apply hysteresis - require more confirmation for direction changes
  if (frequency > hysteresisThreshold) {
    // Strong historical bias - keep the most frequent direction
    signalHistory.addSignal(symbol, timeframe, mostFrequentDirection, confidence);
    return mostFrequentDirection;
  }
  
  // Accept the new direction
  signalHistory.addSignal(symbol, timeframe, calculatedDirection, confidence);
  return calculatedDirection;
}

/**
 * Apply confidence adjustment to ensure realistic and stable values
 * @param calculatedConfidence The raw calculated confidence
 * @param timeframe The signal timeframe
 * @returns Adjusted confidence value
 */
export function stabilizeConfidence(
  symbol: string,
  timeframe: TimeFrame, 
  calculatedConfidence: number
): number {
  const signalHistory = SignalHistory.getInstance();
  const averageConfidence = signalHistory.getAverageConfidence(symbol, timeframe);
  
  // If we have no history, use the calculated confidence
  if (averageConfidence === 0) {
    return Math.min(Math.max(calculatedConfidence, 50), 95);
  }
  
  // Apply smoothing based on timeframe
  // Longer timeframes should have more consistent confidence levels
  const smoothingFactor = getConfidenceSmoothingFactor(timeframe);
  
  // Calculate smoothed confidence
  const smoothedConfidence = (averageConfidence * smoothingFactor) + 
                           (calculatedConfidence * (1 - smoothingFactor));
  
  // Apply reasonable bounds to confidence values
  return Math.min(Math.max(smoothedConfidence, 50), 95);
}

/**
 * Get the hysteresis threshold for a timeframe
 * @param timeframe The signal timeframe
 * @returns Hysteresis threshold (0-1)
 */
function getHysteresisThreshold(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 0.3;  // Very short timeframe - less stable
    case '5m': return 0.4;
    case '15m': return 0.5;
    case '30m': return 0.5;
    case '1h': return 0.6;
    case '4h': return 0.6;
    case '1d': return 0.7;
    case '3d': return 0.7;
    case '1w': return 0.8;  // Weekly - very stable
    case '1M': return 0.9;  // Monthly - extremely stable
    default: return 0.5;
  }
}

/**
 * Get the confidence smoothing factor for a timeframe
 * @param timeframe The signal timeframe
 * @returns Smoothing factor (0-1)
 */
function getConfidenceSmoothingFactor(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 0.3;  // Less smoothing - more responsive
    case '5m': return 0.4;
    case '15m': return 0.5;
    case '30m': return 0.6;
    case '1h': return 0.7;
    case '4h': return 0.7;
    case '1d': return 0.8;
    case '3d': return 0.8;
    case '1w': return 0.9;  // High smoothing - very stable
    case '1M': return 0.95; // Highest smoothing - extremely stable
    default: return 0.6;
  }
}