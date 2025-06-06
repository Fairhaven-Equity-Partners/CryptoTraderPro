import { ChartData, TimeFrame, AdvancedSignal } from '../types';
import { masterCalculationEngine } from './masterCalculationEngine';
import { TIMEFRAME_MULTIPLIERS, RISK_MULTIPLIERS, ALL_TIMEFRAMES } from './optimizedTypes';

/**
 * Optimized Signal Generation Engine
 * Uses master calculation engine for mathematical efficiency
 */

export class OptimizedSignalEngine {
  private static instance: OptimizedSignalEngine;
  private signalCache = new Map<string, AdvancedSignal>();
  private dataStore = new Map<string, Map<TimeFrame, ChartData[]>>();

  static getInstance(): OptimizedSignalEngine {
    if (!OptimizedSignalEngine.instance) {
      OptimizedSignalEngine.instance = new OptimizedSignalEngine();
    }
    return OptimizedSignalEngine.instance;
  }

  /**
   * Store price data for symbol and timeframe
   */
  updatePriceData(symbol: string, timeframe: TimeFrame, data: ChartData[]): void {
    if (!this.dataStore.has(symbol)) {
      this.dataStore.set(symbol, new Map());
    }
    this.dataStore.get(symbol)!.set(timeframe, data);
  }

  /**
   * Generate optimized trading signal for specific timeframe
   */
  generateSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
    const cacheKey = `${symbol}_${timeframe}_${Math.floor(currentPrice / 10) * 10}`;
    
    if (this.signalCache.has(cacheKey)) {
      return this.signalCache.get(cacheKey)!;
    }

    const data = this.dataStore.get(symbol)?.get(timeframe);
    if (!data || data.length < 50) {
      return this.createNeutralSignal(symbol, timeframe, currentPrice);
    }

    // Calculate all indicators using master engine
    const indicators = this.calculateAllIndicators(data);
    
    // Generate signal using optimized decision algorithm
    const signal = this.generateOptimizedSignal(symbol, timeframe, currentPrice, indicators);
    
    // Cache result
    this.signalCache.set(cacheKey, signal);
    
    return signal;
  }

  /**
   * Calculate all indicators using master calculation engine
   */
  private calculateAllIndicators(data: ChartData[]) {
    const engine = masterCalculationEngine;
    
    return {
      rsi: {
        value: engine.calculateRSI(data, 14),
        signal: this.getRSISignal(engine.calculateRSI(data, 14)),
        strength: this.getRSIStrength(engine.calculateRSI(data, 14)),
        name: 'RSI',
        category: 'MOMENTUM'
      },
      macd: {
        ...engine.calculateMACD(data, 12, 26, 9),
        signal: this.getMACDSignal(engine.calculateMACD(data, 12, 26, 9)),
        strength: this.getMACDStrength(engine.calculateMACD(data, 12, 26, 9)),
        name: 'MACD',
        category: 'MOMENTUM'
      },
      ema: {
        short: engine.calculateEMA(data, 12),
        medium: engine.calculateEMA(data, 26),
        long: engine.calculateEMA(data, 50)
      },
      stochastic: engine.calculateStochastic(data, 14, 3),
      bb: engine.calculateBollingerBands(data, 20, 2),
      adx: engine.calculateADX(data, 14),
      atr: {
        value: engine.calculateATR(data, 14),
        name: 'ATR',
        category: 'VOLATILITY'
      },
      supports: engine.calculateSupportResistance(data).supports,
      resistances: engine.calculateSupportResistance(data).resistances,
      volatility: engine.calculateVolatility(data, 20)
    };
  }

  /**
   * Optimized signal generation algorithm
   */
  private generateOptimizedSignal(
    symbol: string,
    timeframe: TimeFrame,
    currentPrice: number,
    indicators: any
  ): AdvancedSignal {
    
    // Multi-factor signal scoring system
    let bullishScore = 0;
    let bearishScore = 0;
    let confidence = 50;

    // RSI Analysis (Weight: 20%)
    const rsiValue = indicators.rsi.value;
    if (rsiValue < 30) {
      bullishScore += 20;
      confidence += 15;
    } else if (rsiValue > 70) {
      bearishScore += 20;
      confidence += 15;
    } else if (rsiValue < 45) {
      bullishScore += 10;
    } else if (rsiValue > 55) {
      bearishScore += 10;
    }

    // MACD Analysis (Weight: 25%)
    const macdHistogram = indicators.macd.histogram;
    const macdValue = indicators.macd.value;
    if (macdHistogram > 0 && macdValue > 0) {
      bullishScore += 25;
      confidence += 12;
    } else if (macdHistogram < 0 && macdValue < 0) {
      bearishScore += 25;
      confidence += 12;
    }

    // EMA Trend Analysis (Weight: 30%)
    const { short: emaShort, medium: emaMedium, long: emaLong } = indicators.ema;
    if (emaShort > emaMedium && emaMedium > emaLong) {
      bullishScore += 30;
      confidence += 18;
    } else if (emaShort < emaMedium && emaMedium < emaLong) {
      bearishScore += 30;
      confidence += 18;
    }

    // ADX Trend Strength (Weight: 15%)
    const adxValue = indicators.adx.value;
    const pdi = indicators.adx.pdi;
    const ndi = indicators.adx.ndi;
    
    if (adxValue > 25) {
      confidence += 10;
      if (pdi > ndi) {
        bullishScore += 15;
      } else {
        bearishScore += 15;
      }
    }

    // Stochastic Momentum (Weight: 10%)
    const stochK = indicators.stochastic.k;
    if (stochK < 20) {
      bullishScore += 10;
    } else if (stochK > 80) {
      bearishScore += 10;
    }

    // Bollinger Bands Position
    const bbPercentB = indicators.bb.percentB;
    if (bbPercentB < 10) {
      bullishScore += 8;
    } else if (bbPercentB > 90) {
      bearishScore += 8;
    }

    // Determine final direction
    const scoreDifference = bullishScore - bearishScore;
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    
    if (scoreDifference >= 15) {
      direction = 'LONG';
    } else if (scoreDifference <= -15) {
      direction = 'SHORT';
    } else {
      direction = 'NEUTRAL';
    }

    // Apply timeframe multiplier
    confidence = Math.min(95, confidence * (TIMEFRAME_MULTIPLIERS[timeframe] || 1));
    
    // Calculate risk levels
    const riskLevels = this.calculateOptimizedRiskLevels(currentPrice, indicators, timeframe);
    
    // Calculate success probability
    const successProbability = this.calculateSuccessProbability(confidence, timeframe, direction, indicators);

    return {
      direction,
      confidence: Math.round(confidence),
      entryPrice: currentPrice,
      stopLoss: riskLevels.stopLoss,
      takeProfit: riskLevels.takeProfit,
      timeframe,
      timestamp: Date.now(),
      successProbability,
      indicators
    };
  }

  /**
   * Calculate optimized risk levels using ATR and volatility
   */
  private calculateOptimizedRiskLevels(
    currentPrice: number,
    indicators: any,
    timeframe: TimeFrame
  ): { stopLoss: number; takeProfit: number } {
    
    const atr = indicators.atr.value;
    const volatility = indicators.volatility;
    const multiplier = RISK_MULTIPLIERS[timeframe] || 1;
    
    // Dynamic risk calculation based on market conditions
    let riskAmount = atr * multiplier;
    
    // Adjust for volatility
    if (volatility > 0.05) {
      riskAmount *= 1.5; // Increase risk in high volatility
    } else if (volatility < 0.02) {
      riskAmount *= 0.8; // Decrease risk in low volatility
    }

    // Support/Resistance consideration
    const supports = indicators.supports || [];
    const resistances = indicators.resistances || [];
    
    let stopLoss = currentPrice - riskAmount;
    let takeProfit = currentPrice + (riskAmount * 2); // 2:1 risk-reward

    // Adjust based on nearby support/resistance
    if (supports.length > 0) {
      const nearestSupport = supports.find((s: number) => s < currentPrice && currentPrice - s < riskAmount * 2);
      if (nearestSupport) {
        stopLoss = Math.max(stopLoss, nearestSupport * 0.995); // 0.5% below support
      }
    }

    if (resistances.length > 0) {
      const nearestResistance = resistances.find((r: number) => r > currentPrice && r - currentPrice < riskAmount * 3);
      if (nearestResistance) {
        takeProfit = Math.min(takeProfit, nearestResistance * 0.995); // 0.5% below resistance
      }
    }

    return { stopLoss, takeProfit };
  }

  /**
   * Calculate success probability based on multiple factors
   */
  private calculateSuccessProbability(
    confidence: number,
    timeframe: TimeFrame,
    direction: string,
    indicators: any
  ): number {
    
    let probability = confidence * 0.85; // Base conversion
    
    // Timeframe adjustments
    const timeframeBonus = {
      '1m': -5, '5m': -3, '15m': 0, '30m': 2,
      '1h': 5, '4h': 8, '1d': 10, '3d': 12, '1w': 15, '1M': 18
    };
    
    probability += timeframeBonus[timeframe] || 0;
    
    // Market condition adjustments
    const adxValue = indicators.adx?.value || 25;
    if (adxValue > 40) {
      probability += 8; // Strong trend increases probability
    } else if (adxValue < 20) {
      probability -= 5; // Weak trend decreases probability
    }
    
    // Volatility adjustment
    const volatility = indicators.volatility || 0.02;
    if (volatility > 0.08) {
      probability -= 10; // High volatility decreases probability
    } else if (volatility < 0.015) {
      probability += 5; // Low volatility increases probability
    }
    
    // Long-term bias (slight bullish bias for crypto)
    if (direction === 'LONG' && ['1d', '3d', '1w', '1M'].includes(timeframe)) {
      probability += 3;
    }

    return Math.max(25, Math.min(95, Math.round(probability)));
  }

  /**
   * Helper methods for signal classification
   */
  private getRSISignal(rsi: number): string {
    if (rsi < 30) return 'BUY';
    if (rsi > 70) return 'SELL';
    return 'NEUTRAL';
  }

  private getRSIStrength(rsi: number): string {
    if (rsi < 20 || rsi > 80) return 'STRONG';
    if (rsi < 35 || rsi > 65) return 'MODERATE';
    return 'WEAK';
  }

  private getMACDSignal(macd: any): string {
    if (macd.histogram > 0) return 'BUY';
    if (macd.histogram < 0) return 'SELL';
    return 'NEUTRAL';
  }

  private getMACDStrength(macd: any): string {
    const histogramAbs = Math.abs(macd.histogram);
    if (histogramAbs > 200) return 'STRONG';
    if (histogramAbs > 50) return 'MODERATE';
    return 'WEAK';
  }

  /**
   * Create neutral signal when insufficient data
   */
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

  /**
   * Generate signals for all timeframes
   */
  generateAllTimeframeSignals(symbol: string, currentPrice: number): Record<TimeFrame, AdvancedSignal> {
    const results: Partial<Record<TimeFrame, AdvancedSignal>> = {};
    
    for (const timeframe of ALL_TIMEFRAMES) {
      results[timeframe] = this.generateSignal(symbol, timeframe, currentPrice);
    }
    
    return results as Record<TimeFrame, AdvancedSignal>;
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.signalCache.clear();
    masterCalculationEngine.clearCache();
  }

  /**
   * Get system statistics
   */
  getStats(): { signals: number; dataPoints: number; calculations: number } {
    let dataPoints = 0;
    this.dataStore.forEach(symbolData => {
      symbolData.forEach(data => {
        dataPoints += data.length;
      });
    });

    const calculationStats = masterCalculationEngine.getCacheStats();
    
    return {
      signals: this.signalCache.size,
      dataPoints,
      calculations: calculationStats.indicators
    };
  }
}

export const optimizedSignalEngine = OptimizedSignalEngine.getInstance();