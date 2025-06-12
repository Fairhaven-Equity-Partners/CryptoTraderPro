/**
 * Streamlined Client Price Manager
 * Optimized for all 50 cryptocurrency pairs with efficient caching and real-time updates
 */

import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  price: number;
  change24h: number;
  timestamp: number;
  symbol: string;
}

interface CacheEntry {
  data: PriceData;
  lastFetch: number;
  subscribers: Set<(data: PriceData) => void>;
}

export class StreamlinedPriceManager {
  private cache = new Map<string, CacheEntry>();
  private fetchTimeout = 30 * 1000; // 30 seconds cache timeout
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Supported symbols for all 50 cryptocurrency pairs
    const supportedSymbols = [
      "BTC/USDT", "ETH/USDT", "BNB/USDT", "XRP/USDT", "SOL/USDT", "USDC/USD", "ADA/USDT", "AVAX/USDT", "DOGE/USDT", "TRX/USDT",
      "TON/USDT", "LINK/USDT", "MATIC/USDT", "SHIB/USDT", "LTC/USDT", "BCH/USDT", "UNI/USDT", "DOT/USDT", "XLM/USDT", "ATOM/USDT",
      "XMR/USDT", "ETC/USDT", "HBAR/USDT", "FIL/USDT", "ICP/USDT", "VET/USDT", "APT/USDT", "NEAR/USDT", "AAVE/USDT", "ARB/USDT",
      "OP/USDT", "MKR/USDT", "GRT/USDT", "STX/USDT", "INJ/USDT", "ALGO/USDT", "LDO/USDT", "THETA/USDT", "SUI/USDT", "RUNE/USDT",
      "MANA/USDT", "SAND/USDT", "FET/USDT", "RNDR/USDT", "KAVA/USDT", "MINA/USDT", "FLOW/USDT", "XTZ/USDT", "BLUR/USDT", "QNT/USDT"
    ];

    // Initialize cache for all supported symbols
    supportedSymbols.forEach(symbol => {
      this.cache.set(symbol, {
        data: { price: 0, change24h: 0, timestamp: 0, symbol },
        lastFetch: 0,
        subscribers: new Set()
      });
    });

    this.isInitialized = true;}

  /**
   * Subscribe to price updates for a symbol
   */
  subscribe(symbol: string, callback: (data: PriceData) => void): () => void {
    const entry = this.cache.get(symbol);
    if (!entry) {return () => {};
    }

    entry.subscribers.add(callback);

    // Fetch fresh data if needed and emit current data
    this.fetchPriceIfNeeded(symbol).then(data => {
      if (data && data.price > 0) {
        callback(data);
      }
    });

    // Return unsubscribe function
    return () => {
      entry.subscribers.delete(callback);
    };
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol: string): PriceData | null {
    const entry = this.cache.get(symbol);
    return entry?.data || null;
  }

  /**
   * Fetch price if cache is stale
   */
  private async fetchPriceIfNeeded(symbol: string): Promise<PriceData | null> {
    const entry = this.cache.get(symbol);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now - entry.lastFetch > this.fetchTimeout;
    
    if (!isStale && entry.data.price > 0) {
      return entry.data;
    }

    try {
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
      if (response.ok) {
        const asset = await response.json();
        if (asset.lastPrice) {
          const priceData: PriceData = {
            price: asset.lastPrice,
            change24h: asset.change24h || 0,
            timestamp: now,
            symbol
          };

          // Update cache
          entry.data = priceData;
          entry.lastFetch = now;

          // Notify subscribers
          entry.subscribers.forEach(callback => {
            try {
              callback(priceData);
            } catch (error) {
              console.error(`[StreamlinedPriceManager] Subscriber error for ${symbol}:`, error);
            }
          });

          return priceData;
        }
      }
    } catch (error) {
      console.error(`[StreamlinedPriceManager] Fetch error for ${symbol}:`, error);
    }

    return null;
  }

  /**
   * Force refresh price for a symbol
   */
  async refreshPrice(symbol: string): Promise<PriceData | null> {
    const entry = this.cache.get(symbol);
    if (entry) {
      entry.lastFetch = 0; // Force refresh
    }
    return this.fetchPriceIfNeeded(symbol);
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clear cache for a symbol
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      const entry = this.cache.get(symbol);
      if (entry) {
        entry.lastFetch = 0;
      }
    } else {
      this.cache.forEach(entry => {
        entry.lastFetch = 0;
      });
    }
  }
}

// Singleton instance
export const streamlinedPriceManager = new StreamlinedPriceManager();

/**
 * Initialize the price manager system
 */
export function initPriceManager(): void {}

/**
 * React hook for streamlined price data
 */
export function useStreamlinedPrice(symbol: string) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    const unsubscribe = streamlinedPriceManager.subscribe(symbol, (data) => {
      setPriceData(data);
      setLoading(false);
      setError(null);
    });

    // Check if we have cached data immediately
    const cachedData = streamlinedPriceManager.getPrice(symbol);
    if (cachedData && cachedData.price > 0) {
      setPriceData(cachedData);
      setLoading(false);
    }

    return unsubscribe;
  }, [symbol]);

  const refresh = useCallback(async () => {
    if (!symbol) return;
    
    setLoading(true);
    try {
      const data = await streamlinedPriceManager.refreshPrice(symbol);
      if (data) {
        setPriceData(data);
        setError(null);
      } else {
        setError('Failed to fetch price data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  return {
    price: priceData?.price || null,
    change24h: priceData?.change24h || null,
    timestamp: priceData?.timestamp || null,
    loading,
    error,
    refresh
  };
}

/**
 * React hook for multiple symbols at once
 */
export function useMultipleStreamlinedPrices(symbols: string[]) {
  const [pricesData, setPricesData] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbols.length) return;

    const unsubscribers: (() => void)[] = [];
    const prices = new Map<string, PriceData>();
    let loadingCount = symbols.length;

    symbols.forEach(symbol => {
      const unsubscribe = streamlinedPriceManager.subscribe(symbol, (data) => {
        prices.set(symbol, data);
        setPricesData(new Map(prices));
        
        loadingCount--;
        if (loadingCount <= 0) {
          setLoading(false);
        }
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [symbols]);

  return {
    prices: pricesData,
    loading
  };
}