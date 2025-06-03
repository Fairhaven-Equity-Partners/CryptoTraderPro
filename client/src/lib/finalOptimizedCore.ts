import { ChartData, TimeFrame, AdvancedSignal } from '../types';
import { optimizedSignalEngine } from './optimizedSignalEngine';
import { TIMEFRAMES } from './optimizedTypes';

/**
 * Final Optimized Core System
 * Single entry point for all cryptocurrency analysis calculations
 * Eliminates code duplication and maximizes performance
 */

export class FinalOptimizedCore {
  private static instance: FinalOptimizedCore;
  private isInitialized = false;
  private activeCalculations = new Set<string>();
  private lastCalculationTime = 0;
  private performanceMetrics = {
    totalCalculations: 0,
    averageTime: 0,
    cacheHitRate: 0
  };

  static getInstance(): FinalOptimizedCore {
    if (!FinalOptimizedCore.instance) {
      FinalOptimizedCore.instance = new FinalOptimizedCore();
    }
    return FinalOptimizedCore.instance;
  }

  /**
   * Initialize the core system
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    console.log('Initializing Final Optimized Core System');
    this.isInitialized = true;
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Process price data update for symbol and timeframe
   */
  updateMarketData(symbol: string, timeframe: TimeFrame, data: ChartData[]): void {
    if (!this.isInitialized) this.initialize();
    
    optimizedSignalEngine.updatePriceData(symbol, timeframe, data);
  }

  /**
   * Calculate signal for specific symbol and timeframe
   */
  async calculateSignal(
    symbol: string, 
    timeframe: TimeFrame, 
    currentPrice: number
  ): Promise<AdvancedSignal> {
    const startTime = performance.now();
    const calculationKey = `${symbol}_${timeframe}`;
    
    // Prevent duplicate calculations
    if (this.activeCalculations.has(calculationKey)) {
      return this.createDefaultSignal(symbol, timeframe, currentPrice);
    }
    
    this.activeCalculations.add(calculationKey);
    
    try {
      const signal = optimizedSignalEngine.generateSignal(symbol, timeframe, currentPrice);
      
      // Update performance metrics
      const executionTime = performance.now() - startTime;
      this.updatePerformanceMetrics(executionTime);
      
      return signal;
    } finally {
      this.activeCalculations.delete(calculationKey);
      this.lastCalculationTime = Date.now();
    }
  }

  /**
   * Calculate signals for all timeframes simultaneously
   */
  async calculateAllTimeframes(
    symbol: string, 
    currentPrice: number
  ): Promise<Record<TimeFrame, AdvancedSignal>> {
    const startTime = performance.now();
    
    // Use parallel processing for multiple timeframes
    const signalPromises = TIMEFRAMES.map(async (timeframe) => {
      const signal = await this.calculateSignal(symbol, timeframe, currentPrice);
      return [timeframe, signal] as [TimeFrame, AdvancedSignal];
    });
    
    const signals = await Promise.all(signalPromises);
    const result = Object.fromEntries(signals) as Record<TimeFrame, AdvancedSignal>;
    
    // Update performance metrics
    const executionTime = performance.now() - startTime;
    this.updatePerformanceMetrics(executionTime);
    
    return result;
  }

  /**
   * Generate trade recommendation based on signals
   */
  generateTradeRecommendation(
    signals: Record<TimeFrame, AdvancedSignal>,
    selectedTimeframe: TimeFrame
  ): any {
    const signal = signals[selectedTimeframe];
    if (!signal || signal.direction === 'NEUTRAL') {
      return null;
    }

    // Calculate timeframe confluence
    const confluence = this.calculateTimeframeConfluence(signals, signal.direction);
    
    // Extract key technical indicators
    const keyIndicators = this.extractKeyTechnicalFactors(signal);
    
    // Calculate risk-adjusted metrics
    const riskMetrics = this.calculateRiskAdjustedMetrics(signal);

    return {
      direction: signal.direction,
      confidence: Math.round(signal.confidence * confluence),
      entry: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      riskReward: riskMetrics.riskReward,
      positionSize: riskMetrics.recommendedSize,
      timeframe: selectedTimeframe,
      confluence: Math.round(confluence * 100),
      keyFactors: keyIndicators,
      successProbability: signal.successProbability,
      marketCondition: this.assessMarketCondition(signal),
      summary: this.generateTradeSummary(signal, confluence)
    };
  }

  /**
   * Calculate confluence across timeframes
   */
  private calculateTimeframeConfluence(
    signals: Record<TimeFrame, AdvancedSignal>,
    direction: string
  ): number {
    const timeframeWeights = {
      '1m': 0.05, '5m': 0.08, '15m': 0.12, '30m': 0.15,
      '1h': 0.18, '4h': 0.20, '1d': 0.22, '3d': 0.18,
      '1w': 0.15, '1M': 0.12
    };

    let weightedConfluence = 0;
    let totalWeight = 0;

    for (const [timeframe, signal] of Object.entries(signals)) {
      if (signal && signal.direction !== 'NEUTRAL') {
        const weight = timeframeWeights[timeframe as TimeFrame] || 0.1;
        const agreement = signal.direction === direction ? 1 : -0.5;
        const confidenceScore = signal.confidence / 100;
        
        weightedConfluence += weight * agreement * confidenceScore;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.max(0.3, weightedConfluence / totalWeight) : 0.5;
  }

  /**
   * Extract key technical factors from signal
   */
  private extractKeyTechnicalFactors(signal: AdvancedSignal): string[] {
    const factors: string[] = [];
    const indicators = signal.indicators || {};

    // RSI analysis
    if (indicators.rsi?.value < 30) factors.push('RSI Oversold');
    else if (indicators.rsi?.value > 70) factors.push('RSI Overbought');

    // MACD momentum
    if (indicators.macd?.histogram > 0) factors.push('MACD Bullish');
    else if (indicators.macd?.histogram < 0) factors.push('MACD Bearish');

    // Trend analysis
    const ema = indicators.ema;
    if (ema?.short > ema?.medium && ema?.medium > ema?.long) {
      factors.push('Uptrend Confirmed');
    } else if (ema?.short < ema?.medium && ema?.medium < ema?.long) {
      factors.push('Downtrend Confirmed');
    }

    // Volatility and strength
    if (indicators.adx?.value > 30) factors.push('Strong Trend');
    if (indicators.volatility > 0.05) factors.push('High Volatility');

    return factors.slice(0, 4); // Limit to most important factors
  }

  /**
   * Calculate risk-adjusted position metrics
   */
  private calculateRiskAdjustedMetrics(signal: AdvancedSignal): any {
    const entryPrice = signal.entryPrice;
    const stopLoss = signal.stopLoss || entryPrice * 0.98;
    const takeProfit = signal.takeProfit || entryPrice * 1.04;
    
    const riskAmount = Math.abs(entryPrice - stopLoss);
    const rewardAmount = Math.abs(takeProfit - entryPrice);
    const riskReward = rewardAmount / riskAmount;
    
    // Position sizing based on risk (2% portfolio risk rule)
    const recommendedSize = Math.min(0.25, 0.02 / (riskAmount / entryPrice));
    
    return {
      riskReward: Math.round(riskReward * 100) / 100,
      recommendedSize: Math.round(recommendedSize * 100) / 100,
      riskPercent: Math.round((riskAmount / entryPrice) * 10000) / 100
    };
  }

  /**
   * Assess overall market condition
   */
  private assessMarketCondition(signal: AdvancedSignal): string {
    const indicators = signal.indicators || {};
    
    const adx = indicators.adx?.value || 25;
    const volatility = indicators.volatility || 0.02;
    const rsi = indicators.rsi?.value || 50;
    
    if (adx > 40 && volatility < 0.03) return 'Strong Trending';
    if (adx < 20 && volatility < 0.02) return 'Consolidating';
    if (volatility > 0.08) return 'High Volatility';
    if (rsi < 35 || rsi > 65) return 'Momentum Building';
    
    return 'Normal Market';
  }

  /**
   * Generate human-readable trade summary
   */
  private generateTradeSummary(signal: AdvancedSignal, confluence: number): string {
    const direction = signal.direction.toLowerCase();
    const confidence = signal.confidence;
    const confluencePercent = Math.round(confluence * 100);
    
    return `${confidence}% confidence ${direction} signal with ${confluencePercent}% multi-timeframe alignment. Success probability: ${signal.successProbability}%.`;
  }

  /**
   * Create default signal when calculation fails
   */
  private createDefaultSignal(
    symbol: string, 
    timeframe: TimeFrame, 
    currentPrice: number
  ): AdvancedSignal {
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
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor calculation performance every 30 seconds
    setInterval(() => {
      const stats = optimizedSignalEngine.getStats();
      console.log(`Performance: ${stats.calculations} cached calculations, ${stats.signals} active signals`);
    }, 30000);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(executionTime: number): void {
    this.performanceMetrics.totalCalculations++;
    
    // Rolling average calculation time
    this.performanceMetrics.averageTime = 
      (this.performanceMetrics.averageTime * 0.9) + (executionTime * 0.1);
  }

  /**
   * Get system performance statistics
   */
  getPerformanceStats(): any {
    const engineStats = optimizedSignalEngine.getStats();
    
    return {
      totalCalculations: this.performanceMetrics.totalCalculations,
      averageExecutionTime: Math.round(this.performanceMetrics.averageTime * 100) / 100,
      activeCalculations: this.activeCalculations.size,
      lastCalculation: this.lastCalculationTime,
      cacheStats: engineStats,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Get memory usage statistics
   */
  private getMemoryUsage(): any {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  /**
   * Clear all caches and reset system
   */
  clearAllCaches(): void {
    optimizedSignalEngine.clearCache();
    this.activeCalculations.clear();
    this.performanceMetrics = {
      totalCalculations: 0,
      averageTime: 0,
      cacheHitRate: 0
    };
  }

  /**
   * Health check for the system
   */
  healthCheck(): boolean {
    return this.isInitialized && 
           this.activeCalculations.size < 10 && 
           this.performanceMetrics.averageTime < 100;
  }
}

// Export singleton instance
export const finalOptimizedCore = FinalOptimizedCore.getInstance();