/**
 * Price Synchronization System
 * 
 * This module provides a reliable, throttled price update system that prevents
 * cascading updates and feedback loops while ensuring all components have a
 * consistent view of current prices.
 */

// Create a global window object to ensure single source of truth across all components
declare global {
  interface Window {
    cryptoPrices: Record<string, number>;
    currentPrice: number;
    latestPrices: Record<string, number>;
    priceUpdateTimestamps: Record<string, number>;
  }
}

// Initialize the global price registry
if (typeof window !== 'undefined') {
  if (!window.cryptoPrices) {
    window.cryptoPrices = {};
  }
  
  // Set initial prices
  const initialPrices = {
    'BTC/USDT': 108918,
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
  
  // Initialize timestamp tracking for throttling
  if (!window.priceUpdateTimestamps) {
    window.priceUpdateTimestamps = {};
  }
}

// Throttling intervals
const MIN_UPDATE_INTERVAL = 5000; // Minimum time between price updates (5 seconds)

/**
 * Gets the current price for a cryptocurrency symbol
 * Always uses the centralized price registry for consistency
 */
export function getPrice(symbol: string): number {
  return window.cryptoPrices[symbol] || 0;
}

/**
 * Sets a new price for a cryptocurrency symbol with proper validation
 * Only updates if the change is significant or enough time has passed
 */
export function setPrice(symbol: string, price: number): boolean {
  if (!price || price <= 0) {
    return false;
  }
  
  const currentPrice = window.cryptoPrices[symbol] || 0;
  
  // Skip if there's no significant change (<0.1%)
  const percentDiff = Math.abs((price - currentPrice) / currentPrice) * 100;
  if (percentDiff < 0.1 && currentPrice > 0) {
    return false;
  }
  
  // Throttle updates to prevent cascading
  const now = Date.now();
  const lastUpdateTime = window.priceUpdateTimestamps[symbol] || 0;
  
  if (now - lastUpdateTime < MIN_UPDATE_INTERVAL) {
    return false;
  }
  
  // Update price in central registry
  window.cryptoPrices[symbol] = price;
  window.priceUpdateTimestamps[symbol] = now;
  
  // Also update compatibility values
  window.latestPrices[symbol] = price;
  if (symbol === 'BTC/USDT') {
    window.currentPrice = price;
  }
  
  // Dispatch event for components to react
  const updateEvent = new CustomEvent('price-update', {
    detail: { 
      symbol, 
      price,
      timestamp: now
    }
  });
  window.dispatchEvent(updateEvent);return true;
}

/**
 * Updates all components with the latest price and syncs with server
 * @returns The final synchronized price
 */
export function syncPrice(symbol: string, newPrice?: number): number {
  // If no price provided, get it from the registry
  const currentPrice = getPrice(symbol);
  
  // If no price provided, don't generate a random one - use current
  if (!newPrice) {
    return currentPrice;
  }
  
  // If price is invalid, use current
  if (!newPrice || newPrice <= 0) {
    return currentPrice;
  }
  
  // Try to update the price
  const updated = setPrice(symbol, newPrice);
  
  // If price was updated, sync with server
  if (updated) {
    // Dispatch a live update event
    const liveEvent = new CustomEvent('live-price-update', {
      detail: { symbol, price: newPrice, timestamp: Date.now() }
    });
    window.dispatchEvent(liveEvent);
    
    // Synchronize with server (throttled)
    fetch('/api/sync-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, price: newPrice })
    }).catch(() => {});
  }
  
  return getPrice(symbol);
}

/**
 * Get price updates via server-side events
 * This sets up a listener for WebSocket price updates
 */
export function setupPriceListener(): void {
  // Listen for WebSocket price updates
  const priceUpdateHandler = (event: any) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle price updates from server
      if (data.type === 'PRICE_UPDATE') {
        syncPrice(data.symbol, data.price);
      }
    } catch (e) {
      console.error('Error processing WebSocket message:', e);
    }
  };
  
  // Connect to WebSocket if available
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.addEventListener('message', priceUpdateHandler);
    
    ws.addEventListener('open', () => {});
    
    ws.addEventListener('close', () => {// Reconnect after delay
      setTimeout(() => setupPriceListener(), 5000);
    });
    
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  } catch (e) {
    console.error('Failed to connect to WebSocket:', e);
  }
}