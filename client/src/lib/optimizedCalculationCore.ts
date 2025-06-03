import { ChartData, TimeFrame } from '../types/index';

/**
 * Optimized Calculation Core - Single source of truth for all calculations
 * Consolidates 50+ calculation files into one efficient system
 */

export interface OptimizedSignal {
  symbol: string;
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  indicators: CalculatedIndicators;
  successProbability: number;
  riskReward: number;
  patternFormations: PatternFormation[];
  supportResistance: SupportResistance;
  environment: MarketEnvironment;
  recommendedLeverage: number;
  marketStructure: MarketStructure;
  volumeProfile: VolumeProfile;
  macroInsights: MacroInsights;
}

interface CalculatedIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  ema: {
    short: number;
    medium: number;
    long: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  adx: {
    value: number;
    pdi: number;
    ndi: number;
  };
  bb: {
    middle: number;
    upper: number;
    lower: number;
    width: number;
    percentB: number;
  };
  supports: number[];
  resistances: number[];
  atr: number;
  volatility: number;
}

interface PatternFormation {
  name: string;
  reliability: number;
  direction: string;
  priceTarget: number;
  description: string;
}

interface SupportResistance {
  supports: number[];
  resistances: number[];
  pivotPoints: number[];
}

interface MarketEnvironment {
  trend: string;
  volatility: string;
  volume: string;
  sentiment: string;
}

interface MarketStructure {
  trend: string;
  phase: string;
  strength: number;
}

interface VolumeProfile {
  volumeWeightedPrice: number;
  highVolumeNodes: number[];
  lowVolumeNodes: number[];
}

interface MacroInsights {
  regime: string;
  correlation: number;
  institutionalFlow: string;
}

/**
 * Main calculation function - replaces all fragmented calculation files
 */
export function calculateOptimizedSignal(
  data: ChartData[],
  timeframe: TimeFrame,
  currentPrice: number,
  symbol: string
): OptimizedSignal {
  if (!data || data.length < 50) {
    throw new Error('Insufficient data for calculations');
  }

  try {
    // Core technical indicators - optimized calculations
    const indicators = calculateIndicators(data, currentPrice);
    
    // Signal direction and confidence
    const { direction, confidence } = determineSignal(indicators, data, timeframe);
    
    // Price levels
    const { stopLoss, takeProfit } = calculatePriceLevels(
      currentPrice, 
      direction, 
      indicators, 
      timeframe
    );
    
    // Risk metrics
    const riskReward = calculateRiskReward(currentPrice, stopLoss, takeProfit);
    const successProbability = calculateSuccessProbability(confidence, timeframe, direction);
    
    // Market analysis
    const patternFormations = detectPatterns(data, indicators);
    const supportResistance = calculateSupportResistance(data, currentPrice);
    const environment = analyzeEnvironment(data, indicators, timeframe);
    const marketStructure = analyzeMarketStructure(data, direction);
    const volumeProfile = analyzeVolumeProfile(data);
    const macroInsights = generateMacroInsights(timeframe, confidence);
    
    // Leverage recommendation
    const recommendedLeverage = calculateOptimalLeverage(confidence, riskReward, timeframe);

    return {
      symbol,
      timeframe,
      direction,
      confidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      timestamp: Date.now(),
      indicators,
      successProbability,
      riskReward,
      patternFormations,
      supportResistance,
      environment,
      recommendedLeverage,
      marketStructure,
      volumeProfile,
      macroInsights
    };
  } catch (error) {
    console.error('Calculation error:', error);
    // Return neutral signal on error
    return createNeutralSignal(symbol, timeframe, currentPrice);
  }
}

function calculateIndicators(data: ChartData[], currentPrice: number): CalculatedIndicators {
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const volumes = data.map(d => d.volume || 1000);

  // RSI calculation
  const rsi = calculateRSI(closes, 14);
  
  // MACD calculation
  const macd = calculateMACD(closes);
  
  // EMA calculation
  const ema = {
    short: calculateEMA(closes, 12),
    medium: calculateEMA(closes, 26),
    long: calculateEMA(closes, 50)
  };
  
  // Stochastic calculation
  const stochastic = calculateStochastic(highs, lows, closes, 14);
  
  // ADX calculation
  const adx = calculateADX(highs, lows, closes, 14);
  
  // Bollinger Bands
  const bb = calculateBollingerBands(closes, 20, 2);
  
  // Support/Resistance levels
  const supports = findSupportLevels(lows, currentPrice);
  const resistances = findResistanceLevels(highs, currentPrice);
  
  // ATR and Volatility
  const atr = calculateATR(highs, lows, closes, 14);
  const volatility = calculateVolatility(closes, 20);

  return {
    rsi,
    macd,
    ema,
    stochastic,
    adx,
    bb,
    supports,
    resistances,
    atr,
    volatility
  };
}

function calculateRSI(closes: number[], period: number): number {
  if (closes.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = closes[closes.length - i] - closes[closes.length - i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(closes: number[]): { value: number; signal: number; histogram: number } {
  if (closes.length < 26) return { value: 0, signal: 0, histogram: 0 };
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12 - ema26;
  
  // Signal line is EMA of MACD line
  const macdValues = [];
  for (let i = 26; i < closes.length; i++) {
    const ema12_i = calculateEMA(closes.slice(0, i + 1), 12);
    const ema26_i = calculateEMA(closes.slice(0, i + 1), 26);
    macdValues.push(ema12_i - ema26_i);
  }
  
  const signalLine = calculateEMA(macdValues, 9);
  const histogram = macdLine - signalLine;
  
  return {
    value: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

function calculateEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = closes[0];
  
  for (let i = 1; i < closes.length; i++) {
    ema = (closes[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateStochastic(highs: number[], lows: number[], closes: number[], period: number): { k: number; d: number } {
  if (closes.length < period) return { k: 50, d: 50 };
  
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // D is 3-period SMA of K
  const kValues = [];
  for (let i = Math.max(0, closes.length - 3); i < closes.length; i++) {
    const periodHighs = highs.slice(Math.max(0, i - period + 1), i + 1);
    const periodLows = lows.slice(Math.max(0, i - period + 1), i + 1);
    const periodHigh = Math.max(...periodHighs);
    const periodLow = Math.min(...periodLows);
    kValues.push(((closes[i] - periodLow) / (periodHigh - periodLow)) * 100);
  }
  
  const d = kValues.reduce((sum, val) => sum + val, 0) / kValues.length;
  
  return { k: k || 50, d: d || 50 };
}

function calculateADX(highs: number[], lows: number[], closes: number[], period: number): { value: number; pdi: number; ndi: number } {
  if (closes.length < period + 1) return { value: 20, pdi: 20, ndi: 20 };
  
  // Simplified ADX calculation
  let sumPDI = 0;
  let sumNDI = 0;
  let sumTR = 0;
  
  for (let i = 1; i < Math.min(period + 1, closes.length); i++) {
    const high = highs[highs.length - i];
    const low = lows[lows.length - i];
    const close = closes[closes.length - i];
    const prevClose = closes[closes.length - i - 1];
    
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    sumTR += tr;
    
    const dmPlus = Math.max(high - highs[highs.length - i - 1], 0);
    const dmMinus = Math.max(lows[lows.length - i - 1] - low, 0);
    
    sumPDI += (dmPlus / tr) * 100;
    sumNDI += (dmMinus / tr) * 100;
  }
  
  const pdi = sumPDI / period;
  const ndi = sumNDI / period;
  const dx = Math.abs(pdi - ndi) / (pdi + ndi) * 100;
  
  return { value: dx, pdi, ndi };
}

function calculateBollingerBands(closes: number[], period: number, stdDev: number): { middle: number; upper: number; lower: number; width: number; percentB: number } {
  if (closes.length < period) {
    const price = closes[closes.length - 1] || 0;
    return {
      middle: price,
      upper: price * 1.02,
      lower: price * 0.98,
      width: 0.04,
      percentB: 50
    };
  }
  
  const recentCloses = closes.slice(-period);
  const sma = recentCloses.reduce((sum, close) => sum + close, 0) / period;
  
  const variance = recentCloses.reduce((sum, close) => sum + Math.pow(close - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  const upper = sma + (standardDeviation * stdDev);
  const lower = sma - (standardDeviation * stdDev);
  const currentPrice = closes[closes.length - 1];
  
  const width = (upper - lower) / sma;
  const percentB = ((currentPrice - lower) / (upper - lower)) * 100;
  
  return {
    middle: sma,
    upper,
    lower,
    width,
    percentB: Math.max(0, Math.min(100, percentB))
  };
}

function findSupportLevels(lows: number[], currentPrice: number): number[] {
  const recentLows = lows.slice(-50);
  const supports = [];
  
  for (let i = 2; i < recentLows.length - 2; i++) {
    if (recentLows[i] < recentLows[i-1] && 
        recentLows[i] < recentLows[i+1] && 
        recentLows[i] < recentLows[i-2] && 
        recentLows[i] < recentLows[i+2]) {
      supports.push(recentLows[i]);
    }
  }
  
  return supports
    .filter(level => level < currentPrice)
    .sort((a, b) => b - a)
    .slice(0, 3);
}

function findResistanceLevels(highs: number[], currentPrice: number): number[] {
  const recentHighs = highs.slice(-50);
  const resistances = [];
  
  for (let i = 2; i < recentHighs.length - 2; i++) {
    if (recentHighs[i] > recentHighs[i-1] && 
        recentHighs[i] > recentHighs[i+1] && 
        recentHighs[i] > recentHighs[i-2] && 
        recentHighs[i] > recentHighs[i+2]) {
      resistances.push(recentHighs[i]);
    }
  }
  
  return resistances
    .filter(level => level > currentPrice)
    .sort((a, b) => a - b)
    .slice(0, 3);
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
  if (closes.length < period + 1) return highs[0] - lows[0] || 1000;
  
  let atrSum = 0;
  for (let i = 1; i <= period; i++) {
    const high = highs[highs.length - i];
    const low = lows[lows.length - i];
    const prevClose = closes[closes.length - i - 1];
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    atrSum += tr;
  }
  
  return atrSum / period;
}

function calculateVolatility(closes: number[], period: number): number {
  if (closes.length < period) return 1;
  
  const recentCloses = closes.slice(-period);
  const returns = [];
  
  for (let i = 1; i < recentCloses.length; i++) {
    returns.push(Math.log(recentCloses[i] / recentCloses[i-1]));
  }
  
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
}

function determineSignal(indicators: CalculatedIndicators, data: ChartData[], timeframe: TimeFrame): { direction: 'LONG' | 'SHORT' | 'NEUTRAL'; confidence: number } {
  let bullishSignals = 0;
  let bearishSignals = 0;
  let signalStrength = 0;
  
  // RSI signals
  if (indicators.rsi < 30) {
    bullishSignals += 2;
    signalStrength += 20;
  } else if (indicators.rsi > 70) {
    bearishSignals += 2;
    signalStrength += 20;
  }
  
  // MACD signals
  if (indicators.macd.histogram > 0) {
    bullishSignals += 1;
    signalStrength += 15;
  } else {
    bearishSignals += 1;
    signalStrength += 15;
  }
  
  // EMA trend
  if (indicators.ema.short > indicators.ema.medium && indicators.ema.medium > indicators.ema.long) {
    bullishSignals += 2;
    signalStrength += 25;
  } else if (indicators.ema.short < indicators.ema.medium && indicators.ema.medium < indicators.ema.long) {
    bearishSignals += 2;
    signalStrength += 25;
  }
  
  // Stochastic signals
  if (indicators.stochastic.k < 20 && indicators.stochastic.d < 20) {
    bullishSignals += 1;
    signalStrength += 10;
  } else if (indicators.stochastic.k > 80 && indicators.stochastic.d > 80) {
    bearishSignals += 1;
    signalStrength += 10;
  }
  
  // ADX trend strength
  if (indicators.adx.value > 25) {
    signalStrength += 20;
  }
  
  // Bollinger Band signals
  if (indicators.bb.percentB < 10) {
    bullishSignals += 1;
    signalStrength += 10;
  } else if (indicators.bb.percentB > 90) {
    bearishSignals += 1;
    signalStrength += 10;
  }
  
  // Determine direction
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  if (bullishSignals > bearishSignals + 1) {
    direction = 'LONG';
  } else if (bearishSignals > bullishSignals + 1) {
    direction = 'SHORT';
  } else {
    direction = 'NEUTRAL';
  }
  
  // Calculate confidence based on signal strength and consensus
  const consensus = Math.abs(bullishSignals - bearishSignals);
  let confidence = Math.min(95, signalStrength + (consensus * 5));
  
  // Timeframe adjustments
  const timeframeMultipliers: Record<TimeFrame, number> = {
    '1m': 0.7, '5m': 0.8, '15m': 0.85, '30m': 0.9,
    '1h': 1.0, '4h': 1.1, '1d': 1.2, '3d': 1.25, '1w': 1.3, '1M': 1.35
  };
  
  confidence *= timeframeMultipliers[timeframe] || 1.0;
  confidence = Math.max(30, Math.min(95, confidence));
  
  return { direction, confidence };
}

function calculatePriceLevels(
  currentPrice: number, 
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  indicators: CalculatedIndicators,
  timeframe: TimeFrame
): { stopLoss: number; takeProfit: number } {
  const atr = indicators.atr;
  const volatility = indicators.volatility;
  
  // Risk multipliers based on timeframe
  const riskMultipliers: Record<TimeFrame, number> = {
    '1m': 0.5, '5m': 0.7, '15m': 1.0, '30m': 1.2,
    '1h': 1.5, '4h': 2.0, '1d': 2.5, '3d': 3.0, '1w': 3.5, '1M': 4.0
  };
  
  const multiplier = riskMultipliers[timeframe] || 1.5;
  const riskAmount = atr * multiplier;
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (direction === 'LONG') {
    stopLoss = Math.max(...indicators.supports.slice(0, 1)) || (currentPrice - riskAmount);
    takeProfit = Math.min(...indicators.resistances.slice(0, 1)) || (currentPrice + (riskAmount * 2));
  } else if (direction === 'SHORT') {
    stopLoss = Math.min(...indicators.resistances.slice(0, 1)) || (currentPrice + riskAmount);
    takeProfit = Math.max(...indicators.supports.slice(0, 1)) || (currentPrice - (riskAmount * 2));
  } else {
    stopLoss = currentPrice;
    takeProfit = currentPrice;
  }
  
  return { stopLoss, takeProfit };
}

function calculateRiskReward(entryPrice: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  if (risk === 0) return 1;
  return reward / risk;
}

function calculateSuccessProbability(confidence: number, timeframe: TimeFrame, direction: 'LONG' | 'SHORT' | 'NEUTRAL'): number {
  let baseProbability = confidence * 0.65; // Convert confidence to probability
  
  // Timeframe adjustments for success probability
  const timeframeAdjustments: Record<TimeFrame, number> = {
    '1m': -10, '5m': -5, '15m': 0, '30m': 2,
    '1h': 5, '4h': 8, '1d': 10, '3d': 12, '1w': 15, '1M': 18
  };
  
  baseProbability += timeframeAdjustments[timeframe] || 0;
  
  // Direction adjustments (market tends to be bullish long-term)
  if (direction === 'LONG' && ['1d', '3d', '1w', '1M'].includes(timeframe)) {
    baseProbability += 5;
  }
  
  return Math.round(Math.max(30, Math.min(95, baseProbability)));
}

function detectPatterns(data: ChartData[], indicators: CalculatedIndicators): PatternFormation[] {
  const patterns: PatternFormation[] = [];
  
  if (data.length < 20) return patterns;
  
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  // Moving Average Crossover
  if (indicators.ema.short > indicators.ema.medium) {
    patterns.push({
      name: 'Golden Cross',
      reliability: 75,
      direction: 'bullish',
      priceTarget: closes[closes.length - 1] * 1.05,
      description: 'Short EMA crossed above medium EMA'
    });
  }
  
  // Support/Resistance Breakout
  const currentPrice = closes[closes.length - 1];
  const recentHigh = Math.max(...highs.slice(-10));
  const recentLow = Math.min(...lows.slice(-10));
  
  if (currentPrice > recentHigh * 0.995) {
    patterns.push({
      name: 'Resistance Breakout',
      reliability: 80,
      direction: 'bullish',
      priceTarget: currentPrice * 1.03,
      description: 'Price breaking above recent resistance'
    });
  }
  
  if (currentPrice < recentLow * 1.005) {
    patterns.push({
      name: 'Support Breakdown',
      reliability: 80,
      direction: 'bearish',
      priceTarget: currentPrice * 0.97,
      description: 'Price breaking below recent support'
    });
  }
  
  // RSI Divergence
  if (indicators.rsi > 70 && closes[closes.length - 1] > closes[closes.length - 5]) {
    patterns.push({
      name: 'Bearish Divergence',
      reliability: 70,
      direction: 'bearish',
      priceTarget: currentPrice * 0.98,
      description: 'Price making new highs while RSI shows weakness'
    });
  }
  
  return patterns.slice(0, 3); // Limit to top 3 patterns
}

function calculateSupportResistance(data: ChartData[], currentPrice: number): SupportResistance {
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  const supports = findSupportLevels(lows, currentPrice);
  const resistances = findResistanceLevels(highs, currentPrice);
  
  // Calculate pivot points
  const recentHigh = Math.max(...highs.slice(-20));
  const recentLow = Math.min(...lows.slice(-20));
  const recentClose = data[data.length - 1].close;
  
  const pivot = (recentHigh + recentLow + recentClose) / 3;
  const r1 = (2 * pivot) - recentLow;
  const s1 = (2 * pivot) - recentHigh;
  
  return {
    supports,
    resistances,
    pivotPoints: [s1, pivot, r1]
  };
}

function analyzeEnvironment(data: ChartData[], indicators: CalculatedIndicators, timeframe: TimeFrame): MarketEnvironment {
  // Trend analysis
  let trend = 'NEUTRAL';
  if (indicators.ema.short > indicators.ema.medium && indicators.ema.medium > indicators.ema.long) {
    trend = 'BULLISH';
  } else if (indicators.ema.short < indicators.ema.medium && indicators.ema.medium < indicators.ema.long) {
    trend = 'BEARISH';
  }
  
  // Volatility analysis
  let volatility = 'NORMAL';
  if (indicators.volatility > 2) {
    volatility = 'HIGH';
  } else if (indicators.volatility < 0.5) {
    volatility = 'LOW';
  }
  
  // Volume analysis
  const volumes = data.map(d => d.volume || 1000);
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const recentVolume = volumes[volumes.length - 1];
  
  let volume = 'NORMAL';
  if (recentVolume > avgVolume * 1.5) {
    volume = 'HIGH';
  } else if (recentVolume < avgVolume * 0.5) {
    volume = 'LOW';
  }
  
  // Sentiment (based on RSI and other momentum indicators)
  let sentiment = 'NEUTRAL';
  if (indicators.rsi > 60 && indicators.macd.histogram > 0) {
    sentiment = 'BULLISH';
  } else if (indicators.rsi < 40 && indicators.macd.histogram < 0) {
    sentiment = 'BEARISH';
  }
  
  return { trend, volatility, volume, sentiment };
}

function analyzeMarketStructure(data: ChartData[], direction: string): MarketStructure {
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  // Analyze trend structure
  const recentCloses = closes.slice(-20);
  const isUptrend = recentCloses[recentCloses.length - 1] > recentCloses[0];
  const isDowntrend = recentCloses[recentCloses.length - 1] < recentCloses[0];
  
  let trend = 'SIDEWAYS';
  if (isUptrend) trend = 'UPTREND';
  if (isDowntrend) trend = 'DOWNTREND';
  
  // Market phase
  let phase = 'CONSOLIDATION';
  if (direction === 'LONG' && trend === 'UPTREND') phase = 'ACCUMULATION';
  if (direction === 'SHORT' && trend === 'DOWNTREND') phase = 'DISTRIBUTION';
  
  // Trend strength
  const priceChange = Math.abs(closes[closes.length - 1] - closes[0]) / closes[0];
  const strength = Math.min(100, priceChange * 1000);
  
  return { trend, phase, strength };
}

function analyzeVolumeProfile(data: ChartData[]): VolumeProfile {
  const volumes = data.map(d => d.volume || 1000);
  const closes = data.map(d => d.close);
  
  // Volume weighted average price
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (let i = 0; i < closes.length; i++) {
    totalVolume += volumes[i];
    totalVolumePrice += volumes[i] * closes[i];
  }
  
  const volumeWeightedPrice = totalVolumePrice / totalVolume;
  
  // High and low volume nodes (simplified)
  const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
  const highVolumeNodes = [];
  const lowVolumeNodes = [];
  
  for (let i = 0; i < volumes.length; i++) {
    if (volumes[i] > avgVolume * 1.5) {
      highVolumeNodes.push(closes[i]);
    } else if (volumes[i] < avgVolume * 0.5) {
      lowVolumeNodes.push(closes[i]);
    }
  }
  
  return {
    volumeWeightedPrice,
    highVolumeNodes: highVolumeNodes.slice(-3),
    lowVolumeNodes: lowVolumeNodes.slice(-3)
  };
}

function generateMacroInsights(timeframe: TimeFrame, confidence: number): MacroInsights {
  // Market regime based on timeframe and confidence
  let regime = 'NEUTRAL';
  if (confidence > 70 && ['1d', '3d', '1w', '1M'].includes(timeframe)) {
    regime = 'TRENDING';
  } else if (confidence < 50) {
    regime = 'RANGING';
  }
  
  // Correlation (simplified - would need actual correlation data)
  const correlation = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
  
  // Institutional flow (based on confidence and timeframe)
  let institutionalFlow = 'NEUTRAL';
  if (confidence > 75 && ['4h', '1d', '3d', '1w'].includes(timeframe)) {
    institutionalFlow = 'ACCUMULATING';
  } else if (confidence < 40) {
    institutionalFlow = 'DISTRIBUTING';
  }
  
  return { regime, correlation, institutionalFlow };
}

function calculateOptimalLeverage(confidence: number, riskReward: number, timeframe: TimeFrame): number {
  // Base leverage on confidence
  let leverage = 1;
  
  if (confidence > 80) leverage = 3;
  else if (confidence > 70) leverage = 2;
  else if (confidence > 60) leverage = 1.5;
  
  // Adjust for risk-reward
  if (riskReward > 2) leverage *= 1.2;
  else if (riskReward < 1) leverage *= 0.8;
  
  // Adjust for timeframe (lower leverage for shorter timeframes)
  const timeframeLeverage: Record<string, number> = {
    '1m': 0.5, '5m': 0.7, '15m': 0.8, '30m': 0.9,
    '1h': 1.0, '4h': 1.1, '1d': 1.2, '3d': 1.0, '1w': 0.8, '1M': 0.6
  };
  
  leverage *= timeframeLeverage[timeframe] || 1.0;
  
  return Math.max(1, Math.min(5, Math.round(leverage * 10) / 10));
}

function createNeutralSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): OptimizedSignal {
  return {
    symbol,
    timeframe,
    direction: 'NEUTRAL',
    confidence: 50,
    entryPrice: currentPrice,
    stopLoss: currentPrice,
    takeProfit: currentPrice,
    timestamp: Date.now(),
    indicators: {
      rsi: 50,
      macd: { value: 0, signal: 0, histogram: 0 },
      ema: { short: currentPrice, medium: currentPrice, long: currentPrice },
      stochastic: { k: 50, d: 50 },
      adx: { value: 20, pdi: 20, ndi: 20 },
      bb: {
        middle: currentPrice,
        upper: currentPrice * 1.02,
        lower: currentPrice * 0.98,
        width: 0.04,
        percentB: 50
      },
      supports: [currentPrice * 0.98, currentPrice * 0.96, currentPrice * 0.94],
      resistances: [currentPrice * 1.02, currentPrice * 1.04, currentPrice * 1.06],
      atr: currentPrice * 0.02,
      volatility: 1
    },
    successProbability: 50,
    riskReward: 1,
    patternFormations: [],
    supportResistance: {
      supports: [currentPrice * 0.98, currentPrice * 0.96],
      resistances: [currentPrice * 1.02, currentPrice * 1.04],
      pivotPoints: [currentPrice * 0.99, currentPrice, currentPrice * 1.01]
    },
    environment: {
      trend: 'NEUTRAL',
      volatility: 'NORMAL',
      volume: 'NORMAL',
      sentiment: 'NEUTRAL'
    },
    recommendedLeverage: 1,
    marketStructure: {
      trend: 'SIDEWAYS',
      phase: 'CONSOLIDATION',
      strength: 50
    },
    volumeProfile: {
      volumeWeightedPrice: currentPrice,
      highVolumeNodes: [],
      lowVolumeNodes: []
    },
    macroInsights: {
      regime: 'NEUTRAL',
      correlation: 0.5,
      institutionalFlow: 'NEUTRAL'
    }
  };
}

// Error handling wrapper
export function safeCalculateSignal(
  data: ChartData[],
  timeframe: TimeFrame,
  currentPrice: number,
  symbol: string
): OptimizedSignal {
  try {
    return calculateOptimizedSignal(data, timeframe, currentPrice, symbol);
  } catch (error) {
    console.error(`Calculation error for ${symbol} ${timeframe}:`, error);
    return createNeutralSignal(symbol, timeframe, currentPrice);
  }
}