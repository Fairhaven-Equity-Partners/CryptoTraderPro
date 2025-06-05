/**
 * Streamlined Price Engine
 * Optimized for all 50 cryptocurrency pairs with minimal API usage
 * Ensures authentic data integrity across the entire platform
 */

import { TOP_50_SYMBOL_MAPPINGS, getCoinGeckoId } from './optimizedSymbolMapping.js';
import { storage } from './storage.js';

interface PriceData {
  price: number;
  change24h: number;
  timestamp: number;
  symbol: string;
}

interface BatchResponse {
  [coinGeckoId: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export class StreamlinedPriceEngine {
  private priceCache = new Map<string, PriceData>();
  private subscribers = new Map<string, Set<(data: PriceData) => void>>();
  private fetchInterval = 4 * 60 * 1000; // 4 minutes
  private maxBatchSize = 20; // Optimal for CoinGecko free tier
  private isRunning = false;
  private lastFetch = 0;

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize price cache for all 50 pairs
   */
  private initializeCache(): void {
    TOP_50_SYMBOL_MAPPINGS.forEach(mapping => {
      this.priceCache.set(mapping.symbol, {
        price: 0,
        change24h: 0,
        timestamp: 0,
        symbol: mapping.symbol
      });
      this.subscribers.set(mapping.symbol, new Set());
    });
    console.log(`[StreamlinedPriceEngine] Initialized cache for ${this.priceCache.size} pairs`);
  }

  /**
   * Subscribe to price updates for a symbol
   */
  subscribe(symbol: string, callback: (data: PriceData) => void): () => void {
    const symbolSubscribers = this.subscribers.get(symbol);
    if (symbolSubscribers) {
      symbolSubscribers.add(callback);
      
      // Send current price if available
      const currentPrice = this.priceCache.get(symbol);
      if (currentPrice && currentPrice.price > 0) {
        callback(currentPrice);
      }
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol: string): PriceData | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Start the streamlined price engine
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[StreamlinedPriceEngine] Starting optimized price fetching');
    
    // Initial fetch
    this.fetchAllPrices();
    
    // Set up interval
    setInterval(() => {
      this.fetchAllPrices();
    }, this.fetchInterval);
  }

  /**
   * Fetch prices for all pairs in optimized batches
   */
  private async fetchAllPrices(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch < this.fetchInterval - 1000) {
      return; // Prevent too frequent calls
    }

    try {
      const coinGeckoIds = TOP_50_SYMBOL_MAPPINGS.map(m => m.coinGeckoId);
      const batches = this.createBatches(coinGeckoIds);
      
      console.log(`[StreamlinedPriceEngine] Fetching ${coinGeckoIds.length} pairs in ${batches.length} batches`);

      for (let i = 0; i < batches.length; i++) {
        await this.fetchBatch(batches[i]);
        
        // Delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await this.delay(1200); // 1.2 seconds between batches
        }
      }

      this.lastFetch = now;
      console.log(`[StreamlinedPriceEngine] Completed price update for all ${coinGeckoIds.length} pairs`);

    } catch (error) {
      console.error('[StreamlinedPriceEngine] Fetch error:', error);
    }
  }

  /**
   * Fetch a single batch of prices
   */
  private async fetchBatch(coinGeckoIds: string[]): Promise<void> {
    try {
      const idsParam = coinGeckoIds.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`;
      
      const headers: Record<string, string> = {};
      const apiKey = process.env.COINGECKO_API_KEY;
      if (apiKey) {
        headers['x-cg-demo-api-key'] = apiKey;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data: BatchResponse = await response.json();
      
      // Process each coin in the batch
      coinGeckoIds.forEach(coinGeckoId => {
        const symbol = this.getSymbolFromCoinGeckoId(coinGeckoId);
        if (!symbol) return;

        const coinData = data[coinGeckoId];
        if (coinData && coinData.usd) {
          const priceData: PriceData = {
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            timestamp: Date.now(),
            symbol
          };

          // Update cache
          this.priceCache.set(symbol, priceData);

          // Notify subscribers
          this.notifySubscribers(symbol, priceData);

          // Update storage
          this.updateStorage(symbol, priceData);
        }
      });

    } catch (error) {
      console.error('[StreamlinedPriceEngine] Batch fetch error:', error);
    }
  }

  /**
   * Notify all subscribers for a symbol
   */
  private notifySubscribers(symbol: string, data: PriceData): void {
    const symbolSubscribers = this.subscribers.get(symbol);
    if (symbolSubscribers) {
      symbolSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[StreamlinedPriceEngine] Subscriber error for ${symbol}:`, error);
        }
      });
    }
  }

  /**
   * Update storage with new price data
   */
  private async updateStorage(symbol: string, data: PriceData): Promise<void> {
    try {
      await storage.updateCryptoAsset(symbol, {
        lastPrice: data.price,
        change24h: data.change24h,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`[StreamlinedPriceEngine] Storage update failed for ${symbol}:`, error);
    }
  }

  /**
   * Get symbol from CoinGecko ID
   */
  private getSymbolFromCoinGeckoId(coinGeckoId: string): string | null {
    const mapping = TOP_50_SYMBOL_MAPPINGS.find(m => m.coinGeckoId === coinGeckoId);
    return mapping ? mapping.symbol : null;
  }

  /**
   * Create batches from array
   */
  private createBatches(array: string[]): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < array.length; i += this.maxBatchSize) {
      batches.push(array.slice(i, i + this.maxBatchSize));
    }
    return batches;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols(): string[] {
    return Array.from(this.priceCache.keys());
  }

  /**
   * Get engine status
   */
  getStatus(): {
    isRunning: boolean;
    lastFetch: number;
    pairCount: number;
    nextFetch: number;
  } {
    return {
      isRunning: this.isRunning,
      lastFetch: this.lastFetch,
      pairCount: this.priceCache.size,
      nextFetch: this.lastFetch + this.fetchInterval
    };
  }
}

// Export singleton instance
export const streamlinedPriceEngine = new StreamlinedPriceEngine();