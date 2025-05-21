// Current prices stored in memory for consistency across the application
// This is a single source of truth that all components will reference
const currentPrices: Record<string, number> = {
  'BTC/USDT': 108465,
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

/**
 * Gets the current price for a cryptocurrency symbol
 * Always uses the centralized price registry for consistency
 */
export function getPrice(symbol: string): number {
  return currentPrices[symbol] || 0;
}

/**
 * Sets a new price for a cryptocurrency symbol
 * Updates the central registry to maintain consistency
 */
export function setPrice(symbol: string, price: number): void {
  if (price > 0) {
    currentPrices[symbol] = price;
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
    // Update DOM data attributes for cross-component access
    const liveElement = document.getElementById('live-price-data');
    if (liveElement) {
      liveElement.setAttribute(`data-${symbol.replace('/', '-')}`, price.toString());
      liveElement.setAttribute('data-active-symbol', symbol);
      liveElement.setAttribute('data-latest-price', price.toString());
      liveElement.setAttribute('data-current-asset', symbol);
      liveElement.setAttribute('data-current-price', price.toString());
    }
    
    // Broadcast a price update event for any components listening
    const updateEvent = new CustomEvent('live-price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    });
    document.dispatchEvent(updateEvent);
    
    // Make sure any global price variables are updated (important for consistency)
    // This ensures the fetchedPrice == currentPrice at all times
    (window as any).currentPrice = price;
    (window as any).latestPrices = (window as any).latestPrices || {};
    (window as any).latestPrices[symbol] = price;
    
    // Sync with server to ensure backend has the same prices
    fetch('/api/sync-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price })
    }).catch(() => {}); // Silent fail as this is just a nice-to-have
  }
  
  return price;
}