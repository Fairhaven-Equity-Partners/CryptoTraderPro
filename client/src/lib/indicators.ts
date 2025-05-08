import { ChartData, Indicator, IndicatorCategory, IndicatorSignal, SignalDirection, TimeframeSignal } from '../types';

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

// Generate indicators for signal analysis
export function analyzeIndicators(chartData: ChartData[]): Indicator[] {
  if (chartData.length < 50) {
    return []; // Not enough data
  }
  
  const closes = chartData.map(candle => candle.close);
  const volumes = chartData.map(candle => candle.volume);
  
  const indicators: Indicator[] = [];
  
  // RSI
  const rsi = calculateRSI(closes);
  indicators.push({
    name: 'RSI',
    category: 'MOMENTUM',
    signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL',
    value: Math.round(rsi)
  });
  
  // MACD
  const macd = calculateMACD(closes);
  const lastIndex = macd.histogram.length - 1;
  const prevIndex = lastIndex - 1;
  
  const macdSignal: IndicatorSignal = macd.histogram[lastIndex] > 0 ? 
    (macd.histogram[lastIndex] > macd.histogram[prevIndex] ? 'BUY' : 'NEUTRAL') : 
    (macd.histogram[lastIndex] < macd.histogram[prevIndex] ? 'SELL' : 'NEUTRAL');
  
  indicators.push({
    name: 'MACD',
    category: 'MOMENTUM',
    signal: macdSignal
  });
  
  // Moving Averages
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  
  let maCrossSignal: IndicatorSignal = 'NEUTRAL';
  if (sma50[sma50.length - 1] > sma200[sma200.length - 1]) {
    maCrossSignal = 'BUY';
  } else if (sma50[sma50.length - 1] < sma200[sma200.length - 1]) {
    maCrossSignal = 'SELL';
  }
  
  indicators.push({
    name: 'MA (50/200)',
    category: 'TREND',
    signal: maCrossSignal
  });
  
  // Bollinger Bands
  const bb = calculateBollingerBands(closes);
  const lastClose = closes[closes.length - 1];
  const lastUpper = bb.upper[bb.upper.length - 1];
  const lastLower = bb.lower[bb.lower.length - 1];
  
  let bbSignal: IndicatorSignal = 'NEUTRAL';
  if (lastClose > lastUpper) {
    bbSignal = 'SELL';
  } else if (lastClose < lastLower) {
    bbSignal = 'BUY';
  }
  
  indicators.push({
    name: 'Bollinger',
    category: 'VOLATILITY',
    signal: bbSignal
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
  
  // Add more indicators for a complete analysis
  // Stochastic
  const stoch = calculateStochastic(chartData);
  const lastK = stoch.k[stoch.k.length - 1];
  const lastD = stoch.d[stoch.d.length - 1];
  
  let stochSignal: IndicatorSignal = 'NEUTRAL';
  if (lastK > 80 && lastD > 80) {
    stochSignal = 'SELL';
  } else if (lastK < 20 && lastD < 20) {
    stochSignal = 'BUY';
  }
  
  indicators.push({
    name: 'Stochastic',
    category: 'MOMENTUM',
    signal: stochSignal
  });
  
  // Simple ADX for trend strength
  indicators.push({
    name: 'ADX',
    category: 'TREND',
    signal: 'NEUTRAL', // ADX doesn't give direction, just strength
    strength: Math.random() > 0.5 ? 'STRONG' : 'MODERATE' // Simulated value in this example
  });
  
  // ATR for volatility
  indicators.push({
    name: 'ATR',
    category: 'VOLATILITY',
    signal: 'NEUTRAL', // ATR doesn't give direction, just volatility
    strength: Math.random() > 0.7 ? 'HIGH' : 'MODERATE' // Simulated value
  });
  
  // Chaikin Oscillator (simplified)
  indicators.push({
    name: 'Chaikin',
    category: 'VOLATILITY',
    signal: Math.random() > 0.5 ? 'BUY' : 'NEUTRAL' // Simulated value
  });
  
  // On-Balance Volume (simplified)
  indicators.push({
    name: 'OBV',
    category: 'VOLUME',
    signal: Math.random() > 0.6 ? 'BUY' : 'NEUTRAL' // Simulated value
  });
  
  // Money Flow Index (simplified)
  indicators.push({
    name: 'MFI',
    category: 'VOLUME',
    signal: Math.random() > 0.5 ? 'BUY' : 'NEUTRAL' // Simulated value
  });
  
  // Ichimoku Cloud (simplified)
  indicators.push({
    name: 'Ichimoku',
    category: 'TREND',
    signal: Math.random() > 0.6 ? 'BUY' : 'NEUTRAL' // Simulated value
  });
  
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
    'VOLUME': []
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
export function generateTimeframeSignals(): TimeframeSignal[] {
  const timeframes: TimeFrame[] = ['1m', '15m', '1h', '4h', '1d', '1w'];
  
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
      case '1w':
        direction = 'LONG';
        strength = 85;
        trend = 'Bullish';
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
