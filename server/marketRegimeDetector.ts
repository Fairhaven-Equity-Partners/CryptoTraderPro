/**
 * MARKET REGIME DETECTOR
 * Advanced market regime classification for optimal indicator weighting
 * Bull/Bear/Sideways/Volatile detection with confidence scoring
 */

import { BigNumber } from 'bignumber.js';

export enum MarketRegime {
  BULL_TREND = 'bull',
  BEAR_TREND = 'bear',
  SIDEWAYS = 'sideways',
  HIGH_VOLATILITY = 'volatile',
  LOW_VOLATILITY = 'stable'
}

interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number;
  trendStrength: number;
  volatilityLevel: number;
  momentum: number;
  reasoning: string[];
}

export class MarketRegimeDetector {
  private minDataPoints: number = 20;
  private trendThreshold: number = 0.6;
  private volatilityThreshold: { high: number; low: number } = { high: 0.15, low: 0.05 };

  /**
   * Detect market regime from price data
   */
  public detectRegime(priceData: PriceData[], timeframe: string = '4h'): RegimeAnalysis {
    if (priceData.length < this.minDataPoints) {
      return this.getDefaultRegime();
    }

    const trendAnalysis = this.analyzeTrend(priceData);
    const volatilityAnalysis = this.analyzeVolatility(priceData);
    const momentumAnalysis = this.analyzeMomentum(priceData);
    
    const regime = this.classifyRegime(trendAnalysis, volatilityAnalysis, timeframe);
    const confidence = this.calculateConfidence(trendAnalysis, volatilityAnalysis, momentumAnalysis);
    const reasoning = this.generateReasoning(regime, trendAnalysis, volatilityAnalysis, momentumAnalysis);

    return {
      regime,
      confidence,
      trendStrength: trendAnalysis.strength,
      volatilityLevel: volatilityAnalysis.level,
      momentum: momentumAnalysis.strength,
      reasoning
    };
  }

  /**
   * Analyze trend strength and direction
   */
  private analyzeTrend(priceData: PriceData[]): {
    direction: 'up' | 'down' | 'neutral';
    strength: number;
    consistency: number;
  } {
    const prices = priceData.map(d => d.close);
    const periods = [5, 10, 20]; // Short, medium, long term trends
    
    const trendScores = periods.map(period => {
      if (prices.length < period) return 0;
      
      const recentPrices = prices.slice(-period);
      const slope = this.calculateLinearRegression(recentPrices).slope;
      return slope;
    });

    // Calculate weighted trend strength
    const weights = [0.5, 0.3, 0.2]; // More weight on recent trends
    const weightedTrend = trendScores.reduce((sum, score, i) => sum + score * weights[i], 0);
    
    // Calculate trend consistency (how aligned are different timeframes)
    const avgTrend = trendScores.reduce((sum, score) => sum + score, 0) / trendScores.length;
    const variance = trendScores.reduce((sum, score) => sum + Math.pow(score - avgTrend, 2), 0) / trendScores.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance));

    const direction = weightedTrend > 0.001 ? 'up' : weightedTrend < -0.001 ? 'down' : 'neutral';
    const strength = Math.abs(weightedTrend) * 1000; // Scale for readability

    return { direction, strength, consistency };
  }

  /**
   * Analyze volatility level
   */
  private analyzeVolatility(priceData: PriceData[]): {
    level: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    normalizedLevel: number;
  } {
    const returns = this.calculateReturns(priceData.map(d => d.close));
    const currentVolatility = this.calculateVolatility(returns);
    
    // Calculate volatility trend over different periods
    const periods = [5, 10, 15];
    const volatilityTrend = periods.map(period => {
      if (returns.length < period * 2) return 0;
      
      const recentVol = this.calculateVolatility(returns.slice(-period));
      const previousVol = this.calculateVolatility(returns.slice(-period * 2, -period));
      
      return recentVol - previousVol;
    });

    const avgVolTrend = volatilityTrend.reduce((sum, trend) => sum + trend, 0) / volatilityTrend.length;
    const trend = avgVolTrend > 0.01 ? 'increasing' : avgVolTrend < -0.01 ? 'decreasing' : 'stable';
    
    // Normalize volatility (typical crypto volatility ranges from 0.02 to 0.3)
    const normalizedLevel = Math.min(1, currentVolatility / 0.3);

    return { level: currentVolatility, trend, normalizedLevel };
  }

  /**
   * Analyze momentum strength
   */
  private analyzeMomentum(priceData: PriceData[]): {
    strength: number;
    direction: 'bullish' | 'bearish' | 'neutral';
    acceleration: number;
  } {
    const prices = priceData.map(d => d.close);
    const volumes = priceData.map(d => d.volume);
    
    // Price momentum using rate of change
    const shortRoc = this.calculateRateOfChange(prices, 5);
    const longRoc = this.calculateRateOfChange(prices, 15);
    
    // Volume-weighted momentum
    const recentVolume = volumes.slice(-5).reduce((sum, v) => sum + v, 0) / 5;
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeRatio = recentVolume / avgVolume;
    
    // Momentum strength combining price and volume
    const rawMomentum = (shortRoc + longRoc) / 2;
    const strength = Math.abs(rawMomentum) * volumeRatio;
    
    // Momentum acceleration (change in momentum)
    const acceleration = shortRoc - longRoc;
    
    const direction = rawMomentum > 0.005 ? 'bullish' : rawMomentum < -0.005 ? 'bearish' : 'neutral';

    return { strength, direction, acceleration };
  }

  /**
   * Classify regime based on analysis
   */
  private classifyRegime(
    trend: { direction: string; strength: number; consistency: number },
    volatility: { normalizedLevel: number; trend: string },
    timeframe: string
  ): MarketRegime {
    // Adjust thresholds based on timeframe
    const timeframeMultiplier = this.getTimeframeMultiplier(timeframe);
    const adjustedTrendThreshold = this.trendThreshold * timeframeMultiplier;
    
    // High volatility override
    if (volatility.normalizedLevel > this.volatilityThreshold.high) {
      return MarketRegime.HIGH_VOLATILITY;
    }
    
    // Low volatility override
    if (volatility.normalizedLevel < this.volatilityThreshold.low) {
      return MarketRegime.LOW_VOLATILITY;
    }
    
    // Trend-based classification
    if (trend.strength > adjustedTrendThreshold && trend.consistency > 0.6) {
      return trend.direction === 'up' ? MarketRegime.BULL_TREND : MarketRegime.BEAR_TREND;
    }
    
    return MarketRegime.SIDEWAYS;
  }

  /**
   * Calculate confidence in regime classification
   */
  private calculateConfidence(
    trend: { strength: number; consistency: number },
    volatility: { normalizedLevel: number },
    momentum: { strength: number }
  ): number {
    // Base confidence from trend consistency
    let confidence = trend.consistency * 0.4;
    
    // Add confidence from clear trend strength
    if (trend.strength > this.trendThreshold) {
      confidence += 0.3;
    }
    
    // Add confidence from momentum alignment
    if (momentum.strength > 0.1) {
      confidence += 0.2;
    }
    
    // Reduce confidence in high volatility environments
    if (volatility.normalizedLevel > this.volatilityThreshold.high) {
      confidence *= 0.8;
    }
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  /**
   * Generate reasoning for regime classification
   */
  private generateReasoning(
    regime: MarketRegime,
    trend: { direction: string; strength: number; consistency: number },
    volatility: { level: number; trend: string },
    momentum: { direction: string; strength: number; acceleration: number }
  ): string[] {
    const reasoning: string[] = [];
    
    switch (regime) {
      case MarketRegime.BULL_TREND:
        reasoning.push(`Strong upward trend detected (strength: ${trend.strength.toFixed(3)})`);
        reasoning.push(`Trend consistency: ${(trend.consistency * 100).toFixed(1)}%`);
        if (momentum.direction === 'bullish') {
          reasoning.push(`Bullish momentum supporting trend`);
        }
        break;
        
      case MarketRegime.BEAR_TREND:
        reasoning.push(`Strong downward trend detected (strength: ${trend.strength.toFixed(3)})`);
        reasoning.push(`Trend consistency: ${(trend.consistency * 100).toFixed(1)}%`);
        if (momentum.direction === 'bearish') {
          reasoning.push(`Bearish momentum supporting trend`);
        }
        break;
        
      case MarketRegime.SIDEWAYS:
        reasoning.push(`Weak trend strength (${trend.strength.toFixed(3)} < ${this.trendThreshold})`);
        reasoning.push(`Market range-bound with low directional bias`);
        if (volatility.level < 0.1) {
          reasoning.push(`Low volatility supporting range-bound movement`);
        }
        break;
        
      case MarketRegime.HIGH_VOLATILITY:
        reasoning.push(`High volatility detected (${(volatility.level * 100).toFixed(1)}%)`);
        reasoning.push(`Volatility trend: ${volatility.trend}`);
        if (momentum.acceleration > 0.01) {
          reasoning.push(`Accelerating momentum increasing volatility`);
        }
        break;
        
      case MarketRegime.LOW_VOLATILITY:
        reasoning.push(`Low volatility environment (${(volatility.level * 100).toFixed(1)}%)`);
        reasoning.push(`Stable price action with minimal fluctuations`);
        break;
    }
    
    return reasoning;
  }

  /**
   * Helper methods
   */
  private calculateLinearRegression(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateRateOfChange(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 1 - period];
    return (current - previous) / previous;
  }

  private getTimeframeMultiplier(timeframe: string): number {
    const multipliers: Record<string, number> = {
      '1m': 0.5,   // Shorter timeframes need stronger signals
      '5m': 0.7,
      '15m': 0.8,
      '30m': 0.9,
      '1h': 1.0,   // Base timeframe
      '4h': 1.2,
      '1d': 1.4,   // Longer timeframes more reliable
      '3d': 1.5,
      '1w': 1.6
    };
    
    return multipliers[timeframe] || 1.0;
  }

  private getDefaultRegime(): RegimeAnalysis {
    return {
      regime: MarketRegime.SIDEWAYS,
      confidence: 0.3,
      trendStrength: 0,
      volatilityLevel: 0.1,
      momentum: 0,
      reasoning: ['Insufficient data for regime detection']
    };
  }

  /**
   * Get regime-specific indicator multipliers
   */
  public getRegimeMultipliers(regime: MarketRegime): Record<string, number> {
    switch (regime) {
      case MarketRegime.BULL_TREND:
        return {
          MACD: 1.2,
          EMA_CONVERGENCE: 1.15,
          RSI: 0.9,
          BOLLINGER_BANDS: 1.1,
          STOCHASTIC: 0.8,
          SMA: 1.1,
          ATR: 1.0,
          VOLUME_PROFILE: 1.2
        };
        
      case MarketRegime.BEAR_TREND:
        return {
          MACD: 1.2,
          EMA_CONVERGENCE: 1.15,
          RSI: 0.9,
          BOLLINGER_BANDS: 1.1,
          STOCHASTIC: 0.8,
          SMA: 1.1,
          ATR: 1.1,
          VOLUME_PROFILE: 1.1
        };
        
      case MarketRegime.SIDEWAYS:
        return {
          MACD: 0.8,
          EMA_CONVERGENCE: 0.8,
          RSI: 1.3,
          BOLLINGER_BANDS: 1.2,
          STOCHASTIC: 1.4,
          SMA: 0.9,
          ATR: 1.0,
          VOLUME_PROFILE: 1.0
        };
        
      case MarketRegime.HIGH_VOLATILITY:
        return {
          MACD: 0.9,
          EMA_CONVERGENCE: 0.9,
          RSI: 1.1,
          BOLLINGER_BANDS: 1.4,
          STOCHASTIC: 1.0,
          SMA: 0.8,
          ATR: 1.5,
          VOLUME_PROFILE: 1.2
        };
        
      case MarketRegime.LOW_VOLATILITY:
        return {
          MACD: 1.1,
          EMA_CONVERGENCE: 1.1,
          RSI: 0.9,
          BOLLINGER_BANDS: 0.8,
          STOCHASTIC: 0.9,
          SMA: 1.2,
          ATR: 0.6,
          VOLUME_PROFILE: 1.0
        };
        
      default:
        return {
          MACD: 1.0,
          EMA_CONVERGENCE: 1.0,
          RSI: 1.0,
          BOLLINGER_BANDS: 1.0,
          STOCHASTIC: 1.0,
          SMA: 1.0,
          ATR: 1.0,
          VOLUME_PROFILE: 1.0
        };
    }
  }
}