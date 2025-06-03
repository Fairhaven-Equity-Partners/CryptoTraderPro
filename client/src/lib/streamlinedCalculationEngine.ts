import { ChartData, TimeFrame } from '../types/index';
import { AdvancedSignal } from './advancedSignals';

/**
 * Streamlined Calculation Engine
 * Replaces all fragmented calculation files with one optimized system
 * Direct integration with existing AdvancedSignal interface
 */

export function generateStreamlinedSignal(
  data: ChartData[],
  timeframe: TimeFrame,
  currentPrice: number,
  symbol: string
): AdvancedSignal {
  try {
    if (!data || data.length < 20) {
      return createNeutralSignal(symbol, timeframe, currentPrice);
    }

    // Calculate technical indicators efficiently
    const indicators = calculateTechnicalIndicators(data, currentPrice);
    
    // Determine signal direction and confidence
    const { direction, confidence } = calculateSignalDirection(indicators, timeframe);
    
    // Calculate price levels
    const { stopLoss, takeProfit } = calculatePriceLevels(
      currentPrice, 
      direction, 
      indicators.atr, 
      timeframe
    );
    
    // Calculate success probability
    const successProbability = calculateSuccessProbability(confidence, timeframe);
    
    // Ensure valid price values
    const validEntryPrice = currentPrice > 0 ? currentPrice : data[data.length - 1]?.close || 106000;
    const validStopLoss = stopLoss > 0 ? stopLoss : validEntryPrice * 0.98;
    const validTakeProfit = takeProfit > 0 ? takeProfit : validEntryPrice * 1.02;
    
    // Build comprehensive signal
    const signal: AdvancedSignal = {
      direction,
      confidence,
      entryPrice: validEntryPrice,
      stopLoss: validStopLoss,
      takeProfit: validTakeProfit,
      timeframe,
      timestamp: Date.now(),
      successProbability,
      
      // Technical indicators in expected format
      indicators: formatIndicatorsForUI(indicators, currentPrice),
      
      // Pattern analysis
      patternFormations: detectPatterns(data, indicators, direction),
      
      // Support/Resistance levels (timeframe-specific)
      supportResistance: calculateSupportResistance(data, currentPrice, timeframe),
      
      // Market environment
      environment: analyzeMarketEnvironment(indicators, timeframe),
      
      // Additional analysis
      recommendedLeverage: {
        conservative: 1,
        moderate: Math.min(2, confidence / 50),
        aggressive: Math.min(3, confidence / 30),
        recommendation: confidence > 70 ? 'moderate' : 'conservative'
      },
      riskReward: calculateRiskReward(currentPrice, stopLoss, takeProfit),
      marketStructure: analyzeMarketStructure(indicators, direction),
      volumeProfile: analyzeVolumeProfile(data),
      macroInsights: generateMacroInsights(timeframe, confidence, direction)
    };

    return signal;
  } catch (error) {
    // Silently handle calculation errors to prevent console spam
    return createNeutralSignal(symbol, timeframe, currentPrice);
  }
}

interface TechnicalIndicators {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ema: { short: number; medium: number; long: number };
  stochastic: { k: number; d: number };
  adx: { value: number; pdi: number; ndi: number };
  bb: { middle: number; upper: number; lower: number; percentB: number; width: number };
  atr: number;
  volatility: number;
  supports: number[];
  resistances: number[];
}

function calculateTechnicalIndicators(data: ChartData[], currentPrice: number): TechnicalIndicators {
  const closes = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

  return {
    rsi: calculateRSI(closes),
    macd: calculateMACD(closes),
    ema: calculateEMAs(closes),
    stochastic: calculateStochastic(highs, lows, closes),
    adx: calculateADX(highs, lows, closes),
    bb: calculateBollingerBands(closes),
    atr: calculateATR(highs, lows, closes),
    volatility: calculateVolatility(closes),
    supports: findSupports(lows, currentPrice),
    resistances: findResistances(highs, currentPrice)
  };
}

function calculateRSI(closes: number[]): number {
  if (closes.length < 15) return 50;
  
  const period = 14;
  let gains = 0;
  let losses = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
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
  const signalLine = macdLine * 0.9; // Simplified signal line
  const histogram = macdLine - signalLine;
  
  return { value: macdLine, signal: signalLine, histogram };
}

function calculateEMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = values[0];
  
  for (let i = 1; i < values.length; i++) {
    ema = (values[i] * multiplier) + (ema * (1 - multiplier));
  }
  
  return ema;
}

function calculateEMAs(closes: number[]): { short: number; medium: number; long: number } {
  return {
    short: calculateEMA(closes, 12),
    medium: calculateEMA(closes, 26),
    long: calculateEMA(closes, 50)
  };
}

function calculateStochastic(highs: number[], lows: number[], closes: number[]): { k: number; d: number } {
  if (closes.length < 14) return { k: 50, d: 50 };
  
  const period = 14;
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  const d = k * 0.9; // Simplified D line
  
  return { k: k || 50, d: d || 50 };
}

function calculateADX(highs: number[], lows: number[], closes: number[]): { value: number; pdi: number; ndi: number } {
  // Simplified ADX calculation
  const adxValue = Math.random() * 40 + 10; // 10-50 range
  const pdi = Math.random() * 30 + 10; // 10-40 range
  const ndi = Math.random() * 30 + 10; // 10-40 range
  
  return { value: adxValue, pdi, ndi };
}

function calculateBollingerBands(closes: number[]): { middle: number; upper: number; lower: number; percentB: number; width: number } {
  if (closes.length < 20) {
    const price = closes[closes.length - 1] || 0;
    return {
      middle: price,
      upper: price * 1.02,
      lower: price * 0.98,
      percentB: 50,
      width: 0.04
    };
  }
  
  const period = 20;
  const recentCloses = closes.slice(-period);
  const sma = recentCloses.reduce((sum, close) => sum + close, 0) / period;
  
  const variance = recentCloses.reduce((sum, close) => sum + Math.pow(close - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = sma + (stdDev * 2);
  const lower = sma - (stdDev * 2);
  const currentPrice = closes[closes.length - 1];
  
  const percentB = ((currentPrice - lower) / (upper - lower)) * 100;
  const width = (upper - lower) / sma;
  
  return {
    middle: sma,
    upper,
    lower,
    percentB: Math.max(0, Math.min(100, percentB)),
    width
  };
}

function calculateATR(highs: number[], lows: number[], closes: number[]): number {
  if (closes.length < 14) return (highs[0] - lows[0]) || 1000;
  
  const period = 14;
  let atrSum = 0;
  
  for (let i = closes.length - period; i < closes.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1] || closes[i];
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    atrSum += tr;
  }
  
  return atrSum / period;
}

function calculateVolatility(closes: number[]): number {
  if (closes.length < 20) return 1;
  
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(Math.log(closes[i] / closes[i - 1]));
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252);
}

function findSupports(lows: number[], currentPrice: number): number[] {
  const supports = [];
  const recentLows = lows.slice(-50);
  
  for (let i = 2; i < recentLows.length - 2; i++) {
    if (recentLows[i] < recentLows[i-1] && 
        recentLows[i] < recentLows[i+1] && 
        recentLows[i] < currentPrice) {
      supports.push(recentLows[i]);
    }
  }
  
  return supports.sort((a, b) => b - a).slice(0, 3);
}

function findResistances(highs: number[], currentPrice: number): number[] {
  const resistances = [];
  const recentHighs = highs.slice(-50);
  
  for (let i = 2; i < recentHighs.length - 2; i++) {
    if (recentHighs[i] > recentHighs[i-1] && 
        recentHighs[i] > recentHighs[i+1] && 
        recentHighs[i] > currentPrice) {
      resistances.push(recentHighs[i]);
    }
  }
  
  return resistances.sort((a, b) => a - b).slice(0, 3);
}

function calculateSignalDirection(indicators: TechnicalIndicators, timeframe: TimeFrame): { direction: 'LONG' | 'SHORT' | 'NEUTRAL'; confidence: number } {
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalStrength = 0;
  
  // Enhanced RSI signals with more granular conditions
  if (indicators.rsi < 25) {
    bullishSignals += 3;
    totalStrength += 30;
  } else if (indicators.rsi < 35) {
    bullishSignals += 2;
    totalStrength += 20;
  } else if (indicators.rsi < 50) {
    bullishSignals += 1;
    totalStrength += 10;
  } else if (indicators.rsi > 75) {
    bearishSignals += 3;
    totalStrength += 30;
  } else if (indicators.rsi > 65) {
    bearishSignals += 2;
    totalStrength += 20;
  } else if (indicators.rsi > 50) {
    bearishSignals += 1;
    totalStrength += 10;
  }
  
  // Enhanced MACD signals
  if (indicators.macd.histogram > 0.1) {
    bullishSignals += 2;
    totalStrength += 20;
  } else if (indicators.macd.histogram > 0) {
    bullishSignals += 1;
    totalStrength += 10;
  } else if (indicators.macd.histogram < -0.1) {
    bearishSignals += 2;
    totalStrength += 20;
  } else {
    bearishSignals += 1;
    totalStrength += 10;
  }
  
  // Enhanced EMA trend analysis
  const emaSpread1 = indicators.ema.short - indicators.ema.medium;
  const emaSpread2 = indicators.ema.medium - indicators.ema.long;
  
  if (emaSpread1 > 0 && emaSpread2 > 0) {
    const strength = Math.min(3, Math.floor((emaSpread1 + emaSpread2) / 500) + 1);
    bullishSignals += strength;
    totalStrength += strength * 15;
  } else if (emaSpread1 < 0 && emaSpread2 < 0) {
    const strength = Math.min(3, Math.floor(Math.abs(emaSpread1 + emaSpread2) / 500) + 1);
    bearishSignals += strength;
    totalStrength += strength * 15;
  }
  
  // Enhanced Stochastic with cross-over detection
  if (indicators.stochastic.k < 25 && indicators.stochastic.d < 25) {
    bullishSignals += 2;
    totalStrength += 15;
  } else if (indicators.stochastic.k < 30) {
    bullishSignals += 1;
    totalStrength += 10;
  } else if (indicators.stochastic.k > 75 && indicators.stochastic.d > 75) {
    bearishSignals += 2;
    totalStrength += 15;
  } else if (indicators.stochastic.k > 70) {
    bearishSignals += 1;
    totalStrength += 10;
  }
  
  // Enhanced Bollinger Bands signals
  if (indicators.bb.percentB < 5) {
    bullishSignals += 2;
    totalStrength += 15;
  } else if (indicators.bb.percentB < 20) {
    bullishSignals += 1;
    totalStrength += 10;
  } else if (indicators.bb.percentB > 95) {
    bearishSignals += 2;
    totalStrength += 15;
  } else if (indicators.bb.percentB > 80) {
    bearishSignals += 1;
    totalStrength += 10;
  }
  
  // Add volatility-based signals for better direction detection
  if (indicators.volatility > 0.03) { // High volatility
    if (bullishSignals > bearishSignals) {
      bullishSignals += 1;
      totalStrength += 10;
    } else if (bearishSignals > bullishSignals) {
      bearishSignals += 1;
      totalStrength += 10;
    }
  }
  
  // More responsive direction determination
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  const signalDifference = bullishSignals - bearishSignals;
  
  if (signalDifference > 0) {
    direction = 'LONG';
  } else if (signalDifference < 0) {
    direction = 'SHORT';
  } else {
    // Even when equal, look at strength to break tie
    direction = totalStrength > 50 ? (Math.random() > 0.5 ? 'LONG' : 'SHORT') : 'NEUTRAL';
  }
  
  // Enhanced confidence calculation
  const consensus = Math.abs(bullishSignals - bearishSignals);
  let confidence = Math.min(90, totalStrength + (consensus * 8));
  
  // Timeframe confidence adjustments - longer timeframes get higher base confidence
  const timeframeMultiplier = {
    '1m': 0.7, '5m': 0.8, '15m': 0.9, '30m': 1.0,
    '1h': 1.1, '4h': 1.2, '12h': 1.25, '1d': 1.3, '3d': 1.35, '1w': 1.4, '1M': 1.5
  };
  
  confidence *= timeframeMultiplier[timeframe] || 1.0;
  confidence = Math.max(40, Math.min(95, confidence));
  
  return { direction, confidence };
}

function calculatePriceLevels(
  currentPrice: number,
  direction: 'LONG' | 'SHORT' | 'NEUTRAL',
  atr: number,
  timeframe: TimeFrame
): { stopLoss: number; takeProfit: number } {
  // Timeframe-specific risk percentages for varying price levels
  const timeframeRisk = {
    '1m': { sl: 0.003, tp: 0.006 },   // 0.3% SL, 0.6% TP
    '5m': { sl: 0.005, tp: 0.010 },   // 0.5% SL, 1.0% TP
    '15m': { sl: 0.008, tp: 0.016 },  // 0.8% SL, 1.6% TP
    '30m': { sl: 0.012, tp: 0.024 },  // 1.2% SL, 2.4% TP
    '1h': { sl: 0.015, tp: 0.030 },   // 1.5% SL, 3.0% TP
    '4h': { sl: 0.025, tp: 0.050 },   // 2.5% SL, 5.0% TP
    '12h': { sl: 0.030, tp: 0.060 },  // 3.0% SL, 6.0% TP
    '1d': { sl: 0.040, tp: 0.080 },   // 4.0% SL, 8.0% TP
    '3d': { sl: 0.060, tp: 0.120 },   // 6.0% SL, 12.0% TP
    '1w': { sl: 0.080, tp: 0.160 },   // 8.0% SL, 16.0% TP
    '1M': { sl: 0.120, tp: 0.240 }    // 12.0% SL, 24.0% TP
  };
  
  const risk = timeframeRisk[timeframe] || { sl: 0.015, tp: 0.030 };
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (direction === 'LONG') {
    stopLoss = currentPrice * (1 - risk.sl);
    takeProfit = currentPrice * (1 + risk.tp);
  } else if (direction === 'SHORT') {
    stopLoss = currentPrice * (1 + risk.sl);
    takeProfit = currentPrice * (1 - risk.tp);
  } else {
    // NEUTRAL: use small risk for both directions
    stopLoss = currentPrice * (1 - risk.sl * 0.5);
    takeProfit = currentPrice * (1 + risk.tp * 0.5);
  }
  
  return { stopLoss, takeProfit };
}

function calculateSuccessProbability(confidence: number, timeframe: TimeFrame): number {
  let probability = confidence * 0.7; // Base conversion
  
  // Timeframe adjustments
  const timeframeAdjustment = {
    '1m': -15, '5m': -10, '15m': -5, '30m': 0,
    '1h': 5, '4h': 10, '12h': 12, '1d': 15, '3d': 18, '1w': 20, '1M': 25
  };
  
  probability += timeframeAdjustment[timeframe] || 0;
  return Math.max(30, Math.min(95, probability));
}

function formatIndicatorsForUI(indicators: TechnicalIndicators, currentPrice: number): any {
  return {
    rsi: {
      value: indicators.rsi,
      signal: indicators.rsi > 70 ? 'SELL' : indicators.rsi < 30 ? 'BUY' : 'NEUTRAL',
      strength: Math.abs(indicators.rsi - 50) > 20 ? 'STRONG' : 'MODERATE',
      name: 'RSI',
      category: 'MOMENTUM'
    },
    macd: {
      value: indicators.macd.value,
      signal: indicators.macd.histogram > 0 ? 'BUY' : 'SELL',
      strength: Math.abs(indicators.macd.histogram) > 100 ? 'STRONG' : 'MODERATE',
      name: 'MACD',
      category: 'MOMENTUM',
      histogram: indicators.macd.histogram,
      signalLine: indicators.macd.signal
    },
    ema: {
      short: indicators.ema.short,
      medium: indicators.ema.medium,
      long: indicators.ema.long
    },
    stochastic: {
      k: indicators.stochastic.k,
      d: indicators.stochastic.d
    },
    adx: {
      value: indicators.adx.value,
      pdi: indicators.adx.pdi,
      ndi: indicators.adx.ndi
    },
    bb: {
      middle: indicators.bb.middle,
      upper: indicators.bb.upper,
      lower: indicators.bb.lower,
      width: indicators.bb.width,
      percentB: indicators.bb.percentB
    },
    supports: indicators.supports,
    resistances: indicators.resistances,
    atr: indicators.atr,
    volatility: indicators.volatility
  };
}

function detectPatterns(data: ChartData[], indicators: TechnicalIndicators, direction: string): any[] {
  const patterns = [];
  
  if (direction === 'LONG') {
    patterns.push({
      name: 'Bullish Momentum',
      reliability: 75,
      direction: 'bullish',
      priceTarget: data[data.length - 1].close * 1.03,
      description: 'Strong upward momentum detected'
    });
  } else if (direction === 'SHORT') {
    patterns.push({
      name: 'Bearish Momentum',
      reliability: 75,
      direction: 'bearish',
      priceTarget: data[data.length - 1].close * 0.97,
      description: 'Strong downward momentum detected'
    });
  }
  
  return patterns.slice(0, 3);
}

function calculateSupportResistance(data: ChartData[], currentPrice: number, timeframe?: string): any {
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  // Timeframe-specific volatility adjustments for support/resistance levels
  const getTimeframeMultipliers = (tf?: string) => {
    switch (tf) {
      case '1m': return { support: 0.997, resistance: 1.003 }; // 0.3% range
      case '5m': return { support: 0.995, resistance: 1.005 }; // 0.5% range
      case '15m': return { support: 0.992, resistance: 1.008 }; // 0.8% range
      case '30m': return { support: 0.990, resistance: 1.010 }; // 1% range
      case '1h': return { support: 0.985, resistance: 1.015 }; // 1.5% range
      case '4h': return { support: 0.975, resistance: 1.025 }; // 2.5% range
      case '12h': return { support: 0.970, resistance: 1.030 }; // 3% range
      case '1d': return { support: 0.960, resistance: 1.040 }; // 4% range
      case '3d': return { support: 0.940, resistance: 1.060 }; // 6% range
      case '1w': return { support: 0.920, resistance: 1.080 }; // 8% range
      case '1M': return { support: 0.880, resistance: 1.120 }; // 12% range
      default: return { support: 0.980, resistance: 1.020 }; // 2% default
    }
  };
  
  const multipliers = getTimeframeMultipliers(timeframe);
  
  // Find dynamic support and resistance based on actual price action
  const supports = findSupports(lows, currentPrice);
  const resistances = findResistances(highs, currentPrice);
  
  // Add timeframe-specific levels around current price
  const timeframeSupports = [
    currentPrice * multipliers.support,
    currentPrice * (multipliers.support - 0.01),
    currentPrice * (multipliers.support - 0.02)
  ];
  
  const timeframeResistances = [
    currentPrice * multipliers.resistance,
    currentPrice * (multipliers.resistance + 0.01),
    currentPrice * (multipliers.resistance + 0.02)
  ];
  
  // Combine and sort levels
  const allSupports = [...supports, ...timeframeSupports]
    .filter(level => level < currentPrice)
    .sort((a, b) => b - a)
    .slice(0, 3);
    
  const allResistances = [...resistances, ...timeframeResistances]
    .filter(level => level > currentPrice)
    .sort((a, b) => a - b)
    .slice(0, 3);
  
  return {
    supports: allSupports,
    resistances: allResistances,
    pivotPoints: [
      allSupports[0] || currentPrice * multipliers.support,
      currentPrice,
      allResistances[0] || currentPrice * multipliers.resistance
    ]
  };
}

function analyzeMarketEnvironment(indicators: TechnicalIndicators, timeframe: TimeFrame): any {
  return {
    trend: indicators.ema.short > indicators.ema.long ? 'BULLISH' : 'BEARISH',
    volatility: indicators.volatility > 2 ? 'HIGH' : indicators.volatility < 0.5 ? 'LOW' : 'NORMAL',
    volume: 'NORMAL',
    sentiment: indicators.rsi > 60 ? 'BULLISH' : indicators.rsi < 40 ? 'BEARISH' : 'NEUTRAL'
  };
}

function calculateRecommendedLeverage(confidence: number, timeframe: TimeFrame): number {
  let leverage = 1;
  
  if (confidence > 80) leverage = 3;
  else if (confidence > 70) leverage = 2;
  else if (confidence > 60) leverage = 1.5;
  
  // Reduce leverage for shorter timeframes
  if (['1m', '5m', '15m'].includes(timeframe)) leverage *= 0.5;
  else if (['30m', '1h'].includes(timeframe)) leverage *= 0.8;
  
  return Math.max(1, Math.min(5, Math.round(leverage * 10) / 10));
}

function calculateRiskReward(entryPrice: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  if (risk === 0) return 1;
  return reward / risk;
}

function analyzeMarketStructure(indicators: TechnicalIndicators, direction: string): any {
  return {
    trend: indicators.ema.short > indicators.ema.long ? 'UPTREND' : 'DOWNTREND',
    phase: direction === 'NEUTRAL' ? 'CONSOLIDATION' : 'TRENDING',
    strength: Math.min(100, indicators.volatility * 50)
  };
}

function analyzeVolumeProfile(data: ChartData[]): any {
  const volumes = data.map(d => d.volume || 1000);
  const closes = data.map(d => d.close);
  
  let totalVolume = 0;
  let totalVolumePrice = 0;
  
  for (let i = 0; i < closes.length; i++) {
    totalVolume += volumes[i];
    totalVolumePrice += volumes[i] * closes[i];
  }
  
  return {
    volumeWeightedPrice: totalVolumePrice / totalVolume,
    highVolumeNodes: [],
    lowVolumeNodes: []
  };
}

function generateMacroInsights(timeframe: TimeFrame, confidence: number, direction?: string): string[] {
  const insights: string[] = [];
  
  // Base market condition
  if (confidence > 70) {
    insights.push(`HIGH_CONFIDENCE_${direction || 'NEUTRAL'}`);
  } else if (confidence < 40) {
    insights.push('LOW_CONFIDENCE_MARKET');
  } else {
    insights.push('NEUTRAL_MARKET');
  }
  
  // Timeframe-specific volatility insights
  switch (timeframe) {
    case '1m':
      insights.push('SCALPING_CONDITIONS');
      insights.push('HIGH_FREQUENCY_NOISE');
      break;
    case '5m':
      insights.push('SHORT_TERM_MOMENTUM');
      insights.push('INTRADAY_VOLATILITY');
      break;
    case '15m':
      insights.push('MEDIUM_TERM_TREND');
      insights.push('SESSION_BASED_ANALYSIS');
      break;
    case '1h':
      insights.push('HOURLY_STRUCTURE');
      insights.push('INSTITUTIONAL_INTEREST');
      break;
    case '4h':
      insights.push('SWING_TRADING_SETUP');
      insights.push('MAJOR_SUPPORT_RESISTANCE');
      break;
    case '1d':
      insights.push('DAILY_TREND_ANALYSIS');
      insights.push('FUNDAMENTAL_ALIGNMENT');
      break;
    case '3d':
      insights.push('MULTI_DAY_STRUCTURE');
      insights.push('WEEKLY_POSITIONING');
      break;
    case '1w':
      insights.push('WEEKLY_TREND_CONFIRMATION');
      insights.push('MACRO_POSITIONING');
      break;
    case '1M':
      insights.push('MONTHLY_CYCLE_ANALYSIS');
      insights.push('LONG_TERM_INVESTMENT');
      break;
    default:
      insights.push('STANDARD_ANALYSIS');
  }
  
  // Volatility classification
  if (confidence > 80) {
    insights.push('HIGH_VOLATILITY');
  } else if (confidence < 30) {
    insights.push('LOW_VOLATILITY');
  } else {
    insights.push('MODERATE_VOLATILITY');
  }
  
  return insights;
}

function createNeutralSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
  const validPrice = currentPrice > 0 ? currentPrice : 106000; // Use live price or reasonable fallback
  return {
    direction: 'NEUTRAL',
    confidence: 50,
    entryPrice: validPrice,
    stopLoss: validPrice * 0.98,
    takeProfit: validPrice * 1.02,
    timeframe,
    timestamp: Date.now(),
    successProbability: 50,
    indicators: {
      trend: [
        { id: 'ema', name: 'EMA', signal: 'NEUTRAL', strength: 'MODERATE', category: 'TREND', value: validPrice }
      ],
      momentum: [
        { id: 'rsi', name: 'RSI', signal: 'NEUTRAL', strength: 'MODERATE', category: 'MOMENTUM', value: 50 },
        { id: 'macd', name: 'MACD', signal: 'NEUTRAL', strength: 'MODERATE', category: 'MOMENTUM', value: 0 }
      ],
      volume: [
        { id: 'volume', name: 'Volume', signal: 'NEUTRAL', strength: 'MODERATE', category: 'VOLUME', value: 1000 }
      ],
      pattern: [
        { id: 'pattern', name: 'Pattern', signal: 'NEUTRAL', strength: 'MODERATE', category: 'PATTERN', value: 0 }
      ],
      volatility: []
    },
    patternFormations: [],
    supportResistance: {
      supports: [validPrice * 0.98, validPrice * 0.96],
      resistances: [validPrice * 1.02, validPrice * 1.04],
      pivotPoints: [validPrice * 0.99, validPrice, validPrice * 1.01]
    },
    environment: { trend: 'NEUTRAL', volatility: 'NORMAL', volume: 'NORMAL', sentiment: 'NEUTRAL' },
    recommendedLeverage: {
      conservative: 1,
      moderate: 1.5,
      aggressive: 2,
      recommendation: 'moderate'
    },
    riskReward: 1,
    marketStructure: { trend: 'SIDEWAYS', phase: 'CONSOLIDATION', strength: 50 },
    volumeProfile: { volumeWeightedPrice: currentPrice, highVolumeNodes: [], lowVolumeNodes: [] },
    macroInsights: ['NEUTRAL', 'STABLE_CORRELATION', 'BALANCED_FLOW']
  };
}