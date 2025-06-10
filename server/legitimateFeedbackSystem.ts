/**
 * Legitimate Feedback System - Phase 3 Implementation
 * Tracks prediction accuracy and improves signal quality using authentic performance data
 */

interface PredictionRecord {
  id: string;
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  entryTime: number;
  predictedExitPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  indicators: any;
  
  // Outcome tracking
  actualExitPrice?: number;
  actualExitTime?: number;
  exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TIMEOUT' | 'MANUAL';
  profitLoss?: number;
  profitLossPercent?: number;
  isCorrect?: boolean;
  
  // Performance metrics
  accuracyScore?: number;
  timingAccuracy?: number;
  priceAccuracy?: number;
  
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
}

interface IndicatorPerformance {
  indicatorName: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  avgProfitLoss: number;
  bestTimeframes: string[];
  reliabilityScore: number;
  confidenceCalibration: number;
}

interface MarketConditionPerformance {
  condition: string;
  successRate: number;
  avgReturn: number;
  bestIndicators: string[];
  optimalTimeframes: string[];
}

class LegitimatePerformanceTracker {
  private predictionRecords: Map<string, PredictionRecord> = new Map();
  private indicatorPerformance: Map<string, IndicatorPerformance> = new Map();
  private marketConditions: Map<string, MarketConditionPerformance> = new Map();
  private learningData: Map<string, any[]> = new Map();
  
  // Prediction timeout periods (in minutes)
  private readonly TIMEFRAME_DURATIONS = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
    '3d': 4320,
    '1w': 10080,
    '1M': 43200
  };

  constructor() {
    this.initializeIndicatorTracking();
    this.startPerformanceMonitoring();
  }

  /**
   * Record a new prediction for tracking
   */
  recordPrediction(
    symbol: string,
    timeframe: string,
    direction: 'LONG' | 'SHORT',
    entryPrice: number,
    predictedExitPrice: number,
    stopLoss: number,
    takeProfit: number,
    confidence: number,
    indicators: any
  ): string {
    const predictionId = this.generatePredictionId(symbol, timeframe, Date.now());
    
    const prediction: PredictionRecord = {
      id: predictionId,
      symbol,
      timeframe,
      direction,
      entryPrice,
      entryTime: Date.now(),
      predictedExitPrice,
      stopLoss,
      takeProfit,
      confidence,
      indicators,
      status: 'ACTIVE'
    };

    this.predictionRecords.set(predictionId, prediction);
    
    console.log(`[LegitimateTracker] Recorded prediction ${predictionId}: ${symbol} ${timeframe} ${direction} @ ${entryPrice}`);
    
    return predictionId;
  }

  /**
   * Update prediction with actual outcome
   */
  updatePredictionOutcome(
    predictionId: string,
    actualExitPrice: number,
    exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TIMEOUT' | 'MANUAL'
  ): void {
    const prediction = this.predictionRecords.get(predictionId);
    if (!prediction) {
      console.warn(`[LegitimateTracker] Prediction ${predictionId} not found`);
      return;
    }

    prediction.actualExitPrice = actualExitPrice;
    prediction.actualExitTime = Date.now();
    prediction.exitReason = exitReason;
    prediction.status = 'COMPLETED';

    // Calculate performance metrics
    this.calculatePredictionMetrics(prediction);
    
    // Update indicator performance
    this.updateIndicatorPerformance(prediction);
    
    // Learn from the outcome
    this.processLearningData(prediction);

    console.log(`[LegitimateTracker] Updated prediction ${predictionId}: ${prediction.isCorrect ? 'CORRECT' : 'INCORRECT'} (${prediction.accuracyScore?.toFixed(2)}%)`);
  }

  /**
   * Calculate comprehensive prediction metrics
   */
  private calculatePredictionMetrics(prediction: PredictionRecord): void {
    const { entryPrice, actualExitPrice, direction, predictedExitPrice } = prediction;
    
    if (!actualExitPrice) return;

    // Calculate profit/loss
    const priceChange = actualExitPrice - entryPrice;
    prediction.profitLoss = direction === 'LONG' ? priceChange : -priceChange;
    prediction.profitLossPercent = (prediction.profitLoss / entryPrice) * 100;

    // Determine if prediction was correct
    const predictedChange = predictedExitPrice - entryPrice;
    const actualChange = actualExitPrice - entryPrice;
    
    prediction.isCorrect = (
      (direction === 'LONG' && actualChange > 0) ||
      (direction === 'SHORT' && actualChange < 0)
    );

    // Calculate accuracy score (0-100)
    const directionAccuracy = prediction.isCorrect ? 100 : 0;
    const priceAccuracy = this.calculatePriceAccuracy(predictedExitPrice, actualExitPrice, entryPrice);
    const timingAccuracy = this.calculateTimingAccuracy(prediction);
    
    prediction.accuracyScore = (directionAccuracy * 0.5) + (priceAccuracy * 0.3) + (timingAccuracy * 0.2);
    prediction.priceAccuracy = priceAccuracy;
    prediction.timingAccuracy = timingAccuracy;
  }

  /**
   * Calculate price prediction accuracy
   */
  private calculatePriceAccuracy(predicted: number, actual: number, entry: number): number {
    const predictedMove = Math.abs(predicted - entry);
    const actualMove = Math.abs(actual - entry);
    
    if (predictedMove === 0 && actualMove === 0) return 100;
    if (predictedMove === 0 || actualMove === 0) return 0;
    
    const accuracy = Math.max(0, 100 - (Math.abs(predictedMove - actualMove) / Math.max(predictedMove, actualMove)) * 100);
    return Math.min(100, accuracy);
  }

  /**
   * Calculate timing accuracy based on timeframe expectations
   */
  private calculateTimingAccuracy(prediction: PredictionRecord): number {
    const expectedDuration = this.TIMEFRAME_DURATIONS[prediction.timeframe] * 60 * 1000; // Convert to ms
    const actualDuration = (prediction.actualExitTime || Date.now()) - prediction.entryTime;
    
    const timingError = Math.abs(actualDuration - expectedDuration) / expectedDuration;
    return Math.max(0, 100 - (timingError * 100));
  }

  /**
   * Update indicator performance tracking
   */
  private updateIndicatorPerformance(prediction: PredictionRecord): void {
    if (!prediction.indicators || !prediction.isCorrect !== undefined) return;

    // Track each indicator used in the prediction
    Object.keys(prediction.indicators).forEach(category => {
      const indicators = prediction.indicators[category];
      if (Array.isArray(indicators)) {
        indicators.forEach(indicator => {
          this.updateSingleIndicatorPerformance(indicator.id || indicator.name, prediction);
        });
      }
    });
  }

  /**
   * Update performance for a single indicator
   */
  private updateSingleIndicatorPerformance(indicatorName: string, prediction: PredictionRecord): void {
    let performance = this.indicatorPerformance.get(indicatorName);
    
    if (!performance) {
      performance = {
        indicatorName,
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        avgProfitLoss: 0,
        bestTimeframes: [],
        reliabilityScore: 0,
        confidenceCalibration: 0
      };
      this.indicatorPerformance.set(indicatorName, performance);
    }

    performance.totalPredictions++;
    if (prediction.isCorrect) {
      performance.correctPredictions++;
    }
    
    performance.accuracy = (performance.correctPredictions / performance.totalPredictions) * 100;
    
    // Update average profit/loss
    const currentTotal = performance.avgProfitLoss * (performance.totalPredictions - 1);
    performance.avgProfitLoss = (currentTotal + (prediction.profitLossPercent || 0)) / performance.totalPredictions;
    
    // Calculate reliability score (accuracy weighted by sample size)
    const sampleSizeWeight = Math.min(1, performance.totalPredictions / 100);
    performance.reliabilityScore = performance.accuracy * sampleSizeWeight;
    
    // Update confidence calibration
    this.updateConfidenceCalibration(performance, prediction);
  }

  /**
   * Update confidence calibration for improved accuracy estimation
   */
  private updateConfidenceCalibration(performance: IndicatorPerformance, prediction: PredictionRecord): void {
    // Compare predicted confidence with actual accuracy
    const confidenceError = Math.abs(prediction.confidence - (prediction.accuracyScore || 0));
    
    // Running average of confidence calibration
    const totalPredictions = performance.totalPredictions;
    const currentCalibration = performance.confidenceCalibration * (totalPredictions - 1);
    performance.confidenceCalibration = (currentCalibration + (100 - confidenceError)) / totalPredictions;
  }

  /**
   * Process learning data for pattern recognition
   */
  private processLearningData(prediction: PredictionRecord): void {
    const key = `${prediction.symbol}_${prediction.timeframe}`;
    
    if (!this.learningData.has(key)) {
      this.learningData.set(key, []);
    }
    
    const data = this.learningData.get(key)!;
    data.push({
      entryPrice: prediction.entryPrice,
      direction: prediction.direction,
      confidence: prediction.confidence,
      indicators: prediction.indicators,
      outcome: {
        isCorrect: prediction.isCorrect,
        accuracyScore: prediction.accuracyScore,
        profitLoss: prediction.profitLossPercent
      },
      timestamp: prediction.entryTime
    });
    
    // Keep only recent learning data (last 1000 predictions per symbol/timeframe)
    if (data.length > 1000) {
      data.splice(0, data.length - 1000);
    }
  }

  /**
   * Get enhanced confidence score based on historical performance
   */
  getEnhancedConfidence(
    symbol: string,
    timeframe: string,
    indicators: any,
    baseConfidence: number
  ): number {
    // Calculate indicator reliability multiplier
    let reliabilityMultiplier = 1.0;
    let indicatorCount = 0;
    
    Object.keys(indicators).forEach(category => {
      const categoryIndicators = indicators[category];
      if (Array.isArray(categoryIndicators)) {
        categoryIndicators.forEach(indicator => {
          const performance = this.indicatorPerformance.get(indicator.id || indicator.name);
          if (performance && performance.totalPredictions >= 10) {
            reliabilityMultiplier += (performance.reliabilityScore / 100 - 0.5) * 0.1;
            indicatorCount++;
          }
        });
      }
    });
    
    // Apply learning from historical data
    const learningMultiplier = this.getLearningMultiplier(symbol, timeframe, indicators);
    
    // Combine multipliers with base confidence
    const enhancedConfidence = baseConfidence * reliabilityMultiplier * learningMultiplier;
    
    return Math.max(1, Math.min(100, enhancedConfidence));
  }

  /**
   * Get learning multiplier based on historical patterns
   */
  private getLearningMultiplier(symbol: string, timeframe: string, indicators: any): number {
    const key = `${symbol}_${timeframe}`;
    const data = this.learningData.get(key);
    
    if (!data || data.length < 20) return 1.0;
    
    // Find similar historical scenarios
    const similarScenarios = data.filter(record => {
      return this.areIndicatorsSimilar(record.indicators, indicators);
    });
    
    if (similarScenarios.length < 5) return 1.0;
    
    // Calculate average accuracy of similar scenarios
    const avgAccuracy = similarScenarios.reduce((sum, scenario) => {
      return sum + (scenario.outcome.accuracyScore || 0);
    }, 0) / similarScenarios.length;
    
    // Return multiplier based on historical performance
    return 0.5 + (avgAccuracy / 100);
  }

  /**
   * Check if two indicator sets are similar
   */
  private areIndicatorsSimilar(indicators1: any, indicators2: any): boolean {
    // Simple similarity check - can be enhanced with more sophisticated pattern matching
    const keys1 = Object.keys(indicators1);
    const keys2 = Object.keys(indicators2);
    
    const commonKeys = keys1.filter(key => keys2.includes(key));
    const similarity = commonKeys.length / Math.max(keys1.length, keys2.length);
    
    return similarity >= 0.7; // 70% similarity threshold
  }

  /**
   * Generate unique prediction ID
   */
  private generatePredictionId(symbol: string, timeframe: string, timestamp: number): string {
    return `pred_${symbol.replace('/', '')}_${timeframe}_${timestamp}`;
  }

  /**
   * Initialize indicator performance tracking
   */
  private initializeIndicatorTracking(): void {
    // Initialize with known indicators
    const indicators = [
      'rsi', 'macd', 'bollinger_bands', 'sma_cross', 'ema_cross',
      'stochastic', 'volume_trend', 'support_resistance', 'pattern_recognition'
    ];
    
    indicators.forEach(indicator => {
      if (!this.indicatorPerformance.has(indicator)) {
        this.indicatorPerformance.set(indicator, {
          indicatorName: indicator,
          totalPredictions: 0,
          correctPredictions: 0,
          accuracy: 50, // Start with neutral assumption
          avgProfitLoss: 0,
          bestTimeframes: [],
          reliabilityScore: 0,
          confidenceCalibration: 50
        });
      }
    });
  }

  /**
   * Start performance monitoring loop
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.checkExpiredPredictions();
      this.updateMarketConditionAnalysis();
    }, 60000); // Check every minute
  }

  /**
   * Check and update expired predictions
   */
  private checkExpiredPredictions(): void {
    const now = Date.now();
    
    this.predictionRecords.forEach((prediction, id) => {
      if (prediction.status === 'ACTIVE') {
        const duration = this.TIMEFRAME_DURATIONS[prediction.timeframe] * 60 * 1000;
        const elapsed = now - prediction.entryTime;
        
        if (elapsed > duration * 2) { // Consider expired after 2x expected duration
          prediction.status = 'EXPIRED';
          console.log(`[LegitimateTracker] Prediction ${id} expired due to timeout`);
        }
      }
    });
  }

  /**
   * Update market condition analysis
   */
  private updateMarketConditionAnalysis(): void {
    // Analyze recent prediction performance by market conditions
    // This would be enhanced with more sophisticated market regime detection
    
    const recentPredictions = Array.from(this.predictionRecords.values())
      .filter(p => p.status === 'COMPLETED' && Date.now() - p.entryTime < 24 * 60 * 60 * 1000);
    
    if (recentPredictions.length > 10) {
      const successRate = recentPredictions.filter(p => p.isCorrect).length / recentPredictions.length;
      
      console.log(`[LegitimateTracker] Recent 24h performance: ${(successRate * 100).toFixed(1)}% accuracy (${recentPredictions.length} predictions)`);
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): any {
    const totalPredictions = this.predictionRecords.size;
    const completedPredictions = Array.from(this.predictionRecords.values()).filter(p => p.status === 'COMPLETED');
    const correctPredictions = completedPredictions.filter(p => p.isCorrect);
    
    const overallAccuracy = completedPredictions.length > 0 
      ? (correctPredictions.length / completedPredictions.length) * 100 
      : 0;
    
    const avgProfitLoss = completedPredictions.length > 0
      ? completedPredictions.reduce((sum, p) => sum + (p.profitLossPercent || 0), 0) / completedPredictions.length
      : 0;

    return {
      overall: {
        totalPredictions,
        completedPredictions: completedPredictions.length,
        accuracy: overallAccuracy,
        avgProfitLoss,
        activePredictions: Array.from(this.predictionRecords.values()).filter(p => p.status === 'ACTIVE').length
      },
      indicators: Array.from(this.indicatorPerformance.values())
        .filter(i => i.totalPredictions > 0)
        .sort((a, b) => b.reliabilityScore - a.reliabilityScore),
      recentPerformance: this.getRecentPerformanceMetrics(),
      learningProgress: {
        totalLearningRecords: Array.from(this.learningData.values()).reduce((sum, data) => sum + data.length, 0),
        symbolsCovered: this.learningData.size,
        adaptiveLearning: 'active'
      }
    };
  }

  /**
   * Get recent performance metrics
   */
  private getRecentPerformanceMetrics(): any {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentPredictions = Array.from(this.predictionRecords.values())
      .filter(p => p.entryTime > oneDayAgo && p.status === 'COMPLETED');
    
    if (recentPredictions.length === 0) {
      return { period: '24h', predictions: 0, accuracy: 0, avgReturn: 0 };
    }
    
    const correct = recentPredictions.filter(p => p.isCorrect).length;
    const accuracy = (correct / recentPredictions.length) * 100;
    const avgReturn = recentPredictions.reduce((sum, p) => sum + (p.profitLossPercent || 0), 0) / recentPredictions.length;
    
    return {
      period: '24h',
      predictions: recentPredictions.length,
      accuracy,
      avgReturn,
      correctPredictions: correct
    };
  }

  /**
   * Clear old prediction records (maintenance)
   */
  cleanup(): void {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    this.predictionRecords.forEach((prediction, id) => {
      if (prediction.entryTime < thirtyDaysAgo && prediction.status === 'COMPLETED') {
        this.predictionRecords.delete(id);
      }
    });
    
    console.log(`[LegitimateTracker] Cleanup completed - ${this.predictionRecords.size} records remaining`);
  }
}

// Singleton instance
export const legitimatePerformanceTracker = new LegitimatePerformanceTracker();