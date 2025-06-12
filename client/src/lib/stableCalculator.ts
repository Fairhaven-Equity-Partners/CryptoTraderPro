/**
 * Stable Signal Calculation Module
 * 
 * This module provides a unified, stable calculation system for cryptocurrency signals
 * with built-in consistency checks and hysteresis to prevent rapid signal flipping.
 */

import { TimeFrame } from '../types';
import { AdvancedSignal } from './advancedSignals';
import { stabilizeSignalDirection, stabilizeConfidence } from './signalStabilizer';

// Signal calculation history to maintain stability
class SignalHistory {
  private static instance: SignalHistory;
  private history: Map<string, Array<{ 
    timestamp: number, 
    signal: AdvancedSignal 
  }>>;
  
  private constructor() {
    this.history = new Map();
  }
  
  public static getInstance(): SignalHistory {
    if (!SignalHistory.instance) {
      SignalHistory.instance = new SignalHistory();
    }
    return SignalHistory.instance;
  }
  
  // Get a unique key for a symbol+timeframe combination
  private getKey(symbol: string, timeframe: TimeFrame): string {
    return `${symbol}-${timeframe`}`;
  }
  
  // Record a signal calculation
  public recordSignal(symbol: string, timeframe: TimeFrame, signal: AdvancedSignal): void {
    const key = this.getKey(symbol, timeframe);
    
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    
    const signals = this.history.get(key)!;
    signals.push({
      timestamp: Date.now(),
      signal: { ...signal }
    });
    
    // Keep only the last 10 signals
    if (signals.length > 10) {
      signals.shift();
    }
  }
  
  // Get recent signals for a given symbol and timeframe
  public getRecentSignals(symbol: string, timeframe: TimeFrame, count: number = 5): AdvancedSignal[] {
    const key = this.getKey(symbol, timeframe);
    
    if (!this.history.has(key)) {
      return [];
    }
    
    const signals = this.history.get(key)!;
    return signals.slice(-count).map(item => item.signal);
  }
  
  // Check if a new signal is significantly different from history
  public isSignificantChange(
    symbol: string, 
    timeframe: TimeFrame, 
    newSignal: AdvancedSignal
  ): boolean {
    const recentSignals = this.getRecentSignals(symbol, timeframe, 3);
    
    // If no history, any change is significant
    if (recentSignals.length === 0) {
      return true;
    }
    
    // Get most recent signal
    const lastSignal = recentSignals[recentSignals.length - 1];
    
    // Different direction is significant
    if (lastSignal.direction !== newSignal.direction) {
      return true;
    }
    
    // Significant confidence change (>10%)
    const confidenceDiff = Math.abs(lastSignal.confidence - newSignal.confidence);
    if (confidenceDiff > 10) {
      return true;
    }
    
    // Price level changes (stop loss, take profit) >5%
    const slChange = Math.abs((lastSignal.stopLoss - newSignal.stopLoss) / lastSignal.stopLoss) * 100;
    const tpChange = Math.abs((lastSignal.takeProfit - newSignal.takeProfit) / lastSignal.takeProfit) * 100;
    
    if (slChange > 5 || tpChange > 5) {
      return true;
    }
    
    return false;
  }
}

/**
 * Stabilizes a signal by comparing with history and applying hysteresis
 * to prevent rapid signal direction changes and confidence fluctuations
 * 
 * @param symbol The cryptocurrency symbol
 * @param timeframe The timeframe of the signal
 * @param signal The newly calculated signal
 * @returns A stabilized signal
 */
export function stabilizeSignal(
  symbol: string,
  timeframe: TimeFrame,
  signal: AdvancedSignal
): AdvancedSignal {
  const history = SignalHistory.getInstance();
  
  // Get recent signals
  const recentSignals = history.getRecentSignals(symbol, timeframe);
  
  // If we have history, apply stabilization
  if (recentSignals.length > 0) {
    // Get most recent signal
    const lastSignal = recentSignals[recentSignals.length - 1];
    
    // Apply stability to direction based on timeframe and history
    const stabilizedDirection = stabilizeSignalDirection(
      symbol,
      timeframe,
      lastSignal.direction,
      signal.direction,
      signal.confidence
    );
    
    // Apply confidence stabilization to prevent wild swings
    const stabilizedConfidence = stabilizeConfidence(
      symbol,
      timeframe,
      signal.confidence
    );
    
    // Apply more stability for longer timeframes
    const significantChange = history.isSignificantChange(symbol, timeframe, signal);
    
    // For weekly and monthly, require stronger evidence for change
    if ((timeframe === '1w' || timeframe === '1M') && !significantChange) {
      // Keep previous signal with slightly updated confidence
      const result = { 
        ...lastSignal,
        confidence: stabilizedConfidence
      };
      
      // Record the stabilized signal
      history.recordSignal(symbol, timeframe, result);
      
      return result;
    }
    
    // For other timeframes, create a hybrid result
    const result = {
      ...signal,
      direction: stabilizedDirection,
      confidence: stabilizedConfidence
    };
    
    // Record the stabilized signal
    history.recordSignal(symbol, timeframe, result);
    
    return result;
  }
  
  // If no history, record and return as-is
  history.recordSignal(symbol, timeframe, signal);
  
  return signal;
}