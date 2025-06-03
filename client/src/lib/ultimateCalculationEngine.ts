import { ChartData, TimeFrame, AdvancedSignal } from '../types';

/**
 * Ultimate Calculation Engine - Final optimized system
 * Single source of truth for all mathematical calculations
 * Eliminates code duplication and maximizes performance
 */

const TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

const TIMEFRAME_CONFIDENCE_MULTIPLIERS: Record<TimeFrame, number> = {
  '1m': 0.85,
  '5m': 0.90,
  '15m': 0.95,
  '30m': 1.00,
  '1h': 1.05,
  '4h': 1.10,
  '1d': 1.15,
  '3d': 1.20,
  '1w': 1.25,
  '1M': 1.30
};

const RISK_MULTIPLIERS: Record<TimeFrame, number> = {
  '1m': 0.5,
  '5m': 0.8,
  '15m': 1.0,
  '30m': 1.2,
  '1h': 1.5,
  '4h': 2.0,
  '1d': 2.5,
  '3d': 3.0,
  '1w': 4.0,
  '1M': 5.0
};

export class UltimateCalculationEngine {
  private static instance: UltimateCalculationEngine;
  private cache = new Map<string, any>();
  private dataStore = new Map<string, Map<TimeFrame, ChartData[]>>();

  static getInstance(): UltimateCalculationEngine {
    if (!UltimateCalculationEngine.instance) {
      UltimateCalculationEngine.instance = new UltimateCalculationEngine();
    }
    return UltimateCalculationEngine.instance;
  }

  // Store market data
  updateMarketData(symbol: string, timeframe: TimeFrame, data: ChartData[]): void {
    if (!this.dataStore.has(symbol)) {
      this.dataStore.set(symbol, new Map());
    }
    this.dataStore.get(symbol)!.set(timeframe, data);
  }

  // Calculate RSI with Wilder's smoothing
  private calculateRSI(data: ChartData[], period: number = 14): number {
    if (data.length < period + 1) return 50;
    
    const cacheKey = `rsi_${data.length}_${period}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);

      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    this.cache.set(cacheKey, rsi);
    return rsi;
  }

  // Calculate EMA
  private calculateEMA(data: ChartData[], period: number): number {
    if (data.length < period) return data[data.length - 1].close;
    
    const cacheKey = `ema_${data.length}_${period}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const alpha = 2 / (period + 1);
    let ema = data[0].close;

    for (let i = 1; i < data.length; i++) {
      ema = alpha * data[i].close + (1 - alpha) * ema;
    }

    this.cache.set(cacheKey, ema);
    return ema;
  }

  // Calculate MACD
  private calculateMACD(data: ChartData[], fast: number = 12, slow: number = 26, signal: number = 9) {
    if (data.length < slow) return { value: 0, signal: 0, histogram: 0 };
    
    const cacheKey = `macd_${data.length}_${fast}_${slow}_${signal}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const fastEMA = this.calculateEMA(data, fast);
    const slowEMA = this.calculateEMA(data, slow);
    const macdLine = fastEMA - slowEMA;
    const signalLine = macdLine * 0.9; // Simplified signal
    const histogram = macdLine - signalLine;

    const result = { value: macdLine, signal: signalLine, histogram };
    this.cache.set(cacheKey, result);
    return result;
  }

  // Calculate Stochastic
  private calculateStochastic(data: ChartData[], kPeriod: number = 14, dPeriod: number = 3) {
    if (data.length < kPeriod) return { k: 50, d: 50 };
    
    const cacheKey = `stoch_${data.length}_${kPeriod}_${dPeriod}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const recent = data.slice(-kPeriod);
    const currentClose = data[data.length - 1].close;
    
    let lowestLow = recent[0].low;
    let highestHigh = recent[0].high;

    for (const candle of recent) {
      lowestLow = Math.min(lowestLow, candle.low);
      highestHigh = Math.max(highestHigh, candle.high);
    }

    const range = highestHigh - lowestLow;
    const k = range === 0 ? 50 : ((currentClose - lowestLow) / range) * 100;
    const d = k; // Simplified for performance

    const result = { k, d };
    this.cache.set(cacheKey, result);
    return result;
  }

  // Calculate Bollinger Bands
  private calculateBollingerBands(data: ChartData[], period: number = 20, stdDev: number = 2) {
    if (data.length < period) {
      const price = data[data.length - 1].close;
      return { upper: price * 1.02, middle: price, lower: price * 0.98, width: 0.04, percentB: 50 };
    }

    const cacheKey = `bb_${data.length}_${period}_${stdDev}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const recent = data.slice(-period);
    const sma = recent.reduce((sum, item) => sum + item.close, 0) / period;
    
    const variance = recent.reduce((sum, item) => {
      const diff = item.close - sma;
      return sum + diff * diff;
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    const currentPrice = data[data.length - 1].close;
    
    const upper = sma + (stdDev * standardDeviation);
    const lower = sma - (stdDev * standardDeviation);
    const width = (upper - lower) / sma;
    const percentB = upper === lower ? 50 : ((currentPrice - lower) / (upper - lower)) * 100;

    const result = { upper, middle: sma, lower, width, percentB };
    this.cache.set(cacheKey, result);
    return result;
  }

  // Calculate ADX
  private calculateADX(data: ChartData[], period: number = 14) {
    if (data.length < period + 1) return { value: 25, pdi: 25, ndi: 25 };
    
    const cacheKey = `adx_${data.length}_${period}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    // Simplified ADX calculation for performance
    const recent = data.slice(-period);
    let upMove = 0;
    let downMove = 0;

    for (let i = 1; i < recent.length; i++) {
      const up = recent[i].high - recent[i - 1].high;
      const down = recent[i - 1].low - recent[i].low;
      
      if (up > down && up > 0) upMove += up;
      if (down > up && down > 0) downMove += down;
    }

    const pdi = (upMove / recent.length) * 100;
    const ndi = (downMove / recent.length) * 100;
    const adx = Math.abs(pdi - ndi);

    const result = { value: adx, pdi, ndi };
    this.cache.set(cacheKey, result);
    return result;
  }

  // Calculate ATR
  private calculateATR(data: ChartData[], period: number = 14): number {
    if (data.length < period + 1) return data[data.length - 1].close * 0.02;
    
    const cacheKey = `atr_${data.length}_${period}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    let trSum = 0;
    for (let i = 1; i <= period; i++) {
      const current = data[data.length - i];
      const previous = data[data.length - i - 1];
      
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      
      trSum += tr;
    }

    const atr = trSum / period;
    this.cache.set(cacheKey, atr);
    return atr;
  }

  // Generate complete signal for timeframe
  generateSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
    const data = this.dataStore.get(symbol)?.get(timeframe);
    if (!data || data.length < 50) {
      return this.createNeutralSignal(symbol, timeframe, currentPrice);
    }

    // Calculate all indicators
    const rsi = this.calculateRSI(data, 14);
    const macd = this.calculateMACD(data, 12, 26, 9);
    const ema = {
      short: this.calculateEMA(data, 12),
      medium: this.calculateEMA(data, 26),
      long: this.calculateEMA(data, 50)
    };
    const stochastic = this.calculateStochastic(data, 14, 3);
    const bb = this.calculateBollingerBands(data, 20, 2);
    const adx = this.calculateADX(data, 14);
    const atr = this.calculateATR(data, 14);

    // Signal scoring system
    let bullishScore = 0;
    let bearishScore = 0;
    let confidence = 50;

    // RSI analysis
    if (rsi < 30) {
      bullishScore += 20;
      confidence += 15;
    } else if (rsi > 70) {
      bearishScore += 20;
      confidence += 15;
    } else if (rsi < 45) {
      bullishScore += 10;
    } else if (rsi > 55) {
      bearishScore += 10;
    }

    // MACD analysis
    if (macd.histogram > 0) {
      bullishScore += 25;
      confidence += 12;
    } else if (macd.histogram < 0) {
      bearishScore += 25;
      confidence += 12;
    }

    // EMA trend analysis
    if (ema.short > ema.medium && ema.medium > ema.long) {
      bullishScore += 30;
      confidence += 18;
    } else if (ema.short < ema.medium && ema.medium < ema.long) {
      bearishScore += 30;
      confidence += 18;
    }

    // ADX strength
    if (adx.value > 25) {
      confidence += 10;
      if (adx.pdi > adx.ndi) {
        bullishScore += 15;
      } else {
        bearishScore += 15;
      }
    }

    // Stochastic
    if (stochastic.k < 20) {
      bullishScore += 10;
    } else if (stochastic.k > 80) {
      bearishScore += 10;
    }

    // Determine direction
    const scoreDiff = bullishScore - bearishScore;
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    
    if (scoreDiff >= 15) direction = 'LONG';
    else if (scoreDiff <= -15) direction = 'SHORT';
    else direction = 'NEUTRAL';

    // Apply timeframe multiplier
    confidence *= TIMEFRAME_CONFIDENCE_MULTIPLIERS[timeframe];
    confidence = Math.min(95, Math.max(30, confidence));

    // Calculate risk levels
    const riskAmount = atr * RISK_MULTIPLIERS[timeframe];
    const stopLoss = currentPrice - riskAmount;
    const takeProfit = currentPrice + (riskAmount * 2);

    // Success probability
    let successProbability = confidence * 0.85;
    if (['1d', '3d', '1w', '1M'].includes(timeframe) && direction === 'LONG') {
      successProbability += 5;
    }
    successProbability = Math.min(95, Math.max(25, successProbability));

    return {
      direction,
      confidence: Math.round(confidence),
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      timeframe,
      timestamp: Date.now(),
      successProbability: Math.round(successProbability),
      indicators: {
        rsi: {
          value: rsi,
          signal: rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : 'NEUTRAL',
          strength: rsi < 20 || rsi > 80 ? 'STRONG' : 'MODERATE',
          name: 'RSI',
          category: 'MOMENTUM'
        },
        macd: {
          ...macd,
          signal: macd.histogram > 0 ? 'BUY' : 'SELL',
          strength: Math.abs(macd.histogram) > 100 ? 'STRONG' : 'MODERATE',
          name: 'MACD',
          category: 'MOMENTUM'
        },
        ema,
        stochastic,
        bb,
        adx,
        atr: { value: atr },
        supports: [],
        resistances: [],
        volatility: atr / currentPrice
      }
    };
  }

  // Generate signals for all timeframes
  generateAllSignals(symbol: string, currentPrice: number): Record<TimeFrame, AdvancedSignal> {
    const signals: Partial<Record<TimeFrame, AdvancedSignal>> = {};
    
    for (const timeframe of TIMEFRAMES) {
      signals[timeframe] = this.generateSignal(symbol, timeframe, currentPrice);
    }
    
    return signals as Record<TimeFrame, AdvancedSignal>;
  }

  // Create neutral signal
  private createNeutralSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
    return {
      direction: 'NEUTRAL',
      confidence: 50,
      entryPrice: currentPrice,
      stopLoss: currentPrice * 0.98,
      takeProfit: currentPrice * 1.04,
      timeframe,
      timestamp: Date.now(),
      successProbability: 50,
      indicators: {}
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get system statistics
  getStats() {
    let dataPoints = 0;
    this.dataStore.forEach(symbolData => {
      symbolData.forEach(data => {
        dataPoints += data.length;
      });
    });

    return {
      cacheSize: this.cache.size,
      dataPoints,
      symbols: this.dataStore.size
    };
  }
}

export const ultimateCalculationEngine = UltimateCalculationEngine.getInstance();