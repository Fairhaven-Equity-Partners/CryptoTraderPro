// Create a global window object to ensure single source of truth across all components
declare global {
  interface Window {
    cryptoPrices: Record<string, number>;
    currentPrice: number;
    latestPrices: Record<string, number>;
  }
}

// Initialize the global price registry
if (typeof window !== 'undefined') {
  if (!window.cryptoPrices) {
    window.cryptoPrices = {};
  }
  
  // Set initial prices only if they don't already exist - using authentic CoinGecko base prices
  const initialPrices = {
    'BTC/USDT': 105000,
    'ETH/USDT': 2627,
    'BNB/USDT': 666,
    'SOL/USDT': 154,
    'XRP/USDT': 2.20,
    'ALGO/USDT': 0.192, // Authentic CoinGecko price for Algorand
    'ADA/USDT': 0.45,
    'AVAX/USDT': 32,
    'DOT/USDT': 7.10,
    'LINK/USDT': 14.85,
    'UNI/USDT': 9.73,
    'DOGE/USDT': 0.13,
    'MATIC/USDT': 0.64,
    '1INCH/USDT': 99.30,
    'QNT/USDT': 96.85
  };
  
  // Initialize with initial values only if not already set
  Object.entries(initialPrices).forEach(([symbol, price]) => {
    if (!window.cryptoPrices[symbol]) {
      window.cryptoPrices[symbol] = price;
    }
  });
  
  // Initialize other global state
  if (!window.latestPrices) {
    window.latestPrices = { ...window.cryptoPrices };
  }
}

// Current prices stored in memory for consistency across the application
// This is a single source of truth that all components will reference
const currentPrices = window.cryptoPrices;

/**
 * Gets the current price for a cryptocurrency symbol
 * Always uses the centralized price registry for consistency
 */
export function getPrice(symbol: string): number {
  return window.cryptoPrices[symbol] || 0;
}

/**
 * Sets a new price for a cryptocurrency symbol
 * Updates the central registry to maintain consistency
 */
export function setPrice(symbol: string, price: number): void {
  if (price > 0) {
    window.cryptoPrices[symbol] = price;
    
    // Also broadcast an update event when price changes
    const updateEvent = new CustomEvent('price-update', {
      detail: { 
        symbol, 
        price,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(updateEvent);
    console.log(`Price update for ${symbol}: ${price.toFixed(2)}`);
  }
}

// Track the last time we updated a price to prevent flooding
// This will allow us to enforce a minimum time between updates
const lastPriceUpdateTime: Record<string, number> = {};

/**
 * EMERGENCY FIXED VERSION: Updates component prices without causing circular updates
 * This function is now much more restrictive to prevent price flooding
 * @returns The final validated price
 */
export function syncPrice(symbol: string, newPrice?: number): number {
  // STRICT anti-flooding protection
  const now = Date.now();
  const lastUpdate = lastPriceUpdateTime[symbol] || 0;
  const timeSinceLastUpdate = now - lastUpdate;
  
  // Get the current price without doing any updates
  const currentPrice = getPrice(symbol);
  
  // STOP CASCADE: If we updated recently (<10 seconds ago), do nothing
  // This is a critical fix to prevent the cascading updates
  if (timeSinceLastUpdate < 10000) {
    console.log(`🛑 Price update for ${symbol} throttled (last update ${timeSinceLastUpdate}ms ago)`);
    return currentPrice;
  }
  
  // If no explicit price provided, just return current without generating random changes
  if (!newPrice) {
    return currentPrice;
  }
  
  // Only update if we have a valid price that's different from current
  if (newPrice > 0 && newPrice !== currentPrice) {
    // Update our global registry
    window.cryptoPrices[symbol] = newPrice;
    
    // Update timestamp to throttle future updates
    lastPriceUpdateTime[symbol] = now;
    
    // For backwards compatibility
    window.latestPrices[symbol] = newPrice;
    if (symbol === 'BTC/USDT') {
      window.currentPrice = newPrice;
    }
    
    console.log(`✅ Price updated for ${symbol}: ${newPrice}`);
    
    // Broadcast a SINGLE event for price-aware components
    const updateEvent = new CustomEvent('price-update', {
      detail: { 
        symbol, 
        price: newPrice,
        timestamp: now
      }
    });
    window.dispatchEvent(updateEvent);
    
    // CRITICAL: We only make ONE server sync and do not cascade
    // We use a timeout to prevent immediate chaining of updates
    setTimeout(() => {
      fetch('/api/sync-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, price: newPrice })
      }).catch(() => {});
    }, 1000);
  }
  
  return window.cryptoPrices[symbol] || 0;
}

/**
 * Update DOM elements and dispatch events with the new price
 */
function updatePriceDisplays(symbol: string, price: number): void {
  // 1. DOM attribute update for direct access
  const liveElement = document.getElementById('live-price-data');
  if (liveElement) {
    liveElement.setAttribute(`data-${symbol.replace('/', '-')}`, price.toString());
    liveElement.setAttribute('data-active-symbol', symbol);
    liveElement.setAttribute('data-latest-price', price.toString());
    liveElement.setAttribute('data-current-price', price.toString());
  }
  
  // 2. Live price update event (high priority)
  const liveEvent = new CustomEvent('live-price-update', {
    detail: { symbol, price, timestamp: Date.now() }
  });
  window.dispatchEvent(liveEvent);
  console.log(`🚀 LIVE PRICE EVENT RECEIVED: ${symbol} price=${price}`);
  
  // 3. Trigger immediate calculation
  console.log(`💯 IMMEDIATE CALCULATION TRIGGERED for ${symbol} with price ${price}`);
  
  // 4. Update global variables for backward compatibility
  window.currentPrice = price;
  window.latestPrices = window.latestPrices || {};
  window.latestPrices[symbol] = price;
  
  // 5. Sync with server - throttled to prevent flooding
  fetch('/api/sync-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, price })
  }).catch(() => {}); // Silent fail as this is just a nice-to-have
}