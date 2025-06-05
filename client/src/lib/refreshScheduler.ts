import { TimeFrame } from '../types';

/**
 * Optimized refresh intervals for each timeframe (in milliseconds)
 * - Short timeframes refresh more frequently
 * - Longer timeframes refresh less frequently to reduce load
 */
export const REFRESH_INTERVALS: Record<TimeFrame, number> = {
  // Short timeframes
  '1m': 30000,     // 30 seconds
  '5m': 45000,     // 45 seconds
  '15m': 60000,    // 1 minute
  
  // Medium timeframes
  '30m': 120000,   // 2 minutes
  '1h': 180000,    // 3 minutes
  '4h': 300000,    // 5 minutes
  
  // Long timeframes
  '1d': 900000,    // 15 minutes
  '3d': 1800000,   // 30 minutes
  
  // Very long timeframes
  '1w': 3600000,   // 1 hour
  '1M': 7200000    // 2 hours
};

// Current price data refresh interval (in milliseconds) - Optimized for CoinGecko free tier
export const PRICE_REFRESH_INTERVAL = 240000; // 4 minutes = supports 200+ pairs on free tier

// Cache validity duration for each timeframe (in milliseconds)
export const CACHE_VALIDITY: Record<TimeFrame, number> = {
  '1m': 120000,     // 2 minutes
  '5m': 300000,     // 5 minutes
  '15m': 900000,    // 15 minutes
  '30m': 1800000,   // 30 minutes
  '1h': 3600000,    // 1 hour
  '4h': 7200000,    // 2 hours
  '1d': 86400000,   // 1 day
  '3d': 172800000,  // 2 days
  '1w': 604800000,  // 7 days
  '1M': 2592000000  // 30 days
};

/**
 * Schedules a task to run at the appropriate interval based on timeframe
 * @param timeframe The timeframe to schedule for
 * @param task The task function to run
 * @returns A cleanup function to cancel the scheduled task
 */
export function scheduleRefresh(timeframe: TimeFrame, task: () => void): () => void {
  const interval = REFRESH_INTERVALS[timeframe];
  const timerId = setInterval(task, interval);
  
  // Return a cleanup function
  return () => clearInterval(timerId);
}

/**
 * Schedules a price update at the optimal frequency
 * @param task The price update function to run
 * @returns A cleanup function to cancel the scheduled task
 */
export function schedulePriceRefresh(task: () => void): () => void {
  const timerId = setInterval(task, PRICE_REFRESH_INTERVAL);
  return () => clearInterval(timerId);
}