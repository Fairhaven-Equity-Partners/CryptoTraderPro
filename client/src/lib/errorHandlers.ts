/**
 * Error handling utilities to ensure calculations work for all cryptocurrencies
 */
import { ChartData, TimeFrame } from '../types';

/**
 * Validate chart data to ensure it can be safely used for calculations
 * @param data Chart data to validate
 * @param symbol Currency symbol (used for logging)
 * @param timeframe Timeframe (used for logging)
 * @returns True if data is valid, false otherwise
 */
export function validateChartData(data: ChartData[] | null | undefined, 
                                symbol: string, 
                                timeframe: TimeFrame): boolean {
  // Check for null or undefined data
  if (!data) {
    console.error(`No data available for ${symbol} on ${timeframe} timeframe`);
    return false;
  }
  
  // Check if data is an array
  if (!Array.isArray(data)) {
    console.error(`Data for ${symbol} on ${timeframe} timeframe is not an array`);
    return false;
  }
  
  // Check if data array is empty
  if (data.length === 0) {
    console.error(`Empty data array for ${symbol} on ${timeframe} timeframe`);
    return false;
  }
  
  // Verify candle data structure has required properties
  const validCandles = data.every(candle => 
    candle && 
    typeof candle.close === 'number' && 
    typeof candle.high === 'number' && 
    typeof candle.low === 'number' && 
    !isNaN(candle.close) && 
    !isNaN(candle.high) && 
    !isNaN(candle.low)
  );
  
  if (!validCandles) {
    console.error(`Invalid candle data structure for ${symbol} on ${timeframe} timeframe`);
    return false;
  }
  
  // Check if we have enough data points for technical analysis (30 as minimum)
  if (data.length < 30) {
    console.warn(`Not enough data points for ${symbol} on ${timeframe} timeframe. Found ${data.length}, minimum recommended is 30.`);
    // Still return true as this is just a warning
  }
  
  return true;
}

/**
 * Creates a fallback/neutral signal when data validation fails
 * @param symbol Currency symbol
 * @param timeframe Analysis timeframe
 * @returns A neutral signal object
 */
export function createNeutralSignal(symbol: string, timeframe: TimeFrame) {
  console.log(`Creating neutral fallback signal for ${symbol} on ${timeframe} timeframe`);
  
  return {
    direction: 'NEUTRAL' as const,
    confidence: 50,
    strength: 'MODERATE' as const,
    trend: 'Neutral',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    supports: [],
    resistances: [],
    optimalRiskReward: 1,
    recommendedLeverage: 1
  };
}