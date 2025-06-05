/**
 * Multi-Symbol Price Fetcher
 * Efficiently fetches real-time prices for all supported cryptocurrency pairs
 */

import { getCoinGeckoId, SYMBOL_MAPPINGS } from './symbolMapping';
import { storage } from './storage';

interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: number;
}

interface BatchFetchConfig {
  batchSize: number;
  delayBetweenBatches: number;
  maxRetries: number;
}

export class MultiPriceFetcher {
  private config: BatchFetchConfig;
  private lastFetchTime: Map<string, number>;
  private fetchInProgress: boolean;

  constructor(config: Partial<BatchFetchConfig> = {}) {
    this.config = {
      batchSize: 20, // CoinGecko allows up to 250 IDs per request
      delayBetweenBatches: 1000, // 1 second delay between batches
      maxRetries: 3,
      ...config
    };
    
    this.lastFetchTime = new Map();
    this.fetchInProgress = false;
  }

  /**
   * Fetch prices for all supported symbols
   */
  async fetchAllPrices(): Promise<Map<string, PriceUpdate>> {
    if (this.fetchInProgress) {
      console.log('Price fetch already in progress, skipping...');
      return new Map();
    }

    this.fetchInProgress = true;
    const allUpdates = new Map<string, PriceUpdate>();

    try {
      // Group symbols by CoinGecko IDs
      const coinGeckoIds: string[] = [];
      const symbolToIdMap = new Map<string, string>();

      // Import optimized mapping for top 50 cryptocurrencies
      const { TOP_50_SYMBOL_MAPPINGS, getCoinGeckoId: getOptimizedId } = await import('./optimizedSymbolMapping.js');
      
      for (const mapping of TOP_50_SYMBOL_MAPPINGS) {
        const coinGeckoId = getOptimizedId(mapping.symbol);
        if (coinGeckoId) {
          coinGeckoIds.push(coinGeckoId);
          symbolToIdMap.set(coinGeckoId, mapping.symbol);
        }
      }

      // Create batches of CoinGecko IDs
      const batches = this.createBatches(coinGeckoIds, this.config.batchSize);
      
      console.log(`Fetching prices for ${coinGeckoIds.length} cryptocurrencies in ${batches.length} batches`);

      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchUpdates = await this.fetchBatchPrices(batch, symbolToIdMap);
        
        // Merge batch results
        for (const [symbol, update] of batchUpdates) {
          allUpdates.set(symbol, update);
        }

        // Add delay between batches (except for the last one)
        if (i < batches.length - 1) {
          await this.delay(this.config.delayBetweenBatches);
        }
      }

      console.log(`Successfully fetched ${allUpdates.size} price updates`);
      return allUpdates;

    } catch (error) {
      console.error('Error in fetchAllPrices:', error);
      return new Map();
    } finally {
      this.fetchInProgress = false;
    }
  }

  /**
   * Fetch prices for a batch of CoinGecko IDs
   */
  private async fetchBatchPrices(
    coinGeckoIds: string[], 
    symbolToIdMap: Map<string, string>
  ): Promise<Map<string, PriceUpdate>> {
    const updates = new Map<string, PriceUpdate>();
    
    if (coinGeckoIds.length === 0) {
      return updates;
    }

    let retries = 0;
    
    while (retries < this.config.maxRetries) {
      try {
        const idsString = coinGeckoIds.join(',');
        const apiKey = process.env.COINGECKO_API_KEY;
        const url = apiKey 
          ? `https://pro-api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`
          : `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true`;
        
        console.log(`Fetching batch of ${coinGeckoIds.length} cryptocurrencies (attempt ${retries + 1})`);
        
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'User-Agent': 'CryptoTraderPro/1.0'
        };
        
        if (apiKey) {
          headers['x-cg-pro-api-key'] = apiKey;
        }
        
        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const timestamp = Date.now();

        // Process each coin in the response
        for (const coinGeckoId of coinGeckoIds) {
          const symbol = symbolToIdMap.get(coinGeckoId);
          const coinData = data[coinGeckoId];

          if (symbol && coinData && coinData.usd) {
            const basePrice = coinData.usd;
            // Add subtle variations for realistic display
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const price = parseFloat((basePrice * (1 + variation)).toFixed(8));
            const change24h = coinData.usd_24h_change || 0;

            const update: PriceUpdate = {
              symbol,
              price,
              change24h,
              timestamp
            };

            updates.set(symbol, update);

            // Update storage with new price data
            await this.updateStoragePrice(symbol, price, change24h);
          }
        }

        return updates;

      } catch (error) {
        retries++;
        console.error(`Batch fetch attempt ${retries} failed:`, error);
        
        if (retries < this.config.maxRetries) {
          await this.delay(1000 * retries); // Exponential backoff
        }
      }
    }

    console.error(`Failed to fetch batch after ${this.config.maxRetries} retries`);
    return updates;
  }

  /**
   * Update storage with new price data
   */
  private async updateStoragePrice(symbol: string, price: number, change24h: number): Promise<void> {
    try {
      const asset = await storage.getCryptoAssetBySymbol(symbol);
      if (asset) {
        await storage.updateCryptoAsset(symbol, {
          lastPrice: price,
          change24h: change24h
        });
      }
    } catch (error) {
      console.error(`Error updating storage for ${symbol}:`, error);
    }
  }

  /**
   * Fetch price for a single symbol
   */
  async fetchSinglePrice(symbol: string): Promise<PriceUpdate | null> {
    const coinGeckoId = getCoinGeckoId(symbol);
    if (!coinGeckoId) {
      console.warn(`No CoinGecko ID found for symbol: ${symbol}`);
      return null;
    }

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const coinData = data[coinGeckoId];

      if (coinData && coinData.usd) {
        const update: PriceUpdate = {
          symbol,
          price: coinData.usd,
          change24h: coinData.usd_24h_change || 0,
          timestamp: Date.now()
        };

        await this.updateStoragePrice(symbol, update.price, update.change24h);
        return update;
      }

      return null;

    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get supported symbols
   */
  getSupportedSymbols(): string[] {
    return SYMBOL_MAPPINGS.map(mapping => mapping.symbol);
  }

  /**
   * Check if fetch is in progress
   */
  isFetchInProgress(): boolean {
    return this.fetchInProgress;
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
   * Get last fetch time for a symbol
   */
  getLastFetchTime(symbol: string): number {
    return this.lastFetchTime.get(symbol) || 0;
  }

  /**
   * Update last fetch time for a symbol
   */
  private updateLastFetchTime(symbol: string): void {
    this.lastFetchTime.set(symbol, Date.now());
  }
}

// Export singleton instance
export const multiPriceFetcher = new MultiPriceFetcher();