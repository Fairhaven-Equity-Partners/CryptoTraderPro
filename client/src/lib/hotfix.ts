/**
 * Hotfix utilities for SOL/USDT calculation issues
 * 
 * This module provides specific fixes for calculations that may fail with certain cryptocurrencies
 */

import { ChartData, TimeFrame } from '../types';

/**
 * Safely validates a data array to make sure calculations won't fail
 */
export function validateDataSafely(data: ChartData[] | undefined | null): boolean {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  // Check for required properties on first and last candle
  try {
    const firstCandle = data[0];
    const lastCandle = data[data.length - 1];
    
    if (!firstCandle || !lastCandle) {
      return false;
    }
    
    // Verify essential properties exist and are valid numbers
    if (typeof firstCandle.close !== 'number' || 
        typeof firstCandle.high !== 'number' || 
        typeof firstCandle.low !== 'number' ||
        typeof lastCandle.close !== 'number' || 
        typeof lastCandle.high !== 'number' || 
        typeof lastCandle.low !== 'number' ||
        isNaN(firstCandle.close) || 
        isNaN(firstCandle.high) || 
        isNaN(firstCandle.low) ||
        isNaN(lastCandle.close) || 
        isNaN(lastCandle.high) || 
        isNaN(lastCandle.low)) {
      return false;
    }
    
    // Verify we have a minimum of data points for calculations
    if (data.length < 20) {
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Data validation error:', e);
    return false;
  }
}

/**
 * Creates fallback values for when calculations fail
 */
export function createFallbackSignal(symbol: string, timeframe: TimeFrame) {
  // Generate a neutral fallback signal with reasonable default values
  return {
    direction: 'NEUTRAL' as const,
    confidence: 50,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    optimalRiskReward: 2,
    recommendedLeverage: 1,
    signalStrength: 'MODERATE' as const,
    patternFormations: [],
    recommendations: [],
    indicators: {
      trend: [],
      momentum: [],
      volatility: [],
      volume: [],
      pattern: []
    },
    macroClassification: 'Neutral',
    calculationStatus: 'Fallback'
  };
}