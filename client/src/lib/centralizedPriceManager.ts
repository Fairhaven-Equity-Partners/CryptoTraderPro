/**
 * Centralized Price Management System
 * 
 * Ensures perfect price synchronization between all components by:
 * - Fetching authentic CoinGecko prices once every 4 minutes
 * - Distributing the exact same price to all components
 * - Respecting CoinGecko rate limits
 * - Maintaining real-time accuracy without excessive API calls
 */

interface PriceData {
  price: number;
  change24h: number;
  timestamp: number;
}

interface PriceSubscriber {
  callback: (price: number) => void;
  symbol: string;
}

class CentralizedPriceManager {
  private priceData: Map<string, PriceData> = new Map();
  private subscribers: Map<string, PriceSubscriber[]> = new Map();
  private fetchInterval: NodeJS.Timeout | null = null;
  private lastFetchTime: number = 0;
  private readonly FETCH_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

  constructor() {
    console.log('[CentralizedPriceManager] Initializing with 4-minute intervals');
  }

  /**
   * Subscribe to price updates for a symbol
   */
  subscribe(symbol: string, callback: (price: number) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
    }
    
    const subscriber: PriceSubscriber = { callback, symbol };
    this.subscribers.get(symbol)!.push(subscriber);
    
    console.log(`[CentralizedPriceManager] New subscriber for ${symbol}`);
    
    // Provide current price immediately if available
    const currentPrice = this.priceData.get(symbol);
    if (currentPrice) {
      callback(currentPrice.price);
    } else {
      // Fetch immediately for new symbols
      this.fetchPriceForSymbol(symbol);
    }
    
    // Start interval if not already running
    this.startFetchInterval();
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(symbol);
      if (subscribers) {
        const index = subscribers.indexOf(subscriber);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
        
        // Clean up empty arrays
        if (subscribers.length === 0) {
          this.subscribers.delete(symbol);
        }
      }
      
      // Stop interval if no more subscribers
      if (this.subscribers.size === 0 && this.fetchInterval) {
        clearInterval(this.fetchInterval);
        this.fetchInterval = null;
        console.log('[CentralizedPriceManager] Stopped fetch interval - no subscribers');
      }
    };
  }

  /**
   * Get current price for a symbol - immediate retrieval for feedback loop
   */
  getCurrentPrice(symbol: string): number | null {
    const data = this.priceData.get(symbol);
    if (data && data.price > 0) {
      return data.price;
    }
    
    // If no cached price, fetch immediately to prevent 2-cycle delay
    console.log(`[CentralizedPriceManager] No cached price for ${symbol}, fetching immediately`);
    this.fetchPriceForSymbol(symbol);
    return null;
  }

  /**
   * Force immediate price fetch and return - eliminates 2-cycle delay
   */
  async getImmediatePrice(symbol: string): Promise<number | null> {
    // Check cache first
    const cachedData = this.priceData.get(symbol);
    if (cachedData && cachedData.price > 0 && (Date.now() - cachedData.timestamp) < 60000) {
      return cachedData.price;
    }
    
    // Fetch immediately if no recent cached data
    return await this.fetchPriceForSymbol(symbol);
  }

  /**
   * Start the 4-minute fetch interval
   */
  private startFetchInterval() {
    if (this.fetchInterval) return;
    
    console.log('[CentralizedPriceManager] Starting 4-minute fetch interval');
    
    this.fetchInterval = setInterval(() => {
      this.fetchAllSubscribedPrices();
    }, this.FETCH_INTERVAL_MS);
  }

  /**
   * Fetch prices for all subscribed symbols
   */
  private async fetchAllSubscribedPrices() {
    const symbols = Array.from(this.subscribers.keys());
    if (symbols.length === 0) return;
    
    console.log(`[CentralizedPriceManager] Fetching prices for ${symbols.length} symbols`);
    
    for (const symbol of symbols) {
      await this.fetchPriceForSymbol(symbol);
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Fetch price for a specific symbol - immediate retrieval for feedback loop
   */
  private async fetchPriceForSymbol(symbol: string) {
    try {
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
      if (response.ok) {
        const data = await response.json();
        const price = data.lastPrice;
        const change24h = data.change24h || 0;
        
        if (price && price > 0) {
          const priceData: PriceData = {
            price,
            change24h,
            timestamp: Date.now()
          };
          
          this.priceData.set(symbol, priceData);
          this.lastFetchTime = Date.now();
          console.log(`[CentralizedPriceManager] Updated price for ${symbol}: $${price}`);
          
          // Notify all subscribers with the exact same price
          const subscribers = this.subscribers.get(symbol);
          if (subscribers) {
            subscribers.forEach(subscriber => {
              subscriber.callback(price);
            });
          }
          
          return price;
        }
      }
    } catch (error) {
      console.error(`[CentralizedPriceManager] Error fetching price for ${symbol}:`, error);
    }
    return null;
  }

  /**
   * Get time until next fetch
   */
  getTimeUntilNextFetch(): number {
    if (!this.lastFetchTime) return 0;
    const elapsed = Date.now() - this.lastFetchTime;
    const remaining = Math.max(0, this.FETCH_INTERVAL_MS - elapsed);
    return Math.floor(remaining / 1000); // Return seconds
  }
}

// Create singleton instance
export const centralizedPriceManager = new CentralizedPriceManager();

/**
 * Hook for components to subscribe to price updates
 */
export function useCentralizedPrice(symbol: string): number | null {
  const [price, setPrice] = React.useState<number | null>(
    centralizedPriceManager.getCurrentPrice(symbol)
  );

  React.useEffect(() => {
    const unsubscribe = centralizedPriceManager.subscribe(symbol, (newPrice) => {
      setPrice(newPrice);
    });

    return unsubscribe;
  }, [symbol]);

  return price;
}

// Import React for the hook
import React from 'react';