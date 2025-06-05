/**
 * Optimized Multi-Pair Manager
 * Efficiently manages price fetching and signal generation for all 50 cryptocurrency pairs
 * Designed for maximum performance with minimal API usage
 */

import { TOP_50_SYMBOL_MAPPINGS, getCoinGeckoId } from './optimizedSymbolMapping.js';
import { storage } from './storage.js';

interface PairData {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: number;
  isActive: boolean;
}

interface BatchFetchResult {
  successful: string[];
  failed: string[];
  data: Map<string, PairData>;
}

export class OptimizedMultiPairManager {
  private pairData: Map<string, PairData> = new Map();
  private batchSize: number = 20; // Optimal batch size for CoinGecko API
  private fetchInterval: number = 4 * 60 * 1000; // 4 minutes
  private isInitialized: boolean = false;
  private fetchInProgress: boolean = false;
  private lastBatchFetch: number = 0;

  constructor() {
    this.initializePairs();
  }

  /**
   * Initialize all 50 cryptocurrency pairs
   */
  private initializePairs(): void {
    TOP_50_SYMBOL_MAPPINGS.forEach(mapping => {
      this.pairData.set(mapping.symbol, {
        symbol: mapping.symbol,
        price: 0,
        change24h: 0,
        lastUpdate: 0,
        isActive: true
      });
    });
    this.isInitialized = true;
    console.log(`[OptimizedMultiPairManager] Initialized ${this.pairData.size} cryptocurrency pairs`);
  }

  /**
   * Fetch prices for all pairs in optimized batches
   */
  async fetchAllPairs(): Promise<BatchFetchResult> {
    if (this.fetchInProgress) {
      console.log('[OptimizedMultiPairManager] Fetch already in progress, skipping');
      return { successful: [], failed: [], data: new Map() };
    }

    this.fetchInProgress = true;
    const result: BatchFetchResult = {
      successful: [],
      failed: [],
      data: new Map()
    };

    try {
      // Create batches of CoinGecko IDs
      const coinGeckoIds = TOP_50_SYMBOL_MAPPINGS.map(m => m.coinGeckoId);
      const batches = this.createBatches(coinGeckoIds, this.batchSize);
      
      console.log(`[OptimizedMultiPairManager] Fetching ${coinGeckoIds.length} pairs in ${batches.length} batches`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
          await this.fetchBatch(batch, result);
          
          // Add delay between batches to respect rate limits
          if (i < batches.length - 1) {
            await this.delay(1000); // 1 second between batches
          }
        } catch (error) {
          console.error(`[OptimizedMultiPairManager] Batch ${i + 1} failed:`, error);
          batch.forEach(id => {
            const symbol = this.getSymbolFromCoinGeckoId(id);
            if (symbol) result.failed.push(symbol);
          });
        }
      }

      this.lastBatchFetch = Date.now();
      console.log(`[OptimizedMultiPairManager] Batch fetch completed: ${result.successful.length} successful, ${result.failed.length} failed`);

    } catch (error) {
      console.error('[OptimizedMultiPairManager] Batch fetch error:', error);
    } finally {
      this.fetchInProgress = false;
    }

    return result;
  }

  /**
   * Fetch a single batch of cryptocurrency pairs
   */
  private async fetchBatch(coinGeckoIds: string[], result: BatchFetchResult): Promise<void> {
    const idsParam = coinGeckoIds.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY || ''
        }
      });

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Process each coin in the batch
      for (const coinGeckoId of coinGeckoIds) {
        const symbol = this.getSymbolFromCoinGeckoId(coinGeckoId);
        if (!symbol) continue;

        const coinData = data[coinGeckoId];
        if (coinData && coinData.usd) {
          const pairData: PairData = {
            symbol,
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            lastUpdate: Date.now(),
            isActive: true
          };

          this.pairData.set(symbol, pairData);
          result.successful.push(symbol);
          result.data.set(symbol, pairData);

          // Update storage
          await this.updateStorage(symbol, pairData.price, pairData.change24h);
        } else {
          result.failed.push(symbol);
        }
      }
    } catch (error) {
      console.error('[OptimizedMultiPairManager] Batch fetch error:', error);
      throw error;
    }
  }

  /**
   * Update storage with new price data
   */
  private async updateStorage(symbol: string, price: number, change24h: number): Promise<void> {
    try {
      await storage.updateCryptoAsset(symbol, {
        lastPrice: price,
        change24h: change24h,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`[OptimizedMultiPairManager] Storage update failed for ${symbol}:`, error);
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
   * Get current price for a specific pair
   */
  getPairPrice(symbol: string): number | null {
    const pair = this.pairData.get(symbol);
    return pair ? pair.price : null;
  }

  /**
   * Get all pair data
   */
  getAllPairData(): Map<string, PairData> {
    return new Map(this.pairData);
  }

  /**
   * Check if pair is supported
   */
  isPairSupported(symbol: string): boolean {
    return this.pairData.has(symbol);
  }

  /**
   * Get supported symbols
   */
  getSupportedSymbols(): string[] {
    return Array.from(this.pairData.keys());
  }

  /**
   * Start automatic fetching
   */
  startAutomaticFetching(): void {
    console.log('[OptimizedMultiPairManager] Starting automatic price fetching every 4 minutes');
    
    // Initial fetch
    this.fetchAllPairs();
    
    // Set up interval
    setInterval(() => {
      this.fetchAllPairs();
    }, this.fetchInterval);
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
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
   * Get fetch status
   */
  getFetchStatus(): {
    isInitialized: boolean;
    fetchInProgress: boolean;
    lastBatchFetch: number;
    pairCount: number;
  } {
    return {
      isInitialized: this.isInitialized,
      fetchInProgress: this.fetchInProgress,
      lastBatchFetch: this.lastBatchFetch,
      pairCount: this.pairData.size
    };
  }
}

// Export singleton instance
export const optimizedMultiPairManager = new OptimizedMultiPairManager();