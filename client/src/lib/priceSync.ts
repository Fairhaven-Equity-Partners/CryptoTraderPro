// Fixed market prices to ensure consistency across the application
export const MARKET_PRICES: Record<string, number> = {
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
 * Always uses the fixed prices for consistency
 */
export function getPrice(symbol: string): number {
  return MARKET_PRICES[symbol] || 0;
}

/**
 * Synchronizes price data across the application
 * Updates DOM elements and sends server update
 */
export function syncPrice(symbol: string): number {
  const price = getPrice(symbol);
  
  if (price > 0) {
    // Update DOM data attributes for cross-component access
    const liveElement = document.getElementById('live-price-data');
    if (liveElement) {
      liveElement.setAttribute(`data-${symbol.replace('/', '-')}`, price.toString());
      liveElement.setAttribute('data-active-symbol', symbol);
      liveElement.setAttribute('data-latest-price', price.toString());
    }
    
    // Dispatch price update event
    const updateEvent = new CustomEvent('live-price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    });
    document.dispatchEvent(updateEvent);
    
    // Sync with server
    fetch('/api/sync-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price })
    }).catch(() => {}); // Silent fail as this is just a nice-to-have
  }
  
  return price;
}