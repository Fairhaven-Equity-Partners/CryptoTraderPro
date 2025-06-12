/**
 * Synced Price System
 * 
 * A simplified, self-contained global price synchronization system.
 */

// Global price registry with fixed starting prices
const GLOBAL_PRICES: Record<string, number> = {
  'BTC/USDT': 107063,
  'ETH/USDT': 2549,
  'SOL/USDT': 170,
  'BNB/USDT': 657,
  'XRP/USDT': 2.36,
  'DOGE/USDT': 0.13,
  'ADA/USDT': 0.48
};

// Last update timestamps
const LAST_UPDATES: Record<string, number> = {};

// Event subscribers for price updates
type PriceCallback = (symbol: string, price: number) => void;
const subscribers: PriceCallback[] = [];

/**
 * Get the current price for a symbol from the global registry
 */
export function getSyncedPrice(symbol: string): number {
  return GLOBAL_PRICES[symbol] || 0;
}

/**
 * Set a price in the global registry and notify subscribers
 */
export function setSyncedPrice(symbol: string, price: number): void {
  if (!symbol || price <= 0) return;
  
  // Skip if price hasn't changed
  if (GLOBAL_PRICES[symbol] === price) return;
  
  // Update price
  GLOBAL_PRICES[symbol] = price;
  LAST_UPDATES[symbol] = Date.now();
  
  // Update global variables for compatibility
  if (typeof window !== 'undefined') {
    if (!window.cryptoPrices) window.cryptoPrices = {};
    if (!window.latestPrices) window.latestPrices = {};
    
    window.cryptoPrices[symbol] = price;
    window.latestPrices[symbol] = price;
    
    if (symbol === 'BTC/USDT') {
      window.currentPrice = price;
    }
    
    // Broadcast to all components
    const event = new CustomEvent('price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }
  
  // Notify subscribers
  subscribers.forEach(callback => {
    try {
      callback(symbol, price);
    } catch (e) {
      console.error('Error in price subscriber:', e);
    }
  });
  
  // Also update server (with throttling)
  updateServer(symbol, price);
}

/**
 * Subscribe to price updates
 */
export function subscribeToPriceUpdates(callback: PriceCallback): () => void {
  subscribers.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
}

/**
 * Handle global price update events from window
 */
export function setupPriceEventListeners(): () => void {
  const handlePriceUpdate = (e: Event) => {
    const event = e as CustomEvent;
    if (event.detail?.symbol && event.detail?.price) {
      setSyncedPrice(event.detail.symbol, event.detail.price);
    }
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener('price-update', handlePriceUpdate);
  }
  
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('price-update', handlePriceUpdate);
    }
  };
}

// Server update logic with throttling to prevent flooding
const pendingServerUpdates: Record<string, NodeJS.Timeout> = {};

function updateServer(symbol: string, price: number): void {
  // Cancel any pending update for this symbol
  if (pendingServerUpdates[symbol]) {
    clearTimeout(pendingServerUpdates[symbol]);
  }
  
  // Schedule a new update with a delay to prevent flooding
  pendingServerUpdates[symbol] = setTimeout(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/sync-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, price })
      }).catch(() => {});
    }
    delete pendingServerUpdates[symbol];
  }, 300);
}