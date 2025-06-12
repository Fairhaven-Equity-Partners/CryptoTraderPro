import { TimeFrame } from '../types';
import { ultimateCalculationEngine } from './ultimateCalculationEngine';
import { marketStructureEngine } from './marketStructureEngine';

/**
 * Accuracy Tracker - Continuous Learning System
 * Tracks prediction accuracy and provides feedback to improve market analysis
 */

interface PredictionRecord {
  symbol: string;
  timeframe: TimeFrame;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  confidence: number;
  isResolved: boolean;
  wasCorrect?: boolean;
  exitPrice?: number;
  exitTime?: number;
  profitLoss?: number;
}

interface AccuracyMetrics {
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  avgProfitLoss: number;
  bestTimeframe: TimeFrame | null;
  confidenceAccuracy: number;
}

export class AccuracyTracker {
  private static instance: AccuracyTracker;
  private predictions = new Map<string, PredictionRecord>();
  private accuracyHistory = new Map<string, AccuracyMetrics>();
  private learningEnabled = true;

  static getInstance(): AccuracyTracker {
    if (!AccuracyTracker.instance) {
      AccuracyTracker.instance = new AccuracyTracker();
    }
    return AccuracyTracker.instance;
  }

  /**
   * Record a new prediction for accuracy tracking
   */
  recordPrediction(
    symbol: string,
    timeframe: TimeFrame,
    direction: 'LONG' | 'SHORT' | 'NEUTRAL',
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
    confidence: number
  ): string {
    const predictionId = `${symbol}_${timeframe}_${Date.now()`}`;
    
    const prediction: PredictionRecord = {
      symbol,
      timeframe,
      direction,
      entryPrice,
      stopLoss,
      takeProfit,
      timestamp: Date.now(),
      confidence,
      isResolved: false
    };

    this.predictions.set(predictionId, prediction);return predictionId;
  }

  /**
   * Check and resolve predictions based on current price
   */
  checkPredictions(symbol: string, currentPrice: number): void {
    const unresolvedPredictions = Array.from(this.predictions.entries())
      .filter(([_, pred]) => pred.symbol === symbol && !pred.isResolved);

    for (const [predictionId, prediction] of unresolvedPredictions) {
      const shouldResolve = this.shouldResolvePrediction(prediction, currentPrice);
      
      if (shouldResolve.resolve) {
        this.resolvePrediction(predictionId, currentPrice, shouldResolve.wasCorrect, shouldResolve.profitLoss);
      }
    }
  }

  /**
   * Determine if a prediction should be resolved
   */
  private shouldResolvePrediction(
    prediction: PredictionRecord, 
    currentPrice: number
  ): { resolve: boolean; wasCorrect: boolean; profitLoss: number } {
    const timeSinceEntry = Date.now() - prediction.timestamp;
    const maxHoldTime = this.getMaxHoldTime(prediction.timeframe);

    // Check if stop loss or take profit hit
    if (prediction.direction === 'LONG') {
      if (currentPrice <= prediction.stopLoss) {
        const profitLoss = ((currentPrice - prediction.entryPrice) / prediction.entryPrice) * 100;
        return { resolve: true, wasCorrect: false, profitLoss };
      }
      if (currentPrice >= prediction.takeProfit) {
        const profitLoss = ((currentPrice - prediction.entryPrice) / prediction.entryPrice) * 100;
        return { resolve: true, wasCorrect: true, profitLoss };
      }
    } else if (prediction.direction === 'SHORT') {
      if (currentPrice >= prediction.stopLoss) {
        const profitLoss = ((prediction.entryPrice - currentPrice) / prediction.entryPrice) * 100;
        return { resolve: true, wasCorrect: false, profitLoss };
      }
      if (currentPrice <= prediction.takeProfit) {
        const profitLoss = ((prediction.entryPrice - currentPrice) / prediction.entryPrice) * 100;
        return { resolve: true, wasCorrect: true, profitLoss };
      }
    }

    // Check if maximum hold time reached
    if (timeSinceEntry > maxHoldTime) {
      const profitLoss = prediction.direction === 'LONG' ?
        ((currentPrice - prediction.entryPrice) / prediction.entryPrice) * 100 :
        ((prediction.entryPrice - currentPrice) / prediction.entryPrice) * 100;
      
      const wasCorrect = profitLoss > 0;
      return { resolve: true, wasCorrect, profitLoss };
    }

    return { resolve: false, wasCorrect: false, profitLoss: 0 };
  }

  /**
   * Get maximum hold time based on timeframe
   */
  private getMaxHoldTime(timeframe: TimeFrame): number {
    const holdTimes: Record<TimeFrame, number> = {
      '1m': 5 * 60 * 1000,      // 5 minutes
      '5m': 25 * 60 * 1000,     // 25 minutes
      '15m': 75 * 60 * 1000,    // 1.25 hours
      '30m': 150 * 60 * 1000,   // 2.5 hours
      '1h': 6 * 60 * 60 * 1000, // 6 hours
      '4h': 24 * 60 * 60 * 1000, // 1 day
      '1d': 7 * 24 * 60 * 60 * 1000, // 1 week
      '3d': 21 * 24 * 60 * 60 * 1000, // 3 weeks
      '1w': 60 * 24 * 60 * 60 * 1000, // 2 months
      '1M': 180 * 24 * 60 * 60 * 1000 // 6 months
    };

    return holdTimes[timeframe] || 24 * 60 * 60 * 1000; // Default 1 day
  }

  /**
   * Resolve a prediction and update accuracy metrics
   */
  private resolvePrediction(
    predictionId: string, 
    exitPrice: number, 
    wasCorrect: boolean, 
    profitLoss: number
  ): void {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) return;

    // Update prediction record
    prediction.isResolved = true;
    prediction.wasCorrect = wasCorrect;
    prediction.exitPrice = exitPrice;
    prediction.exitTime = Date.now();
    prediction.profitLoss = profitLoss;}%)`);

    // Update accuracy metrics
    this.updateAccuracyMetrics(prediction);

    // Provide feedback to calculation engines if learning is enabled
    if (this.learningEnabled) {
      this.provideFeedback(prediction);
    }
  }

  /**
   * Update accuracy metrics for the symbol-timeframe combination
   */
  private updateAccuracyMetrics(prediction: PredictionRecord): void {
    const key = `${prediction.symbol}_${prediction.timeframe`}`;
    const current = this.accuracyHistory.get(key) || {
      totalPredictions: 0,
      correctPredictions: 0,
      winRate: 0,
      avgProfitLoss: 0,
      bestTimeframe: null,
      confidenceAccuracy: 0
    };

    current.totalPredictions += 1;
    if (prediction.wasCorrect) current.correctPredictions += 1;
    current.winRate = (current.correctPredictions / current.totalPredictions) * 100;

    // Update average profit/loss
    const totalPL = (current.avgProfitLoss * (current.totalPredictions - 1)) + (prediction.profitLoss || 0);
    current.avgProfitLoss = totalPL / current.totalPredictions;

    // Update confidence accuracy (how well confidence correlates with success)
    const expectedSuccess = prediction.confidence / 100;
    const actualSuccess = prediction.wasCorrect ? 1 : 0;
    const confidenceError = Math.abs(expectedSuccess - actualSuccess);
    current.confidenceAccuracy = 100 - (confidenceError * 100);

    this.accuracyHistory.set(key, current);
  }

  /**
   * Provide feedback to calculation engines for learning
   */
  private provideFeedback(prediction: PredictionRecord): void {
    // Update ultimate calculation engine accuracy tracking
    ultimateCalculationEngine.updatePredictionAccuracy(
      prediction.symbol,
      prediction.timeframe,
      prediction.wasCorrect || false
    );

    // Update market structure engine accuracy tracking
    marketStructureEngine.updateAccuracy(
      prediction.symbol,
      prediction.timeframe,
      prediction.wasCorrect || false
    );}

  /**
   * Get accuracy metrics for a symbol-timeframe combination
   */
  getAccuracyMetrics(symbol: string, timeframe: TimeFrame): AccuracyMetrics {
    const key = `${symbol}_${timeframe`}`;
    return this.accuracyHistory.get(key) || {
      totalPredictions: 0,
      correctPredictions: 0,
      winRate: 0,
      avgProfitLoss: 0,
      bestTimeframe: null,
      confidenceAccuracy: 0
    };
  }

  /**
   * Get overall accuracy statistics
   */
  getOverallStats(): {
    totalPredictions: number;
    overallWinRate: number;
    bestPerformingTimeframes: Array<{ timeframe: TimeFrame; winRate: number; predictions: number }>;
    profitabilityByTimeframe: Map<TimeFrame, number>;
  } {
    const stats = {
      totalPredictions: 0,
      totalCorrect: 0,
      timeframeStats: new Map<TimeFrame, { correct: number; total: number; profitLoss: number }>()
    };

    // Aggregate all resolved predictions
    for (const prediction of this.predictions.values()) {
      if (!prediction.isResolved) continue;

      stats.totalPredictions += 1;
      if (prediction.wasCorrect) stats.totalCorrect += 1;

      const tfStats = stats.timeframeStats.get(prediction.timeframe) || { correct: 0, total: 0, profitLoss: 0 };
      tfStats.total += 1;
      if (prediction.wasCorrect) tfStats.correct += 1;
      tfStats.profitLoss += prediction.profitLoss || 0;
      stats.timeframeStats.set(prediction.timeframe, tfStats);
    }

    // Calculate best performing timeframes
    const bestPerformingTimeframes = Array.from(stats.timeframeStats.entries())
      .map(([timeframe, data]) => ({
        timeframe,
        winRate: (data.correct / data.total) * 100,
        predictions: data.total
      }))
      .filter(item => item.predictions >= 5) // Minimum sample size
      .sort((a, b) => b.winRate - a.winRate);

    // Calculate profitability by timeframe
    const profitabilityByTimeframe = new Map<TimeFrame, number>();
    for (const [timeframe, data] of stats.timeframeStats) {
      profitabilityByTimeframe.set(timeframe, data.profitLoss / data.total);
    }

    return {
      totalPredictions: stats.totalPredictions,
      overallWinRate: stats.totalPredictions > 0 ? (stats.totalCorrect / stats.totalPredictions) * 100 : 0,
      bestPerformingTimeframes,
      profitabilityByTimeframe
    };
  }

  /**
   * Enable or disable learning mode
   */
  setLearningMode(enabled: boolean): void {
    this.learningEnabled = enabled;}

  /**
   * Clear old predictions to manage memory
   */
  clearOldPredictions(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;
    const toRemove: string[] = [];

    for (const [id, prediction] of this.predictions) {
      if (prediction.timestamp < cutoffTime && prediction.isResolved) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.predictions.delete(id));}
}

export const accuracyTracker = AccuracyTracker.getInstance();