/**
 * Signal Stabilization System
 * 
 * Prevents dramatic signal flips in weekly and monthly timeframes
 * by maintaining signal consistency across price data updates.
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

// Last signals for each symbol and timeframe
const lastSignals: Record<string, Record<TimeFrame, StabilizedSignal>> = {};

// Track how many periods a signal has been stable
const stabilityCounter: Record<string, Record<TimeFrame, number>> = {};

// Timeframe-specific settings
const timeframeSettings: Record<TimeFrame, TimeframeSettings> = {
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
  
  // Initialize storage if needed
  if (!lastSignals[symbol]) {
    lastSignals[symbol] = {} as Record<TimeFrame, StabilizedSignal>;
    stabilityCounter[symbol] = {} as Record<TimeFrame, number>;
  }
  
  // If this is the first signal for this timeframe, just use it
  if (!lastSignals[symbol][timeframe]) {
    lastSignals[symbol][timeframe] = { direction, confidence };
    stabilityCounter[symbol][timeframe] = 1;
    console.log(`After ${timeframe} stabilization: ${direction} (${confidence}%)`);
    return { direction, confidence };
  }
  
  const settings = timeframeSettings[timeframe];
  const lastSignal = lastSignals[symbol][timeframe];
  let counter = stabilityCounter[symbol][timeframe] || 0;
  
  // If confidence exceeds the override threshold, always accept the new signal
  if (confidence >= settings.overrideThreshold) {
    lastSignals[symbol][timeframe] = { direction, confidence };
    stabilityCounter[symbol][timeframe] = 1;  // Reset counter
    console.log(`After ${timeframe} stabilization: ${direction} (${confidence}%) [Override]`);
    return { direction, confidence };
  }
  
  // If direction is the same, always accept but update confidence as weighted average
  if (direction === lastSignal.direction) {
    // Weight recent signals more heavily
    const weightedConfidence = (confidence * 0.7) + (lastSignal.confidence * 0.3);
    lastSignals[symbol][timeframe] = { 
      direction, 
      confidence: Math.round(weightedConfidence)
    };
    stabilityCounter[symbol][timeframe] = counter + 1;  // Increase stability
    console.log(`After ${timeframe} stabilization: ${direction} (${Math.round(weightedConfidence)}%) [Reinforced]`);
    return { direction, confidence: Math.round(weightedConfidence) };
  }
  
  // If direction differs but confidence is below threshold, maintain previous signal
  if (confidence < settings.confidenceThreshold) {
    console.log(`After ${timeframe} stabilization: ${lastSignal.direction} (${lastSignal.confidence}%) [Maintained]`);
    return lastSignal;
  }
  
  // If the signal has been stable for less than the fallback period, maintain previous
  if (counter < settings.fallbackPeriod) {
    stabilityCounter[symbol][timeframe] = counter + 1;  // Still increment counter
    console.log(`After ${timeframe} stabilization: ${lastSignal.direction} (${lastSignal.confidence}%) [Fallback]`);
    return lastSignal;
  }
  
  // If we get here, accept new direction but temper confidence slightly
  const temperedConfidence = Math.max(confidence - 5, 50);  // Reduce confidence slightly
  lastSignals[symbol][timeframe] = { direction, confidence: temperedConfidence };
  stabilityCounter[symbol][timeframe] = 1;  // Reset counter
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