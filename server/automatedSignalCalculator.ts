/**
 * Automated Signal Calculator
 * Continuously calculates and updates signals for all 50 cryptocurrency pairs across all timeframes
 * Runs on synchronized 4-minute intervals with the main calculation engine
 * Optimized for maximum efficiency and accuracy
 */

import { TOP_50_SYMBOL_MAPPINGS, getCoinGeckoId } from './optimizedSymbolMapping.js';
import type { InsertSignalHistory } from '../shared/schema';
import { TechnicalIndicatorsEngine, type TechnicalAnalysis, type CandlestickData } from './technicalIndicators.js';
import { AdvancedMarketAnalysisEngine, type AdvancedMarketData } from './advancedMarketAnalysis.js';
import { marketSentimentEngine, type SentimentAdjustedSignal } from './marketSentimentEngine.js';
import { smartCacheManager } from './smartCacheManager.js';

interface CalculatedSignal {
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  strength: number;
  price: number;
  timestamp: number;
  indicators: any;
  technicalAnalysis?: TechnicalAnalysis;
  confluenceScore?: number;
  riskReward?: number;
  volatilityAdjustment?: number;
}

export class AutomatedSignalCalculator {
  private isRunning: boolean = false;
  private calculationInterval: NodeJS.Timeout | null = null;
  private lastCalculationTime: number = 0;
  private signalCache: Map<string, CalculatedSignal[]> = new Map();
  private marketVolatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
  private dynamicIntervalMs: number = 4 * 60 * 1000; // Optimized 4 minutes for synchronized calculations
  
  private readonly timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  private readonly baseCalculationIntervalMs = 4 * 60 * 1000; // Base 4 minutes (synchronized with main engine)
  private readonly volatilityThresholds = {
    low: 2,
    medium: 5,
    high: 10,
    extreme: 20
  };

  constructor() {
    console.log('[AutomatedSignalCalculator] Initializing optimized signal calculation system');
  }

  /**
   * Start the automated signal calculation system with immediate initialization
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[AutomatedSignalCalculator] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[AutomatedSignalCalculator] Starting IMMEDIATE automated signal calculations');
    
    // Calculate signals IMMEDIATELY on startup - no delays
    console.log('[AutomatedSignalCalculator] Triggering immediate calculation to eliminate 2-cycle delay');
    try {
      await this.calculateAllSignals();
      console.log('[AutomatedSignalCalculator] Initial calculation completed successfully');
    } catch (error) {
      console.error('[AutomatedSignalCalculator] Initial calculation error:', error);
    }
    
    // Disabled automatic interval - calculations now triggered by component timer only
    // this.calculationInterval = setInterval(async () => {
    //   try {
    //     await this.calculateAllSignals();
    //   } catch (error) {
    //     console.error('[AutomatedSignalCalculator] Error in scheduled calculation:', error);
    //   }
    // }, this.baseCalculationIntervalMs);

    console.log('[AutomatedSignalCalculator] Automated system started - immediate calculations active');
  }

  /**
   * Stop the automated signal calculation system
   */
  stop(): void {
    if (this.calculationInterval) {
      clearInterval(this.calculationInterval);
      this.calculationInterval = null;
    }
    this.isRunning = false;
    console.log('[AutomatedSignalCalculator] Automated signal calculations stopped');
  }

  /**
   * Calculate signals for all cryptocurrency pairs across all timeframes
   * Optimized for maximum efficiency and accuracy
   */
  private async calculateAllSignals(): Promise<void> {
    const startTime = Date.now();
    console.log(`[AutomatedSignalCalculator] Starting optimized calculation for ${TOP_50_SYMBOL_MAPPINGS.length} pairs across ${this.timeframes.length} timeframes`);

    try {
      // Fetch authentic market data from CoinGecko API
      const coinGeckoIds = TOP_50_SYMBOL_MAPPINGS.map(m => m.coinGeckoId).join(',');
      // Use CoinMarketCap service for price fetching
      const { coinMarketCapService } = await import('./coinMarketCapService.js');
      
      const response = await fetch(apiUrl, {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
          'User-Agent': 'CryptoTraderPro/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const priceData = await response.json();
      const fetchedCount = Object.keys(priceData).length;
      console.log(`[AutomatedSignalCalculator] Successfully fetched ${fetchedCount}/${TOP_50_SYMBOL_MAPPINGS.length} price updates`);

      // Pre-allocate arrays for better performance
      const allCalculatedSignals: CalculatedSignal[] = [];
      allCalculatedSignals.length = TOP_50_SYMBOL_MAPPINGS.length * this.timeframes.length;
      let signalIndex = 0;

      // Calculate comprehensive signals for all 50 cryptocurrency pairs across all timeframes
      for (const mapping of TOP_50_SYMBOL_MAPPINGS) {
        const cryptoData = priceData[mapping.coinGeckoId];
        
        if (!cryptoData || !cryptoData.usd || cryptoData.usd <= 0) {
          console.warn(`[AutomatedSignalCalculator] Invalid price data for ${mapping.symbol}: ${cryptoData?.usd}`);
          continue;
        }

        const currentPrice = Number(cryptoData.usd);
        const change24h = Number(cryptoData.usd_24h_change) || 0;
        const marketCap = Number(cryptoData.usd_market_cap) || 0;

        // Validate authentic price data integrity
        if (currentPrice < 0.000001 || isNaN(currentPrice)) {
          console.warn(`[AutomatedSignalCalculator] Price validation failed for ${mapping.symbol}: ${currentPrice}`);
          continue;
        }

        // Calculate comprehensive signals for all timeframes using same technical analysis as BTC/USDT
        for (const timeframe of this.timeframes) {
          try {
            // Apply the same advanced signal calculation system used for BTC/USDT
            const calculatedSignal = await this.calculateSignalForPair(
              mapping.symbol, 
              currentPrice, 
              change24h, 
              marketCap, 
              timeframe,
              mapping.category
            );
            
            if (calculatedSignal) {
              allCalculatedSignals[signalIndex++] = calculatedSignal;
              
              // Log samples for monitoring signal diversity across all pairs
              if (calculatedSignal.direction !== 'NEUTRAL' && Math.random() < 0.05) {
                console.log(`[AutomatedSignalCalculator] ${calculatedSignal.direction} signal: ${calculatedSignal.symbol} ${calculatedSignal.timeframe} - Confidence: ${calculatedSignal.confidence}%`);
              }
            }
          } catch (error) {
            console.error(`[AutomatedSignalCalculator] Error calculating signal for ${mapping.symbol} ${timeframe}:`, error);
            // Create fallback signal with authentic price data
            const fallbackSignal = this.createFallbackSignal(mapping.symbol, currentPrice, change24h, timeframe);
            allCalculatedSignals[signalIndex++] = fallbackSignal;
          }
        }
      }

      // Trim array to actual size
      allCalculatedSignals.length = signalIndex;

      // Efficiently update signal cache
      this.updateSignalCache(allCalculatedSignals);

      this.lastCalculationTime = startTime;
      const duration = Date.now() - startTime;
      const signalsPerSecond = Math.round(allCalculatedSignals.length / (duration / 1000));
      
      // Log signal distribution for analysis
      const signalCounts = { LONG: 0, SHORT: 0, NEUTRAL: 0 };
      allCalculatedSignals.forEach(signal => {
        signalCounts[signal.direction]++;
      });
      
      console.log(`[AutomatedSignalCalculator] ✅ Calculated ${allCalculatedSignals.length} signals in ${duration}ms (${signalsPerSecond} signals/sec)`);
      console.log(`[AutomatedSignalCalculator] 📊 Cache updated with ${this.signalCache.size} symbols across ${this.timeframes.length} timeframes`);
      console.log(`[AutomatedSignalCalculator] 📈 Signal Distribution: LONG=${signalCounts.LONG}, SHORT=${signalCounts.SHORT}, NEUTRAL=${signalCounts.NEUTRAL}`);

    } catch (error) {
      console.error('[AutomatedSignalCalculator] ❌ Critical error in signal calculation:', error);
      // Don't clear cache on error to maintain service availability
    }
  }

  /**
   * Efficiently update signal cache with new calculations
   */
  private updateSignalCache(allSignals: CalculatedSignal[]): void {
    const newCache = new Map<string, CalculatedSignal[]>();
    
    // Group signals by symbol in a single pass
    for (const signal of allSignals) {
      if (!newCache.has(signal.symbol)) {
        newCache.set(signal.symbol, []);
      }
      newCache.get(signal.symbol)!.push(signal);
    }
    
    // Replace cache atomically
    this.signalCache = newCache;
  }

  /**
   * Calculate advanced signal using sophisticated multi-factor analysis
   * Replaces change24h-centric approach with layered scoring system
   */
  private async calculateSignalForPair(
    symbol: string,
    currentPrice: number,
    change24h: number,
    marketCap: number,
    timeframe: string,
    category?: string
  ): Promise<CalculatedSignal> {
    // Perform advanced market analysis
    const advancedAnalysis = await AdvancedMarketAnalysisEngine.analyzeMarket(
      symbol,
      currentPrice,
      change24h,
      marketCap,
      category || 'altcoin',
      timeframe
    );
    
    // Use advanced layered scoring system
    const layeredScore = advancedAnalysis.layeredScore;
    const direction = layeredScore.direction;
    let confidence = layeredScore.normalizedConfidence;
    
    // Apply sentiment analysis enhancement for major pairs
    if (['BTC/USDT', 'ETH/USDT', 'BNB/USDT'].includes(symbol)) {
      try {
        const sentimentAdjustment = await marketSentimentEngine.adjustSignalWithSentiment(
          confidence,
          direction,
          symbol,
          timeframe
        );
        confidence = sentimentAdjustment.adjustedConfidence;
        
        // Add sentiment reasoning to indicators
        if (sentimentAdjustment.sentimentReason.length > 0) {
          layeredScore.reasoning.push(...sentimentAdjustment.sentimentReason);
        }
      } catch (error) {
        console.error(`[AutomatedSignalCalculator] Sentiment analysis failed for ${symbol}:`, error);
      }
    }
    
    // Generate comprehensive indicators from advanced analysis
    const advancedIndicators = {
      trend: [
        { 
          id: "multi_period_returns", 
          name: "Multi-Period Returns", 
          category: "TREND", 
          signal: advancedAnalysis.multiPeriodReturns.weightedMomentumScore > 0 ? "BUY" : "SELL",
          strength: Math.abs(advancedAnalysis.multiPeriodReturns.weightedMomentumScore) > 3 ? "STRONG" : "MODERATE",
          value: advancedAnalysis.multiPeriodReturns.weightedMomentumScore
        },
        { 
          id: "trend_consistency", 
          name: "Trend Consistency", 
          category: "TREND", 
          signal: advancedAnalysis.multiPeriodReturns.trendConsistency > 75 ? "STRONG" : "MODERATE",
          strength: advancedAnalysis.multiPeriodReturns.trendConsistency > 75 ? "STRONG" : "MODERATE",
          value: advancedAnalysis.multiPeriodReturns.trendConsistency
        },
        { 
          id: "ema_short", 
          name: "EMA (12)", 
          category: "TREND", 
          signal: advancedAnalysis.technicalAnalysis.emaShort.signal, 
          strength: advancedAnalysis.technicalAnalysis.emaShort.strength, 
          value: advancedAnalysis.technicalAnalysis.emaShort.value 
        },
        { 
          id: "ema_medium", 
          name: "EMA (26)", 
          category: "TREND", 
          signal: advancedAnalysis.technicalAnalysis.emaMedium.signal, 
          strength: advancedAnalysis.technicalAnalysis.emaMedium.strength, 
          value: advancedAnalysis.technicalAnalysis.emaMedium.value 
        }
      ],
      momentum: [
        { 
          id: "rsi", 
          name: "RSI (14)", 
          category: "MOMENTUM", 
          signal: advancedAnalysis.technicalAnalysis.rsi.signal, 
          strength: advancedAnalysis.technicalAnalysis.rsi.strength, 
          value: advancedAnalysis.technicalAnalysis.rsi.value 
        },
        { 
          id: "macd", 
          name: "MACD", 
          category: "MOMENTUM", 
          signal: advancedAnalysis.technicalAnalysis.macd.result.signal, 
          strength: advancedAnalysis.technicalAnalysis.macd.result.strength, 
          value: advancedAnalysis.technicalAnalysis.macd.histogram 
        },
        { 
          id: "adx", 
          name: "ADX", 
          category: "TREND", 
          signal: advancedAnalysis.technicalAnalysis.adx.result.signal, 
          strength: advancedAnalysis.technicalAnalysis.adx.result.strength, 
          value: advancedAnalysis.technicalAnalysis.adx.adx 
        }
      ],
      volatility: [
        { 
          id: "bollinger", 
          name: "Bollinger Bands", 
          category: "VOLATILITY", 
          signal: advancedAnalysis.technicalAnalysis.bollingerBands.result.signal, 
          strength: advancedAnalysis.technicalAnalysis.bollingerBands.result.strength, 
          value: advancedAnalysis.technicalAnalysis.bollingerBands.position 
        },
        {
          id: "market_regime",
          name: "Market Regime",
          category: "VOLATILITY",
          signal: advancedAnalysis.marketRegime.type,
          strength: advancedAnalysis.marketRegime.strength > 70 ? "STRONG" : "MODERATE",
          value: advancedAnalysis.marketRegime.strength
        }
      ],
      volume: [
        { 
          id: "volume", 
          name: "Volume Analysis", 
          category: "VOLUME", 
          signal: advancedAnalysis.technicalAnalysis.volumeAnalysis.signal, 
          strength: advancedAnalysis.technicalAnalysis.volumeAnalysis.strength, 
          value: advancedAnalysis.technicalAnalysis.volumeAnalysis.value 
        },
        { 
          id: "vwap", 
          name: "VWAP", 
          category: "VOLUME", 
          signal: advancedAnalysis.technicalAnalysis.vwap.signal, 
          strength: advancedAnalysis.technicalAnalysis.vwap.strength, 
          value: advancedAnalysis.technicalAnalysis.vwap.value 
        }
      ],
      confluence: [
        {
          id: "layered_score",
          name: "Advanced Layered Analysis",
          category: "CONFLUENCE",
          signal: direction,
          strength: confidence > 75 ? "STRONG" : confidence > 50 ? "MODERATE" : "WEAK",
          value: layeredScore.totalScore
        }
      ],
      reasoning: layeredScore.reasoning
    };

    return {
      symbol,
      timeframe,
      direction,
      confidence: Math.round(confidence),
      strength: Math.round(confidence),
      price: currentPrice,
      timestamp: Date.now(),
      indicators: advancedIndicators,
      technicalAnalysis: advancedAnalysis.technicalAnalysis,
      confluenceScore: layeredScore.confluenceScore,
      riskReward: this.calculateRiskReward(currentPrice, advancedAnalysis.technicalAnalysis, direction),
      volatilityAdjustment: this.calculateVolatilityAdjustment(Math.abs(change24h), Math.abs(change24h) > 5)
    };
  }

  /**
   * Calculate price-based confidence using traditional momentum analysis
   */
  private calculatePriceBasedConfidence(change24h: number, volatility: number): number {
    const strongBullish = change24h > 2.5;
    const moderateBullish = change24h > 0.3 && change24h <= 2.5;
    const strongBearish = change24h < -2.5;
    const moderateBearish = change24h < -0.3 && change24h >= -2.5;
    
    if (strongBullish) {
      return Math.min(95, 70 + (change24h * 3));
    } else if (moderateBullish) {
      return Math.min(75, 55 + (change24h * 8));
    } else if (strongBearish) {
      return Math.min(95, 70 + (Math.abs(change24h) * 3));
    } else if (moderateBearish) {
      return Math.min(75, 55 + (Math.abs(change24h) * 8));
    } else {
      return Math.max(35, 50 - (volatility * 1.5));
    }
  }

  /**
   * Calculate multi-timeframe confluence score
   */
  private calculateTimeframeConfluence(analysis: TechnicalAnalysis, currentTimeframe: string): number {
    // Higher timeframes get higher confluence weights
    const timeframeHierarchy: Record<string, number> = {
      '1m': 0.3, '5m': 0.4, '15m': 0.5, '30m': 0.6, '1h': 0.7,
      '4h': 0.85, '1d': 1.0, '3d': 1.1, '1w': 1.15, '1M': 1.2
    };

    const baseWeight = timeframeHierarchy[currentTimeframe] || 1.0;
    const confluenceStrength = analysis.confluence.confidenceMultiplier;
    
    // Stronger confluence on higher timeframes gets bigger boost
    return 1.0 + (confluenceStrength * baseWeight * 0.2);
  }

  /**
   * Calculate risk-reward ratio based on technical levels
   */
  private calculateRiskReward(currentPrice: number, analysis: TechnicalAnalysis, direction: string): number {
    const bb = analysis.bollingerBands;
    const vwap = analysis.vwap.value;
    
    if (direction === 'LONG') {
      const stopLoss = Math.min(bb.lower, vwap * 0.98);
      const takeProfit = Math.max(bb.upper, vwap * 1.02);
      const risk = currentPrice - stopLoss;
      const reward = takeProfit - currentPrice;
      return risk > 0 ? reward / risk : 1.5;
    } else if (direction === 'SHORT') {
      const stopLoss = Math.max(bb.upper, vwap * 1.02);
      const takeProfit = Math.min(bb.lower, vwap * 0.98);
      const risk = stopLoss - currentPrice;
      const reward = currentPrice - takeProfit;
      return risk > 0 ? reward / risk : 1.5;
    }
    
    return 1.0;
  }

  /**
   * Calculate volatility-based confidence adjustment
   */
  private calculateVolatilityAdjustment(volatility: number, isHighVolatility: boolean): number {
    if (isHighVolatility) {
      // High volatility: increase opportunity but also risk
      return volatility > 10 ? 1.15 : 1.08;
    } else if (volatility < 1) {
      // Very low volatility: reduce confidence due to low momentum
      return 0.92;
    }
    return 1.0;
  }

  /**
   * Get category-based signal strength multiplier
   */
  private getCategoryMultiplier(category: string): number {
    const multipliers: Record<string, number> = {
      'major': 1.2,
      'layer1': 1.15,
      'defi': 1.1,
      'layer2': 1.05,
      'altcoin': 1.0,
      'meme': 0.95,
      'stablecoin': 0.8
    };
    return multipliers[category] || 1.0;
  }

  /**
   * Get optimized timeframe-specific weight multiplier for enhanced precision
   */
  private getTimeframeWeight(timeframe: string): number {
    const weights: Record<string, number> = {
      '1m': 0.75,
      '5m': 0.82,
      '15m': 0.88,
      '30m': 0.94,
      '1h': 1.0,
      '4h': 1.12,
      '1d': 1.15,
      '3d': 1.1,
      '1w': 1.05,
      '1M': 1.0
    };
    return weights[timeframe] || 1.0;
  }

  /**
   * Get cached signals for a specific symbol and timeframe
   */
  getSignals(symbol: string, timeframe?: string): CalculatedSignal[] {
    const symbolSignals = this.signalCache.get(symbol) || [];
    
    if (timeframe) {
      return symbolSignals.filter(s => s.timeframe === timeframe);
    }
    
    return symbolSignals;
  }

  /**
   * Get all cached signals for the market heatmap
   */
  getAllSignals(): Map<string, CalculatedSignal[]> {
    return this.signalCache;
  }

  /**
   * Create fallback signal for system stability when advanced analysis fails
   */
  private createFallbackSignal(
    symbol: string,
    currentPrice: number,
    change24h: number,
    timeframe: string
  ): CalculatedSignal {
    const volatility = Math.abs(change24h);
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;

    // Simple momentum-based fallback logic
    if (change24h > 3) {
      direction = 'LONG';
      confidence = Math.min(80, 55 + (change24h * 5));
    } else if (change24h < -3) {
      direction = 'SHORT';
      confidence = Math.min(80, 55 + (Math.abs(change24h) * 5));
    }

    return {
      symbol,
      timeframe,
      direction,
      confidence: Math.round(confidence),
      strength: Math.round(confidence),
      price: currentPrice,
      timestamp: Date.now(),
      indicators: {
        trend: [{ 
          id: "fallback", 
          name: "Fallback Analysis", 
          category: "TREND", 
          signal: direction, 
          strength: "MODERATE", 
          value: change24h 
        }],
        momentum: [],
        volatility: [],
        volume: [],
        confluence: []
      }
    };
  }

  /**
   * Get calculation status
   */
  getStatus(): {
    isRunning: boolean;
    lastCalculationTime: number;
    nextCalculationIn: number;
    totalSymbols: number;
    totalSignals: number;
  } {
    const now = Date.now();
    const nextCalculationIn = Math.max(0, 
      this.lastCalculationTime + this.dynamicIntervalMs - now
    );
    
    let totalSignals = 0;
    this.signalCache.forEach(signals => {
      totalSignals += signals.length;
    });

    return {
      isRunning: this.isRunning,
      lastCalculationTime: this.lastCalculationTime,
      nextCalculationIn,
      totalSymbols: this.signalCache.size,
      totalSignals
    };
  }
}

export const automatedSignalCalculator = new AutomatedSignalCalculator();