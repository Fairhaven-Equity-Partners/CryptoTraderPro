/**
 * STABLE PRICE SYNCHRONIZATION SYSTEM
 * 
 * This module provides a unified price system that fetches prices at a reduced 
 * frequency (every 3 minutes) to minimize signal volatility while ensuring all
 * components display the same price data.
 */

import { fetchAssetBySymbol } from './api';

// Central storage for latest prices
const priceCache: Record<string, {
  price: number;
  timestamp: number;
}> = {};

// Time between price refreshes (3 minutes in milliseconds)
const REFRESH_INTERVAL = 180000; // 3 minutes

// Active price polling intervals
const activePolling: Record<string, NodeJS.Timeout> = {};

/**
 * Get the current price for a symbol
 * Returns cached price if available and not expired, otherwise fetches new price
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  const now = Date.now();
  const cachedData = priceCache[symbol];
  
  // If we have a recent price (less than 3 minutes old), use it
  if (cachedData && (now - cachedData.timestamp) < REFRESH_INTERVAL) {
    return cachedData.price;
  }
  
  // Otherwise fetch a fresh price
  try {
    const data = await fetchAssetBySymbol(symbol);
    if (!data || !data.price) {
      // If fetch fails but we have a cached price, use it regardless of age
      if (cachedData) return cachedData.price;
      return 0;
    }
    
    // Update cache with new price
    priceCache[symbol] = {
      price: data.price,
      timestamp: now
    };
    
    // Broadcast this new price
    broadcastPriceUpdate(symbol, data.price);
    
    return data.price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Return cached price if available, otherwise 0
    return cachedData ? cachedData.price : 0;
  }
}

/**
 * Broadcast price update to all listeners
 */
export function broadcastPriceUpdate(symbol: string, price: number) {
  // Create and dispatch a custom event with the price data
  const event = new CustomEvent('price-update', {
    detail: { symbol, price }
  });
  
  // Broadcast to both window and document to maximize capture
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  
  console.log(`[StablePriceSync] Broadcasting price update: ${symbol} = ${price}`);
}

/**
 * Subscribe to price updates
 * Returns an unsubscribe function
 */
export function subscribeToPriceUpdates(
  symbol: string, 
  callback: (price: number) => void
): () => void {
  // Create the event handler
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail && detail.symbol === symbol) {
      callback(detail.price);
    }
  };
  
  // Add event listeners
  window.addEventListener('price-update', handler);
  document.addEventListener('price-update', handler);
  
  // Return an unsubscribe function
  return () => {
    window.removeEventListener('price-update', handler);
    document.removeEventListener('price-update', handler);
  };
}

/**
 * Start polling for price updates at a 3-minute interval
 * Only one polling interval will be created per symbol
 */
export function startPricePolling(symbol: string): () => void {
  // Check if we're already polling for this symbol
  if (activePolling[symbol]) {
    return () => stopPricePolling(symbol);
  }
  
  // Fetch immediately
  getCurrentPrice(symbol);
  
  // Set up interval for future updates
  activePolling[symbol] = setInterval(() => {
    console.log(`[StablePriceSync] Polling price for ${symbol} (3-minute interval)`);
    getCurrentPrice(symbol);
  }, REFRESH_INTERVAL);
  
  // Return a cleanup function
  return () => stopPricePolling(symbol);
}

/**
 * Stop polling for price updates
 */
export function stopPricePolling(symbol: string) {
  if (activePolling[symbol]) {
    clearInterval(activePolling[symbol]);
    delete activePolling[symbol];
  }
}