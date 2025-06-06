import { ChartData, TimeFrame, AdvancedSignal } from '../types';
import { marketStructureEngine } from './marketStructureEngine';

/**
 * Ultimate Calculation Engine - Final optimized system
 * Single source of truth for all mathematical calculations
 * Eliminates code duplication and maximizes performance
 */

const TIMEFRAMES: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

const TIMEFRAME_CONFIDENCE_MULTIPLIERS: Record<TimeFrame, number> = {
  '1m': 0.75,   // Lower weight for high noise
  '5m': 0.82,   // Reduced noise but still short-term
  '15m': 0.90,  // Better signal quality
  '30m': 0.95,  // Good balance of signal/noise
  '1h': 1.00,   // Baseline timeframe
  '4h': 1.15,   // Higher reliability for trend analysis
  '1d': 1.25,   // Strong trend signals
  '3d': 1.35,   // Very reliable medium-term trends
  '1w': 1.45,   // Excellent long-term trend accuracy
  '1M': 1.55    // Maximum weight for strongest trends
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
  private predictionAccuracy = new Map<string, { correct: number; total: number; winRate: number }>();
  private adaptiveWeights = new Map<string, number>();

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

  // Update prediction accuracy for feedback loop
  updatePredictionAccuracy(symbol: string, timeframe: TimeFrame, wasCorrect: boolean): void {
    const key = `${symbol}_${timeframe}`;
    const current = this.predictionAccuracy.get(key) || { correct: 0, total: 0, winRate: 0 };
    
    current.total += 1;
    if (wasCorrect) current.correct += 1;
    current.winRate = (current.correct / current.total) * 100;
    
    this.predictionAccuracy.set(key, current);
    
    // Adaptive weight adjustment based on accuracy
    const weight = Math.max(0.5, Math.min(1.5, current.winRate / 70)); // Target 70% accuracy
    this.adaptiveWeights.set(key, weight);
  }

  // Get adaptive weight for symbol-timeframe combination
  private getAdaptiveWeight(symbol: string, timeframe: TimeFrame): number {
    const key = `${symbol}_${timeframe}`;
    return this.adaptiveWeights.get(key) || 1.0;
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
    // Adjust minimum data requirements for different timeframes
    const minRequiredPoints = timeframe === '1M' ? 12 : timeframe === '1w' ? 20 : 50;
    if (!data || data.length < minRequiredPoints) {
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

    // RSI analysis with enhanced weighting
    if (rsi < 20) {
      bullishScore += 35;  // Extremely oversold - strong buy signal
      confidence += 25;
    } else if (rsi < 30) {
      bullishScore += 25;  // Oversold condition
      confidence += 18;
    } else if (rsi > 80) {
      bearishScore += 35;  // Extremely overbought - strong sell signal
      confidence += 25;
    } else if (rsi > 70) {
      bearishScore += 25;  // Overbought condition
      confidence += 18;
    } else if (rsi < 40) {
      bullishScore += 12;  // Slightly bearish momentum
    } else if (rsi > 60) {
      bearishScore += 12;  // Slightly bullish momentum
    }

    // MACD analysis with momentum consideration
    const macdStrength = Math.abs(macd.histogram);
    if (macd.histogram > 0) {
      if (macdStrength > currentPrice * 0.005) {  // Strong momentum
        bullishScore += 35;
        confidence += 20;
      } else {
        bullishScore += 20;
        confidence += 12;
      }
    } else if (macd.histogram < 0) {
      if (macdStrength > currentPrice * 0.005) {  // Strong momentum
        bearishScore += 35;
        confidence += 20;
      } else {
        bearishScore += 20;
        confidence += 12;
      }
    }

    // EMA trend analysis with price proximity weighting
    const priceToShortEMA = Math.abs(currentPrice - ema.short) / currentPrice;
    const trendStrength = priceToShortEMA < 0.02 ? 1.5 : 1.0;  // Stronger signal when price is close to EMA
    
    if (ema.short > ema.medium && ema.medium > ema.long) {
      const trendScore = Math.floor(30 * trendStrength);
      bullishScore += trendScore;
      confidence += Math.floor(18 * trendStrength);
    } else if (ema.short < ema.medium && ema.medium < ema.long) {
      const trendScore = Math.floor(30 * trendStrength);
      bearishScore += trendScore;
      confidence += Math.floor(18 * trendStrength);
    }

    // ADX strength with enhanced trend confirmation
    if (adx.value > 30) {
      confidence += 18;  // Strong trend
      if (adx.pdi > adx.ndi) {
        bullishScore += 25;
      } else {
        bearishScore += 25;
      }
    } else if (adx.value > 20) {
      confidence += 10;  // Moderate trend
      if (adx.pdi > adx.ndi) {
        bullishScore += 12;
      } else {
        bearishScore += 12;
      }
    }

    // Bollinger Bands position analysis
    if (bb.percentB < 5) {
      bullishScore += 20;  // Extreme oversold
      confidence += 15;
    } else if (bb.percentB < 20) {
      bullishScore += 10;  // Oversold
    } else if (bb.percentB > 95) {
      bearishScore += 20;  // Extreme overbought
      confidence += 15;
    } else if (bb.percentB > 80) {
      bearishScore += 10;  // Overbought
    }

    // Volatility analysis for risk adjustment
    const volatilityRatio = atr / currentPrice;
    if (volatilityRatio > 0.03) {
      confidence -= 10;  // High volatility reduces confidence
    } else if (volatilityRatio < 0.01) {
      confidence += 8;   // Low volatility increases confidence
    }

    // Stochastic with momentum confirmation
    if (stochastic.k < 20 && stochastic.d < 20) {
      bullishScore += 15;  // Double confirmation oversold
      confidence += 10;
    } else if (stochastic.k < 20) {
      bullishScore += 8;
    } else if (stochastic.k > 80 && stochastic.d > 80) {
      bearishScore += 15;  // Double confirmation overbought
      confidence += 10;
    } else if (stochastic.k > 80) {
      bearishScore += 8;
    }

    // Market structure analysis using authentic data
    const marketStructure = marketStructureEngine.analyzeMarketStructure(data, symbol, timeframe);
    
    // Apply market structure bias
    if (marketStructure.bias === 'BULLISH') {
      bullishScore += Math.floor(marketStructure.strength * 0.3);
      confidence += Math.floor(marketStructure.strength * 0.15);
    } else if (marketStructure.bias === 'BEARISH') {
      bearishScore += Math.floor(marketStructure.strength * 0.3);
      confidence += Math.floor(marketStructure.strength * 0.15);
    }

    // Volume profile confirmation
    if (marketStructure.volumeProfile === 'STRONG') {
      confidence += 12;
      if (marketStructure.bias === 'BULLISH') bullishScore += 15;
      else if (marketStructure.bias === 'BEARISH') bearishScore += 15;
    } else if (marketStructure.volumeProfile === 'WEAK') {
      confidence -= 8;
    }

    // Market regime adjustment
    if (marketStructure.regime === 'TRENDING') {
      confidence += 10;
    } else if (marketStructure.regime === 'VOLATILE') {
      confidence -= 15; // Reduce confidence in volatile markets
    }

    // Determine direction with enhanced thresholds
    const scoreDiff = bullishScore - bearishScore;
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    
    if (scoreDiff >= 20) direction = 'LONG';
    else if (scoreDiff <= -20) direction = 'SHORT';
    else direction = 'NEUTRAL';

    // Apply timeframe multiplier and adaptive weight
    const adaptiveWeight = this.getAdaptiveWeight(symbol, timeframe);
    confidence *= TIMEFRAME_CONFIDENCE_MULTIPLIERS[timeframe] * adaptiveWeight;
    confidence = Math.min(95, Math.max(30, confidence));

    // Calculate risk levels with support/resistance integration
    const supportResistance = this.analyzeSupportResistance(data, currentPrice);
    const riskAmount = atr * RISK_MULTIPLIERS[timeframe];
    
    let stopLoss: number;
    let takeProfit: number;
    
    if (direction === 'LONG') {
      // Use nearest support for stop loss if available
      const nearestSupport = supportResistance.supports[0];
      stopLoss = nearestSupport && nearestSupport > currentPrice * 0.95 ? 
        nearestSupport * 0.998 : currentPrice - riskAmount;
      
      // Use nearest resistance for take profit if available
      const nearestResistance = supportResistance.resistances[0];
      takeProfit = nearestResistance && nearestResistance < currentPrice * 1.1 ? 
        nearestResistance * 0.998 : currentPrice + (riskAmount * 2);
    } else if (direction === 'SHORT') {
      // Use nearest resistance for stop loss if available
      const nearestResistance = supportResistance.resistances[0];
      stopLoss = nearestResistance && nearestResistance < currentPrice * 1.05 ? 
        nearestResistance * 1.002 : currentPrice + riskAmount;
      
      // Use nearest support for take profit if available
      const nearestSupport = supportResistance.supports[0];
      takeProfit = nearestSupport && nearestSupport > currentPrice * 0.9 ? 
        nearestSupport * 1.002 : currentPrice - (riskAmount * 2);
    } else {
      stopLoss = currentPrice * 0.98;
      takeProfit = currentPrice * 1.04;
    }

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
        supports: supportResistance.supports,
        resistances: supportResistance.resistances,
        volatility: atr / currentPrice,
        marketStructure: {
          regime: marketStructure.regime,
          bias: marketStructure.bias,
          strength: marketStructure.strength,
          volumeProfile: marketStructure.volumeProfile
        }
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

  // Support and resistance analysis for risk management
  private analyzeSupportResistance(data: ChartData[], currentPrice: number): { supports: number[]; resistances: number[] } {
    if (data.length < 50) return { supports: [], resistances: [] };
    
    const period = Math.min(100, data.length);
    const recent = data.slice(-period);
    
    const supports: number[] = [];
    const resistances: number[] = [];
    
    // Find swing highs and lows with volume confirmation
    for (let i = 3; i < recent.length - 3; i++) {
      const current = recent[i];
      const avgVolume = recent.slice(i-3, i+4).reduce((sum, candle) => sum + candle.volume, 0) / 7;
      
      // Swing high with volume
      if (current.high > recent[i-1].high && current.high > recent[i-2].high && current.high > recent[i-3].high &&
          current.high > recent[i+1].high && current.high > recent[i+2].high && current.high > recent[i+3].high &&
          current.volume > avgVolume * 1.2) {
        resistances.push(current.high);
      }
      
      // Swing low with volume
      if (current.low < recent[i-1].low && current.low < recent[i-2].low && current.low < recent[i-3].low &&
          current.low < recent[i+1].low && current.low < recent[i+2].low && current.low < recent[i+3].low &&
          current.volume > avgVolume * 1.2) {
        supports.push(current.low);
      }
    }

    // Filter levels near current price (within 5%)
    const priceRange = currentPrice * 0.05;
    const nearSupports = supports.filter(level => Math.abs(currentPrice - level) <= priceRange && level < currentPrice);
    const nearResistances = resistances.filter(level => Math.abs(currentPrice - level) <= priceRange && level > currentPrice);

    return {
      supports: nearSupports.sort((a, b) => b - a).slice(0, 3),
      resistances: nearResistances.sort((a, b) => a - b).slice(0, 3)
    };
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
      symbols: this.dataStore.size,
      accuracyTracking: this.predictionAccuracy.size,
      adaptiveWeights: this.adaptiveWeights.size
    };
  }
}

export const ultimateCalculationEngine = UltimateCalculationEngine.getInstance();