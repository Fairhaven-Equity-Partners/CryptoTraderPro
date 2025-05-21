/**
 * Uniform Price System
 * 
 * This module provides a centralized, global price synchronization system
 * to ensure ALL components display the exact same price at all times.
 */

// Define the global registry for prices
interface GlobalPriceRegistry {
  prices: Record<string, number>;
  lastUpdated: Record<string, number>;
}

// Create a global registry that will be accessible everywhere
declare global {
  interface Window {
    GLOBAL_PRICES: GlobalPriceRegistry;
  }
}

// Initialize the global registry if it doesn't exist
if (typeof window !== 'undefined' && !window.GLOBAL_PRICES) {
  window.GLOBAL_PRICES = {
    prices: {
      'BTC/USDT': 107063,
      'ETH/USDT': 2549,
      'SOL/USDT': 170,
      'BNB/USDT': 657,
      'XRP/USDT': 2.36,
      'DOGE/USDT': 0.13,
      'ADA/USDT': 0.48
    },
    lastUpdated: {}
  };
}

/**
 * Get the current universal price for a symbol
 * This should be used by ALL components that need to display a price
 */
export function getUniformPrice(symbol: string): number {
  if (typeof window !== 'undefined' && window.GLOBAL_PRICES) {
    if (window.GLOBAL_PRICES.prices[symbol]) {
      return window.GLOBAL_PRICES.prices[symbol];
    }
  }
  return 0; // Default if not found
}

/**
 * Set a new price and broadcast it to all components
 * This ensures every component displays the exact same price
 */
export function setUniformPrice(symbol: string, price: number): void {
  if (!symbol || price <= 0) return;
  
  // Update the global registry first
  if (typeof window !== 'undefined') {
    if (!window.GLOBAL_PRICES) {
      window.GLOBAL_PRICES = { prices: {}, lastUpdated: {} };
    }
    
    // Only update if the price has actually changed
    const currentPrice = window.GLOBAL_PRICES.prices[symbol];
    if (currentPrice === price) {
      return; // No change, skip update to prevent loops
    }
    
    // Update in registry
    window.GLOBAL_PRICES.prices[symbol] = price;
    window.GLOBAL_PRICES.lastUpdated[symbol] = Date.now();
    
    // Also update legacy globals for compatibility
    if (!window.cryptoPrices) window.cryptoPrices = {};
    if (!window.latestPrices) window.latestPrices = {};
    
    window.cryptoPrices[symbol] = price;
    window.latestPrices[symbol] = price;
    
    if (symbol === 'BTC/USDT') {
      window.currentPrice = price;
    }
    
    // Broadcast via all known event channels to ensure ALL components update
    
    // 1. Window price-update event (for modern components)
    window.dispatchEvent(new CustomEvent('price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    }));
    
    // 2. Document live-price-update event (for legacy components)
    document.dispatchEvent(new CustomEvent('live-price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    }));
    
    // 3. Global price update event (for our new unified system)
    window.dispatchEvent(new CustomEvent('uniform-price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    }));
    
    // 4. Also update server via API to ensure backend is in sync
    syncWithServer(symbol, price);
    
    console.log(`✅ Uniform price updated for ${symbol}: ${price}`);
  }
}

/**
 * Sync price with server (for backend consistency)
 */
function syncWithServer(symbol: string, price: number): void {
  // Server sync shouldn't be instant to prevent flooding
  // Use a delayed approach
  setTimeout(() => {
    fetch('/api/sync-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price })
    }).catch(() => {}); // Silent fail is fine here
  }, 100);
}

/**
 * Subscribe to price updates from the unified system
 * All components should use this to stay in sync
 */
export function subscribeToUniformPrices(
  symbol: string, 
  callback: (price: number) => void
): () => void {
  const handlePriceUpdate = (event: CustomEvent) => {
    if (event.detail.symbol === symbol) {
      callback(event.detail.price);
    }
  };
  
  window.addEventListener('uniform-price-update', handlePriceUpdate as EventListener);
  
  // Also listen to legacy events for compatibility
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  document.addEventListener('live-price-update', handlePriceUpdate as EventListener);
  
  // Call immediately with current price
  const currentPrice = getUniformPrice(symbol);
  if (currentPrice > 0) {
    callback(currentPrice);
  }
  
  // Return cleanup function
  return () => {
    window.removeEventListener('uniform-price-update', handlePriceUpdate as EventListener);
    window.removeEventListener('price-update', handlePriceUpdate as EventListener);
    document.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
  };
}

/**
 * Initialize the price system with a fixed price
 * Use this on component mounts to ensure consistent startup prices
 */
export function initializeWithFixedPrice(symbol: string): void {
  // Use appropriate fixed prices for major cryptos
  let fixedPrice = 0;
  
  if (symbol === 'BTC/USDT') fixedPrice = 107063;
  if (symbol === 'ETH/USDT') fixedPrice = 2549;
  if (symbol === 'SOL/USDT') fixedPrice = 170;
  if (symbol === 'BNB/USDT') fixedPrice = 657;
  if (symbol === 'XRP/USDT') fixedPrice = 2.36;
  if (symbol === 'DOGE/USDT') fixedPrice = 0.13;
  if (symbol === 'ADA/USDT') fixedPrice = 0.48;
  
  if (fixedPrice > 0) {
    setUniformPrice(symbol, fixedPrice);
  }
}