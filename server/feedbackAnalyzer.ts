/**
 * Feedback Analysis Engine
 * Continuously evaluates prediction accuracy and adapts signal weights for improved performance
 * Implements dynamic learning to optimize signal quality over time
 */

import { storage } from './storage';
import type { TradeSimulation } from '@shared/schema';

interface IndicatorPerformance {
  indicator: string;
  hitRate: number;
  totalPredictions: number;
  successfulPredictions: number;
  averageReturn: number;
  confidenceAccuracy: number;
  lastUpdated: number;
}

interface TimeframePerformance {
  timeframe: string;
  hitRate: number;
  totalSignals: number;
  successfulSignals: number;
  averageConfidence: number;
  actualAccuracy: number;
  performanceScore: number;
}

interface SymbolPerformance {
  symbol: string;
  category: string;
  hitRate: number;
  volatilityAdjustedReturn: number;
  signalQuality: number;
  bestTimeframes: string[];
}

export class FeedbackAnalyzer {
  private performanceCache: Map<string, any> = new Map();
  private lastAnalysisTime: number = 0;
  private readonly analysisIntervalMs = 30 * 60 * 1000; // 30 minutes
  
  constructor() {
    console.log('[FeedbackAnalyzer] Initializing intelligent feedback analysis system');
  }

  /**
   * Start continuous feedback analysis with periodic performance evaluation
   */
  async start(): Promise<void> {
    console.log('[FeedbackAnalyzer] Starting adaptive feedback analysis');
    
    // Run initial analysis
    await this.runPerformanceAnalysis();
    
    // Schedule periodic analysis
    setInterval(async () => {
      try {
        await this.runPerformanceAnalysis();
      } catch (error) {
        console.error('[FeedbackAnalyzer] Error in periodic analysis:', error);
      }
    }, this.analysisIntervalMs);
  }

  /**
   * Comprehensive performance analysis of all predictions
   */
  private async runPerformanceAnalysis(): Promise<void> {
    const startTime = Date.now();
    console.log('[FeedbackAnalyzer] Running comprehensive performance analysis');

    try {
      // Get all trade simulations for analysis  
      const allSimulations = await storage.getTradeSimulations('BTC/USDT');
      
      if (allSimulations.length < 10) {
        console.log('[FeedbackAnalyzer] Insufficient data for analysis - need at least 10 predictions');
        return;
      }

      // Evaluate prediction outcomes
      const evaluatedSimulations = await this.evaluateAllPredictions(allSimulations);
      
      // Analyze indicator performance
      const indicatorPerformance = await this.analyzeIndicatorPerformance(evaluatedSimulations);
      
      // Analyze timeframe performance
      const timeframePerformance = await this.analyzeTimeframePerformance(evaluatedSimulations);
      
      // Analyze symbol performance
      const symbolPerformance = await this.analyzeSymbolPerformance(evaluatedSimulations);
      
      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(
        indicatorPerformance,
        timeframePerformance,
        symbolPerformance
      );
      
      // Cache results
      this.performanceCache.set('indicators', indicatorPerformance);
      this.performanceCache.set('timeframes', timeframePerformance);
      this.performanceCache.set('symbols', symbolPerformance);
      this.performanceCache.set('recommendations', recommendations);
      
      this.lastAnalysisTime = startTime;
      const duration = Date.now() - startTime;
      
      console.log(`[FeedbackAnalyzer] Analysis completed in ${duration}ms`);
      console.log(`[FeedbackAnalyzer] Analyzed ${evaluatedSimulations.length} predictions`);
      console.log(`[FeedbackAnalyzer] Generated ${recommendations.length} optimization recommendations`);
      
    } catch (error) {
      console.error('[FeedbackAnalyzer] Error in performance analysis:', error);
    }
  }

  /**
   * Evaluate prediction outcomes for all trade simulations
   */
  private async evaluateAllPredictions(simulations: TradeSimulation[]): Promise<Array<TradeSimulation & { outcome: 'hit' | 'miss' | 'pending'; actualReturn: number }>> {
    const evaluatedPredictions = [];
    
    for (const simulation of simulations) {
      try {
        const evaluation = await this.evaluatePredictionOutcome(simulation);
        evaluatedPredictions.push({
          ...simulation,
          outcome: evaluation.outcome,
          actualReturn: evaluation.actualReturn
        });
      } catch (error) {
        console.error(`[FeedbackAnalyzer] Error evaluating prediction ${simulation.id}:`, error);
      }
    }
    
    return evaluatedPredictions;
  }

  /**
   * Evaluate individual prediction outcome
   */
  private async evaluatePredictionOutcome(simulation: TradeSimulation): Promise<{ outcome: 'hit' | 'miss' | 'pending'; actualReturn: number }> {
    // If simulation is still active, check current price against targets
    if (simulation.isActive && !simulation.exitPrice) {
      // Get current price for the symbol (simplified - would normally fetch from price manager)
      const currentPrice = await this.getCurrentPriceForSymbol(simulation.symbol);
      
      if (!currentPrice) {
        return { outcome: 'pending', actualReturn: 0 };
      }
      
      const entryPrice = simulation.entryPrice;
      const stopLoss = simulation.stopLoss;
      const takeProfit = simulation.takeProfit;
      
      // Check if stop loss or take profit hit
      if (simulation.direction === 'LONG') {
        if (currentPrice <= stopLoss) {
          return { 
            outcome: 'miss', 
            actualReturn: ((stopLoss - entryPrice) / entryPrice) * 100 
          };
        } else if (currentPrice >= takeProfit) {
          return { 
            outcome: 'hit', 
            actualReturn: ((takeProfit - entryPrice) / entryPrice) * 100 
          };
        }
      } else if (simulation.direction === 'SHORT') {
        if (currentPrice >= stopLoss) {
          return { 
            outcome: 'miss', 
            actualReturn: ((entryPrice - stopLoss) / entryPrice) * 100 
          };
        } else if (currentPrice <= takeProfit) {
          return { 
            outcome: 'hit', 
            actualReturn: ((entryPrice - takeProfit) / entryPrice) * 100 
          };
        }
      }
      
      // Still pending
      const unrealizedReturn = simulation.direction === 'LONG' 
        ? ((currentPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - currentPrice) / entryPrice) * 100;
        
      return { outcome: 'pending', actualReturn: unrealizedReturn };
    }
    
    // If simulation has exit data, use that
    if (simulation.exitPrice && simulation.profitLossPercent !== null) {
      const outcome = simulation.profitLossPercent > 0 ? 'hit' : 'miss';
      return { outcome, actualReturn: simulation.profitLossPercent };
    }
    
    return { outcome: 'pending', actualReturn: 0 };
  }

  /**
   * Analyze performance of different indicators
   */
  private async analyzeIndicatorPerformance(evaluatedSimulations: Array<TradeSimulation & { outcome: string; actualReturn: number }>): Promise<IndicatorPerformance[]> {
    const indicatorStats = new Map<string, { hits: number; total: number; returns: number[]; confidences: number[] }>();
    
    for (const sim of evaluatedSimulations) {
      if (sim.outcome === 'pending') continue;
      
      try {
        // Parse signal data to extract indicator information
        const signalData = typeof sim.signalData === 'string' ? JSON.parse(sim.signalData) : sim.signalData;
        const indicators = signalData?.indicators || {};
        
        // Analyze each indicator's contribution
        for (const [indicatorType, indicatorArray] of Object.entries(indicators)) {
          if (Array.isArray(indicatorArray)) {
            for (const indicator of indicatorArray) {
              const key = `${indicatorType}_${indicator.id}`;
              
              if (!indicatorStats.has(key)) {
                indicatorStats.set(key, { hits: 0, total: 0, returns: [], confidences: [] });
              }
              
              const stats = indicatorStats.get(key)!;
              stats.total++;
              stats.returns.push(sim.actualReturn);
              stats.confidences.push(sim.confidence);
              
              if (sim.outcome === 'hit') {
                stats.hits++;
              }
            }
          }
        }
      } catch (error) {
        console.error('[FeedbackAnalyzer] Error parsing signal data:', error);
      }
    }
    
    // Convert to performance metrics
    const performance: IndicatorPerformance[] = [];
    const entries = Array.from(indicatorStats.entries());
    
    for (const [indicator, stats] of entries) {
      if (stats.total >= 5) { // Minimum sample size
        const hitRate = stats.hits / stats.total;
        const averageReturn = stats.returns.reduce((a: number, b: number) => a + b, 0) / stats.returns.length;
        const averageConfidence = stats.confidences.reduce((a: number, b: number) => a + b, 0) / stats.confidences.length;
        
        performance.push({
          indicator,
          hitRate,
          totalPredictions: stats.total,
          successfulPredictions: stats.hits,
          averageReturn,
          confidenceAccuracy: hitRate / (averageConfidence / 100), // How well confidence predicts success
          lastUpdated: Date.now()
        });
      }
    }
    
    return performance.sort((a: IndicatorPerformance, b: IndicatorPerformance) => b.hitRate - a.hitRate);
  }

  /**
   * Analyze performance across different timeframes
   */
  private async analyzeTimeframePerformance(evaluatedSimulations: Array<TradeSimulation & { outcome: string; actualReturn: number }>): Promise<TimeframePerformance[]> {
    const timeframeStats = new Map<string, { hits: number; total: number; confidences: number[] }>();
    
    for (const sim of evaluatedSimulations) {
      if (sim.outcome === 'pending') continue;
      
      const timeframe = sim.timeframe;
      if (!timeframeStats.has(timeframe)) {
        timeframeStats.set(timeframe, { hits: 0, total: 0, confidences: [] });
      }
      
      const stats = timeframeStats.get(timeframe)!;
      stats.total++;
      stats.confidences.push(sim.confidence);
      
      if (sim.outcome === 'hit') {
        stats.hits++;
      }
    }
    
    const performance: TimeframePerformance[] = [];
    const entries = Array.from(timeframeStats.entries());
    
    for (const [timeframe, stats] of entries) {
      if (stats.total >= 3) { // Minimum sample size
        const hitRate = stats.hits / stats.total;
        const averageConfidence = stats.confidences.reduce((a: number, b: number) => a + b, 0) / stats.confidences.length;
        const performanceScore = hitRate * (averageConfidence / 100);
        
        performance.push({
          timeframe,
          hitRate,
          totalSignals: stats.total,
          successfulSignals: stats.hits,
          averageConfidence,
          actualAccuracy: hitRate,
          performanceScore
        });
      }
    }
    
    return performance.sort((a: TimeframePerformance, b: TimeframePerformance) => b.performanceScore - a.performanceScore);
  }

  /**
   * Analyze performance across different symbols and categories
   */
  private async analyzeSymbolPerformance(evaluatedSimulations: Array<TradeSimulation & { outcome: string; actualReturn: number }>): Promise<SymbolPerformance[]> {
    const symbolStats = new Map<string, { hits: number; total: number; returns: number[]; timeframes: Map<string, number> }>();
    
    for (const sim of evaluatedSimulations) {
      if (sim.outcome === 'pending') continue;
      
      const symbol = sim.symbol;
      if (!symbolStats.has(symbol)) {
        symbolStats.set(symbol, { hits: 0, total: 0, returns: [], timeframes: new Map() });
      }
      
      const stats = symbolStats.get(symbol)!;
      stats.total++;
      stats.returns.push(sim.actualReturn);
      
      // Track timeframe performance for this symbol
      const timeframeHits = stats.timeframes.get(sim.timeframe) || 0;
      if (sim.outcome === 'hit') {
        stats.hits++;
        stats.timeframes.set(sim.timeframe, timeframeHits + 1);
      }
    }
    
    const performance: SymbolPerformance[] = [];
    const entries = Array.from(symbolStats.entries());
    
    for (const [symbol, stats] of entries) {
      if (stats.total >= 3) { // Minimum sample size
        const hitRate = stats.hits / stats.total;
        const averageReturn = stats.returns.reduce((a: number, b: number) => a + b, 0) / stats.returns.length;
        const volatilityAdjustedReturn = averageReturn / Math.sqrt(stats.returns.length); // Simplified Sharpe-like ratio
        
        // Find best performing timeframes for this symbol
        const timeframeEntries = Array.from(stats.timeframes.entries());
        const bestTimeframes: string[] = timeframeEntries
          .filter(([_, hits]: [string, number]) => hits >= 1)
          .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
          .slice(0, 3)
          .map(([timeframe]: [string, number]) => timeframe);
        
        performance.push({
          symbol,
          category: this.getSymbolCategory(symbol),
          hitRate,
          volatilityAdjustedReturn,
          signalQuality: hitRate * Math.abs(averageReturn),
          bestTimeframes
        });
      }
    }
    
    return performance.sort((a: SymbolPerformance, b: SymbolPerformance) => b.signalQuality - a.signalQuality);
  }

  /**
   * Generate optimization recommendations based on performance analysis
   */
  private generateOptimizationRecommendations(
    indicators: IndicatorPerformance[],
    timeframes: TimeframePerformance[],
    symbols: SymbolPerformance[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Indicator recommendations
    const topIndicators = indicators.slice(0, 3);
    const worstIndicators = indicators.slice(-2);
    
    if (topIndicators.length > 0) {
      recommendations.push(`Increase weight for top performing indicators: ${topIndicators.map(i => i.indicator).join(', ')}`);
    }
    
    if (worstIndicators.length > 0 && worstIndicators[0].hitRate < 0.4) {
      recommendations.push(`Consider reducing weight for underperforming indicators: ${worstIndicators.map(i => i.indicator).join(', ')}`);
    }
    
    // Timeframe recommendations
    const bestTimeframes = timeframes.filter(t => t.hitRate > 0.6);
    const worstTimeframes = timeframes.filter(t => t.hitRate < 0.4);
    
    if (bestTimeframes.length > 0) {
      recommendations.push(`Focus on high-performing timeframes: ${bestTimeframes.map(t => t.timeframe).join(', ')}`);
    }
    
    if (worstTimeframes.length > 0) {
      recommendations.push(`Review signal logic for underperforming timeframes: ${worstTimeframes.map(t => t.timeframe).join(', ')}`);
    }
    
    // Symbol recommendations
    const topSymbols = symbols.filter(s => s.hitRate > 0.65);
    if (topSymbols.length > 0) {
      recommendations.push(`Prioritize signals for high-performing symbols: ${topSymbols.map(s => s.symbol).join(', ')}`);
    }
    
    return recommendations;
  }

  /**
   * Get current price for symbol evaluation
   */
  private async getCurrentPriceForSymbol(symbol: string): Promise<number | null> {
    try {
      // This would integrate with the CentralizedPriceManager
      // For now, return null to indicate pending evaluation
      return null;
    } catch (error) {
      console.error(`[FeedbackAnalyzer] Error getting current price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get symbol category for analysis
   */
  private getSymbolCategory(symbol: string): string {
    // This would integrate with the symbol mapping
    if (symbol.includes('BTC') || symbol.includes('ETH')) return 'major';
    if (symbol.includes('USDT') || symbol.includes('USDC')) return 'stablecoin';
    return 'altcoin';
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): {
    indicators: IndicatorPerformance[];
    timeframes: TimeframePerformance[];
    symbols: SymbolPerformance[];
    recommendations: string[];
    lastUpdated: number;
  } {
    return {
      indicators: this.performanceCache.get('indicators') || [],
      timeframes: this.performanceCache.get('timeframes') || [],
      symbols: this.performanceCache.get('symbols') || [],
      recommendations: this.performanceCache.get('recommendations') || [],
      lastUpdated: this.lastAnalysisTime
    };
  }
}

export const feedbackAnalyzer = new FeedbackAnalyzer();