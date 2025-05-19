/**
 * Technical Indicators Calculation Library
 * 
 * This module provides functions to calculate technical indicators from price data
 * to generate more realistic and consistent trading signals.
 */

import { ChartData, TimeFrame } from '../types';

/**
 * Calculate Simple Moving Average (SMA)
 * @param data Array of price data points
 * @param period Number of periods to average
 * @param priceKey Which price point to use (default: 'close')
 */
export function calculateSMA(data: ChartData[], period: number, priceKey: keyof ChartData = 'close'): number[] {
  const result: number[] = [];
  
  if (data.length < period) {
    return result;
  }
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j][priceKey] as number;
    }
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data Array of price data points
 * @param period Number of periods for EMA
 * @param priceKey Which price point to use (default: 'close')
 */
export function calculateEMA(data: ChartData[], period: number, priceKey: keyof ChartData = 'close'): number[] {
  const result: number[] = [];
  
  if (data.length < period) {
    return result;
  }
  
  // Calculate initial SMA as first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i][priceKey] as number;
  }
  let ema = sum / period;
  result.push(ema);
  
  // Calculate multiplier
  const multiplier = 2 / (period + 1);
  
  // Calculate EMA for remaining data points
  for (let i = period; i < data.length; i++) {
    ema = ((data[i][priceKey] as number) - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param data Array of price data points
 * @param period RSI period (typically 14)
 */
export function calculateRSI(data: ChartData[], period: number = 14): number[] {
  const result: number[] = [];
  
  if (!data || data.length < period + 1) {
    // Return a default RSI value if we don't have enough data
    return [50]; 
  }
  
  try {
    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < data.length; i++) {
      changes.push(data[i].close - data[i - 1].close);
    }
    
    // Calculate average gains and losses over the specified period
    let gains = 0;
    let losses = 0;
    
    // Initialize first average gain and loss
    for (let i = 0; i < period; i++) {
      if (changes[i] >= 0) {
        gains += changes[i];
      } else {
        losses += Math.abs(changes[i]);
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate first RSI
    let rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
    let rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
    
    // Calculate rest of RSI values using smoothed method
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change >= 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      // Use smoothed averages for subsequent calculations
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss);
      rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
  } catch (error) {
    console.error("Error calculating RSI:", error);
    return [50]; // Return neutral value on error
  }
  
  return result;
}

/**
 * Calculate Moving Average Convergence Divergence (MACD)
 * @param data Array of price data points
 * @param fastPeriod Period for fast EMA (typically 12)
 * @param slowPeriod Period for slow EMA (typically 26)
 * @param signalPeriod Period for signal line (typically 9)
 */
export function calculateMACD(
  data: ChartData[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): { macd: number[], signal: number[], histogram: number[] } {
  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macdLine: number[] = [];
  
  // MACD line starts when both EMAs are available
  const startIndex = data.length - Math.min(fastEMA.length, slowEMA.length);
  
  for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
    const fastIndex = fastEMA.length - 1 - i;
    const slowIndex = slowEMA.length - 1 - i;
    
    macdLine.unshift(fastEMA[fastIndex] - slowEMA[slowIndex]);
  }
  
  // Calculate signal line (9-day EMA of MACD line)
  // Create dummy data for EMA calculation
  const dummyData: ChartData[] = macdLine.map(value => ({
    time: 0,
    open: value,
    high: value,
    low: value,
    close: value,
    volume: 0
  }));
  
  const signalLine = calculateEMA(dummyData, signalPeriod, 'close');
  
  // Calculate histogram (MACD - Signal)
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = macdLine.length - signalLine.length + i;
    if (macdIndex >= 0) {
      histogram.push(macdLine[macdIndex] - signalLine[i]);
    }
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

/**
 * Calculate Bollinger Bands
 * @param data Array of price data points
 * @param period Period for SMA (typically 20)
 * @param multiplier Standard deviation multiplier (typically 2)
 */
export function calculateBollingerBands(
  data: ChartData[], 
  period: number = 20, 
  multiplier: number = 2
): { middle: number[], upper: number[], lower: number[] } {
  const result = {
    middle: [] as number[],
    upper: [] as number[],
    lower: [] as number[]
  };
  
  if (data.length < period) {
    return result;
  }
  
  // Calculate the middle band (SMA)
  const middle = calculateSMA(data, period);
  
  // Calculate upper and lower bands
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      const deviation = data[i - j].close - middle[i - (period - 1)];
      sum += deviation * deviation;
    }
    const stdDev = Math.sqrt(sum / period);
    
    const upperBand = middle[i - (period - 1)] + (multiplier * stdDev);
    const lowerBand = middle[i - (period - 1)] - (multiplier * stdDev);
    
    result.middle.push(middle[i - (period - 1)]);
    result.upper.push(upperBand);
    result.lower.push(lowerBand);
  }
  
  return result;
}

/**
 * Calculate Average True Range (ATR)
 * @param data Array of price data points
 * @param period ATR period (typically 14)
 */
export function calculateATR(data: ChartData[], period: number = 14): number[] {
  const result: number[] = [];
  const trueRanges: number[] = [];
  
  if (data.length < 2) {
    return result;
  }
  
  // Calculate true range for each candle
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }
  
  // Calculate first ATR as simple average of true ranges
  if (trueRanges.length >= period) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += trueRanges[i];
    }
    let atr = sum / period;
    result.push(atr);
    
    // Calculate remaining ATRs using smoothed method
    for (let i = period; i < trueRanges.length; i++) {
      atr = ((atr * (period - 1)) + trueRanges[i]) / period;
      result.push(atr);
    }
  }
  
  return result;
}

/**
 * Calculate Stochastic Oscillator
 * @param data Array of price data points
 * @param kPeriod %K period (typically 14)
 * @param dPeriod %D period (typically 3)
 */
export function calculateStochastic(
  data: ChartData[], 
  kPeriod: number = 14, 
  dPeriod: number = 3
): { k: number[], d: number[] } {
  const result = {
    k: [] as number[],
    d: [] as number[]
  };
  
  if (data.length < kPeriod) {
    return result;
  }
  
  // Calculate %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    
    // Find highest high and lowest low in the period
    for (let j = 0; j < kPeriod; j++) {
      const high = data[i - j].high;
      const low = data[i - j].low;
      
      highestHigh = Math.max(highestHigh, high);
      lowestLow = Math.min(lowestLow, low);
    }
    
    // Calculate %K
    const k = ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
    result.k.push(k);
  }
  
  // Calculate %D (simple moving average of %K)
  if (result.k.length >= dPeriod) {
    for (let i = dPeriod - 1; i < result.k.length; i++) {
      let sum = 0;
      for (let j = 0; j < dPeriod; j++) {
        sum += result.k[i - j];
      }
      result.d.push(sum / dPeriod);
    }
  }
  
  return result;
}

/**
 * Determine trend strength using ADX (Average Directional Index)
 * @param data Array of price data points
 * @param period ADX period (typically 14)
 */
export function calculateADX(data: ChartData[], period: number = 14): { adx: number[], pdi: number[], ndi: number[] } {
  const result = {
    adx: [] as number[],
    pdi: [] as number[],
    ndi: [] as number[]
  };
  
  if (data.length < period + 1) {
    return result;
  }
  
  // Calculate +DM, -DM, and TR for each period
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;
    
    // Calculate +DM and -DM
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    let plusDMValue = 0;
    let minusDMValue = 0;
    
    if (upMove > downMove && upMove > 0) {
      plusDMValue = upMove;
    }
    
    if (downMove > upMove && downMove > 0) {
      minusDMValue = downMove;
    }
    
    plusDM.push(plusDMValue);
    minusDM.push(minusDMValue);
    
    // Calculate True Range
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }
  
  // Calculate first +DI14, -DI14 and TR14
  let sumPlusDM = 0;
  let sumMinusDM = 0;
  let sumTR = 0;
  
  for (let i = 0; i < period; i++) {
    sumPlusDM += plusDM[i];
    sumMinusDM += minusDM[i];
    sumTR += trueRanges[i];
  }
  
  let plusDI = (sumPlusDM / sumTR) * 100;
  let minusDI = (sumMinusDM / sumTR) * 100;
  
  result.pdi.push(plusDI);
  result.ndi.push(minusDI);
  
  // Calculate first DX
  let dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
  
  // Calculate smoothed values for subsequent periods
  for (let i = period; i < trueRanges.length; i++) {
    sumPlusDM = sumPlusDM - (sumPlusDM / period) + plusDM[i];
    sumMinusDM = sumMinusDM - (sumMinusDM / period) + minusDM[i];
    sumTR = sumTR - (sumTR / period) + trueRanges[i];
    
    plusDI = (sumPlusDM / sumTR) * 100;
    minusDI = (sumMinusDM / sumTR) * 100;
    
    result.pdi.push(plusDI);
    result.ndi.push(minusDI);
    
    // Calculate DX
    dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI + 0.000001)) * 100;
    
    // First ADX is just the first DX
    if (i === period) {
      result.adx.push(dx);
    } else {
      // Calculate ADX using previous ADX
      const adx = ((result.adx[result.adx.length - 1] * (period - 1)) + dx) / period;
      result.adx.push(adx);
    }
  }
  
  return result;
}

/**
 * Calculate support and resistance levels
 * @param data Array of price data points
 * @param sensitivity Number of periods to consider for pivot points
 */
export function calculateSupportResistance(data: ChartData[], sensitivity: number = 5): { supports: number[], resistances: number[] } {
  const result = {
    supports: [] as number[],
    resistances: [] as number[]
  };
  
  if (data.length < sensitivity * 2 + 1) {
    return result;
  }
  
  // Find pivot points (local highs and lows)
  for (let i = sensitivity; i < data.length - sensitivity; i++) {
    let isLow = true;
    let isHigh = true;
    
    for (let j = i - sensitivity; j < i; j++) {
      if (data[j].low <= data[i].low) isLow = false;
      if (data[j].high >= data[i].high) isHigh = false;
    }
    
    for (let j = i + 1; j <= i + sensitivity; j++) {
      if (data[j].low <= data[i].low) isLow = false;
      if (data[j].high >= data[i].high) isHigh = false;
    }
    
    if (isLow) {
      result.supports.push(data[i].low);
    }
    
    if (isHigh) {
      result.resistances.push(data[i].high);
    }
  }
  
  // Simplify support and resistance levels by grouping nearby levels
  result.supports = clusterLevels(result.supports, 0.5);
  result.resistances = clusterLevels(result.resistances, 0.5);
  
  return result;
}

/**
 * Group nearby levels together to reduce noise
 * @param levels Array of price levels
 * @param tolerance Percentage tolerance for grouping (e.g. 0.5 = 0.5%)
 */
function clusterLevels(levels: number[], tolerance: number): number[] {
  if (levels.length <= 1) {
    return levels;
  }
  
  // Sort levels
  levels.sort((a, b) => a - b);
  
  const clustered: number[] = [];
  let currentCluster: number[] = [levels[0]];
  
  for (let i = 1; i < levels.length; i++) {
    const currentLevel = levels[i];
    const lastClusterLevel = currentCluster[currentCluster.length - 1];
    
    // If this level is close to the last one, add to current cluster
    if ((currentLevel - lastClusterLevel) / lastClusterLevel * 100 <= tolerance) {
      currentCluster.push(currentLevel);
    } else {
      // Otherwise, finalize the current cluster and start a new one
      clustered.push(currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length);
      currentCluster = [currentLevel];
    }
  }
  
  // Add the last cluster
  if (currentCluster.length > 0) {
    clustered.push(currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length);
  }
  
  return clustered;
}

/**
 * Calculate the Ichimoku Cloud indicator
 * @param data Array of price data points
 * @param conversionPeriod Tenkan-sen period (typically 9)
 * @param basePeriod Kijun-sen period (typically 26)
 * @param spanPeriod Senkou Span B period (typically 52)
 * @param displacement Displacement period (typically 26)
 */
export function calculateIchimoku(
  data: ChartData[],
  conversionPeriod: number = 9,
  basePeriod: number = 26,
  spanPeriod: number = 52,
  displacement: number = 26
): { 
  conversionLine: number[], 
  baseLine: number[], 
  leadingSpanA: number[], 
  leadingSpanB: number[], 
  laggingSpan: number[] 
} {
  const result = {
    conversionLine: [] as number[],
    baseLine: [] as number[],
    leadingSpanA: [] as number[],
    leadingSpanB: [] as number[],
    laggingSpan: [] as number[]
  };
  
  if (data.length < Math.max(conversionPeriod, basePeriod, spanPeriod)) {
    return result;
  }
  
  // Calculate the Tenkan-sen (Conversion Line)
  for (let i = conversionPeriod - 1; i < data.length; i++) {
    let high = -Infinity;
    let low = Infinity;
    
    for (let j = 0; j < conversionPeriod; j++) {
      high = Math.max(high, data[i - j].high);
      low = Math.min(low, data[i - j].low);
    }
    
    result.conversionLine.push((high + low) / 2);
  }
  
  // Calculate the Kijun-sen (Base Line)
  for (let i = basePeriod - 1; i < data.length; i++) {
    let high = -Infinity;
    let low = Infinity;
    
    for (let j = 0; j < basePeriod; j++) {
      high = Math.max(high, data[i - j].high);
      low = Math.min(low, data[i - j].low);
    }
    
    result.baseLine.push((high + low) / 2);
  }
  
  // Calculate the Senkou Span A (Leading Span A)
  const minLength = Math.min(result.conversionLine.length, result.baseLine.length);
  for (let i = 0; i < minLength; i++) {
    const conversionIndex = result.conversionLine.length - minLength + i;
    const baseIndex = result.baseLine.length - minLength + i;
    
    result.leadingSpanA.push((result.conversionLine[conversionIndex] + result.baseLine[baseIndex]) / 2);
  }
  
  // Calculate the Senkou Span B (Leading Span B)
  for (let i = spanPeriod - 1; i < data.length; i++) {
    let high = -Infinity;
    let low = Infinity;
    
    for (let j = 0; j < spanPeriod; j++) {
      high = Math.max(high, data[i - j].high);
      low = Math.min(low, data[i - j].low);
    }
    
    result.leadingSpanB.push((high + low) / 2);
  }
  
  // Calculate the Chikou Span (Lagging Span)
  for (let i = 0; i < data.length - displacement; i++) {
    result.laggingSpan.push(data[i].close);
  }
  
  return result;
}

/**
 * Calculate Momentum indicators for a specific timeframe
 * @param data Price data for the timeframe
 */
export function calculateIndicatorsForTimeframe(data: ChartData[]): {
  rsi: number,
  macd: { value: number, signal: number, histogram: number },
  ema: { short: number, medium: number, long: number },
  stochastic: { k: number, d: number },
  adx: { value: number, pdi: number, ndi: number },
  bb: { middle: number, upper: number, lower: number, width: number, percentB: number },
  supports: number[],
  resistances: number[],
  atr: number,
  volatility: number
} {
  if (!data || data.length < 100) {
    throw new Error("Insufficient data for indicator calculation");
  }
  
  // Calculate RSI
  const rsiValues = calculateRSI(data, 14);
  const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
  
  // Calculate MACD
  const macdResult = calculateMACD(data);
  const macd = {
    value: macdResult.macd.length > 0 ? macdResult.macd[macdResult.macd.length - 1] : 0,
    signal: macdResult.signal.length > 0 ? macdResult.signal[macdResult.signal.length - 1] : 0,
    histogram: macdResult.histogram.length > 0 ? macdResult.histogram[macdResult.histogram.length - 1] : 0
  };
  
  // Calculate EMAs
  const ema9 = calculateEMA(data, 9);
  const ema21 = calculateEMA(data, 21);
  const ema200 = calculateEMA(data, 200);
  
  const ema = {
    short: ema9.length > 0 ? ema9[ema9.length - 1] : data[data.length - 1].close,
    medium: ema21.length > 0 ? ema21[ema21.length - 1] : data[data.length - 1].close,
    long: ema200.length > 0 ? ema200[ema200.length - 1] : data[data.length - 1].close
  };
  
  // Calculate Stochastic Oscillator
  const stochasticResult = calculateStochastic(data);
  const stochastic = {
    k: stochasticResult.k.length > 0 ? stochasticResult.k[stochasticResult.k.length - 1] : 50,
    d: stochasticResult.d.length > 0 ? stochasticResult.d[stochasticResult.d.length - 1] : 50
  };
  
  // Calculate ADX
  const adxResult = calculateADX(data);
  const adx = {
    value: adxResult.adx.length > 0 ? adxResult.adx[adxResult.adx.length - 1] : 25,
    pdi: adxResult.pdi.length > 0 ? adxResult.pdi[adxResult.pdi.length - 1] : 25,
    ndi: adxResult.ndi.length > 0 ? adxResult.ndi[adxResult.ndi.length - 1] : 25
  };
  
  // Calculate Bollinger Bands
  const bbResult = calculateBollingerBands(data);
  const currentPrice = data[data.length - 1].close;
  let bbMiddle = currentPrice;
  let bbUpper = currentPrice * 1.02;
  let bbLower = currentPrice * 0.98;
  
  if (bbResult.middle.length > 0) {
    const lastIndex = bbResult.middle.length - 1;
    bbMiddle = bbResult.middle[lastIndex];
    bbUpper = bbResult.upper[lastIndex];
    bbLower = bbResult.lower[lastIndex];
  }
  
  const bbWidth = (bbUpper - bbLower) / bbMiddle;
  const percentB = Math.max(0, Math.min(1, (currentPrice - bbLower) / (bbUpper - bbLower)));
  
  const bb = {
    middle: bbMiddle,
    upper: bbUpper,
    lower: bbLower,
    width: bbWidth,
    percentB: percentB * 100
  };
  
  // Calculate Support and Resistance
  const srLevels = calculateSupportResistance(data);
  
  // Calculate ATR
  const atrValues = calculateATR(data);
  const atr = atrValues.length > 0 ? atrValues[atrValues.length - 1] : 0;
  
  // Calculate historical volatility (standard deviation of returns)
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close / data[i - 1].close) - 1);
  }
  
  const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * 100; // As a percentage
  
  return {
    rsi,
    macd,
    ema,
    stochastic,
    adx,
    bb,
    supports: srLevels.supports,
    resistances: srLevels.resistances,
    atr,
    volatility
  };
}

/**
 * Determine market environment based on indicators
 * @param indicators Calculated technical indicators
 */
export function determineMarketEnvironment(indicators: any): {
  trend: 'STRONG_UPTREND' | 'UPTREND' | 'NEUTRAL' | 'DOWNTREND' | 'STRONG_DOWNTREND',
  volatility: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW',
  momentum: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH'
} {
  // Determine trend based on EMAs and ADX
  let trend: 'STRONG_UPTREND' | 'UPTREND' | 'NEUTRAL' | 'DOWNTREND' | 'STRONG_DOWNTREND' = 'NEUTRAL';
  
  const priceAboveEMA200 = indicators.ema.short > indicators.ema.long;
  const ema9Above21 = indicators.ema.short > indicators.ema.medium;
  const strongTrend = indicators.adx.value > 25;
  const veryStrongTrend = indicators.adx.value > 40;
  
  if (priceAboveEMA200 && ema9Above21) {
    trend = veryStrongTrend ? 'STRONG_UPTREND' : (strongTrend ? 'UPTREND' : 'NEUTRAL');
  } else if (!priceAboveEMA200 && !ema9Above21) {
    trend = veryStrongTrend ? 'STRONG_DOWNTREND' : (strongTrend ? 'DOWNTREND' : 'NEUTRAL');
  }
  
  // Determine volatility level based on BB width and ATR
  let volatility: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW' = 'MODERATE';
  
  if (indicators.bb.width > 0.06 || indicators.volatility > 5) {
    volatility = indicators.bb.width > 0.08 || indicators.volatility > 7 ? 'VERY_HIGH' : 'HIGH';
  } else if (indicators.bb.width < 0.03 || indicators.volatility < 2) {
    volatility = indicators.bb.width < 0.02 || indicators.volatility < 1 ? 'VERY_LOW' : 'LOW';
  }
  
  // Determine momentum based on RSI and MACD
  let momentum: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH' = 'NEUTRAL';
  
  const strongBullRSI = indicators.rsi > 70;
  const bullRSI = indicators.rsi > 60;
  const bearRSI = indicators.rsi < 40;
  const strongBearRSI = indicators.rsi < 30;
  
  const macdPositive = indicators.macd.value > 0;
  const macdAboveSignal = indicators.macd.value > indicators.macd.signal;
  const macdHistogramPositive = indicators.macd.histogram > 0;
  
  if ((strongBullRSI || bullRSI) && macdPositive && macdAboveSignal) {
    momentum = strongBullRSI && macdHistogramPositive ? 'STRONG_BULLISH' : 'BULLISH';
  } else if ((strongBearRSI || bearRSI) && !macdPositive && !macdAboveSignal) {
    momentum = strongBearRSI && !macdHistogramPositive ? 'STRONG_BEARISH' : 'BEARISH';
  }
  
  return {
    trend,
    volatility,
    momentum
  };
}

/**
 * Generate a trading signal based on technical indicators
 * @param data Price data
 * @param timeframe The timeframe of the data
 */
export function generateSignal(data: ChartData[], timeframe: TimeFrame): {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  confidence: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  indicators: any,
  environment: any
} {
  try {
    // Make sure we have enough data
    if (!data || data.length < 50) { // Reduced minimum data points for better compatibility
      console.log(`Not enough data points for ${timeframe}, using simplified analysis`);
      
      // Generate basic signal
      const simplifiedSignal = generateSimplifiedSignal(data, timeframe);
      
      // Enhance with better support/resistance levels
      if (data && data.length > 0) {
        const currentPrice = data[data.length - 1].close;
        
        // More realistic percentages based on actual volatility in crypto markets
        simplifiedSignal.indicators.supports = [
          currentPrice * 0.99,  // Close support (1% below)
          currentPrice * 0.975, // Medium support (2.5% below)
          currentPrice * 0.95   // Strong support (5% below)
        ];
        
        simplifiedSignal.indicators.resistances = [
          currentPrice * 1.01,  // Close resistance (1% above)
          currentPrice * 1.025, // Medium resistance (2.5% above)
          currentPrice * 1.05   // Strong resistance (5% above)
        ];
      }
      
      return simplifiedSignal;
    }
    
    // Calculate technical indicators
    const indicators = calculateIndicatorsForTimeframe(data);
    
    // Determine market environment
    const environment = determineMarketEnvironment(indicators);
    
    // Generate signals based on indicator combination
    let bullishSignals = 0;
    let bearishSignals = 0;
    let neutralSignals = 0;
    let totalSignals = 0;
    
    // RSI signals
    totalSignals++;
    if (indicators.rsi > 70) bearishSignals++;
    else if (indicators.rsi < 30) bullishSignals++;
    else if (indicators.rsi > 60) bullishSignals += 0.5;
    else if (indicators.rsi < 40) bearishSignals += 0.5;
    else neutralSignals++;
    
    // MACD signals
    totalSignals++;
    if (indicators.macd.value > 0 && indicators.macd.histogram > 0) bullishSignals++;
    else if (indicators.macd.value < 0 && indicators.macd.histogram < 0) bearishSignals++;
    else neutralSignals++;
    
    // EMA signals
    totalSignals++;
    if (indicators.ema.short > indicators.ema.medium && indicators.ema.medium > indicators.ema.long) bullishSignals++;
    else if (indicators.ema.short < indicators.ema.medium && indicators.ema.medium < indicators.ema.long) bearishSignals++;
    else neutralSignals++;
    
    // Stochastic signals
    totalSignals++;
    if (indicators.stochastic.k < 20 && indicators.stochastic.k > indicators.stochastic.d) bullishSignals++;
    else if (indicators.stochastic.k > 80 && indicators.stochastic.k < indicators.stochastic.d) bearishSignals++;
    else neutralSignals++;
    
    // ADX signals
    totalSignals++;
    if (indicators.adx.value > 25) {
      if (indicators.adx.pdi > indicators.adx.ndi) bullishSignals++;
      else if (indicators.adx.ndi > indicators.adx.pdi) bearishSignals++;
    } else {
      neutralSignals++;
    }
    
    // Bollinger Bands signals
    totalSignals++;
    if (indicators.bb.percentB < 20) bullishSignals++;
    else if (indicators.bb.percentB > 80) bearishSignals++;
    else neutralSignals++;
    
    // Market Environment signals
    totalSignals += 2;
    if (environment.trend === 'STRONG_UPTREND' || environment.trend === 'UPTREND') bullishSignals += 2;
    else if (environment.trend === 'STRONG_DOWNTREND' || environment.trend === 'DOWNTREND') bearishSignals += 2;
    else neutralSignals += 2;
    
    // Add momentum signals
    totalSignals++;
    if (environment.momentum === 'STRONG_BULLISH' || environment.momentum === 'BULLISH') bullishSignals++;
    else if (environment.momentum === 'STRONG_BEARISH' || environment.momentum === 'BEARISH') bearishSignals++;
    else neutralSignals++;
    
    // Calculate signal confidence
    const bullishPercentage = (bullishSignals / totalSignals) * 100;
    const bearishPercentage = (bearishSignals / totalSignals) * 100;
    const neutralPercentage = (neutralSignals / totalSignals) * 100;
    
    // Determine final signal direction
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;
    
    if (bullishPercentage > bearishPercentage && bullishPercentage > neutralPercentage) {
      direction = 'LONG';
      confidence = bullishPercentage;
    } else if (bearishPercentage > bullishPercentage && bearishPercentage > neutralPercentage) {
      direction = 'SHORT';
      confidence = bearishPercentage;
    } else {
      direction = 'NEUTRAL';
      confidence = Math.max(50, 100 - (bullishPercentage + bearishPercentage));
    }
    
    // Modify confidence based on market environment
    if (environment.volatility === 'VERY_HIGH') {
      confidence = Math.max(0, confidence - 10);
    } else if (environment.volatility === 'VERY_LOW') {
      confidence = Math.min(100, confidence + 10);
    }
    
    // Price levels for the signal
    const currentPrice = data[data.length - 1].close;
    const atrMultiplier = direction === 'LONG' ? -1 : 1;
    const stopLoss = currentPrice + (atrMultiplier * indicators.atr * 1.5);
    const tpAtrMultiplier = direction === 'LONG' ? 2 : -2;
    const takeProfit = currentPrice + (tpAtrMultiplier * indicators.atr);
    
    return {
      direction,
      confidence: Math.round(confidence),
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      indicators,
      environment
    };
  } catch (error) {
    console.error(`Error generating signal for ${timeframe}:`, error);
    return generateSimplifiedSignal(data, timeframe);
  }
}

/**
 * Generate a simplified signal when full technical analysis isn't possible
 * This serves as a fallback when we don't have enough data
 */
function generateSimplifiedSignal(data: ChartData[], timeframe: TimeFrame): {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  confidence: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  indicators: any,
  environment: any
} {
  // Default to neutral with moderate confidence
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 50;
  
  try {
    if (data && data.length > 5) {
      const currentPrice = data[data.length - 1].close;
      const prices = data.map(candle => candle.close);
      
      // Simple price trend: compare current price with average of last 5 candles
      const avgPrice = prices.slice(-5).reduce((sum, price) => sum + price, 0) / 5;
      
      if (currentPrice > avgPrice * 1.01) {
        direction = 'LONG';
        confidence = 55;
      } else if (currentPrice < avgPrice * 0.99) {
        direction = 'SHORT';
        confidence = 55;
      }
      
      // Check recent momentum
      if (data.length > 3) {
        const priceChange = (currentPrice - data[data.length - 3].close) / data[data.length - 3].close;
        
        if (Math.abs(priceChange) > 0.03) { // More than 3% move
          if (priceChange > 0 && direction === 'LONG') {
            confidence += 10;
          } else if (priceChange < 0 && direction === 'SHORT') {
            confidence += 10;
          }
        }
      }
      
      const volatility = Math.min(10, Math.max(1, 
        data.slice(-10).reduce((sum, candle) => sum + (candle.high - candle.low) / candle.low, 0) * 100
      ));
      
      const stopDistance = direction === 'LONG' ? -volatility / 100 : volatility / 100;
      const tpDistance = direction === 'LONG' ? volatility * 2 / 100 : -volatility * 2 / 100;
      
      // Calculate more realistic support and resistance levels
      const resistanceLevels = [];
      const supportLevels = [];
      
      // Get recent significant price levels
      try {
        // Calculate significant swing highs and lows over the last 50 candles
        const lookbackPeriod = Math.min(50, data.length - 1);
        
        // Find local highs and lows
        for (let i = 5; i < lookbackPeriod - 5; i++) {
          // Check for local high (higher than 5 candles before and after)
          let isHigh = true;
          for (let j = i-5; j < i; j++) {
            if (data[j].high > data[i].high) {
              isHigh = false;
              break;
            }
          }
          for (let j = i+1; j <= i+5 && j < data.length; j++) {
            if (data[j].high > data[i].high) {
              isHigh = false;
              break;
            }
          }
          
          if (isHigh) {
            resistanceLevels.push(data[i].high);
          }
          
          // Check for local low
          let isLow = true;
          for (let j = i-5; j < i; j++) {
            if (data[j].low < data[i].low) {
              isLow = false;
              break;
            }
          }
          for (let j = i+1; j <= i+5 && j < data.length; j++) {
            if (data[j].low < data[i].low) {
              isLow = false;
              break;
            }
          }
          
          if (isLow) {
            supportLevels.push(data[i].low);
          }
        }
        
        // Add recent highs and lows if we need more levels
        if (resistanceLevels.length < 2) {
          // Get the highest high of the last 20 periods
          let highestHigh = -Infinity;
          for (let i = data.length - 20; i < data.length; i++) {
            if (i >= 0 && data[i].high > highestHigh) {
              highestHigh = data[i].high;
            }
          }
          resistanceLevels.push(highestHigh);
        }
        
        if (supportLevels.length < 2) {
          // Get the lowest low of the last 20 periods
          let lowestLow = Infinity;
          for (let i = data.length - 20; i < data.length; i++) {
            if (i >= 0 && data[i].low < lowestLow) {
              lowestLow = data[i].low;
            }
          }
          supportLevels.push(lowestLow);
        }
      } catch (err) {
        console.error("Error calculating support/resistance:", err);
      }
      
      // Ensure we have at least basic levels if calculation failed
      if (resistanceLevels.length === 0) {
        resistanceLevels.push(currentPrice * 1.02, currentPrice * 1.05);
      }
      
      if (supportLevels.length === 0) {
        supportLevels.push(currentPrice * 0.98, currentPrice * 0.95);
      }
      
      // Sort and remove duplicates
      const uniqueResistances = [...new Set(resistanceLevels)]
        .sort((a, b) => a - b)
        .filter(level => level > currentPrice); // Only keep resistances above current price
        
      const uniqueSupports = [...new Set(supportLevels)]
        .sort((a, b) => b - a)
        .filter(level => level < currentPrice); // Only keep supports below current price
      
      return {
        direction,
        confidence,
        entryPrice: currentPrice,
        stopLoss: currentPrice * (1 + stopDistance),
        takeProfit: currentPrice * (1 + tpDistance),
        indicators: {
          rsi: 50,
          macd: { value: 0, signal: 0, histogram: 0 },
          ema: { short: currentPrice, medium: currentPrice, long: currentPrice },
          stochastic: { k: 50, d: 50 },
          adx: { value: 20, pdi: 20, ndi: 20 },
          bb: { middle: currentPrice, upper: currentPrice * 1.02, lower: currentPrice * 0.98, width: 0.04, percentB: 50 },
          supports: uniqueSupports.length > 0 ? uniqueSupports : [currentPrice * 0.98, currentPrice * 0.95],
          resistances: uniqueResistances.length > 0 ? uniqueResistances : [currentPrice * 1.02, currentPrice * 1.05],
          atr: currentPrice * 0.01,
          volatility: volatility
        },
        environment: {
          trend: 'NEUTRAL',
          volatility: volatility > 5 ? 'HIGH' : (volatility < 2 ? 'LOW' : 'MODERATE'),
          momentum: direction === 'LONG' ? 'BULLISH' : (direction === 'SHORT' ? 'BEARISH' : 'NEUTRAL')
        }
      };
    }
  } catch (err) {
    console.error("Error in simplified signal generation:", err);
  }
  
  // If all else fails, create a truly default signal
  const currentPrice = data && data.length > 0 ? data[data.length - 1].close : 1000;
  
  return {
    direction: 'NEUTRAL',
    confidence: 50,
    entryPrice: currentPrice,
    stopLoss: currentPrice * 0.95,
    takeProfit: currentPrice * 1.05,
    indicators: {
      rsi: 50,
      macd: { value: 0, signal: 0, histogram: 0 },
      ema: { short: currentPrice, medium: currentPrice, long: currentPrice },
      stochastic: { k: 50, d: 50 },
      adx: { value: 20, pdi: 20, ndi: 20 },
      bb: { middle: currentPrice, upper: currentPrice * 1.02, lower: currentPrice * 0.98, width: 0.04, percentB: 50 },
      supports: [currentPrice * 0.95, currentPrice * 0.9],
      resistances: [currentPrice * 1.05, currentPrice * 1.1],
      atr: currentPrice * 0.01,
      volatility: 3
    },
    environment: {
      trend: 'NEUTRAL',
      volatility: 'MODERATE',
      momentum: 'NEUTRAL'
    }
  };
}

/**
 * Adjust signals based on a hierarchy of timeframes
 * Higher timeframes influence lower timeframes
 */
export function alignSignalsWithTimeframeHierarchy(
  signals: Record<TimeFrame, any>,
  timeframeWeights: Record<TimeFrame, number>
): Record<TimeFrame, any> {
  const sortedTimeframes: TimeFrame[] = Object.keys(timeframeWeights).sort(
    (a, b) => timeframeWeights[b as TimeFrame] - timeframeWeights[a as TimeFrame]
  ) as TimeFrame[];
  
  // Copy signals to avoid mutating the original
  const alignedSignals = { ...signals };
  
  // Start with the highest timeframe and influence lower timeframes
  for (let i = 0; i < sortedTimeframes.length - 1; i++) {
    const higherTf = sortedTimeframes[i];
    const higherSignal = alignedSignals[higherTf];
    
    if (!higherSignal) continue;
    
    // Influence lower timeframes
    for (let j = i + 1; j < sortedTimeframes.length; j++) {
      const lowerTf = sortedTimeframes[j];
      const lowerSignal = alignedSignals[lowerTf];
      
      if (!lowerSignal) continue;
      
      // Calculate influence factor based on timeframe difference
      const influenceFactor = 0.15 * (j - i);
      
      // If higher timeframe has a strong signal, influence the lower timeframe
      if (Math.abs(higherSignal.confidence - 50) > 20) {
        // If directions match, boost the confidence slightly
        if (higherSignal.direction === lowerSignal.direction) {
          alignedSignals[lowerTf] = {
            ...lowerSignal,
            confidence: Math.min(100, lowerSignal.confidence + influenceFactor * 10)
          };
        }
        // If directions conflict and higher timeframe is very confident, slightly reduce lower timeframe confidence
        else if (higherSignal.confidence > 70) {
          alignedSignals[lowerTf] = {
            ...lowerSignal,
            confidence: Math.max(0, lowerSignal.confidence - influenceFactor * 5)
          };
        }
      }
    }
  }
  
  return alignedSignals;
}