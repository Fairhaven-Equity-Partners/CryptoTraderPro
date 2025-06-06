/**
 * Automated Signal Calculator
 * Continuously calculates and updates signals for all 50 cryptocurrency pairs across all timeframes
 * Runs on synchronized 4-minute intervals with the main calculation engine
 * Optimized for maximum efficiency and accuracy
 */

import { TOP_50_SYMBOL_MAPPINGS, getCoinGeckoId } from './optimizedSymbolMapping.js';
import type { InsertSignalHistory } from '../shared/schema';

interface CalculatedSignal {
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  strength: number;
  price: number;
  timestamp: number;
  indicators: any;
}

export class AutomatedSignalCalculator {
  private isRunning: boolean = false;
  private calculationInterval: NodeJS.Timeout | null = null;
  private lastCalculationTime: number = 0;
  private signalCache: Map<string, CalculatedSignal[]> = new Map();
  
  private readonly timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  private readonly calculationIntervalMs = 4 * 60 * 1000; // 4 minutes

  constructor() {
    console.log('[AutomatedSignalCalculator] Initializing optimized signal calculation system');
  }

  /**
   * Start the automated signal calculation system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[AutomatedSignalCalculator] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[AutomatedSignalCalculator] Starting automated signal calculations');
    
    // Calculate signals immediately on startup
    await this.calculateAllSignals();
    
    // Set up recurring calculations every 4 minutes
    this.calculationInterval = setInterval(async () => {
      try {
        await this.calculateAllSignals();
      } catch (error) {
        console.error('[AutomatedSignalCalculator] Error in scheduled calculation:', error);
      }
    }, this.calculationIntervalMs);

    console.log('[AutomatedSignalCalculator] Automated system started - calculating every 4 minutes');
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
      // Batch fetch all price data with optimized request
      const coinGeckoIds = TOP_50_SYMBOL_MAPPINGS.map(m => m.coinGeckoId).join(',');
      const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&precision=2`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY || '',
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

      // Calculate signals for each cryptocurrency across all timeframes
      for (const mapping of TOP_50_SYMBOL_MAPPINGS) {
        const cryptoData = priceData[mapping.coinGeckoId];
        
        if (!cryptoData || !cryptoData.usd || cryptoData.usd <= 0) {
          console.warn(`[AutomatedSignalCalculator] Invalid price data for ${mapping.symbol}: ${cryptoData?.usd}`);
          continue;
        }

        const currentPrice = Number(cryptoData.usd);
        const change24h = Number(cryptoData.usd_24h_change) || 0;
        const marketCap = Number(cryptoData.usd_market_cap) || 0;

        // Validate price data integrity
        if (currentPrice < 0.000001 || isNaN(currentPrice)) {
          console.warn(`[AutomatedSignalCalculator] Price validation failed for ${mapping.symbol}: ${currentPrice}`);
          continue;
        }

        // Calculate optimized signals for all timeframes
        for (const timeframe of this.timeframes) {
          const signal = this.calculateSignalForPair(
            mapping.symbol, 
            currentPrice, 
            change24h, 
            marketCap, 
            timeframe,
            mapping.category
          );
          
          // Log samples of LONG signals for debugging
          if (signal.direction === 'LONG' && Math.random() < 0.1) {
            console.log(`[AutomatedSignalCalculator] LONG signal found: ${signal.symbol} ${signal.timeframe} - Change: ${change24h}%, Confidence: ${signal.confidence}%`);
          }
          
          allCalculatedSignals[signalIndex++] = signal;
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
   * Calculate optimized signal for a specific cryptocurrency pair and timeframe
   * Enhanced with category-based analysis and improved accuracy
   */
  private calculateSignalForPair(
    symbol: string,
    currentPrice: number,
    change24h: number,
    marketCap: number,
    timeframe: string,
    category?: string
  ): CalculatedSignal {
    // Enhanced market analysis with category-specific optimizations
    const volatility = Math.abs(change24h);
    const isHighVolatility = volatility > 5;
    const isLargeCapCrypto = marketCap > 10000000000; // $10B+
    
    // Category-based signal strength adjustments
    const categoryMultiplier = this.getCategoryMultiplier(category || 'altcoin');
    
    // Timeframe-specific analysis weights
    const timeframeWeight = this.getTimeframeWeight(timeframe);
    
    // RSI-equivalent calculation based on price momentum
    const momentum = Math.min(100, Math.max(0, 50 + (change24h * 3)));

    // Multi-factor signal generation with enhanced accuracy
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 50;

    // Optimized multi-factor trend analysis with enhanced precision
    const strongBullish = change24h > 2.5;
    const moderateBullish = change24h > 0.3 && change24h <= 2.5;
    const strongBearish = change24h < -2.5;
    const moderateBearish = change24h < -0.3 && change24h >= -2.5;
    
    // Enhanced signal generation with improved accuracy
    if (strongBullish) {
      direction = 'LONG';
      confidence = Math.min(95, 65 + (change24h * 5) * categoryMultiplier * timeframeWeight);
    } else if (moderateBullish && momentum > 52) {
      direction = 'LONG';
      confidence = Math.min(85, 50 + (change24h * 10) * categoryMultiplier * timeframeWeight);
    } else if (strongBearish) {
      direction = 'SHORT';
      confidence = Math.min(95, 65 + (Math.abs(change24h) * 5) * categoryMultiplier * timeframeWeight);
    } else if (moderateBearish && momentum < 48) {
      direction = 'SHORT';
      confidence = Math.min(85, 50 + (Math.abs(change24h) * 10) * categoryMultiplier * timeframeWeight);
    } else if (change24h > 0 && momentum > 58) {
      // Enhanced momentum-driven LONG signals
      direction = 'LONG';
      confidence = Math.min(80, 45 + (momentum * 0.6) * categoryMultiplier * timeframeWeight);
    } else if (change24h < 0 && momentum < 42) {
      // Enhanced momentum-driven SHORT signals
      direction = 'SHORT';
      confidence = Math.min(80, 45 + ((60 - momentum) * 0.6) * categoryMultiplier * timeframeWeight);
    } else {
      direction = 'NEUTRAL';
      confidence = Math.max(35, 50 - (volatility * 1.8));
    }

    // Enhanced momentum-based precision adjustments
    if (momentum > 72 && direction === 'LONG') {
      confidence = Math.min(98, confidence + 10);
    } else if (momentum < 28 && direction === 'SHORT') {
      confidence = Math.min(98, confidence + 10);
    }

    // Optimized market cap and volatility adjustments
    if (isLargeCapCrypto && confidence > 65) {
      confidence = Math.min(96, confidence + 6);
    }
    
    if (isHighVolatility && confidence > 60) {
      confidence = Math.min(94, confidence + 4);
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
        trend: [
          { name: "Price Momentum", signal: change24h > 0 ? "BUY" : "SELL", strength: volatility > 3 ? "STRONG" : "MODERATE", value: change24h },
          { name: "Market Structure", signal: direction, strength: confidence > 75 ? "STRONG" : "MODERATE" },
          { name: "Category Analysis", signal: categoryMultiplier > 1 ? "BULLISH" : "NEUTRAL", strength: "MODERATE", value: categoryMultiplier }
        ],
        momentum: [
          { name: "Momentum Index", signal: momentum > 70 ? "OVERBOUGHT" : momentum < 30 ? "OVERSOLD" : "NEUTRAL", strength: "MODERATE", value: momentum }
        ],
        volatility: [
          { name: "Volatility Analysis", signal: isHighVolatility ? "HIGH" : "NORMAL", strength: volatility > 8 ? "STRONG" : "MODERATE", value: volatility }
        ],
        volume: [
          { name: "Market Cap Weight", signal: isLargeCapCrypto ? "STRONG" : "MODERATE", strength: "MODERATE", value: marketCap }
        ]
      }
    };
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
      this.lastCalculationTime + this.calculationIntervalMs - now
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