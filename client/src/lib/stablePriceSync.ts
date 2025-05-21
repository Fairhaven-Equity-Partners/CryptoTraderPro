/**
 * Stable Price Synchronization System
 * 
 * A completely redesigned price system that prevents update flooding
 * and ensures consistent price data across the application.
 */

// Global price registry with proper throttling
interface PriceRegistry {
  prices: Record<string, number>;
  lastUpdates: Record<string, number>;
  pendingUpdates: Record<string, boolean>;
}

// Initialize global registry if it doesn't exist
const globalRegistry: PriceRegistry = {
  prices: {
    'BTC/USDT': 108918,
    'ETH/USDT': 2559,
    'BNB/USDT': 656,
    'SOL/USDT': 171,
    'XRP/USDT': 2.39,
    'DOGE/USDT': 0.13
  },
  lastUpdates: {},
  pendingUpdates: {}
};

// Configuration
const UPDATE_INTERVAL = 30000; // Minimum 30 seconds between updates
const SIGNIFICANT_CHANGE = 0.25; // Minimum 0.25% change to trigger update

/**
 * Get the current price for a symbol
 */
export function getStablePrice(symbol: string): number {
  return globalRegistry.prices[symbol] || 0;
}

/**
 * Set a price with thorough validation
 * Returns true if the update was accepted
 */
export function setStablePrice(symbol: string, price: number): boolean {
  // Basic validation
  if (!symbol || price <= 0) {
    return false;
  }
  
  // Get current timestamp
  const now = Date.now();
  
  // Check if we're throttled
  const lastUpdate = globalRegistry.lastUpdates[symbol] || 0;
  if (now - lastUpdate < UPDATE_INTERVAL) {
    console.log(`🛑 Price update for ${symbol} throttled (last update ${now - lastUpdate}ms ago)`);
    return false;
  }
  
  // Check if price actually changed significantly
  const currentPrice = globalRegistry.prices[symbol] || 0;
  if (currentPrice > 0) {
    const percentChange = Math.abs((price - currentPrice) / currentPrice) * 100;
    if (percentChange < SIGNIFICANT_CHANGE) {
      console.log(`ℹ️ Price update for ${symbol} ignored (change too small: ${percentChange.toFixed(2)}%)`);
      return false;
    }
  }
  
  // Update price in registry
  globalRegistry.prices[symbol] = price;
  globalRegistry.lastUpdates[symbol] = now;
  
  // For backward compatibility
  if (typeof window !== 'undefined') {
    if (!window.cryptoPrices) window.cryptoPrices = {};
    if (!window.latestPrices) window.latestPrices = {};
    
    window.cryptoPrices[symbol] = price;
    window.latestPrices[symbol] = price;
    
    if (symbol === 'BTC/USDT') {
      window.currentPrice = price;
    }
  }
  
  console.log(`✅ Price updated for ${symbol}: ${price}`);
  
  // Dispatch event for components
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('stable-price-update', {
      detail: { symbol, price, timestamp: now }
    });
    window.dispatchEvent(event);
  }
  
  // Queue server sync (only if not already pending)
  if (!globalRegistry.pendingUpdates[symbol]) {
    globalRegistry.pendingUpdates[symbol] = true;
    
    setTimeout(() => {
      syncWithServer(symbol, price);
      globalRegistry.pendingUpdates[symbol] = false;
    }, 1000);
  }
  
  return true;
}

/**
 * Sync price with server
 */
function syncWithServer(symbol: string, price: number): void {
  if (typeof window === 'undefined') return;
  
  fetch('/api/sync-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, price })
  })
  .then(response => response.json())
  .then(data => {
    if (data.throttled) {
      console.log(`Server throttled price update for ${symbol}`);
    } else if (data.ignored) {
      console.log(`Server ignored price update for ${symbol} (change too small)`);
    }
  })
  .catch(error => {
    console.error('Error syncing price with server:', error);
  });
}

/**
 * Setup a fixed schedule polling for a realistic, stable price
 */
export function setupStablePricePolling(symbol: string, interval = 60000): () => void {
  // Don't run on server
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  // Create small realistic price movements
  const pollInterval = setInterval(() => {
    const currentPrice = getStablePrice(symbol);
    if (currentPrice <= 0) return;
    
    // Generate a small random movement (-0.2% to +0.2%)
    const changePercent = (Math.random() * 0.4) - 0.2;
    const newPrice = currentPrice * (1 + (changePercent / 100));
    const roundedPrice = Math.round(newPrice * 100) / 100;
    
    // Update if it's been long enough since last update
    const lastUpdate = globalRegistry.lastUpdates[symbol] || 0;
    const now = Date.now();
    
    if (now - lastUpdate >= UPDATE_INTERVAL) {
      setStablePrice(symbol, roundedPrice);
    }
  }, interval);
  
  // Return cleanup function
  return () => clearInterval(pollInterval);
}

/**
 * Fetch price directly from server (bypassing local cache)
 */
export async function fetchFreshPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
    const data = await response.json();
    
    if (data && data.lastPrice > 0) {
      // Only update if significantly different from current
      const currentPrice = getStablePrice(symbol);
      const percentChange = (currentPrice > 0) 
        ? Math.abs((data.lastPrice - currentPrice) / currentPrice) * 100
        : 100;
        
      if (percentChange >= SIGNIFICANT_CHANGE) {
        setStablePrice(symbol, data.lastPrice);
      }
      
      return data.lastPrice;
    }
  } catch (error) {
    console.error('Error fetching fresh price:', error);
  }
  
  return getStablePrice(symbol);
}