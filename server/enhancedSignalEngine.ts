/**
 * Enhanced Signal Engine
 * Integrates all advanced components: Real OHLC, Multi-timeframe Confluence, Market Breadth
 * Maintains existing interface while providing institutional-grade analysis
 */

import { TechnicalIndicatorsEngine, type TechnicalAnalysis } from './technicalIndicators.js';
import { AdvancedMarketAnalysisEngine, type AdvancedAnalysisResult } from './advancedMarketAnalysis.js';
import { marketSentimentEngine, type SentimentAdjustedSignal } from './marketSentimentEngine.js';
import { realOHLCDataEngine } from './realOHLCDataEngine.js';
import { multiTimeframeConfluenceEngine } from './multiTimeframeConfluenceEngine.js';
import { marketBreadthEngine } from './marketBreadthEngine.js';

interface EnhancedSignalResult {
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  indicators: any;
  reasoning: string[];
  enhancedMetrics: {
    confluenceScore: number;
    breadthAdjustment: number;
    realDataUsed: boolean;
    totalAdjustments: number;
  };
}

interface TimeframeSignalData {
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  strength: number;
  technicalScore: number;
}

export class EnhancedSignalEngine {
  private marketBreadthCache: any = null;
  private lastBreadthUpdate: number = 0;

  /**
   * Calculate enhanced signal with all advanced components
   */
  async calculateEnhancedSignal(
    symbol: string,
    timeframe: string,
    currentPrice: number,
    change24h: number,
    marketCap: number,
    category: string,
    allTimeframeSignals?: TimeframeSignalData[],
    marketData?: Map<string, any>
  ): Promise<EnhancedSignalResult> {

    // Start with advanced market analysis (existing functionality)
    const advancedAnalysis = await AdvancedMarketAnalysisEngine.analyzeMarket(
      symbol,
      currentPrice,
      change24h,
      marketCap,
      category,
      timeframe
    );

    let confidence = advancedAnalysis.layeredScore.normalizedConfidence;
    let direction = advancedAnalysis.layeredScore.direction;
    const reasoning = [...advancedAnalysis.layeredScore.reasoning];
    let totalAdjustments = 0;
    let realDataUsed = false;

    // Enhancement 1: Real OHLC Data Integration
    try {
      const ohlcData = await realOHLCDataEngine.getOHLCData(symbol, timeframe);
      if (ohlcData.length > 20) {
        realDataUsed = true;
        reasoning.push(`Analysis based on ${ohlcData.length} authentic market candles`);
      }
    } catch (error) {
      // Continue with existing analysis if OHLC unavailable
    }

    // Enhancement 2: Multi-timeframe Confluence Analysis
    let confluenceScore = 50;
    if (allTimeframeSignals && allTimeframeSignals.length > 3) {
      const confluenceResult = multiTimeframeConfluenceEngine.calculateConfluence(allTimeframeSignals);
      confluenceScore = confluenceResult.confluenceScore;
      
      // Apply confluence adjustment
      const confluenceAdjustment = this.calculateConfluenceAdjustment(confluenceResult, direction);
      confidence += confluenceAdjustment;
      totalAdjustments += confluenceAdjustment;
      
      if (Math.abs(confluenceAdjustment) > 3) {
        reasoning.push(...multiTimeframeConfluenceEngine.generateConfluenceReasoning(confluenceResult));
      }
    }

    // Enhancement 3: Market Breadth Analysis
    let breadthAdjustment = 0;
    if (marketData && marketData.size > 10) {
      try {
        const breadthAnalysis = await this.getMarketBreadthAnalysis(marketData);
        const breadthResult = marketBreadthEngine.applyBreadthFilter(confidence, direction, breadthAnalysis);
        
        breadthAdjustment = breadthResult.adjustedConfidence - confidence;
        confidence = breadthResult.adjustedConfidence;
        totalAdjustments += breadthAdjustment;
        
        if (breadthResult.breadthReason.length > 0) {
          reasoning.push(...breadthResult.breadthReason);
        }
      } catch (error) {
        // Continue without breadth analysis if unavailable
      }
    }

    // Enhancement 4: Sentiment Analysis (for major pairs)
    if (['BTC/USDT', 'ETH/USDT', 'BNB/USDT'].includes(symbol)) {
      try {
        const sentimentAdjustment = await marketSentimentEngine.adjustSignalWithSentiment(
          confidence,
          direction,
          symbol,
          timeframe
        );
        
        const sentimentChange = sentimentAdjustment.adjustedConfidence - confidence;
        confidence = sentimentAdjustment.adjustedConfidence;
        totalAdjustments += sentimentChange;
        
        if (sentimentAdjustment.sentimentReason.length > 0) {
          reasoning.push(...sentimentAdjustment.sentimentReason);
        }
      } catch (error) {
        // Continue without sentiment if unavailable
      }
    }

    // Ensure confidence bounds
    confidence = Math.max(25, Math.min(95, confidence));

    // Calculate stop loss and take profit using enhanced volatility analysis
    const { stopLoss, takeProfit } = this.calculateEnhancedRiskLevels(
      currentPrice,
      direction,
      timeframe,
      change24h,
      confluenceScore
    );

    // Generate enhanced indicators structure
    const enhancedIndicators = {
      ...advancedAnalysis.technicalAnalysis,
      enhancedMetrics: {
        confluenceScore,
        breadthAdjustment,
        realDataUsed,
        totalAdjustments: Math.round(totalAdjustments)
      }
    };

    return {
      symbol,
      timeframe,
      direction,
      confidence: Math.round(confidence),
      entryPrice: currentPrice,
      stopLoss: Number(stopLoss.toFixed(2)),
      takeProfit: Number(takeProfit.toFixed(2)),
      timestamp: Date.now(),
      indicators: enhancedIndicators,
      reasoning,
      enhancedMetrics: {
        confluenceScore: Math.round(confluenceScore),
        breadthAdjustment: Math.round(breadthAdjustment),
        realDataUsed,
        totalAdjustments: Math.round(totalAdjustments)
      }
    };
  }

  /**
   * Calculate confluence-based confidence adjustment
   */
  private calculateConfluenceAdjustment(confluenceResult: any, direction: string): number {
    let adjustment = 0;
    
    // Strong confluence bonus
    if (confluenceResult.agreementLevel === 'STRONG' && confluenceResult.dominantDirection === direction) {
      adjustment += 10;
    } else if (confluenceResult.agreementLevel === 'MODERATE' && confluenceResult.dominantDirection === direction) {
      adjustment += 5;
    } else if (confluenceResult.agreementLevel === 'CONFLICTED') {
      adjustment -= 8;
    }

    // Consensus bonus
    adjustment += confluenceResult.consensusBonus * 0.3;
    
    // Conflict penalty
    adjustment -= confluenceResult.conflictPenalty * 0.4;

    return Math.max(-15, Math.min(15, adjustment));
  }

  /**
   * Get market breadth analysis with caching
   */
  private async getMarketBreadthAnalysis(marketData: Map<string, any>): Promise<any> {
    const now = Date.now();
    
    // Use cached analysis if recent (5 minutes)
    if (this.marketBreadthCache && (now - this.lastBreadthUpdate) < 5 * 60 * 1000) {
      return this.marketBreadthCache;
    }

    const analysis = await marketBreadthEngine.analyzeMarketBreadth(marketData);
    this.marketBreadthCache = analysis;
    this.lastBreadthUpdate = now;
    
    return analysis;
  }

  /**
   * Calculate enhanced risk levels using confluence and volatility
   */
  private calculateEnhancedRiskLevels(
    currentPrice: number,
    direction: 'LONG' | 'SHORT' | 'NEUTRAL',
    timeframe: string,
    change24h: number,
    confluenceScore: number
  ): { stopLoss: number; takeProfit: number } {
    
    // Base volatility from 24h change
    const baseVolatility = Math.max(0.015, Math.abs(change24h) * 0.002);
    
    // Timeframe multiplier
    const timeframeMultiplier = this.getTimeframeRiskMultiplier(timeframe);
    
    // Confluence adjustment - higher confluence allows tighter stops
    const confluenceAdjustment = confluenceScore > 70 ? 0.8 : confluenceScore < 40 ? 1.3 : 1.0;
    
    // Calculate adjusted risk percentage
    const riskPercent = baseVolatility * timeframeMultiplier * confluenceAdjustment;
    const rewardPercent = riskPercent * 2.2; // Enhanced risk-reward ratio

    let stopLoss: number;
    let takeProfit: number;

    if (direction === 'LONG') {
      stopLoss = currentPrice * (1 - riskPercent);
      takeProfit = currentPrice * (1 + rewardPercent);
    } else if (direction === 'SHORT') {
      stopLoss = currentPrice * (1 + riskPercent);
      takeProfit = currentPrice * (1 - rewardPercent);
    } else {
      // NEUTRAL
      stopLoss = currentPrice * (1 - riskPercent);
      takeProfit = currentPrice * (1 + rewardPercent);
    }

    return { stopLoss, takeProfit };
  }

  /**
   * Get timeframe-specific risk multiplier
   */
  private getTimeframeRiskMultiplier(timeframe: string): number {
    const multipliers: { [key: string]: number } = {
      '1m': 0.6,
      '5m': 0.8,
      '15m': 1.0,
      '30m': 1.2,
      '1h': 1.4,
      '4h': 1.8,
      '1d': 2.2,
      '3d': 2.8,
      '1w': 3.5,
      '1M': 4.0
    };

    return multipliers[timeframe] || 1.0;
  }

  /**
   * Generate summary of enhancements applied
   */
  generateEnhancementSummary(result: EnhancedSignalResult): string {
    const features: string[] = [];
    
    if (result.enhancedMetrics.realDataUsed) {
      features.push('authentic OHLC data');
    }
    
    if (result.enhancedMetrics.confluenceScore > 60) {
      features.push('strong timeframe confluence');
    }
    
    if (Math.abs(result.enhancedMetrics.breadthAdjustment) > 3) {
      features.push('market breadth analysis');
    }
    
    if (features.length === 0) {
      return 'Standard technical analysis';
    }
    
    return `Enhanced with ${features.join(', ')} (+${result.enhancedMetrics.totalAdjustments} confidence adjustment)`;
  }
}

export const enhancedSignalEngine = new EnhancedSignalEngine();