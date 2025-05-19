/**
 * Special handling for SOL/USDT calculations
 */
import { ChartData, TimeFrame } from '../types';

/**
 * Validates SOL candle data before calculations
 * This function can be used before calculations to ensure data is valid
 */
export function validateSolData(data: ChartData[] | null | undefined, timeframe: TimeFrame): boolean {
  // Check if data exists and is an array
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error(`SOL/USDT error: Invalid data for ${timeframe} timeframe`);
    return false;
  }
  
  // Check if data points have required properties with valid values
  const hasValidData = data.every(candle => (
    candle && 
    typeof candle.close === 'number' && 
    !isNaN(candle.close) &&
    typeof candle.high === 'number' && 
    !isNaN(candle.high) &&
    typeof candle.low === 'number' && 
    !isNaN(candle.low)
  ));
  
  if (!hasValidData) {
    console.error(`SOL/USDT error: Data contains invalid candles for ${timeframe} timeframe`);
    return false;
  }
  
  return true;
}

/**
 * Safely processes SOL calculations with fallback to prevent errors
 */
export function safeCalculation<T>(
  symbol: string,
  timeframe: TimeFrame, 
  data: ChartData[],
  calculationFn: (data: ChartData[]) => T,
  fallbackValue: T
): T {
  try {
    // Special handling for SOL/USDT
    if (symbol.includes('SOL') && !validateSolData(data, timeframe)) {
      console.log(`Using fallback value for SOL/USDT ${timeframe} calculation`);
      return fallbackValue;
    }
    
    return calculationFn(data);
  } catch (error) {
    console.error(`Error in ${symbol} calculation for ${timeframe}:`, error);
    return fallbackValue;
  }
}