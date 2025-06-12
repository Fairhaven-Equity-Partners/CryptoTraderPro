import { ChartData, TimeFrame, AdvancedSignal } from '../types';

/**
 * Market Structure Analysis Engine
 * Advanced market analysis with authentic data validation and accuracy tracking
 */

export class MarketStructureEngine {
  private static instance: MarketStructureEngine;
  private accuracyMetrics = new Map<string, { winRate: number; totalPredictions: number; correctPredictions: number }>();
  private marketRegimeCache = new Map<string, 'TRENDING' | 'RANGING' | 'VOLATILE'>();

  static getInstance(): MarketStructureEngine {
    if (!MarketStructureEngine.instance) {
      MarketStructureEngine.instance = new MarketStructureEngine();
    }
    return MarketStructureEngine.instance;
  }

  /**
   * Analyze market structure using authentic price data
   */
  analyzeMarketStructure(data: ChartData[], symbol: string, timeframe: TimeFrame): {
    regime: 'TRENDING' | 'RANGING' | 'VOLATILE';
    strength: number;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    supportLevels: number[];
    resistanceLevels: number[];
    volumeProfile: 'STRONG' | 'WEAK' | 'NORMAL';
  } {
    if (!data || data.length < 50) {
      return {
        regime: 'RANGING',
        strength: 0,
        bias: 'NEUTRAL',
        supportLevels: [],
        resistanceLevels: [],
        volumeProfile: 'NORMAL'
      };
    }

    const regime = this.detectMarketRegime(data);
    const bias = this.calculateMarketBias(data);
    const supportResistance = this.findKeyLevels(data);
    const volumeProfile = this.analyzeVolumeStrength(data);
    const strength = this.calculateStructureStrength(data, regime);

    return {
      regime,
      strength,
      bias,
      supportLevels: supportResistance.supports,
      resistanceLevels: supportResistance.resistances,
      volumeProfile
    };
  }

  /**
   * Detect market regime using price action analysis
   */
  private detectMarketRegime(data: ChartData[]): 'TRENDING' | 'RANGING' | 'VOLATILE' {
    const period = Math.min(50, data.length);
    const recent = data.slice(-period);
    
    // Calculate ATR for volatility
    let atrSum = 0;
    for (let i = 1; i < recent.length; i++) {
      const current = recent[i];
      const previous = recent[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      atrSum += tr;
    }
    const avgTrueRange = atrSum / (recent.length - 1);
    const currentPrice = recent[recent.length - 1].close;
    const volatilityRatio = avgTrueRange / currentPrice;

    // High volatility threshold
    if (volatilityRatio > 0.04) {
      return 'VOLATILE';
    }

    // Trend detection using linear regression
    const prices = recent.map(candle => candle.close);
    const { slope, r2 } = this.calculateLinearRegression(prices);
    
    // Strong trend if R² > 0.7 and significant slope
    if (r2 > 0.7 && Math.abs(slope) > currentPrice * 0.001) {
      return 'TRENDING';
    }

    return 'RANGING';
  }

  /**
   * Calculate market bias using multiple factors
   */
  private calculateMarketBias(data: ChartData[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const recent = data.slice(-20);
    const older = data.slice(-40, -20);
    
    if (recent.length < 10 || older.length < 10) return 'NEUTRAL';

    // Price momentum
    const recentAvg = recent.reduce((sum, candle) => sum + candle.close, 0) / recent.length;
    const olderAvg = older.reduce((sum, candle) => sum + candle.close, 0) / older.length;
    const priceMomentum = (recentAvg - olderAvg) / olderAvg;

    // Volume-weighted analysis
    const recentVolumeWeightedPrice = recent.reduce((sum, candle) => 
      sum + (candle.close * candle.volume), 0) / recent.reduce((sum, candle) => sum + candle.volume, 0);
    const olderVolumeWeightedPrice = older.reduce((sum, candle) => 
      sum + (candle.close * candle.volume), 0) / older.reduce((sum, candle) => sum + candle.volume, 0);
    const vwapMomentum = (recentVolumeWeightedPrice - olderVolumeWeightedPrice) / olderVolumeWeightedPrice;

    // Higher highs and higher lows analysis
    const recentHighs = recent.map(c => c.high);
    const recentLows = recent.map(c => c.low);
    const olderHighs = older.map(c => c.high);
    const olderLows = older.map(c => c.low);
    
    const highsImproving = Math.max(...recentHighs) > Math.max(...olderHighs);
    const lowsImproving = Math.min(...recentLows) > Math.min(...olderLows);

    // Combine factors
    let bullishPoints = 0;
    let bearishPoints = 0;

    if (priceMomentum > 0.02) bullishPoints += 2;
    else if (priceMomentum < -0.02) bearishPoints += 2;

    if (vwapMomentum > 0.015) bullishPoints += 2;
    else if (vwapMomentum < -0.015) bearishPoints += 2;

    if (highsImproving && lowsImproving) bullishPoints += 2;
    else if (!highsImproving && !lowsImproving) bearishPoints += 2;

    if (bullishPoints >= 4) return 'BULLISH';
    if (bearishPoints >= 4) return 'BEARISH';
    return 'NEUTRAL';
  }

  /**
   * Find key support and resistance levels
   */
  private findKeyLevels(data: ChartData[]): { supports: number[]; resistances: number[] } {
    const period = Math.min(100, data.length);
    const recent = data.slice(-period);
    
    const supports: number[] = [];
    const resistances: number[] = [];
    
    // Find swing highs and lows
    for (let i = 2; i < recent.length - 2; i++) {
      const current = recent[i];
      
      // Swing high
      if (current.high > recent[i-1].high && current.high > recent[i-2].high &&
          current.high > recent[i+1].high && current.high > recent[i+2].high) {
        resistances.push(current.high);
      }
      
      // Swing low
      if (current.low < recent[i-1].low && current.low < recent[i-2].low &&
          current.low < recent[i+1].low && current.low < recent[i+2].low) {
        supports.push(current.low);
      }
    }

    // Remove duplicates and sort
    const uniqueSupports = Array.from(new Set(supports)).sort((a, b) => b - a).slice(0, 3);
    const uniqueResistances = Array.from(new Set(resistances)).sort((a, b) => a - b).slice(0, 3);

    return {
      supports: uniqueSupports,
      resistances: uniqueResistances
    };
  }

  /**
   * Analyze volume strength
   */
  private analyzeVolumeStrength(data: ChartData[]): 'STRONG' | 'WEAK' | 'NORMAL' {
    const period = Math.min(20, data.length);
    const recent = data.slice(-period);
    
    if (recent.length < 10) return 'NORMAL';

    const avgVolume = recent.reduce((sum, candle) => sum + candle.volume, 0) / recent.length;
    const recentVolume = recent.slice(-5).reduce((sum, candle) => sum + candle.volume, 0) / 5;
    
    const volumeRatio = recentVolume / avgVolume;
    
    if (volumeRatio > 1.5) return 'STRONG';
    if (volumeRatio < 0.7) return 'WEAK';
    return 'NORMAL';
  }

  /**
   * Calculate structure strength
   */
  private calculateStructureStrength(data: ChartData[], regime: string): number {
    const recent = data.slice(-30);
    if (recent.length < 10) return 0;

    let strength = 50; // Base strength

    // Trend consistency
    if (regime === 'TRENDING') {
      const prices = recent.map(c => c.close);
      const { r2 } = this.calculateLinearRegression(prices);
      strength += r2 * 30; // Add up to 30 points for strong trend
    }

    // Volume confirmation
    const volumeProfile = this.analyzeVolumeStrength(recent);
    if (volumeProfile === 'STRONG') strength += 15;
    else if (volumeProfile === 'WEAK') strength -= 10;

    return Math.min(100, Math.max(0, strength));
  }

  /**
   * Linear regression calculation
   */
  private calculateLinearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    const sumYY = values.reduce((sum, val) => sum + (val * val), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const r2 = 1 - (ssResidual / ssTotal);

    return { slope, intercept, r2: Math.max(0, r2) };
  }

  /**
   * Update prediction accuracy for feedback loop
   */
  updateAccuracy(symbol: string, timeframe: TimeFrame, wasCorrect: boolean): void {
    const key = `${symbol}_${timeframe`}`;
    const current = this.accuracyMetrics.get(key) || { 
      winRate: 0, 
      totalPredictions: 0, 
      correctPredictions: 0 
    };

    current.totalPredictions += 1;
    if (wasCorrect) current.correctPredictions += 1;
    current.winRate = (current.correctPredictions / current.totalPredictions) * 100;

    this.accuracyMetrics.set(key, current);
  }

  /**
   * Get accuracy metrics
   */
  getAccuracyMetrics(symbol: string, timeframe: TimeFrame): { winRate: number; totalPredictions: number } {
    const key = `${symbol}_${timeframe`}`;
    const metrics = this.accuracyMetrics.get(key) || { winRate: 0, totalPredictions: 0, correctPredictions: 0 };
    return { winRate: metrics.winRate, totalPredictions: metrics.totalPredictions };
  }
}

export const marketStructureEngine = MarketStructureEngine.getInstance();