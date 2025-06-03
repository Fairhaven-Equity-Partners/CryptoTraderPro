/**
 * Enhanced Accuracy System - Advanced market analysis for improved predictions
 */

import { apiRequest } from './queryClient';

interface MarketCondition {
  volatility: 'high' | 'medium' | 'low';
  trend: 'strong_bull' | 'bull' | 'sideways' | 'bear' | 'strong_bear';
  volume: 'high' | 'medium' | 'low';
  momentum: 'accelerating' | 'steady' | 'decelerating';
}

interface AccuracyBooster {
  condition: MarketCondition;
  multiplier: number;
  confidence: number;
  description: string;
}

interface TimeframeCorrelation {
  timeframe1: string;
  timeframe2: string;
  correlation: number;
  strength: 'strong' | 'moderate' | 'weak';
}

class EnhancedAccuracySystem {
  private accuracyBoosters: AccuracyBooster[] = [];
  private correlationMatrix: Map<string, TimeframeCorrelation[]> = new Map();
  private marketRegimes: Map<string, MarketCondition> = new Map();

  constructor() {
    this.initializeAccuracyBoosters();
  }

  private initializeAccuracyBoosters(): void {
    this.accuracyBoosters = [
      {
        condition: {
          volatility: 'high',
          trend: 'strong_bull',
          volume: 'high',
          momentum: 'accelerating'
        },
        multiplier: 1.25,
        confidence: 85,
        description: 'High volatility bull breakout with strong volume'
      },
      {
        condition: {
          volatility: 'low',
          trend: 'sideways',
          volume: 'low',
          momentum: 'steady'
        },
        multiplier: 0.75,
        confidence: 45,
        description: 'Low volatility consolidation - signals less reliable'
      },
      {
        condition: {
          volatility: 'medium',
          trend: 'bear',
          volume: 'high',
          momentum: 'accelerating'
        },
        multiplier: 1.15,
        confidence: 75,
        description: 'Bear trend with high volume confirmation'
      }
    ];
  }

  /**
   * Analyze current market conditions for accuracy enhancement
   */
  analyzeMarketConditions(symbol: string, indicators: any): MarketCondition {
    const volatility = this.calculateVolatilityLevel(indicators);
    const trend = this.analyzeTrendStrength(indicators);
    const volume = this.analyzeVolumeLevel(indicators);
    const momentum = this.analyzeMomentum(indicators);

    const condition: MarketCondition = {
      volatility,
      trend,
      volume,
      momentum
    };

    this.marketRegimes.set(symbol, condition);
    return condition;
  }

  private calculateVolatilityLevel(indicators: any): 'high' | 'medium' | 'low' {
    const atr = indicators.atr || 0;
    const price = indicators.price || 100000;
    const volatilityPercent = (atr / price) * 100;

    if (volatilityPercent > 3) return 'high';
    if (volatilityPercent > 1.5) return 'medium';
    return 'low';
  }

  private analyzeTrendStrength(indicators: any): MarketCondition['trend'] {
    const ema = indicators.ema || {};
    const macd = indicators.macd || {};
    const adx = indicators.adx || {};

    const shortEma = ema.short || 0;
    const mediumEma = ema.medium || 0;
    const longEma = ema.long || 0;
    const macdValue = macd.value || 0;
    const adxValue = adx.value || 0;

    // Strong trend conditions
    if (adxValue > 25) {
      if (shortEma > mediumEma && mediumEma > longEma && macdValue > 0) {
        return 'strong_bull';
      }
      if (shortEma < mediumEma && mediumEma < longEma && macdValue < 0) {
        return 'strong_bear';
      }
    }

    // Medium trend conditions
    if (adxValue > 15) {
      if (shortEma > longEma && macdValue > 0) return 'bull';
      if (shortEma < longEma && macdValue < 0) return 'bear';
    }

    return 'sideways';
  }

  private analyzeVolumeLevel(indicators: any): 'high' | 'medium' | 'low' {
    // Volume analysis would typically require volume data
    // For now, we'll estimate based on volatility and momentum
    const atr = indicators.atr || 0;
    const rsi = indicators.rsi || 50;
    
    const volumeScore = Math.abs(rsi - 50) + (atr / 1000);
    
    if (volumeScore > 30) return 'high';
    if (volumeScore > 15) return 'medium';
    return 'low';
  }

  private analyzeMomentum(indicators: any): 'accelerating' | 'steady' | 'decelerating' {
    const rsi = indicators.rsi || 50;
    const macd = indicators.macd || {};
    const stoch = indicators.stochastic || {};

    const macdHistogram = macd.histogram || 0;
    const stochK = stoch.k || 50;

    // Accelerating momentum
    if ((rsi > 70 || rsi < 30) && Math.abs(macdHistogram) > 100) {
      return 'accelerating';
    }

    // Decelerating momentum
    if ((rsi > 45 && rsi < 55) && Math.abs(macdHistogram) < 50) {
      return 'decelerating';
    }

    return 'steady';
  }

  /**
   * Calculate enhanced confidence based on market conditions
   */
  calculateEnhancedConfidence(
    baseConfidence: number,
    symbol: string,
    timeframe: string,
    indicators: any
  ): number {
    const marketCondition = this.analyzeMarketConditions(symbol, indicators);
    
    // Find matching accuracy booster
    const booster = this.findBestAccuracyBooster(marketCondition);
    
    if (booster) {
      const enhancedConfidence = baseConfidence * booster.multiplier;
      return Math.min(Math.max(enhancedConfidence, 10), 95); // Clamp between 10-95
    }

    return baseConfidence;
  }

  private findBestAccuracyBooster(condition: MarketCondition): AccuracyBooster | null {
    for (const booster of this.accuracyBoosters) {
      const match = this.calculateConditionMatch(condition, booster.condition);
      if (match > 0.7) { // 70% match threshold
        return booster;
      }
    }
    return null;
  }

  private calculateConditionMatch(current: MarketCondition, target: MarketCondition): number {
    let matches = 0;
    let total = 0;

    // Compare each condition
    if (current.volatility === target.volatility) matches++;
    total++;

    if (current.trend === target.trend) matches++;
    total++;

    if (current.volume === target.volume) matches++;
    total++;

    if (current.momentum === target.momentum) matches++;
    total++;

    return matches / total;
  }

  /**
   * Analyze timeframe correlations for signal confirmation
   */
  analyzeTimeframeCorrelations(signals: Record<string, any>): TimeframeCorrelation[] {
    const correlations: TimeframeCorrelation[] = [];
    const timeframes = Object.keys(signals).filter(tf => signals[tf]);

    for (let i = 0; i < timeframes.length; i++) {
      for (let j = i + 1; j < timeframes.length; j++) {
        const tf1 = timeframes[i];
        const tf2 = timeframes[j];
        
        const signal1 = signals[tf1];
        const signal2 = signals[tf2];

        if (signal1 && signal2) {
          const correlation = this.calculateSignalCorrelation(signal1, signal2);
          
          correlations.push({
            timeframe1: tf1,
            timeframe2: tf2,
            correlation,
            strength: correlation > 0.7 ? 'strong' : correlation > 0.4 ? 'moderate' : 'weak'
          });
        }
      }
    }

    return correlations;
  }

  private calculateSignalCorrelation(signal1: any, signal2: any): number {
    let correlationScore = 0;
    let factors = 0;

    // Direction correlation
    if (signal1.direction === signal2.direction) {
      correlationScore += 0.4;
    }
    factors++;

    // Confidence correlation
    const confidenceDiff = Math.abs(signal1.confidence - signal2.confidence);
    correlationScore += (1 - confidenceDiff / 100) * 0.3;
    factors++;

    // Indicator alignment
    if (signal1.indicators && signal2.indicators) {
      const rsi1 = signal1.indicators.rsi || 50;
      const rsi2 = signal2.indicators.rsi || 50;
      const rsiAlignment = 1 - Math.abs(rsi1 - rsi2) / 100;
      correlationScore += rsiAlignment * 0.3;
      factors++;
    }

    return factors > 0 ? correlationScore / factors : 0;
  }

  /**
   * Generate market condition summary
   */
  getMarketConditionSummary(symbol: string): string {
    const condition = this.marketRegimes.get(symbol);
    if (!condition) return 'Market conditions not analyzed';

    const parts = [
      `Volatility: ${condition.volatility}`,
      `Trend: ${condition.trend.replace('_', ' ')}`,
      `Volume: ${condition.volume}`,
      `Momentum: ${condition.momentum}`
    ];

    return parts.join(' | ');
  }

  /**
   * Get accuracy enhancement recommendations
   */
  getAccuracyRecommendations(symbol: string): string[] {
    const condition = this.marketRegimes.get(symbol);
    if (!condition) return [];

    const recommendations: string[] = [];

    if (condition.volatility === 'high') {
      recommendations.push('High volatility detected - use wider stop losses');
    }

    if (condition.trend === 'sideways') {
      recommendations.push('Sideways market - consider range trading strategies');
    }

    if (condition.momentum === 'accelerating') {
      recommendations.push('Strong momentum - trend continuation likely');
    }

    if (condition.volume === 'low') {
      recommendations.push('Low volume - wait for confirmation before entering');
    }

    return recommendations;
  }
}

// Global instance
export const enhancedAccuracySystem = new EnhancedAccuracySystem();

// Export helper functions
export const analyzeMarketConditions = (symbol: string, indicators: any) =>
  enhancedAccuracySystem.analyzeMarketConditions(symbol, indicators);

export const calculateEnhancedConfidence = (
  baseConfidence: number,
  symbol: string,
  timeframe: string,
  indicators: any
) => enhancedAccuracySystem.calculateEnhancedConfidence(baseConfidence, symbol, timeframe, indicators);

export const analyzeTimeframeCorrelations = (signals: Record<string, any>) =>
  enhancedAccuracySystem.analyzeTimeframeCorrelations(signals);

export const getMarketConditionSummary = (symbol: string) =>
  enhancedAccuracySystem.getMarketConditionSummary(symbol);

export const getAccuracyRecommendations = (symbol: string) =>
  enhancedAccuracySystem.getAccuracyRecommendations(symbol);