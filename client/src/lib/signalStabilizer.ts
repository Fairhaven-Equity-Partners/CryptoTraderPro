/**
 * Signal Stabilization System
 * 
 * Prevents dramatic signal flips in weekly and monthly timeframes
 * by maintaining signal consistency across price data updates.
 * 
 * Optimized version with faster lookups and reduced memory usage.
 * 
 * Confidence thresholds:
 * - Weekly: 85%+ required for signal change
 * - Monthly: 90%+ required for signal change
 */

import { SignalDirection, TimeFrame } from './advancedSignals';

interface StabilizedSignal {
  direction: SignalDirection;
  confidence: number;
}

interface TimeframeSettings {
  confidenceThreshold: number; // Minimum confidence needed to override previous signal
  overrideThreshold: number;   // Super high confidence that always overrides (98%+)
  fallbackPeriod: number;      // How many periods to hold signal before allowing change
}

// Combine signal state and counter into a single object to reduce lookups
interface SignalState {
  direction: SignalDirection;
  confidence: number;
  counter: number;
}

// Efficient cache using symbol_timeframe as key for faster lookups
// This prevents unnecessary nested object creation and reduces memory overhead
const signalCache = new Map<string, SignalState>();

// Use a single object for settings to improve lookup speed
const TIMEFRAME_SETTINGS: Record<TimeFrame, TimeframeSettings> = {
  '1m': { confidenceThreshold: 60, overrideThreshold: 95, fallbackPeriod: 1 },
  '5m': { confidenceThreshold: 65, overrideThreshold: 95, fallbackPeriod: 1 },
  '15m': { confidenceThreshold: 70, overrideThreshold: 95, fallbackPeriod: 2 },
  '30m': { confidenceThreshold: 75, overrideThreshold: 95, fallbackPeriod: 2 },
  '1h': { confidenceThreshold: 75, overrideThreshold: 95, fallbackPeriod: 3 },
  '4h': { confidenceThreshold: 80, overrideThreshold: 95, fallbackPeriod: 4 },
  '1d': { confidenceThreshold: 83, overrideThreshold: 96, fallbackPeriod: 4 },
  '3d': { confidenceThreshold: 85, overrideThreshold: 96, fallbackPeriod: 5 },
  '1w': { confidenceThreshold: 87, overrideThreshold: 97, fallbackPeriod: 6 },
  '1M': { confidenceThreshold: 90, overrideThreshold: 98, fallbackPeriod: 8 },
};

/**
 * Get a stabilized trading signal that resists dramatic flips
 * Optimized version with faster cache lookups and reduced memory usage
 * 
 * @param symbol Asset symbol
 * @param timeframe Trading timeframe
 * @param direction Raw signal direction
 * @param confidence Raw signal confidence
 * @returns Stabilized signal with direction and confidence
 */
export function getStabilizedSignal(
  symbol: string, 
  timeframe: TimeFrame, 
  direction: SignalDirection, 
  confidence: number
): StabilizedSignal {
  console.log(`Before ${timeframe} stabilization: ${direction} (${confidence}%)`);
  
  // Create a compound key for faster lookups
  const cacheKey = `${symbol}_${timeframe}`;
  
  // Get settings once (faster than multiple lookups)
  const settings = TIMEFRAME_SETTINGS[timeframe];
  
  // If not in cache, initialize with current signal
  if (!signalCache.has(cacheKey)) {
    const initialState: SignalState = {
      direction,
      confidence,
      counter: 1
    };
    signalCache.set(cacheKey, initialState);
    console.log(`After ${timeframe} stabilization: ${direction} (${confidence}%)`);
    return { direction, confidence };
  }
  
  // Get cached state (guaranteed to exist after above check)
  const cachedState = signalCache.get(cacheKey)!;
  const { direction: lastDirection, confidence: lastConfidence, counter } = cachedState;
  
  // Fast path: Override threshold - always accept new signal
  if (confidence >= settings.overrideThreshold) {
    const newState: SignalState = { direction, confidence, counter: 1 };
    signalCache.set(cacheKey, newState);
    console.log(`After ${timeframe} stabilization: ${direction} (${confidence}%) [Override]`);
    return { direction, confidence };
  }
  
  // Fast path: Same direction - weighted confidence update
  if (direction === lastDirection) {
    // Optimize weighted calculation - fewer operations
    const weightedConfidence = Math.round((confidence * 0.7) + (lastConfidence * 0.3));
    const newState: SignalState = { 
      direction, 
      confidence: weightedConfidence,
      counter: counter + 1
    };
    signalCache.set(cacheKey, newState);
    console.log(`After ${timeframe} stabilization: ${direction} (${weightedConfidence}%) [Reinforced]`);
    return { direction, confidence: weightedConfidence };
  }
  
  // Fast path: Low confidence change - maintain previous signal
  if (confidence < settings.confidenceThreshold) {
    console.log(`After ${timeframe} stabilization: ${lastDirection} (${lastConfidence}%) [Maintained]`);
    return { direction: lastDirection, confidence: lastConfidence };
  }
  
  // Fast path: In fallback period - maintain previous but increment counter
  if (counter < settings.fallbackPeriod) {
    const newState: SignalState = { 
      direction: lastDirection, 
      confidence: lastConfidence,
      counter: counter + 1
    };
    signalCache.set(cacheKey, newState);
    console.log(`After ${timeframe} stabilization: ${lastDirection} (${lastConfidence}%) [Fallback]`);
    return { direction: lastDirection, confidence: lastConfidence };
  }
  
  // Final case: Accept new direction with tempered confidence
  const temperedConfidence = Math.max(confidence - 5, 50);
  const newState: SignalState = { 
    direction, 
    confidence: temperedConfidence,
    counter: 1
  };
  signalCache.set(cacheKey, newState);
  console.log(`After ${timeframe} stabilization: ${direction} (${temperedConfidence}%) [Changed]`);
  return { direction, confidence: temperedConfidence };
}

/**
 * Reset all stored signals (used during testing or when data significantly changes)
 */
export function resetAllSignals(): void {
  Object.keys(lastSignals).forEach(symbol => {
    delete lastSignals[symbol];
    delete stabilityCounter[symbol];
  });
}

/**
 * Initialize the signal stabilization system and expose the API on window
 */
export function initSignalStabilizationSystem(): void {
  // Expose functions to the global window object
  window.signalStabilizationSystem = {
    getStabilizedSignal,
    resetAllSignals
  };
  
  console.log('Signal Stabilization System Initialized');
}

// Type for the global window system
export interface SignalStabilizationSystem {
  getStabilizedSignal: (
    symbol: string, 
    timeframe: TimeFrame, 
    direction: SignalDirection, 
    confidence: number
  ) => { direction: SignalDirection; confidence: number };
  resetAllSignals: () => void;
}