/**
 * Adaptive Learning Engine
 * 
 * This system continuously learns from real market outcomes to improve prediction accuracy.
 * It implements a feedback loop that adjusts calculation weights based on historical performance.
 */

import { apiRequest } from './queryClient';
import type { AccuracyMetrics } from '@shared/schema';

interface IndicatorPerformance {
  name: string;
  winRate: number;
  avgAccuracy: number;
  totalPredictions: number;
  weight: number;
  lastUpdated: number;
}

interface TimeframePerformance {
  timeframe: string;
  overallAccuracy: number;
  indicatorPerformance: Map<string, IndicatorPerformance>;
  bestIndicators: string[];
  weakestIndicators: string[];
}

interface AdaptiveWeights {
  rsi: number;
  macd: number;
  ema: number;
  stochastic: number;
  adx: number;
  bb: number;
  volume: number;
  patterns: number;
  support_resistance: number;
}

class AdaptiveLearningEngine {
  private performanceCache = new Map<string, TimeframePerformance>();
  private baseWeights: AdaptiveWeights = {
    rsi: 1.0,
    macd: 1.0,
    ema: 1.0,
    stochastic: 0.8,
    adx: 0.9,
    bb: 0.85,
    volume: 0.7,
    patterns: 0.6,
    support_resistance: 0.75
  };
  
  private adaptedWeights = new Map<string, AdaptiveWeights>();
  private readonly LEARNING_RATE = 0.1;
  private readonly MIN_PREDICTIONS_FOR_LEARNING = 10;

  constructor() {
    console.log('🧠 Adaptive Learning Engine initialized - starting feedback loop optimization');
  }

  /**
   * Learn from accuracy metrics and adjust calculation weights
   */
  async learnFromAccuracy(symbol: string, timeframe: string): Promise<void> {
    try {
      // Fetch latest accuracy metrics
      const metrics = await apiRequest(`/api/accuracy/${symbol}?timeframe=${timeframe}`);
      
      if (!metrics || metrics.length === 0) {
        console.log(`📊 No accuracy data yet for ${symbol} ${timeframe}`);
        return;
      }

      const metric = metrics[0] as AccuracyMetrics;
      
      // Only start learning if we have enough data
      if (metric.totalTrades < this.MIN_PREDICTIONS_FOR_LEARNING) {
        console.log(`📊 Need more predictions for learning (${metric.totalTrades}/${this.MIN_PREDICTIONS_FOR_LEARNING})`);
        return;
      }

      const key = `${symbol}_${timeframe}`;
      
      // Calculate performance scores for each indicator
      const indicatorScores = {
        rsi: this.calculateIndicatorScore(metric.rsiAccuracy, metric.winRate),
        macd: this.calculateIndicatorScore(metric.macdAccuracy, metric.winRate),
        ema: this.calculateIndicatorScore(metric.emaAccuracy, metric.winRate),
        stochastic: this.calculateIndicatorScore(metric.stochasticAccuracy, metric.winRate),
        adx: this.calculateIndicatorScore(metric.adxAccuracy, metric.winRate),
        bb: this.calculateIndicatorScore(metric.bbAccuracy, metric.winRate)
      };

      // Get current weights or use base weights
      const currentWeights = this.adaptedWeights.get(key) || { ...this.baseWeights };
      
      // Apply adaptive learning to adjust weights
      const newWeights = this.adaptWeights(currentWeights, indicatorScores, metric.winRate);
      
      // Store updated weights
      this.adaptedWeights.set(key, newWeights);
      
      console.log(`🧠 Learning update for ${symbol} ${timeframe}:`);
      console.log(`📈 Win Rate: ${metric.winRate?.toFixed(1)}% | Total Trades: ${metric.totalTrades}`);
      console.log(`⚖️ Weight adjustments:`, {
        rsi: `${currentWeights.rsi.toFixed(2)} → ${newWeights.rsi.toFixed(2)}`,
        macd: `${currentWeights.macd.toFixed(2)} → ${newWeights.macd.toFixed(2)}`,
        ema: `${currentWeights.ema.toFixed(2)} → ${newWeights.ema.toFixed(2)}`
      });

      // Update performance cache
      this.updatePerformanceCache(symbol, timeframe, metric, indicatorScores);
      
    } catch (error) {
      console.error('Error in adaptive learning:', error);
    }
  }

  /**
   * Calculate performance score for an indicator
   */
  private calculateIndicatorScore(indicatorAccuracy: number | null, overallWinRate: number | null): number {
    if (!indicatorAccuracy || !overallWinRate) return 0.5; // Neutral score
    
    // Normalize accuracy to 0-1 scale
    const accuracyScore = Math.max(0, Math.min(1, indicatorAccuracy / 100));
    const winRateScore = Math.max(0, Math.min(1, overallWinRate / 100));
    
    // Weighted combination: accuracy matters more than overall win rate
    return (accuracyScore * 0.7) + (winRateScore * 0.3);
  }

  /**
   * Adapt weights based on performance scores
   */
  private adaptWeights(
    currentWeights: AdaptiveWeights, 
    indicatorScores: Record<string, number>, 
    overallWinRate: number | null
  ): AdaptiveWeights {
    const newWeights = { ...currentWeights };
    
    // Only adapt if we have meaningful win rate data
    if (!overallWinRate || overallWinRate < 30) {
      return newWeights; // Don't adapt on very poor performance
    }
    
    // Adaptive learning formula: adjust based on performance vs baseline
    const baseline = 0.5; // 50% baseline performance
    
    for (const [indicator, score] of Object.entries(indicatorScores)) {
      if (indicator in newWeights) {
        const currentWeight = currentWeights[indicator as keyof AdaptiveWeights];
        const performance = score - baseline;
        
        // Apply learning rate and performance adjustment
        const adjustment = this.LEARNING_RATE * performance;
        let newWeight = currentWeight + adjustment;
        
        // Constrain weights to reasonable bounds
        newWeight = Math.max(0.1, Math.min(2.0, newWeight));
        
        (newWeights as any)[indicator] = newWeight;
      }
    }
    
    // Boost weights for high-performing indicators
    if (overallWinRate > 70) {
      // Find best performing indicator
      const bestIndicator = Object.entries(indicatorScores)
        .reduce((best, [name, score]) => score > best.score ? { name, score } : best, 
                { name: '', score: 0 });
      
      if (bestIndicator.name && bestIndicator.name in newWeights) {
        (newWeights as any)[bestIndicator.name] *= 1.1; // 10% boost
      }
    }
    
    return newWeights;
  }

  /**
   * Get adapted weights for a symbol/timeframe combination
   */
  getAdaptedWeights(symbol: string, timeframe: string): AdaptiveWeights {
    const key = `${symbol}_${timeframe}`;
    return this.adaptedWeights.get(key) || { ...this.baseWeights };
  }

  /**
   * Apply weights to indicator values in signal calculation
   */
  applyAdaptiveWeights(
    symbol: string, 
    timeframe: string, 
    indicators: any
  ): any {
    const weights = this.getAdaptedWeights(symbol, timeframe);
    const weightedIndicators = { ...indicators };
    
    // Apply weights to RSI
    if (weightedIndicators.rsi !== undefined) {
      weightedIndicators.rsi *= weights.rsi;
    }
    
    // Apply weights to MACD components
    if (weightedIndicators.macd) {
      weightedIndicators.macd.value *= weights.macd;
      weightedIndicators.macd.signal *= weights.macd;
      weightedIndicators.macd.histogram *= weights.macd;
    }
    
    // Apply weights to EMA
    if (weightedIndicators.ema) {
      weightedIndicators.ema.short *= weights.ema;
      weightedIndicators.ema.medium *= weights.ema;
      weightedIndicators.ema.long *= weights.ema;
    }
    
    // Apply weights to Stochastic
    if (weightedIndicators.stochastic) {
      weightedIndicators.stochastic.k *= weights.stochastic;
      weightedIndicators.stochastic.d *= weights.stochastic;
    }
    
    // Apply weights to ADX
    if (weightedIndicators.adx) {
      weightedIndicators.adx.value *= weights.adx;
    }
    
    // Apply weights to Bollinger Bands
    if (weightedIndicators.bb) {
      weightedIndicators.bb.width *= weights.bb;
      weightedIndicators.bb.percentB *= weights.bb;
    }
    
    return weightedIndicators;
  }

  /**
   * Update performance cache with new data
   */
  private updatePerformanceCache(
    symbol: string, 
    timeframe: string, 
    metric: AccuracyMetrics, 
    indicatorScores: Record<string, number>
  ): void {
    const key = `${symbol}_${timeframe}`;
    
    const performance: TimeframePerformance = {
      timeframe,
      overallAccuracy: metric.winRate || 0,
      indicatorPerformance: new Map(),
      bestIndicators: [],
      weakestIndicators: []
    };
    
    // Build indicator performance map
    for (const [name, score] of Object.entries(indicatorScores)) {
      performance.indicatorPerformance.set(name, {
        name,
        winRate: metric.winRate || 0,
        avgAccuracy: score * 100,
        totalPredictions: metric.totalTrades || 0,
        weight: this.getAdaptedWeights(symbol, timeframe)[name as keyof AdaptiveWeights] || 1.0,
        lastUpdated: Date.now()
      });
    }
    
    // Identify best and weakest indicators
    const sortedIndicators = Object.entries(indicatorScores)
      .sort(([,a], [,b]) => b - a);
    
    performance.bestIndicators = sortedIndicators.slice(0, 2).map(([name]) => name);
    performance.weakestIndicators = sortedIndicators.slice(-2).map(([name]) => name);
    
    this.performanceCache.set(key, performance);
  }

  /**
   * Get performance summary for a symbol/timeframe
   */
  getPerformanceSummary(symbol: string, timeframe: string): TimeframePerformance | null {
    const key = `${symbol}_${timeframe}`;
    return this.performanceCache.get(key) || null;
  }

  /**
   * Calculate confidence adjustment based on historical accuracy
   */
  calculateConfidenceAdjustment(symbol: string, timeframe: string, baseConfidence: number): number {
    const performance = this.getPerformanceSummary(symbol, timeframe);
    
    if (!performance || performance.overallAccuracy === 0) {
      return baseConfidence; // No adjustment without historical data
    }
    
    // Adjust confidence based on historical win rate
    const winRateMultiplier = performance.overallAccuracy / 100;
    const adjustedConfidence = baseConfidence * (0.5 + (winRateMultiplier * 0.5));
    
    // Constrain to reasonable bounds
    return Math.max(10, Math.min(95, adjustedConfidence));
  }

  /**
   * Initialize continuous learning for a symbol
   */
  async startContinuousLearning(symbol: string): Promise<void> {
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    
    console.log(`🧠 Starting continuous learning for ${symbol}`);
    
    // Initial learning pass
    for (const timeframe of timeframes) {
      await this.learnFromAccuracy(symbol, timeframe);
    }
    
    // Set up periodic learning updates every 5 minutes
    setInterval(async () => {
      for (const timeframe of timeframes) {
        await this.learnFromAccuracy(symbol, timeframe);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// Global instance
export const adaptiveLearningEngine = new AdaptiveLearningEngine();

// Export helper functions
export const learnFromAccuracy = (symbol: string, timeframe: string) => 
  adaptiveLearningEngine.learnFromAccuracy(symbol, timeframe);

export const getAdaptedWeights = (symbol: string, timeframe: string) => 
  adaptiveLearningEngine.getAdaptedWeights(symbol, timeframe);

export const applyAdaptiveWeights = (symbol: string, timeframe: string, indicators: any) => 
  adaptiveLearningEngine.applyAdaptiveWeights(symbol, timeframe, indicators);

export const calculateConfidenceAdjustment = (symbol: string, timeframe: string, baseConfidence: number) => 
  adaptiveLearningEngine.calculateConfidenceAdjustment(symbol, timeframe, baseConfidence);

export const startContinuousLearning = (symbol: string) => 
  adaptiveLearningEngine.startContinuousLearning(symbol);