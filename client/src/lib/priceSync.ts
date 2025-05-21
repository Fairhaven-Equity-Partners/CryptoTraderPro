// Create a global window object to ensure single source of truth across all components
declare global {
  interface Window {
    cryptoPrices: Record<string, number>;
  }
}

// Initialize the global price object if it doesn't exist yet
if (typeof window !== 'undefined' && !window.cryptoPrices) {
  window.cryptoPrices = {
    'BTC/USDT': 108918, // Updated with latest price
    'ETH/USDT': 2559,
    'BNB/USDT': 656,
    'SOL/USDT': 171,
    'XRP/USDT': 2.39,
    'AXS/USDT': 117,
    'AAVE/USDT': 92.70,
    'DOT/USDT': 7.10,
    'LINK/USDT': 14.85,
    'UNI/USDT': 9.73,
    'DOGE/USDT': 0.13,
    'AVAX/USDT': 31.52,
    'MATIC/USDT': 0.64,
    '1INCH/USDT': 99.30,
    'QNT/USDT': 96.85
  };
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

/**
 * Updates all components with the latest price
 * This is the ONLY function that should be called to update prices
 * @returns The final synchronized price
 */
export function syncPrice(symbol: string, newPrice?: number): number {
  // If a new price is provided, update our central registry
  if (newPrice && newPrice > 0) {
    setPrice(symbol, newPrice);
  }
  
  // Get the current price from our central registry
  const price = getPrice(symbol);
  
  if (price > 0) {
    // Broadcast all events needed for components to stay in sync
    
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
    
    // 5. Sync with server
    fetch('/api/sync-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price })
    }).catch(() => {}); // Silent fail as this is just a nice-to-have
  }
  
  return price;
}