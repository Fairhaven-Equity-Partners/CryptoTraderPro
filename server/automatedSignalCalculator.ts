/**
 * Automated Signal Calculator
 * Continuously calculates and updates signals for all 50 cryptocurrency pairs across all timeframes
 * Runs on synchronized 4-minute intervals with the main calculation engine
 */

import { TOP_50_SYMBOL_MAPPINGS, getCoinGeckoId } from './optimizedSymbolMapping';
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
    console.log('[AutomatedSignalCalculator] Initializing automated signal calculation system');
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
   */
  private async calculateAllSignals(): Promise<void> {
    const startTime = Date.now();
    console.log('[AutomatedSignalCalculator] Starting automated signal calculation for all 50 pairs');

    try {
      // Fetch all price data from CoinGecko in one batch request
      const coinGeckoIds = TOP_50_SYMBOL_MAPPINGS.map(m => m.coinGeckoId).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
        {
          headers: {
            'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const priceData = await response.json();
      console.log(`[AutomatedSignalCalculator] Fetched price data for ${Object.keys(priceData).length} cryptocurrencies`);

      // Calculate signals for each cryptocurrency across all timeframes
      const allCalculatedSignals: CalculatedSignal[] = [];

      for (const mapping of TOP_50_SYMBOL_MAPPINGS) {
        const cryptoData = priceData[mapping.coinGeckoId];
        
        if (!cryptoData) {
          console.warn(`[AutomatedSignalCalculator] No price data for ${mapping.symbol}`);
          continue;
        }

        const currentPrice = cryptoData.usd;
        const change24h = cryptoData.usd_24h_change || 0;
        const marketCap = cryptoData.usd_market_cap || 0;

        // Calculate signals for all timeframes for this cryptocurrency
        for (const timeframe of this.timeframes) {
          const signal = this.calculateSignalForPair(mapping.symbol, currentPrice, change24h, marketCap, timeframe);
          allCalculatedSignals.push(signal);
        }
      }

      // Group signals by symbol and store in cache
      this.signalCache.clear();
      for (const signal of allCalculatedSignals) {
        if (!this.signalCache.has(signal.symbol)) {
          this.signalCache.set(signal.symbol, []);
        }
        this.signalCache.get(signal.symbol)!.push(signal);
      }

      this.lastCalculationTime = startTime;
      const duration = Date.now() - startTime;
      
      console.log(`[AutomatedSignalCalculator] Completed calculation for ${allCalculatedSignals.length} signals across ${TOP_50_SYMBOL_MAPPINGS.length} pairs in ${duration}ms`);
      console.log(`[AutomatedSignalCalculator] Next calculation in ${this.calculationIntervalMs / 1000} seconds`);

    } catch (error) {
      console.error('[AutomatedSignalCalculator] Error calculating signals:', error);
    }
  }

  /**
   * Calculate signal for a specific cryptocurrency pair and timeframe
   */
  private calculateSignalForPair(
    symbol: string,
    currentPrice: number,
    change24h: number,
    marketCap: number,
    timeframe: string
  ): CalculatedSignal {
    // Authentic market analysis calculations
    const volatility = Math.abs(change24h);
    const isHighVolatility = volatility > 5;
    const isLargeCapCrypto = marketCap > 10000000000; // $10B+
    
    // RSI-equivalent calculation based on price momentum
    const momentum = Math.min(100, Math.max(0, 50 + (change24h * 3)));
    
    // Trend analysis based on 24h change and volatility
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    let confidence: number;
    
    // Market structure analysis
    if (change24h > 5 && momentum > 65) {
      direction = 'LONG';
      confidence = Math.min(95, 65 + volatility * 2);
    } else if (change24h < -5 && momentum < 35) {
      direction = 'SHORT';
      confidence = Math.min(95, 65 + volatility * 2);
    } else if (change24h > 2 && momentum > 55) {
      direction = 'LONG';
      confidence = Math.min(85, 55 + volatility);
    } else if (change24h < -2 && momentum < 45) {
      direction = 'SHORT';
      confidence = Math.min(85, 55 + volatility);
    } else if (Math.abs(change24h) < 1) {
      direction = 'NEUTRAL';
      confidence = 50;
    } else {
      direction = change24h > 0 ? 'LONG' : 'SHORT';
      confidence = Math.min(75, 45 + volatility);
    }
    
    // Timeframe adjustments for confidence
    if (timeframe === '1M' || timeframe === '1w') {
      confidence = Math.min(95, confidence + 10); // Higher confidence for longer timeframes
    } else if (timeframe === '3d' || timeframe === '1d') {
      confidence = Math.min(90, confidence + 5);
    } else if (timeframe === '1m' || timeframe === '5m') {
      confidence = Math.max(35, confidence - 15); // Lower confidence for shorter timeframes
    }
    
    // Large market cap bonus
    if (isLargeCapCrypto) {
      confidence = Math.min(95, confidence + 5);
    }
    
    // High volatility adjustment
    if (isHighVolatility) {
      confidence = Math.min(95, confidence + 8);
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
          { name: "Market Structure", signal: direction, strength: confidence > 75 ? "STRONG" : "MODERATE" }
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
    cachedSignalsCount: number;
  } {
    const nextCalculationIn = this.lastCalculationTime > 0 
      ? Math.max(0, (this.lastCalculationTime + this.calculationIntervalMs) - Date.now())
      : 0;

    let totalSignals = 0;
    for (const [, signals] of this.signalCache) {
      totalSignals += signals.length;
    }

    return {
      isRunning: this.isRunning,
      lastCalculationTime: this.lastCalculationTime,
      nextCalculationIn,
      cachedSignalsCount: totalSignals
    };
  }
}

// Export singleton instance
export const automatedSignalCalculator = new AutomatedSignalCalculator();