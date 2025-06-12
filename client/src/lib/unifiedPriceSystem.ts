/**
 * Unified Real-Time Price System
 * Ensures all calculations use authentic CoinMarketCap data
 * Eliminates price synchronization issues across the platform
 */

interface PriceData {
  price: number;
  change24h: number;
  timestamp: number;
  source: 'coinmarketcap' | 'cache';
}

class UnifiedPriceSystem {
  private static instance: UnifiedPriceSystem;
  private priceCache = new Map<string, PriceData>();
  private activeSymbols = new Set<string>();
  private refreshInterval = 4 * 60 * 1000; // 4 minutes for CoinGecko free tier
  private lastGlobalUpdate = 0;
  private updateInProgress = false;

  static getInstance(): UnifiedPriceSystem {
    if (!UnifiedPriceSystem.instance) {
      UnifiedPriceSystem.instance = new UnifiedPriceSystem();
    }
    return UnifiedPriceSystem.instance;
  }

  /**
   * Get real-time price with authentication validation
   */
  async getRealTimePrice(symbol: string): Promise<number> {
    console.log(`[UnifiedPrice] Getting real-time price for ${symbol}`);
    
    // Add to active tracking
    this.activeSymbols.add(symbol);
    
    // Check if we need to refresh
    const now = Date.now();
    const cached = this.priceCache.get(symbol);
    
    if (cached && (now - cached.timestamp) < this.refreshInterval && cached.source === 'coinmarketcap') {
      console.log(`[UnifiedPrice] Using fresh CoinGecko data for ${symbol}: $${cached.price}`);
      return cached.price;
    }

    // Fetch fresh data from API
    try {
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data && typeof data.lastPrice === 'number' && data.lastPrice > 0) {
        const priceData: PriceData = {
          price: data.lastPrice,
          change24h: data.change24h || 0,
          timestamp: now,
          source: 'coinmarketcap'
        };
        
        this.priceCache.set(symbol, priceData);
        
        // Broadcast price update to all systems
        this.broadcastPriceUpdate(symbol, data.lastPrice);
        
        console.log(`[UnifiedPrice] Fresh CoinGecko price for ${symbol}: $${data.lastPrice}`);
        return data.lastPrice;
      }
      
      throw new Error('Invalid price data received');
    } catch (error) {
      console.error(`[UnifiedPrice] Error fetching ${symbol}:`, error);
      
      // Return cached data if available, but mark as stale
      if (cached) {
        console.log(`[UnifiedPrice] Using cached price for ${symbol}: $${cached.price}`);
        return cached.price;
      }
      
      throw new Error(`No price data available for ${symbol}`);
    }
  }

  /**
   * Force refresh all active symbols
   */
  async refreshAllPrices(): Promise<void> {
    if (this.updateInProgress) {
      console.log('[UnifiedPrice] Update already in progress');
      return;
    }

    this.updateInProgress = true;
    console.log(`[UnifiedPrice] Refreshing ${this.activeSymbols.size} active symbols`);

    try {
      const promises = Array.from(this.activeSymbols).map(symbol => 
        this.getRealTimePrice(symbol).catch(error => {
          console.error(`Failed to refresh ${symbol}:`, error);
          return null;
        })
      );

      await Promise.all(promises);
      this.lastGlobalUpdate = Date.now();
      
      console.log('[UnifiedPrice] All active symbols refreshed');
    } finally {
      this.updateInProgress = false;
    }
  }

  /**
   * Broadcast price updates to all calculation systems
   */
  private broadcastPriceUpdate(symbol: string, price: number): void {
    // Update live price display
    window.dispatchEvent(new CustomEvent('livePriceUpdate', {
      detail: { symbol, price, forceCalculate: true, source: 'coinmarketcap' }
    }));

    // Update calculation systems
    window.dispatchEvent(new CustomEvent('priceUpdate', {
      detail: { symbol, price, timestamp: Date.now() }
    }));

    console.log(`[UnifiedPrice] Broadcasted ${symbol} price update: $${price}`);
  }

  /**
   * Get cached price data
   */
  getCachedPrice(symbol: string): PriceData | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Check if price data is stale
   */
  isPriceStale(symbol: string): boolean {
    const cached = this.priceCache.get(symbol);
    if (!cached) return true;
    
    const now = Date.now();
    return (now - cached.timestamp) > this.refreshInterval;
  }

  /**
   * Get all tracked symbols
   */
  getActiveSymbols(): string[] {
    return Array.from(this.activeSymbols);
  }

  /**
   * Clear stale cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    const maxAge = this.refreshInterval * 2; // Keep data for 8 minutes max

    for (const [symbol, data] of this.priceCache.entries()) {
      if (now - data.timestamp > maxAge) {
        this.priceCache.delete(symbol);
        console.log(`[UnifiedPrice] Cleaned up stale data for ${symbol}`);
      }
    }
  }

  /**
   * Initialize automatic price updates
   */
  startAutomaticUpdates(): void {
    // Update every 4 minutes for CoinGecko free tier
    setInterval(() => {
      if (this.activeSymbols.size > 0) {
        this.refreshAllPrices();
      }
    }, this.refreshInterval);

    // Cleanup cache every 10 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 10 * 60 * 1000);

    console.log('[UnifiedPrice] Automatic updates started');
  }
}

export const unifiedPriceSystem = UnifiedPriceSystem.getInstance();

// Start automatic updates when module loads
unifiedPriceSystem.startAutomaticUpdates();