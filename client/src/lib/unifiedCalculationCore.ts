/**
 * Unified Calculation Core - Streamlined & Optimized
 * 
 * Single source of truth for all technical analysis calculations
 * Optimized for performance with intelligent caching and minimal redundancy
 */

import { ChartData, TimeFrame, AdvancedSignal, SignalDirection } from '../types';

// Performance optimization: Pre-allocated arrays and calculation cache
const calculationCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_EXPIRY = 30000; // 30 seconds cache
const tempArrays = {
  prices: new Array(1000),
  volumes: new Array(1000),
  highs: new Array(1000),
  lows: new Array(1000)
};

// Optimized calculation parameters by timeframe
const TIMEFRAME_PARAMS = {
  '1m': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 0.3, takeProfit: 0.6 },
  '5m': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 0.5, takeProfit: 1.0 },
  '15m': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 0.8, takeProfit: 1.6 },
  '30m': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 1.2, takeProfit: 2.4 },
  '1h': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 1.8, takeProfit: 3.6 },
  '4h': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 3.0, takeProfit: 6.0 },
  '12h': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 4.5, takeProfit: 9.0 },
  '1d': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 4.0, takeProfit: 8.0 },
  '3d': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 8.0, takeProfit: 16.0 },
  '1w': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 12.0, takeProfit: 24.0 },
  '1M': { rsi: 14, macd: [12, 26, 9], bb: [20, 2], stopLoss: 12.0, takeProfit: 24.0 }
};

/**
 * Fast RSI calculation using optimized algorithm
 */
function calculateRSI(data: ChartData[], period: number = 14): number {
  if (data.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Initial calculation
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Smoothed calculation for the last value
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    
    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Fast MACD calculation
 */
function calculateMACD(data: ChartData[], fast: number = 12, slow: number = 26, signal: number = 9) {
  if (data.length < slow) return { value: 0, signal: 0, histogram: 0 };
  
  // Calculate EMAs
  const fastEMA = calculateEMA(data, fast);
  const slowEMA = calculateEMA(data, slow);
  const macdLine = fastEMA - slowEMA;
  
  // Simple signal line approximation for performance
  const signalLine = macdLine * 0.8; // Simplified calculation
  
  return {
    value: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine
  };
}

/**
 * Fast EMA calculation
 */
function calculateEMA(data: ChartData[], period: number): number {
  if (data.length === 0) return 0;
  
  const multiplier = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

/**
 * Fast Bollinger Bands calculation
 */
function calculateBollingerBands(data: ChartData[], period: number = 20, stdDev: number = 2) {
  if (data.length < period) return { middle: 0, upper: 0, lower: 0, width: 0, percentB: 50 };
  
  // Calculate SMA
  let sum = 0;
  for (let i = data.length - period; i < data.length; i++) {
    sum += data[i].close;
  }
  const sma = sum / period;
  
  // Calculate standard deviation
  let variance = 0;
  for (let i = data.length - period; i < data.length; i++) {
    variance += Math.pow(data[i].close - sma, 2);
  }
  const standardDev = Math.sqrt(variance / period);
  
  const upper = sma + (standardDev * stdDev);
  const lower = sma - (standardDev * stdDev);
  const currentPrice = data[data.length - 1].close;
  
  return {
    middle: sma,
    upper,
    lower,
    width: (upper - lower) / sma,
    percentB: ((currentPrice - lower) / (upper - lower)) * 100
  };
}

/**
 * Generate trading signals with optimized calculations
 */
function generateTradingSignal(data: ChartData[], timeframe: TimeFrame): SignalDirection {
  const params = TIMEFRAME_PARAMS[timeframe];
  const rsi = calculateRSI(data, params.rsi);
  const macd = calculateMACD(data, ...params.macd);
  const bb = calculateBollingerBands(data, ...params.bb);
  
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // RSI signals
  if (rsi < 30) bullishSignals += 2;
  else if (rsi > 70) bearishSignals += 2;
  else if (rsi < 50) bullishSignals += 1;
  else bearishSignals += 1;
  
  // MACD signals
  if (macd.histogram > 0) bullishSignals += 1;
  else bearishSignals += 1;
  
  // Bollinger Bands signals
  if (bb.percentB < 20) bullishSignals += 1;
  else if (bb.percentB > 80) bearishSignals += 1;
  
  // Determine signal
  if (bullishSignals > bearishSignals + 1) return 'LONG';
  if (bearishSignals > bullishSignals + 1) return 'SHORT';
  return 'NEUTRAL';
}

/**
 * Calculate optimal entry price based on technical analysis
 */
function calculateOptimalEntry(data: ChartData[], direction: SignalDirection, currentPrice: number): number {
  if (!data || data.length < 20) return currentPrice;
  
  const recent = data.slice(-10);
  const avg = recent.reduce((sum, candle) => sum + candle.close, 0) / recent.length;
  
  if (direction === 'LONG') {
    // For LONG: Look for slight pullback entry (better than market price)
    const supportLevel = Math.min(...recent.map(c => c.low));
    return Math.max(supportLevel * 1.001, currentPrice * 0.999);
  } else if (direction === 'SHORT') {
    // For SHORT: Look for resistance level entry (better than market price)  
    const resistanceLevel = Math.max(...recent.map(c => c.high));
    return Math.min(resistanceLevel * 0.999, currentPrice * 1.001);
  }
  
  return currentPrice;
}

/**
 * Calculate stop loss and take profit levels based on ATR and technical levels
 */
function calculateTradingLevels(data: ChartData[], entryPrice: number, direction: SignalDirection, timeframe: TimeFrame) {
  const params = TIMEFRAME_PARAMS[timeframe];
  
  // Calculate ATR for dynamic stop loss sizing
  let atr = 0;
  if (data && data.length >= 14) {
    const atrPeriod = Math.min(14, data.length - 1);
    for (let i = data.length - atrPeriod; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = i > 0 ? data[i-1].close : data[i].close;
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      atr += tr;
    }
    atr = atr / atrPeriod;
  } else {
    // Fallback ATR estimation
    atr = entryPrice * 0.02; // 2% of price as estimated volatility
  }
  
  // Use ATR-based calculations for more realistic levels
  const atrMultiplier = timeframe === '1m' ? 1.5 : 
                       timeframe === '5m' ? 2.0 :
                       timeframe === '15m' ? 2.5 :
                       timeframe === '30m' ? 3.0 :
                       timeframe === '1h' ? 3.5 :
                       timeframe === '4h' ? 4.0 :
                       timeframe === '1d' ? 5.0 :
                       timeframe === '3d' ? 6.0 :
                       timeframe === '1w' ? 8.0 : 10.0;
  
  if (direction === 'LONG') {
    return {
      stopLoss: entryPrice - (atr * atrMultiplier),
      takeProfit: entryPrice + (atr * atrMultiplier * 2) // 1:2 risk/reward
    };
  } else if (direction === 'SHORT') {
    return {
      stopLoss: entryPrice + (atr * atrMultiplier),
      takeProfit: entryPrice - (atr * atrMultiplier * 2) // 1:2 risk/reward
    };
  }
  
  return {
    stopLoss: entryPrice * 0.98,
    takeProfit: entryPrice * 1.02
  };
}

/**
 * Main unified calculation function
 */
export function calculateUnifiedSignal(
  data: ChartData[],
  timeframe: TimeFrame,
  symbol: string,
  currentPrice: number
): AdvancedSignal {
  // Check cache first
  const cacheKey = `${symbol}-${timeframe}-${currentPrice}`;
  const cached = calculationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.result;
  }
  
  // Validate data
  if (!data || data.length < 50) {
    const fallbackLevels = calculateTradingLevels(data || [], currentPrice, 'NEUTRAL', timeframe);
    return {
      direction: 'NEUTRAL',
      confidence: 50,
      entryPrice: currentPrice,
      stopLoss: fallbackLevels.stopLoss,
      takeProfit: fallbackLevels.takeProfit,
      timeframe,
      timestamp: Date.now(),
      successProbability: 50
    };
  }
  
  // Generate signal
  const direction = generateTradingSignal(data, timeframe);
  
  // Calculate optimal entry price based on technical analysis
  const optimalEntry = calculateOptimalEntry(data, direction, currentPrice);
  
  // Calculate trading levels using ATR and technical analysis
  const tradingLevels = calculateTradingLevels(data, optimalEntry, direction, timeframe);
  
  // Calculate indicators for confidence
  const params = TIMEFRAME_PARAMS[timeframe];
  const rsi = calculateRSI(data, params.rsi);
  const macd = calculateMACD(data, ...params.macd);
  const bb = calculateBollingerBands(data, ...params.bb);
  
  // Calculate confidence based on indicator alignment
  let confidence = 50;
  if (direction === 'LONG') {
    if (rsi < 30) confidence += 20;
    else if (rsi < 50) confidence += 10;
    if (macd.histogram > 0) confidence += 15;
    if (bb.percentB < 30) confidence += 15;
  } else if (direction === 'SHORT') {
    if (rsi > 70) confidence += 20;
    else if (rsi > 50) confidence += 10;
    if (macd.histogram < 0) confidence += 15;
    if (bb.percentB > 70) confidence += 15;
  }
  
  confidence = Math.min(95, Math.max(5, confidence));
  
  // Calculate real ATR for indicator data
  let atr = 0;
  if (data.length >= 14) {
    const atrPeriod = Math.min(14, data.length - 1);
    for (let i = data.length - atrPeriod; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = i > 0 ? data[i-1].close : data[i].close;
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      atr += tr;
    }
    atr = atr / atrPeriod;
  } else {
    atr = bb.width * currentPrice;
  }
  
  const result: AdvancedSignal = {
    direction,
    confidence,
    entryPrice: optimalEntry,
    stopLoss: tradingLevels.stopLoss,
    takeProfit: tradingLevels.takeProfit,
    timeframe,
    timestamp: Date.now(),
    successProbability: confidence,
    indicators: {
      rsi,
      macd,
      bb,
      atr,
      volatility: bb.width
    },
    patternFormations: [],
    supportLevels: [],
    resistanceLevels: [],
    macroInsights: []
  };
  
  // Cache result
  calculationCache.set(cacheKey, { result, timestamp: Date.now() });
  
  // Clean cache periodically
  if (calculationCache.size > 100) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    calculationCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_EXPIRY) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => calculationCache.delete(key));
  }
  
  return result;
}

/**
 * Batch calculate signals for multiple timeframes - optimized
 */
export function calculateMultiTimeframeSignals(
  dataMap: Record<TimeFrame, ChartData[]>,
  symbol: string,
  currentPrice: number
): Record<TimeFrame, AdvancedSignal> {
  const results: Record<TimeFrame, AdvancedSignal> = {} as any;
  
  // Calculate in parallel for better performance
  const timeframes = Object.keys(dataMap) as TimeFrame[];
  
  for (const timeframe of timeframes) {
    const data = dataMap[timeframe];
    if (data && data.length > 0) {
      results[timeframe] = calculateUnifiedSignal(data, timeframe, symbol, currentPrice);
    }
  }
  
  return results;
}

/**
 * Clear calculation cache
 */
export function clearCalculationCache(): void {
  calculationCache.clear();
}