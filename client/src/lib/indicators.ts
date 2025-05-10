import { ChartData, Indicator, IndicatorCategory, IndicatorSignal, IndicatorStrength, SignalDirection, TimeFrame, TimeframeSignal } from '../types';

// Cache for indicator calculations to improve performance
const calculationCache: Record<string, {
  timestamp: number;
  result: Indicator[];
}> = {};

// Cache expiration time in milliseconds (30 seconds)
const CACHE_EXPIRATION = 30 * 1000;

// Maximum cache entries to prevent memory leaks
const MAX_CACHE_ENTRIES = 80;

/**
 * Clean up old cache entries to prevent memory leaks
 */
function cleanupCache() {
  const cacheKeys = Object.keys(calculationCache);
  
  // If cache is getting too large, remove oldest entries
  if (cacheKeys.length > MAX_CACHE_ENTRIES) {
    // Sort by timestamp (oldest first)
    const sortedKeys = cacheKeys.sort((a, b) => 
      calculationCache[a].timestamp - calculationCache[b].timestamp
    );
    
    // Remove oldest entries to get down to 75% of max
    const removeCount = Math.floor(MAX_CACHE_ENTRIES * 0.25);
    for (let i = 0; i < removeCount; i++) {
      delete calculationCache[sortedKeys[i]];
    }
  }
}

// Helper functions for technical indicators
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) {
    return 50; // Not enough data, return neutral
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  // Calculate RSI using smoothed averages
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }
  
  if (avgLoss === 0) {
    return 100;
  }
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(0);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Calculate signal line
  const signalLine = calculateEMA(macdLine.slice(slowPeriod - 1), signalPeriod);
  
  // Fill signal line with zeros for alignment
  const fullSignalLine: number[] = new Array(slowPeriod - 1 + signalPeriod - 1).fill(0);
  fullSignalLine.push(...signalLine);
  
  // Calculate histogram
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (i < slowPeriod - 1 + signalPeriod - 1) {
      histogram.push(0);
    } else {
      histogram.push(macdLine[i] - fullSignalLine[i]);
    }
  }
  
  return {
    macd: macdLine,
    signal: fullSignalLine,
    histogram
  };
}

export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Initialize EMA with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
    ema.push(0); // Placeholder
  }
  
  ema[period - 1] = sum / period;
  
  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema.push(prices[i] * multiplier + ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
}

export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      middle.push(0);
      upper.push(0);
      lower.push(0);
      continue;
    }
    
    // Calculate SMA
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    const sma = sum / period;
    middle.push(sma);
    
    // Calculate standard deviation
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      variance += Math.pow(prices[j] - sma, 2);
    }
    const stdDev = Math.sqrt(variance / period);
    
    upper.push(sma + multiplier * stdDev);
    lower.push(sma - multiplier * stdDev);
  }
  
  return { upper, middle, lower };
}

export function calculateStochastic(chartData: ChartData[], period = 14, smoothK = 3, smoothD = 3): {
  k: number[];
  d: number[];
} {
  const highs: number[] = chartData.map(candle => candle.high);
  const lows: number[] = chartData.map(candle => candle.low);
  const closes: number[] = chartData.map(candle => candle.close);
  
  const rawK: number[] = [];
  
  // Calculate raw %K
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      rawK.push(0);
      continue;
    }
    
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    
    for (let j = i - period + 1; j <= i; j++) {
      highestHigh = Math.max(highestHigh, highs[j]);
      lowestLow = Math.min(lowestLow, lows[j]);
    }
    
    const range = highestHigh - lowestLow;
    if (range === 0) {
      rawK.push(100);
    } else {
      const k = 100 * ((closes[i] - lowestLow) / range);
      rawK.push(k);
    }
  }
  
  // Smooth %K and calculate %D
  const k = calculateSMA(rawK.slice(period - 1), smoothK);
  const d = calculateSMA(k, smoothD);
  
  // Align arrays
  const fullK = new Array(period - 1 + smoothK - 1).fill(0).concat(k);
  const fullD = new Array(period - 1 + smoothK - 1 + smoothD - 1).fill(0).concat(d);
  
  return { k: fullK, d: fullD };
}

export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(0);
      continue;
    }
    
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(sum / period);
  }
  
  return sma;
}

// Calculate Average Directional Index (ADX)
export function calculateADX(chartData: ChartData[], period = 14): {
  adx: number;
  pdi: number;
  mdi: number;
} {
  if (chartData.length < period * 3) {
    return { adx: 50, pdi: 50, mdi: 50 }; // Not enough data
  }
  
  const highs = chartData.map(candle => candle.high);
  const lows = chartData.map(candle => candle.low);
  const closes = chartData.map(candle => candle.close);
  
  // Calculate True Range (TR)
  const trueRanges: number[] = [];
  for (let i = 1; i < chartData.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(hl, hc, lc));
  }
  
  // Calculate +DM and -DM
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  
  for (let i = 1; i < chartData.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }
    
    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }
  
  // Calculate smoothed averages
  const smoothedTR = calculateSmoothAverage(trueRanges, period);
  const smoothedPlusDM = calculateSmoothAverage(plusDM, period);
  const smoothedMinusDM = calculateSmoothAverage(minusDM, period);
  
  // Calculate +DI and -DI
  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;
  
  // Calculate DX
  const dx = (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100;
  
  // Calculate ADX (typically a 14-period average of DX)
  // For simplicity, we're just returning the last DX value as ADX
  const adx = dx;
  
  return { adx, pdi: plusDI, mdi: minusDI };
}

// Helper function for ADX calculation
function calculateSmoothAverage(data: number[], period: number): number {
  let sum = 0;
  const startIdx = Math.max(0, data.length - period);
  const actualPeriod = Math.min(period, data.length);
  
  for (let i = startIdx; i < data.length; i++) {
    sum += data[i];
  }
  
  return sum / actualPeriod;
}

// Calculate Average True Range (ATR)
export function calculateATR(chartData: ChartData[], period = 14): number {
  if (chartData.length < period) {
    return 0; // Not enough data
  }
  
  const trueRanges: number[] = [];
  
  // Calculate True Range
  for (let i = 1; i < chartData.length; i++) {
    const high = chartData[i].high;
    const low = chartData[i].low;
    const prevClose = chartData[i - 1].close;
    
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate ATR
  let atr = 0;
  if (trueRanges.length >= period) {
    // First ATR is a simple average
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += trueRanges[i];
    }
    atr = sum / period;
    
    // Subsequent ATRs use smoothing
    for (let i = period; i < trueRanges.length; i++) {
      atr = ((period - 1) * atr + trueRanges[i]) / period;
    }
  }
  
  return atr;
}

// Calculate On-Balance Volume (OBV)
export function calculateOBV(chartData: ChartData[]): number {
  if (chartData.length < 2) {
    return 0;
  }
  
  let obv = 0;
  for (let i = 1; i < chartData.length; i++) {
    if (chartData[i].close > chartData[i - 1].close) {
      obv += chartData[i].volume;
    } else if (chartData[i].close < chartData[i - 1].close) {
      obv -= chartData[i].volume;
    }
  }
  
  return obv;
}

// Calculate Fibonacci Retracement Levels
export function calculateFibonacciLevels(high: number, low: number): {
  level0: number; // 0%
  level236: number; // 23.6%
  level382: number; // 38.2%
  level500: number; // 50.0%
  level618: number; // 61.8%
  level786: number; // 78.6%
  level1000: number; // 100%
} {
  const diff = high - low;
  
  return {
    level0: high,
    level236: high - 0.236 * diff,
    level382: high - 0.382 * diff,
    level500: high - 0.5 * diff,
    level618: high - 0.618 * diff,
    level786: high - 0.786 * diff,
    level1000: low
  };
}

// Calculate Money Flow Index (MFI)
export function calculateMFI(chartData: ChartData[], period = 14): number {
  if (chartData.length < period) {
    return 50; // Not enough data
  }
  
  const typicalPrices: number[] = [];
  const moneyFlow: number[] = [];
  
  // Calculate typical price and money flow
  for (const candle of chartData) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    typicalPrices.push(typicalPrice);
    moneyFlow.push(typicalPrice * candle.volume);
  }
  
  // Calculate positive and negative money flow
  let positiveMF = 0;
  let negativeMF = 0;
  
  for (let i = 1; i <= period; i++) {
    const index = typicalPrices.length - i;
    const prevIndex = index - 1;
    
    if (index > 0) {
      if (typicalPrices[index] > typicalPrices[prevIndex]) {
        positiveMF += moneyFlow[index];
      } else if (typicalPrices[index] < typicalPrices[prevIndex]) {
        negativeMF += moneyFlow[index];
      }
    }
  }
  
  // Calculate money flow ratio and index
  if (negativeMF === 0) {
    return 100;
  }
  
  const moneyFlowRatio = positiveMF / negativeMF;
  const mfi = 100 - (100 / (1 + moneyFlowRatio));
  
  return mfi;
}

// Generate indicators for signal analysis with performance caching
export function analyzeIndicators(chartData: ChartData[]): Indicator[] {
  if (chartData.length < 50) {
    return []; // Not enough data
  }
  
  // Create a cache key using the first and last timestamps and last price
  // This allows us to use cached results when chart data hasn't changed
  const firstTimestamp = chartData[0].time;
  const lastTimestamp = chartData[chartData.length - 1].time;
  const lastPrice = chartData[chartData.length - 1].close;
  const cacheKey = `${firstTimestamp}-${lastTimestamp}-${lastPrice}`;
  
  // Check if we have a valid cached result
  const now = Date.now();
  if (calculationCache[cacheKey] && 
      (now - calculationCache[cacheKey].timestamp < CACHE_EXPIRATION)) {
    return [...calculationCache[cacheKey].result]; // Return a copy of cached result
  }
  
  // Calculate fresh indicators
  const closes = chartData.map(candle => candle.close);
  const highs = chartData.map(candle => candle.high);
  const lows = chartData.map(candle => candle.low);
  const volumes = chartData.map(candle => candle.volume);
  const opens = chartData.map(candle => candle.open);
  
  const indicators: Indicator[] = [];
  
  // RSI
  const rsi = calculateRSI(closes);
  indicators.push({
    name: 'RSI',
    category: 'MOMENTUM',
    signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL',
    value: Math.round(rsi),
    strength: rsi > 80 || rsi < 20 ? 'STRONG' : rsi > 70 || rsi < 30 ? 'MODERATE' : 'WEAK'
  });
  
  // MACD
  const macd = calculateMACD(closes);
  const lastIndex = macd.histogram.length - 1;
  const prevIndex = lastIndex - 1;
  
  const macdSignal: IndicatorSignal = macd.histogram[lastIndex] > 0 ? 
    (macd.histogram[lastIndex] > macd.histogram[prevIndex] ? 'BUY' : 'NEUTRAL') : 
    (macd.histogram[lastIndex] < macd.histogram[prevIndex] ? 'SELL' : 'NEUTRAL');
  
  // Determine the strength of the MACD signal
  const macdStrength = Math.abs(macd.histogram[lastIndex]) > Math.abs(macd.histogram[prevIndex]) * 1.5 ? 
    'STRONG' : Math.abs(macd.histogram[lastIndex]) > Math.abs(macd.histogram[prevIndex]) * 1.2 ? 
    'MODERATE' : 'WEAK';
  
  indicators.push({
    name: 'MACD',
    category: 'MOMENTUM',
    signal: macdSignal,
    strength: macdStrength
  });
  
  // Moving Averages
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma100 = calculateSMA(closes, 100);
  const sma200 = calculateSMA(closes, 200);
  
  // Exponential Moving Averages
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema55 = calculateEMA(closes, 55);
  const ema200 = calculateEMA(closes, 200);
  
  // Golden Cross / Death Cross (MA50 vs MA200)
  let maCrossSignal: IndicatorSignal = 'NEUTRAL';
  if (sma50[sma50.length - 1] > sma200[sma200.length - 1]) {
    maCrossSignal = 'BUY';
  } else if (sma50[sma50.length - 1] < sma200[sma200.length - 1]) {
    maCrossSignal = 'SELL';
  }
  
  indicators.push({
    name: 'MA Cross',
    category: 'TREND',
    signal: maCrossSignal,
    strength: Math.abs(sma50[sma50.length - 1] - sma200[sma200.length - 1]) / sma200[sma200.length - 1] > 0.05 ? 
      'STRONG' : 'MODERATE',
    value: `50/200`
  });
  
  // EMA Cross (9 vs 21 EMA)
  let emaCrossSignal: IndicatorSignal = 'NEUTRAL';
  const lastEMA9 = ema9[ema9.length - 1];
  const lastEMA21 = ema21[ema21.length - 1];
  const prevEMA9 = ema9[ema9.length - 2];
  const prevEMA21 = ema21[ema21.length - 2];
  
  if (lastEMA9 > lastEMA21 && prevEMA9 <= prevEMA21) {
    emaCrossSignal = 'BUY'; // Fresh bullish cross
  } else if (lastEMA9 < lastEMA21 && prevEMA9 >= prevEMA21) {
    emaCrossSignal = 'SELL'; // Fresh bearish cross
  } else if (lastEMA9 > lastEMA21) {
    emaCrossSignal = 'BUY'; // Already in bullish trend
  } else if (lastEMA9 < lastEMA21) {
    emaCrossSignal = 'SELL'; // Already in bearish trend
  }
  
  indicators.push({
    name: 'EMA Cross',
    category: 'TREND',
    signal: emaCrossSignal,
    strength: Math.abs(lastEMA9 - lastEMA21) / lastEMA21 > 0.02 ? 'STRONG' : 'MODERATE',
    value: `9/21`
  });
  
  // Price relative to key moving averages
  const lastClose = closes[closes.length - 1];
  const priceVsMAs = [
    { ma: sma20[sma20.length - 1], period: 20 },
    { ma: sma50[sma50.length - 1], period: 50 },
    { ma: sma100[sma100.length - 1], period: 100 },
    { ma: sma200[sma200.length - 1], period: 200 }
  ];
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  priceVsMAs.forEach(({ ma }) => {
    if (lastClose > ma) bullishCount++;
    else bearishCount++;
  });
  
  indicators.push({
    name: 'Price vs MAs',
    category: 'TREND',
    signal: bullishCount > bearishCount ? 'BUY' : bearishCount > bullishCount ? 'SELL' : 'NEUTRAL',
    strength: Math.abs(bullishCount - bearishCount) > 2 ? 'STRONG' : 'MODERATE',
    value: `${bullishCount}/${priceVsMAs.length} bullish`
  });
  
  // Bollinger Bands
  const bb = calculateBollingerBands(closes);
  const lastBBUpper = bb.upper[bb.upper.length - 1];
  const lastBBLower = bb.lower[bb.lower.length - 1];
  const lastBBMiddle = bb.middle[bb.middle.length - 1];
  
  let bbSignal: IndicatorSignal = 'NEUTRAL';
  let bbStrength: IndicatorStrength = 'MODERATE';
  
  // Bollinger Band breakout
  if (lastClose > lastBBUpper) {
    bbSignal = 'SELL';
    bbStrength = (lastClose - lastBBUpper) / (lastBBUpper - lastBBMiddle) > 0.5 ? 'STRONG' : 'MODERATE';
  } else if (lastClose < lastBBLower) {
    bbSignal = 'BUY';
    bbStrength = (lastBBLower - lastClose) / (lastBBMiddle - lastBBLower) > 0.5 ? 'STRONG' : 'MODERATE';
  } else if (lastClose > lastBBMiddle) {
    bbSignal = 'NEUTRAL';
    bbStrength = 'WEAK';
  } else {
    bbSignal = 'NEUTRAL';
    bbStrength = 'WEAK';
  }
  
  indicators.push({
    name: 'Bollinger',
    category: 'VOLATILITY',
    signal: bbSignal,
    strength: bbStrength
  });
  
  // Volume trend
  const avgVolume = volumes.slice(-10).reduce((sum, vol) => sum + vol, 0) / 10;
  const lastVolume = volumes[volumes.length - 1];
  
  indicators.push({
    name: 'Volume',
    category: 'VOLUME',
    signal: lastVolume > avgVolume * 1.5 ? 'BUY' : lastVolume < avgVolume * 0.5 ? 'SELL' : 'NEUTRAL',
    strength: lastVolume > avgVolume * 2 ? 'HIGH' : lastVolume > avgVolume * 1.5 ? 'STRONG' : lastVolume < avgVolume * 0.5 ? 'WEAK' : 'MODERATE'
  });
  
  // Stochastic
  const stoch = calculateStochastic(chartData);
  const lastK = stoch.k[stoch.k.length - 1];
  const lastD = stoch.d[stoch.d.length - 1];
  
  let stochSignal: IndicatorSignal = 'NEUTRAL';
  let stochStrength: IndicatorStrength = 'MODERATE';
  
  if (lastK > 80 && lastD > 80) {
    stochSignal = 'SELL';
    stochStrength = lastK > 90 && lastD > 90 ? 'STRONG' : 'MODERATE';
  } else if (lastK < 20 && lastD < 20) {
    stochSignal = 'BUY';
    stochStrength = lastK < 10 && lastD < 10 ? 'STRONG' : 'MODERATE';
  } else if (lastK > lastD && lastK < 80) {
    stochSignal = 'BUY';
    stochStrength = 'WEAK';
  } else if (lastK < lastD && lastK > 20) {
    stochSignal = 'SELL';
    stochStrength = 'WEAK';
  }
  
  indicators.push({
    name: 'Stochastic',
    category: 'MOMENTUM',
    signal: stochSignal,
    strength: stochStrength,
    value: `K:${Math.round(lastK)} D:${Math.round(lastD)}`
  });
  
  // ADX for trend strength
  const adxResult = calculateADX(chartData);
  let adxSignal: IndicatorSignal = 'NEUTRAL';
  
  if (adxResult.adx > 25) {
    if (adxResult.pdi > adxResult.mdi) {
      adxSignal = 'BUY';
    } else if (adxResult.mdi > adxResult.pdi) {
      adxSignal = 'SELL';
    }
  }
  
  indicators.push({
    name: 'ADX',
    category: 'TREND',
    signal: adxSignal,
    strength: adxResult.adx > 40 ? 'STRONG' : adxResult.adx > 25 ? 'MODERATE' : 'WEAK',
    value: Math.round(adxResult.adx)
  });
  
  // ATR for volatility
  const atr = calculateATR(chartData);
  const atrPercentage = (atr / lastClose) * 100;
  
  indicators.push({
    name: 'ATR',
    category: 'VOLATILITY',
    signal: 'NEUTRAL', // ATR doesn't give direction, just volatility
    strength: atrPercentage > 5 ? 'HIGH' : atrPercentage > 3 ? 'STRONG' : atrPercentage > 1 ? 'MODERATE' : 'WEAK',
    value: `${atrPercentage.toFixed(1)}%`
  });
  
  // On-Balance Volume (OBV)
  const obv = calculateOBV(chartData);
  const obvSignal = obv > 0 ? 'BUY' : obv < 0 ? 'SELL' : 'NEUTRAL';
  
  indicators.push({
    name: 'OBV',
    category: 'VOLUME',
    signal: obvSignal,
    strength: Math.abs(obv) > 10000 ? 'STRONG' : 'MODERATE'
  });
  
  // Money Flow Index
  const mfi = calculateMFI(chartData);
  
  indicators.push({
    name: 'MFI',
    category: 'VOLUME',
    signal: mfi > 80 ? 'SELL' : mfi < 20 ? 'BUY' : 'NEUTRAL',
    strength: mfi > 90 || mfi < 10 ? 'STRONG' : mfi > 80 || mfi < 20 ? 'MODERATE' : 'WEAK',
    value: Math.round(mfi)
  });
  
  // Fibonacci Retracement (simplified)
  const recentHigh = Math.max(...highs.slice(-50));
  const recentLow = Math.min(...lows.slice(-50));
  const fibLevels = calculateFibonacciLevels(recentHigh, recentLow);
  
  // Check which level we're at
  let fibSignal: IndicatorSignal = 'NEUTRAL';
  if (lastClose <= fibLevels.level382 && lastClose >= fibLevels.level500) {
    fibSignal = 'BUY'; // 38.2% - 50% retracement is a good buy zone
  } else if (lastClose <= fibLevels.level618 && lastClose >= fibLevels.level786) {
    fibSignal = 'BUY'; // 61.8% - 78.6% retracement is a strong buy zone
  } else if (lastClose >= fibLevels.level236 && lastClose <= fibLevels.level0) {
    fibSignal = 'SELL'; // Price near the top
  }
  
  indicators.push({
    name: 'Fibonacci',
    category: 'TREND',
    signal: fibSignal,
    strength: lastClose <= fibLevels.level618 && lastClose >= fibLevels.level786 ? 'STRONG' : 'MODERATE'
  });
  
  // Previous trends continuation
  const shortTrend = closes[closes.length - 1] > closes[closes.length - 5] ? 'BUY' : 'SELL';
  const mediumTrend = closes[closes.length - 1] > closes[closes.length - 20] ? 'BUY' : 'SELL';
  const longTrend = closes[closes.length - 1] > closes[closes.length - 50] ? 'BUY' : 'SELL';
  
  let trendContinuationSignal: IndicatorSignal = 'NEUTRAL';
  let trendContinuationStrength: IndicatorStrength = 'MODERATE';
  
  if (shortTrend === mediumTrend && mediumTrend === longTrend) {
    trendContinuationSignal = shortTrend;
    trendContinuationStrength = 'STRONG';
  } else if (shortTrend === mediumTrend) {
    trendContinuationSignal = shortTrend;
    trendContinuationStrength = 'MODERATE';
  } else {
    trendContinuationSignal = shortTrend;
    trendContinuationStrength = 'WEAK';
  }
  
  indicators.push({
    name: 'Trend',
    category: 'TREND',
    signal: trendContinuationSignal,
    strength: trendContinuationStrength
  });
  
  // Rate of Change (Momentum)
  const roc = ((lastClose - closes[closes.length - 21]) / closes[closes.length - 21]) * 100;
  
  indicators.push({
    name: 'Momentum',
    category: 'MOMENTUM',
    signal: roc > 5 ? 'BUY' : roc < -5 ? 'SELL' : 'NEUTRAL',
    strength: Math.abs(roc) > 10 ? 'STRONG' : Math.abs(roc) > 5 ? 'MODERATE' : 'WEAK',
    value: `${roc.toFixed(1)}%`
  });
  
  // Candle Pattern Detection
  const lastFive = chartData.slice(-5);
  let patternSignal: IndicatorSignal = 'NEUTRAL';
  let patternStrength: IndicatorStrength = 'WEAK';
  let patternName = 'None';
  
  if (lastFive.length >= 2) {
    const current = lastFive[lastFive.length - 1];
    const previous = lastFive[lastFive.length - 2];
    
    // Bullish Engulfing
    if (current.close > current.open && // Current is bullish
        previous.close < previous.open && // Previous is bearish
        current.open < previous.close && // Opens below previous close
        current.close > previous.open) { // Closes above previous open
      patternSignal = 'BUY';
      patternStrength = 'STRONG';
      patternName = 'Bullish Engulfing';
    }
    // Bearish Engulfing
    else if (current.close < current.open && // Current is bearish
             previous.close > previous.open && // Previous is bullish
             current.open > previous.close && // Opens above previous close
             current.close < previous.open) { // Closes below previous open
      patternSignal = 'SELL';
      patternStrength = 'STRONG';
      patternName = 'Bearish Engulfing';
    }
    // Doji (indecision)
    else if (Math.abs(current.close - current.open) / (current.high - current.low) < 0.1) {
      patternSignal = 'NEUTRAL';
      patternStrength = 'MODERATE';
      patternName = 'Doji';
    }
    // Hammer (bullish reversal)
    else if (current.low < Math.min(current.open, current.close) && 
             (current.high - Math.max(current.open, current.close)) < 
             (Math.min(current.open, current.close) - current.low) * 0.5 &&
             (Math.max(current.open, current.close) - Math.min(current.open, current.close)) < 
             (Math.min(current.open, current.close) - current.low) * 0.3) {
      patternSignal = 'BUY';
      patternStrength = 'MODERATE';
      patternName = 'Hammer';
    }
    // Shooting Star (bearish reversal)
    else if (current.high > Math.max(current.open, current.close) && 
             (Math.min(current.open, current.close) - current.low) < 
             (current.high - Math.max(current.open, current.close)) * 0.5 &&
             (Math.max(current.open, current.close) - Math.min(current.open, current.close)) < 
             (current.high - Math.max(current.open, current.close)) * 0.3) {
      patternSignal = 'SELL';
      patternStrength = 'MODERATE';
      patternName = 'Shooting Star';
    }
    // Morning Star (bullish reversal) - simplified version
    else if (lastFive.length >= 3 && 
             lastFive[lastFive.length - 3].close < lastFive[lastFive.length - 3].open && // First candle is bearish
             Math.abs(lastFive[lastFive.length - 2].close - lastFive[lastFive.length - 2].open) < Math.abs(lastFive[lastFive.length - 3].close - lastFive[lastFive.length - 3].open) * 0.5 && // Middle candle is small
             lastFive[lastFive.length - 1].close > lastFive[lastFive.length - 1].open && // Last candle is bullish
             lastFive[lastFive.length - 1].close > (lastFive[lastFive.length - 3].open + lastFive[lastFive.length - 3].close) / 2) { // Last candle closes above midpoint of first candle
      patternSignal = 'BUY';
      patternStrength = 'STRONG';
      patternName = 'Morning Star';
    }
    // Evening Star (bearish reversal) - simplified version
    else if (lastFive.length >= 3 && 
             lastFive[lastFive.length - 3].close > lastFive[lastFive.length - 3].open && // First candle is bullish
             Math.abs(lastFive[lastFive.length - 2].close - lastFive[lastFive.length - 2].open) < Math.abs(lastFive[lastFive.length - 3].close - lastFive[lastFive.length - 3].open) * 0.5 && // Middle candle is small
             lastFive[lastFive.length - 1].close < lastFive[lastFive.length - 1].open && // Last candle is bearish
             lastFive[lastFive.length - 1].close < (lastFive[lastFive.length - 3].open + lastFive[lastFive.length - 3].close) / 2) { // Last candle closes below midpoint of first candle
      patternSignal = 'SELL';
      patternStrength = 'STRONG';
      patternName = 'Evening Star';
    }
  }
  
  indicators.push({
    name: 'Candle Pattern',
    category: 'PATTERN',
    signal: patternSignal,
    strength: patternStrength,
    value: patternName
  });
  
  // Ichimoku Cloud (simplified)
  const tenkanSen = (Math.max(...highs.slice(-9)) + Math.min(...lows.slice(-9))) / 2;
  const kijunSen = (Math.max(...highs.slice(-26)) + Math.min(...lows.slice(-26))) / 2;
  
  let ichimokuSignal: IndicatorSignal = 'NEUTRAL';
  
  if (lastClose > tenkanSen && tenkanSen > kijunSen) {
    ichimokuSignal = 'BUY';
  } else if (lastClose < tenkanSen && tenkanSen < kijunSen) {
    ichimokuSignal = 'SELL';
  }
  
  indicators.push({
    name: 'Ichimoku',
    category: 'TREND',
    signal: ichimokuSignal,
    strength: Math.abs(tenkanSen - kijunSen) / kijunSen > 0.02 ? 'STRONG' : 'MODERATE'
  });
  
  // Cache the calculation result before returning
  calculationCache[cacheKey] = {
    timestamp: Date.now(),
    result: [...indicators] // Store a copy to prevent mutation issues
  };
  
  // Cleanup the cache periodically to prevent memory leaks
  cleanupCache();
  
  return indicators;
}

// Generate signal summary from indicators
export function generateSignalSummary(indicators: Indicator[]): {
  direction: SignalDirection,
  strength: number,
  categorizedIndicators: Record<IndicatorCategory, Indicator[]>
} {
  const categorizedIndicators: Record<IndicatorCategory, Indicator[]> = {
    'MOMENTUM': [],
    'TREND': [],
    'VOLATILITY': [],
    'VOLUME': [],
    'PATTERN': []
  };
  
  let buyCount = 0;
  let sellCount = 0;
  let totalCount = 0;
  
  indicators.forEach(indicator => {
    categorizedIndicators[indicator.category].push(indicator);
    
    if (indicator.signal === 'BUY') {
      buyCount++;
    } else if (indicator.signal === 'SELL') {
      sellCount++;
    }
    
    totalCount++;
  });
  
  // Calculate signal direction and strength
  const buyPercentage = (buyCount / totalCount) * 100;
  const sellPercentage = (sellCount / totalCount) * 100;
  
  let direction: SignalDirection = 'NEUTRAL';
  let strength = 50;
  
  if (buyPercentage > sellPercentage + 10) {
    direction = 'LONG';
    strength = Math.min(Math.round(buyPercentage + (buyPercentage - sellPercentage) / 2), 100);
  } else if (sellPercentage > buyPercentage + 10) {
    direction = 'SHORT';
    strength = Math.min(Math.round(sellPercentage + (sellPercentage - buyPercentage) / 2), 100);
  } else {
    strength = Math.round(50 + (buyPercentage - sellPercentage));
  }
  
  // Ensure strength is within bounds
  strength = Math.max(0, Math.min(100, strength));
  
  return {
    direction,
    strength,
    categorizedIndicators
  };
}

// Generate timeframe signals
// Helper function for calculating the Hull Moving Average (HMA)
export function calculateHMA(data: number[], period: number): number[] {
  // Calculate weighted moving average with period/2
  const halfPeriod = Math.floor(period / 2);
  const wma1 = calculateWMA(data, halfPeriod);
  
  // Calculate weighted moving average with period
  const wma2 = calculateWMA(data, period);
  
  // Calculate 2*WMA(n/2) - WMA(n)
  const diff: number[] = [];
  for (let i = 0; i < wma1.length; i++) {
    if (i < wma2.length) {
      diff.push(2 * wma1[i] - wma2[i]);
    } else {
      diff.push(2 * wma1[i] - wma2[wma2.length - 1]); // Use last value if arrays are different lengths
    }
  }
  
  // Calculate WMA with sqrt(n) period
  const sqrtPeriod = Math.floor(Math.sqrt(period));
  return calculateWMA(diff, sqrtPeriod);
}

// Helper function for calculating Weighted Moving Average (WMA)
export function calculateWMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const denominator = (period * (period + 1)) / 2;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]); // Use the value instead of 0 to keep the array length consistent
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      // Weight increases linearly with index
      sum += data[i - (period - 1) + j] * (j + 1);
    }
    
    result.push(sum / denominator);
  }
  
  return result;
}

export function generateTimeframeSignals(): TimeframeSignal[] {
  const timeframes: TimeFrame[] = ['1m', '15m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  return timeframes.map(timeframe => {
    let direction: SignalDirection;
    let strength: number;
    let trend: string;
    
    // Simulate different signals for different timeframes
    switch (timeframe) {
      case '1m':
        direction = 'SHORT';
        strength = 65;
        trend = 'Bearish';
        break;
      case '15m':
        direction = 'NEUTRAL';
        strength = 50;
        trend = 'Sideways';
        break;
      case '1h':
        direction = 'LONG';
        strength = 60;
        trend = 'Bullish';
        break;
      case '4h':
        direction = 'LONG';
        strength = 75;
        trend = 'Bullish';
        break;
      case '1d':
        direction = 'LONG';
        strength = 80;
        trend = 'Bullish';
        break;
      case '3d':
        direction = 'LONG';
        strength = 82;
        trend = 'Bullish';
        break;
      case '1w':
        direction = 'LONG';
        strength = 85;
        trend = 'Bullish';
        break;
      case '1M':
        direction = 'LONG';
        strength = 90;
        trend = 'Strong Bullish';
        break;
      default:
        direction = 'NEUTRAL';
        strength = 50;
        trend = 'Sideways';
    }
    
    return {
      timeframe,
      signal: direction,
      strength,
      trend
    };
  });
}
