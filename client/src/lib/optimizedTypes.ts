import { TimeFrame } from '../types';

// Optimized type-safe mappings for all timeframes
export const TIMEFRAME_WEIGHTS: Record<TimeFrame, number> = {
  '1m': 1,
  '5m': 2,
  '15m': 3,
  '30m': 4,
  '1h': 5,
  '4h': 6,
  '1d': 7,
  '3d': 8,
  '1w': 9,
  '1M': 10
};

export const TIMEFRAME_MULTIPLIERS: Record<TimeFrame, number> = {
  '1m': 0.7,
  '5m': 0.8,
  '15m': 0.85,
  '30m': 0.9,
  '1h': 1.0,
  '4h': 1.1,
  '1d': 1.2,
  '3d': 1.25,
  '1w': 1.3,
  '1M': 1.35
};

export const RISK_MULTIPLIERS: Record<TimeFrame, number> = {
  '1m': 0.5,
  '5m': 0.7,
  '15m': 1.0,
  '30m': 1.2,
  '1h': 1.5,
  '4h': 2.0,
  '1d': 2.5,
  '3d': 3.0,
  '1w': 3.5,
  '1M': 4.0
};

export const SUCCESS_PROBABILITY_ADJUSTMENTS: Record<TimeFrame, number> = {
  '1m': -10,
  '5m': -5,
  '15m': 0,
  '30m': 2,
  '1h': 5,
  '4h': 8,
  '1d': 10,
  '3d': 12,
  '1w': 15,
  '1M': 18
};

export const LEVERAGE_ADJUSTMENTS: Record<TimeFrame, number> = {
  '1m': 0.5,
  '5m': 0.7,
  '15m': 0.8,
  '30m': 0.9,
  '1h': 1.0,
  '4h': 1.1,
  '1d': 1.2,
  '3d': 1.0,
  '1w': 0.8,
  '1M': 0.6
};

// Type-safe timeframe arrays
export const ALL_TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
export const DISPLAY_TIMEFRAMES: TimeFrame[] = ['15m', '1h', '4h', '1d', '3d', '1w', '1M'];
export const SHORT_TERM_TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '30m'];
export const LONG_TERM_TIMEFRAMES: TimeFrame[] = ['1d', '3d', '1w', '1M'];

// Helper functions for type safety
export function isValidTimeframe(timeframe: string): timeframe is TimeFrame {
  return ALL_TIMEFRAMES.includes(timeframe as TimeFrame);
}

export function getTimeframeWeight(timeframe: TimeFrame): number {
  return TIMEFRAME_WEIGHTS[timeframe];
}

export function getTimeframeMultiplier(timeframe: TimeFrame): number {
  return TIMEFRAME_MULTIPLIERS[timeframe];
}

export function getRiskMultiplier(timeframe: TimeFrame): number {
  return RISK_MULTIPLIERS[timeframe];
}

export function getSuccessProbabilityAdjustment(timeframe: TimeFrame): number {
  return SUCCESS_PROBABILITY_ADJUSTMENTS[timeframe];
}

export function getLeverageAdjustment(timeframe: TimeFrame): number {
  return LEVERAGE_ADJUSTMENTS[timeframe];
}

// Initialize empty signals object with proper typing
export function createEmptySignalsObject(): Record<TimeFrame, null> {
  return ALL_TIMEFRAMES.reduce((acc, timeframe) => {
    acc[timeframe] = null;
    return acc;
  }, {} as Record<TimeFrame, null>);
}