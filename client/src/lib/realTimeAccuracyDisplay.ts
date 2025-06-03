/**
 * Real-time Accuracy Display System
 * Tracks and displays live prediction performance
 */

interface LiveAccuracyMetric {
  timeframe: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  profitLoss: number;
  lastUpdate: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface AccuracyTrend {
  timeframe: string;
  accuracyHistory: number[];
  profitHistory: number[];
  recentPerformance: 'excellent' | 'good' | 'average' | 'poor';
}

class RealTimeAccuracyDisplay {
  private metrics: Map<string, LiveAccuracyMetric> = new Map();
  private trends: Map<string, AccuracyTrend> = new Map();
  private listeners: Set<Function> = new Set();

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
    
    timeframes.forEach(tf => {
      this.metrics.set(tf, {
        timeframe: tf,
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        profitLoss: 0,
        lastUpdate: Date.now(),
        trend: 'stable'
      });

      this.trends.set(tf, {
        timeframe: tf,
        accuracyHistory: [],
        profitHistory: [],
        recentPerformance: 'average'
      });
    });
  }

  /**
   * Update accuracy metrics for a specific timeframe
   */
  updateAccuracy(timeframe: string, isCorrect: boolean, profitLoss: number): void {
    const metric = this.metrics.get(timeframe);
    if (!metric) return;

    metric.totalPredictions++;
    if (isCorrect) metric.correctPredictions++;
    
    metric.accuracy = (metric.correctPredictions / metric.totalPredictions) * 100;
    metric.profitLoss += profitLoss;
    metric.lastUpdate = Date.now();

    // Update trend
    const trend = this.trends.get(timeframe);
    if (trend) {
      trend.accuracyHistory.push(metric.accuracy);
      trend.profitHistory.push(metric.profitLoss);
      
      // Keep only last 10 readings
      if (trend.accuracyHistory.length > 10) {
        trend.accuracyHistory.shift();
        trend.profitHistory.shift();
      }

      // Calculate trend direction
      metric.trend = this.calculateTrend(trend.accuracyHistory);
      trend.recentPerformance = this.assessPerformance(metric.accuracy, metric.profitLoss);
    }

    this.notifyListeners();
  }

  private calculateTrend(history: number[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const earlier = history.slice(-6, -3);
    
    if (earlier.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const diff = recentAvg - earlierAvg;
    
    if (diff > 2) return 'improving';
    if (diff < -2) return 'declining';
    return 'stable';
  }

  private assessPerformance(accuracy: number, profitLoss: number): 'excellent' | 'good' | 'average' | 'poor' {
    if (accuracy >= 75 && profitLoss > 0) return 'excellent';
    if (accuracy >= 60 && profitLoss >= 0) return 'good';
    if (accuracy >= 45) return 'average';
    return 'poor';
  }

  /**
   * Get accuracy metrics for a specific timeframe
   */
  getAccuracyMetric(timeframe: string): LiveAccuracyMetric | null {
    return this.metrics.get(timeframe) || null;
  }

  /**
   * Get accuracy trend for a specific timeframe
   */
  getAccuracyTrend(timeframe: string): AccuracyTrend | null {
    return this.trends.get(timeframe) || null;
  }

  /**
   * Get overall performance summary
   */
  getOverallPerformance(): {
    totalPredictions: number;
    overallAccuracy: number;
    totalProfitLoss: number;
    bestTimeframe: string;
    worstTimeframe: string;
  } {
    let totalPredictions = 0;
    let totalCorrect = 0;
    let totalProfitLoss = 0;
    let bestAccuracy = 0;
    let worstAccuracy = 100;
    let bestTimeframe = '';
    let worstTimeframe = '';

    for (const [timeframe, metric] of this.metrics) {
      totalPredictions += metric.totalPredictions;
      totalCorrect += metric.correctPredictions;
      totalProfitLoss += metric.profitLoss;

      if (metric.totalPredictions > 0) {
        if (metric.accuracy > bestAccuracy) {
          bestAccuracy = metric.accuracy;
          bestTimeframe = timeframe;
        }
        if (metric.accuracy < worstAccuracy) {
          worstAccuracy = metric.accuracy;
          worstTimeframe = timeframe;
        }
      }
    }

    return {
      totalPredictions,
      overallAccuracy: totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0,
      totalProfitLoss,
      bestTimeframe,
      worstTimeframe
    };
  }

  /**
   * Get top performing timeframes
   */
  getTopPerformers(): Array<{ timeframe: string; accuracy: number; profitLoss: number }> {
    const performers = Array.from(this.metrics.values())
      .filter(m => m.totalPredictions >= 3) // Minimum sample size
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    return performers.map(p => ({
      timeframe: p.timeframe,
      accuracy: p.accuracy,
      profitLoss: p.profitLoss
    }));
  }

  /**
   * Subscribe to accuracy updates
   */
  subscribe(callback: Function): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Simulate accuracy updates for demo purposes
   */
  simulateAccuracyUpdate(timeframe: string): void {
    const isCorrect = Math.random() > 0.4; // 60% accuracy simulation
    const profitLoss = isCorrect ? Math.random() * 100 : -Math.random() * 50;
    this.updateAccuracy(timeframe, isCorrect, profitLoss);
  }

  /**
   * Get formatted accuracy display data
   */
  getFormattedDisplayData(timeframe: string): {
    accuracy: string;
    predictions: string;
    profitLoss: string;
    trend: string;
    performance: string;
    trendIcon: string;
    performanceColor: string;
  } {
    const metric = this.getAccuracyMetric(timeframe);
    const trend = this.getAccuracyTrend(timeframe);

    if (!metric || !trend) {
      return {
        accuracy: '0%',
        predictions: '0',
        profitLoss: '$0',
        trend: 'stable',
        performance: 'average',
        trendIcon: '→',
        performanceColor: 'text-gray-400'
      };
    }

    const trendIcon = metric.trend === 'improving' ? '↗' : 
                     metric.trend === 'declining' ? '↘' : '→';

    const performanceColor = trend.recentPerformance === 'excellent' ? 'text-green-400' :
                           trend.recentPerformance === 'good' ? 'text-blue-400' :
                           trend.recentPerformance === 'average' ? 'text-yellow-400' : 'text-red-400';

    return {
      accuracy: `${metric.accuracy.toFixed(1)}%`,
      predictions: metric.totalPredictions.toString(),
      profitLoss: `$${metric.profitLoss.toFixed(2)}`,
      trend: metric.trend,
      performance: trend.recentPerformance,
      trendIcon,
      performanceColor
    };
  }
}

// Global instance
export const realTimeAccuracyDisplay = new RealTimeAccuracyDisplay();

// Export helper functions
export const updateAccuracy = (timeframe: string, isCorrect: boolean, profitLoss: number) =>
  realTimeAccuracyDisplay.updateAccuracy(timeframe, isCorrect, profitLoss);

export const getAccuracyMetric = (timeframe: string) =>
  realTimeAccuracyDisplay.getAccuracyMetric(timeframe);

export const getFormattedDisplayData = (timeframe: string) =>
  realTimeAccuracyDisplay.getFormattedDisplayData(timeframe);

export const getOverallPerformance = () =>
  realTimeAccuracyDisplay.getOverallPerformance();

export const subscribeToAccuracyUpdates = (callback: Function) =>
  realTimeAccuracyDisplay.subscribe(callback);