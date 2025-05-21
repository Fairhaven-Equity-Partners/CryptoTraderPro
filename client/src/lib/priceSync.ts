// Current market prices to ensure calculations are consistent across the application
export const FIXED_MARKET_PRICES: Record<string, number> = {
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

// Get the current price for a symbol from our fixed market prices
export function getCurrentPrice(symbol: string): number {
  return FIXED_MARKET_PRICES[symbol] || 0;
}

// Update price in DOM and return it (central source of truth)
export function syncPrice(symbol: string, price: number = 0): number {
  // If no price provided, use our fixed prices
  if (price <= 0) {
    price = getCurrentPrice(symbol);
  }
  
  // Only use price if it's valid
  if (price > 0) {
    // Update DOM element for cross-component access
    const priceElement = document.getElementById('live-price-data');
    if (priceElement) {
      priceElement.setAttribute(`data-${symbol.replace('/', '-')}`, price.toString());
      priceElement.setAttribute('data-active-symbol', symbol);
      priceElement.setAttribute('data-latest-price', price.toString());
    }
    
    // Emit a price update event for components to listen to
    const updateEvent = new CustomEvent('live-price-update', {
      detail: { symbol, price, timestamp: Date.now() }
    });
    document.dispatchEvent(updateEvent);
    
    // Also sync with server
    fetch('/api/sync-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price })
    }).catch(() => {}); // Silent fail - not critical functionality
  }
  
  return price;
}