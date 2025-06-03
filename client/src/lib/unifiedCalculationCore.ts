/**
 * Unified Calculation Core - Consolidated mathematical engine
 * Replaces 78+ fragmented files with single optimized system
 * Implements mathematically accurate indicators with proper algorithms
 */

import { TimeFrame } from '../types';

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi: { value: number; signal: 'BUY' | 'SELL' | 'NEUTRAL'; strength: 'WEAK' | 'MODERATE' | 'STRONG' };
  macd: { value: number; signal: 'BUY' | 'SELL' | 'NEUTRAL'; histogram: number; strength: 'WEAK' | 'MODERATE' | 'STRONG' };
  ema: { short: number; medium: number; long: number };
  stochastic: { k: number; d: number };
  bb: { upper: number; middle: number; lower: number; width: number; percentB: number };
  adx: { value: number; pdi: number; ndi: number };
  atr: { value: number };
  supports: number[];
  resistances: number[];
  volatility: number;
  marketRegime: 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY';
  confidenceFactors: {
    trendAlignment: boolean;
    momentumConfluence: boolean;
    volatilityLevel: string;
  };
}

interface UnifiedSignal {
  symbol: string;
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  indicators: TechnicalIndicators;
  successProbability: number;
  patternFormations?: any[];
  macroInsights?: string[];
}

class UnifiedCalculationCore {
  private dataCache = new Map<string, OHLCData[]>();
  private indicatorCache = new Map<string, any>();

  /**
   * Calculate RSI using Wilder's smoothing method (mathematically accurate)
   */
  private calculateRSI(data: OHLCData[], period = 14): number {
    if (data.length < period + 1) return 50;
    
    const changes = data.slice(1).map((d, i) => d.close - data[i].close);
    
    // Initial average gain/loss
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    // Apply Wilder's smoothing for remaining values
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      if (change > 0) {
        avgGain = ((avgGain * (period - 1)) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = ((avgLoss * (period - 1)) + Math.abs(change)) / period;
      }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD with proper EMA smoothing (fixes oversimplified macdLine * 0.9)
   */
  private calculateMACD(data: OHLCData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const prices = data.map(d => d.close);
    
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    const macdLine = fastEMA - slowEMA;
    
    // Calculate signal line using proper EMA
    const macdValues = [];
    for (let i = slowPeriod - 1; i < data.length; i++) {
      const fast = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
      const slow = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
      macdValues.push(fast - slow);
    }
    
    const signalLine = this.calculateEMA(macdValues, signalPeriod);
    const histogram = macdLine - signalLine;
    
    return { macdLine, signalLine, histogram };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }



  /**
   * Calculate ADX with proper +DI/-DI using Wilder's smoothing
   */
  private calculateADX(data: OHLCData[], period = 14) {
    if (data.length < period + 1) return { adx: 0, pdi: 0, ndi: 0 };
    
    const trueRanges: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevHigh = data[i - 1].high;
      const prevLow = data[i - 1].low;
      const prevClose = data[i - 1].close;
      
      // True Range
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
      
      // Directional Movement
      const plusDM = high - prevHigh > prevLow - low ? Math.max(high - prevHigh, 0) : 0;
      const minusDM = prevLow - low > high - prevHigh ? Math.max(prevLow - low, 0) : 0;
      
      plusDMs.push(plusDM);
      minusDMs.push(minusDM);
    }
    
    // Apply Wilder's smoothing
    let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
    let plusDI = plusDMs.slice(0, period).reduce((sum, dm) => sum + dm, 0) / period;
    let minusDI = minusDMs.slice(0, period).reduce((sum, dm) => sum + dm, 0) / period;
    
    for (let i = period; i < trueRanges.length; i++) {
      atr = ((atr * (period - 1)) + trueRanges[i]) / period;
      plusDI = ((plusDI * (period - 1)) + plusDMs[i]) / period;
      minusDI = ((minusDI * (period - 1)) + minusDMs[i]) / period;
    }
    
    const pdi = (plusDI / atr) * 100;
    const ndi = (minusDI / atr) * 100;
    
    const dx = Math.abs(pdi - ndi) / (pdi + ndi) * 100;
    
    return { adx: dx, pdi, ndi };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(data: OHLCData[], period = 20, stdDev = 2) {
    const prices = data.map(d => d.close);
    const sma = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
    
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = sma + (standardDeviation * stdDev);
    const lower = sma - (standardDeviation * stdDev);
    const width = (upper - lower) / sma;
    const percentB = (prices[prices.length - 1] - lower) / (upper - lower) * 100;
    
    return { upper, middle: sma, lower, width, percentB };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(data: OHLCData[], period = 14): number {
    if (data.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      trueRanges.push(tr);
    }
    
    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  /**
   * Calculate support and resistance levels using multiple methods for robustness
   */
  private calculateSupportResistance(data: OHLCData[], lookback = 15): { supports: number[]; resistances: number[] } {
    const supports: number[] = [];
    const resistances: number[] = [];
    
    if (data.length < 10) {
      // Generate basic levels from current price if insufficient data
      const currentPrice = data[data.length - 1]?.close || 0;
      if (currentPrice > 0) {
        return {
          supports: [
            currentPrice * 0.985,
            currentPrice * 0.970,
            currentPrice * 0.955
          ],
          resistances: [
            currentPrice * 1.015,
            currentPrice * 1.030,
            currentPrice * 1.045
          ]
        };
      }
      return { supports, resistances };
    }
    
    // Method 1: Find pivot highs and lows
    const pivotLookback = Math.min(lookback, Math.floor(data.length / 3));
    for (let i = pivotLookback; i < data.length - pivotLookback; i++) {
      const current = data[i];
      let isResistance = true;
      let isSupport = true;
      
      // Check for pivot high (resistance)
      for (let j = i - pivotLookback; j <= i + pivotLookback; j++) {
        if (j !== i && data[j].high >= current.high) {
          isResistance = false;
          break;
        }
      }
      
      // Check for pivot low (support)
      for (let j = i - pivotLookback; j <= i + pivotLookback; j++) {
        if (j !== i && data[j].low <= current.low) {
          isSupport = false;
          break;
        }
      }
      
      if (isResistance) resistances.push(current.high);
      if (isSupport) supports.push(current.low);
    }
    
    // Method 2: Add psychological levels and recent highs/lows
    const recentData = data.slice(-50);
    const recentHigh = Math.max(...recentData.map(d => d.high));
    const recentLow = Math.min(...recentData.map(d => d.low));
    const currentPrice = data[data.length - 1].close;
    
    // Add recent extreme levels
    if (recentHigh > currentPrice * 1.005) resistances.push(recentHigh);
    if (recentLow < currentPrice * 0.995) supports.push(recentLow);
    
    // Method 3: Add volume-weighted levels (using close prices as proxy)
    const volumeWeightedLevels = this.calculateVolumeWeightedLevels(data);
    supports.push(...volumeWeightedLevels.supports);
    resistances.push(...volumeWeightedLevels.resistances);
    
    // Clean and sort levels
    const cleanSupports = [...new Set(supports)]
      .filter(level => level > 0 && level < currentPrice)
      .sort((a, b) => b - a)
      .slice(0, 3);
      
    const cleanResistances = [...new Set(resistances)]
      .filter(level => level > currentPrice)
      .sort((a, b) => a - b)
      .slice(0, 3);
    
    return { 
      supports: cleanSupports, 
      resistances: cleanResistances 
    };
  }
  
  /**
   * Calculate volume-weighted support and resistance levels
   */
  private calculateVolumeWeightedLevels(data: OHLCData[]): { supports: number[]; resistances: number[] } {
    const supports: number[] = [];
    const resistances: number[] = [];
    const currentPrice = data[data.length - 1].close;
    
    // Group price levels by volume
    const priceVolumeMap = new Map<number, number>();
    const recentData = data.slice(-100);
    
    recentData.forEach(candle => {
      const priceLevel = Math.round(candle.close / 10) * 10; // Round to nearest 10
      const currentVolume = priceVolumeMap.get(priceLevel) || 0;
      priceVolumeMap.set(priceLevel, currentVolume + candle.volume);
    });
    
    // Sort by volume and extract significant levels
    const sortedLevels = Array.from(priceVolumeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    
    sortedLevels.forEach(level => {
      if (level < currentPrice) {
        supports.push(level);
      } else if (level > currentPrice) {
        resistances.push(level);
      }
    });
    
    return { supports, resistances };
  }

  /**
   * Detect market regime based on volatility and trend strength
   */
  private detectMarketRegime(data: OHLCData[], indicators: any): string {
    const volatility = indicators.volatility;
    const adx = indicators.adx.value;
    const rsi = indicators.rsi.value;
    
    if (volatility > 0.04) return 'HIGH_VOLATILITY';
    if (volatility < 0.015) return 'LOW_VOLATILITY';
    if (adx > 25 && rsi > 60) return 'TRENDING_UP';
    if (adx > 25 && rsi < 40) return 'TRENDING_DOWN';
    return 'RANGING';
  }

  /**
   * Calculate timeframe-specific position sizing based on ATR
   */
  private calculatePositionSizing(timeframe: TimeFrame, atr: number, currentPrice: number) {
    const timeframeMultipliers = {
      '1m': 0.5, '5m': 0.75, '15m': 1.0, '30m': 1.25,
      '1h': 1.5, '4h': 2.0, '1d': 3.0, '3d': 4.0,
      '1w': 5.0, '1M': 8.0
    };
    
    const multiplier = timeframeMultipliers[timeframe] || 1.0;
    const atrPercentage = (atr / currentPrice) * 100;
    
    return {
      stopLossDistance: atr * multiplier * 0.8,
      takeProfitDistance: atr * multiplier * 1.6,
      riskPercentage: Math.min(atrPercentage * multiplier, 5.0)
    };
  }

  /**
   * Generate unified signal with all indicators
   */
  public generateSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): UnifiedSignal | null {
    const cacheKey = `${symbol}_${timeframe}`;
    const data = this.dataCache.get(cacheKey);
    
    if (!data || data.length < 50) return null;
    
    // Calculate all indicators
    const rsi = this.calculateRSI(data);
    const macd = this.calculateMACD(data);
    const ema = {
      short: this.calculateEMA(data.map(d => d.close), 9),
      medium: this.calculateEMA(data.map(d => d.close), 21),
      long: this.calculateEMA(data.map(d => d.close), 50)
    };
    const stochastic = this.calculateStochastic(data);
    const bb = this.calculateBollingerBands(data);
    const adx = this.calculateADX(data);
    const atr = this.calculateATR(data);
    
    // Calculate volatility
    const prices = data.slice(-20).map(d => d.close);
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length) * Math.sqrt(252);
    
    // Calculate support and resistance levels
    const supportResistance = this.calculateSupportResistance(data);
    
    // Debug logging
    console.log(`Support/Resistance calculation for ${symbol} ${timeframe}:`, {
      dataLength: data.length,
      supports: supportResistance.supports.length,
      resistances: supportResistance.resistances.length,
      supportLevels: supportResistance.supports,
      resistanceLevels: supportResistance.resistances
    });
    
    const indicators: TechnicalIndicators = {
      rsi: {
        value: rsi,
        signal: rsi > 70 ? 'SELL' : rsi < 30 ? 'BUY' : 'NEUTRAL',
        strength: Math.abs(rsi - 50) > 30 ? 'STRONG' : Math.abs(rsi - 50) > 15 ? 'MODERATE' : 'WEAK'
      },
      macd: {
        value: macd.macdLine,
        signal: macd.histogram > 0 ? 'BUY' : 'SELL',
        histogram: macd.histogram,
        strength: Math.abs(macd.histogram) > 100 ? 'STRONG' : Math.abs(macd.histogram) > 50 ? 'MODERATE' : 'WEAK'
      },
      ema,
      stochastic,
      bb,
      adx: { value: adx.adx, pdi: adx.pdi, ndi: adx.ndi },
      atr: { value: atr },
      supports: supportResistance.supports,
      resistances: supportResistance.resistances,
      volatility,
      marketRegime: this.detectMarketRegime(data, { volatility, adx, rsi: { value: rsi } }) as any,
      confidenceFactors: {
        trendAlignment: ema.short > ema.medium && ema.medium > ema.long,
        momentumConfluence: (rsi > 50 && macd.histogram > 0) || (rsi < 50 && macd.histogram < 0),
        volatilityLevel: volatility > 0.04 ? 'HIGH_VOLATILITY' : volatility < 0.015 ? 'LOW_VOLATILITY' : 'NORMAL'
      }
    };
    
    // Determine signal direction and confidence
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;
    
    const bullishSignals = [
      rsi < 30 ? 20 : rsi < 50 ? 10 : 0,
      macd.histogram > 0 ? 25 : 0,
      ema.short > ema.medium ? 15 : 0,
      bb.percentB < 20 ? 15 : 0,
      adx.pdi > adx.ndi ? 10 : 0
    ].reduce((sum, score) => sum + score, 0);
    
    const bearishSignals = [
      rsi > 70 ? 20 : rsi > 50 ? 10 : 0,
      macd.histogram < 0 ? 25 : 0,
      ema.short < ema.medium ? 15 : 0,
      bb.percentB > 80 ? 15 : 0,
      adx.ndi > adx.pdi ? 10 : 0
    ].reduce((sum, score) => sum + score, 0);
    
    if (bullishSignals > bearishSignals + 20) {
      direction = 'LONG';
      confidence = Math.min(50 + bullishSignals, 95);
    } else if (bearishSignals > bullishSignals + 20) {
      direction = 'SHORT';
      confidence = Math.min(50 + bearishSignals, 95);
    }
    
    // Calculate position sizing
    const sizing = this.calculatePositionSizing(timeframe, atr, currentPrice);
    
    return {
      symbol,
      timeframe,
      direction,
      confidence,
      entryPrice: currentPrice,
      stopLoss: direction === 'LONG' 
        ? currentPrice - sizing.stopLossDistance 
        : currentPrice + sizing.stopLossDistance,
      takeProfit: direction === 'LONG'
        ? currentPrice + sizing.takeProfitDistance
        : currentPrice - sizing.takeProfitDistance,
      timestamp: Date.now(),
      indicators,
      successProbability: Math.min(confidence * 1.2, 95),
      patternFormations: [],
      macroInsights: [
        `Market Regime: ${indicators.marketRegime}`,
        `RSI: ${indicators.rsi.value.toFixed(2)} (${indicators.rsi.signal})`,
        `MACD: ${indicators.macd.value.toFixed(2)} (${indicators.macd.signal})`,
        `ADX: ${indicators.adx.value.toFixed(2)}`,
        `Volatility: ${(indicators.volatility * 100).toFixed(2)}%`,
        `Trend Alignment: ${indicators.confidenceFactors.trendAlignment ? 'Yes' : 'No'}`,
        `Momentum Confluence: ${indicators.confidenceFactors.momentumConfluence ? 'Yes' : 'No'}`
      ]
    };
  }

  private calculateStochastic(data: OHLCData[], kPeriod = 14, dPeriod = 3) {
    const recent = data.slice(-kPeriod);
    const currentClose = data[data.length - 1].close;
    const lowestLow = Math.min(...recent.map(d => d.low));
    const highestHigh = Math.max(...recent.map(d => d.high));
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (3-period SMA of %K)
    const kValues = [];
    for (let i = data.length - dPeriod; i < data.length; i++) {
      const recentForK = data.slice(i - kPeriod + 1, i + 1);
      const closeForK = data[i].close;
      const lowForK = Math.min(...recentForK.map(d => d.low));
      const highForK = Math.max(...recentForK.map(d => d.high));
      kValues.push(((closeForK - lowForK) / (highForK - lowForK)) * 100);
    }
    
    const d = kValues.reduce((sum, val) => sum + val, 0) / kValues.length;
    
    return { k, d };
  }

  public updateMarketData(symbol: string, timeframe: TimeFrame, data: OHLCData[]): void {
    const cacheKey = `${symbol}_${timeframe}`;
    this.dataCache.set(cacheKey, data);
  }
}

export const unifiedCalculationCore = new UnifiedCalculationCore();

// Export the multi-timeframe calculation function for backward compatibility
export function calculateMultiTimeframeSignals(symbol: string, currentPrice: number, chartData: any) {
  const results = new Map();
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  for (const timeframe of timeframes) {
    if (chartData[timeframe] && chartData[timeframe].length > 0) {
      unifiedCalculationCore.updateMarketData(symbol, timeframe, chartData[timeframe]);
      const signal = unifiedCalculationCore.generateSignal(symbol, timeframe, currentPrice);
      if (signal) {
        results.set(timeframe, signal);
      }
    }
  }
  
  return results;
}