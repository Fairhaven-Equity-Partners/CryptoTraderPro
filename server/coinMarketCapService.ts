/**
 * CoinMarketCap Service
 * CoinMarketCap price fetching service for cryptocurrency data
 */

import { getCMCSymbol } from './optimizedSymbolMapping.js';

interface CMCPriceData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

class CoinMarketCapService {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';
  private cache = new Map<string, { data: CMCPriceData; timestamp: number }>();
  private cacheTimeout = 120000; // 2 minutes cache

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || 'd129bffe-efd9-4841-9946-f67c10168aed';
  }

  /**
   * Fetch real-time price for a single symbol
   */
  async fetchPrice(symbol: string): Promise<CMCPriceData | null> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const cmcSymbol = getCMCSymbol(symbol);
    if (!cmcSymbol) {
      console.warn(`No CoinMarketCap mapping for ${symbol}`);
      return null;
    }

    try {
      console.log(`Fetching real-time ${symbol} price from CoinMarketCap API using symbol: ${cmcSymbol}`);
      
      const response = await fetch(`${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${cmcSymbol}`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status.error_code !== 0) {
        throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
      }

      const coinData = data.data[cmcSymbol];
      if (!coinData) {
        throw new Error(`No data returned for ${cmcSymbol}`);
      }

      const priceData: CMCPriceData = {
        price: coinData.quote.USD.price,
        change24h: coinData.quote.USD.percent_change_24h,
        volume24h: coinData.quote.USD.volume_24h,
        marketCap: coinData.quote.USD.market_cap,
        lastUpdated: coinData.quote.USD.last_updated
      };

      // Cache the result
      this.cache.set(symbol, { data: priceData, timestamp: Date.now() });

      console.log(`Got real-time ${symbol} price: $${priceData.price.toFixed(2)} with 24h change: ${priceData.change24h.toFixed(2)}%`);
      
      return priceData;

    } catch (error) {
      console.error(`Failed to fetch ${symbol} from CoinMarketCap:`, error);
      return null;
    }
  }

  /**
   * Fetch prices for multiple symbols in batch
   */
  async fetchBatchPrices(symbols: string[]): Promise<Record<string, CMCPriceData>> {
    const cmcSymbols = symbols
      .map(symbol => getCMCSymbol(symbol))
      .filter(Boolean) as string[];

    if (cmcSymbols.length === 0) {
      return {};
    }

    try {
      const symbolString = cmcSymbols.join(',');
      const response = await fetch(`${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${symbolString}`, {
        headers: {
          'X-CMC_PRO_API_KEY': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status.error_code !== 0) {
        throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
      }

      const results: Record<string, CMCPriceData> = {};

      symbols.forEach(symbol => {
        const cmcSymbol = getCMCSymbol(symbol);
        if (cmcSymbol && data.data[cmcSymbol]) {
          const coinData = data.data[cmcSymbol];
          const priceData: CMCPriceData = {
            price: coinData.quote.USD.price,
            change24h: coinData.quote.USD.percent_change_24h,
            volume24h: coinData.quote.USD.volume_24h,
            marketCap: coinData.quote.USD.market_cap,
            lastUpdated: coinData.quote.USD.last_updated
          };

          results[symbol] = priceData;
          
          // Cache individual results
          this.cache.set(symbol, { data: priceData, timestamp: Date.now() });
        }
      });

      console.log(`CoinMarketCap batch fetch completed for ${Object.keys(results).length} symbols`);
      return results;

    } catch (error) {
      console.error('CoinMarketCap batch fetch failed:', error);
      return {};
    }
  }

  /**
   * Clear cache for a specific symbol or all symbols
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      this.cache.delete(symbol);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; symbols: string[] } {
    return {
      size: this.cache.size,
      symbols: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const coinMarketCapService = new CoinMarketCapService();