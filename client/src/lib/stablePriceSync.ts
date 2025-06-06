/**
 * STABLE PRICE SYNCHRONIZATION SYSTEM - FIXED
 * 
 * This module provides a unified price system that fetches prices at a reduced 
 * frequency (exactly every 3 minutes) to minimize signal volatility while ensuring all
 * components display the same price data.
 */

import { fetchAssetBySymbol } from './api';

// IMPORTANT: Single global timer to control all price fetches to avoid timing race conditions
let globalPriceTimer: NodeJS.Timeout | null = null;

// Central storage for latest prices
const priceCache: Record<string, {
  price: number;
  timestamp: number;
}> = {};

// Time between price refreshes (10 minutes in milliseconds) - significantly increased to prevent excessive recalculations
const REFRESH_INTERVAL = 600000; // 10 minutes

// Track symbols that need price updates
const activeSymbols: Set<string> = new Set();

// Track the last time we actually fetched
let lastFetchTime = Date.now();

// Export for other modules to access
export { lastFetchTime };

/**
 * COMPLETELY REWRITTEN:
 * Get the current price for a symbol - has strong debouncing to prevent excessive fetches
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  console.log(`[Price] getCurrentPrice called for ${symbol}`);
  const now = Date.now();
  const cachedData = priceCache[symbol];
  
  // If we have a cache hit that's still valid, return it immediately
  if (cachedData && (now - cachedData.timestamp) < REFRESH_INTERVAL) {
    console.log(`[Price] Using cached price for ${symbol}: ${cachedData.price}`);
    return cachedData.price;
  }
  
  // Track this symbol for regular updates
  if (!activeSymbols.has(symbol)) {
    activeSymbols.add(symbol);
    console.log(`[Price] Added ${symbol} to active tracking list`);
  }
  
  // Fetch a fresh price - but only if enough time has passed
  const timeSinceFetch = now - lastFetchTime;
  if (timeSinceFetch < REFRESH_INTERVAL && cachedData) {
    console.log(`[Price] Skipping fetch, only ${Math.floor(timeSinceFetch/1000)}s since last fetch`);
    return cachedData.price; // Return stale data if we have it
  }
  
  // If we reach here, we need to fetch fresh data
  try {
    console.log(`[Price] Fetching fresh price for ${symbol}...`);
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
    
    // Update global fetch time
    lastFetchTime = now;
    
    // Broadcast this new price
    broadcastPriceUpdate(symbol, data.price);
    
    return data.price;
  } catch (error) {
    console.error(`[Price] Error fetching price for ${symbol}:`, error);
    // Return cached price if available, otherwise 0
    return cachedData ? cachedData.price : 0;
  }
}

/**
 * Check if enough time has passed since the last calculation
 * to prevent excessive recalculations
 */
function shouldAllowCalculation(symbol: string): boolean {
  // Get the timestamp of the last calculation
  const lastCalcTime = (window as any).lastCalcTimestamp || {};
  const lastTime = lastCalcTime[symbol] || 0;
  const now = Date.now();
  
  // DRAMATICALLY REDUCE CALCULATION FREQUENCY - 10 MINUTE LOCKOUT PERIOD
  // This completely prevents the market analysis box from changing too frequently
  if (now - lastTime < 600000) { // 10 minutes in milliseconds
    console.log(`[StablePrice] Skipping recalculation - Last calc was ${Math.floor((now - lastTime)/1000)}s ago, 10-minute lockout in effect`);
    return false;
  }
  
  return true;
}

/**
 * Broadcast price update to all listeners with improved reliability
 */
export function broadcastPriceUpdate(symbol: string, price: number) {
  // Create and dispatch a custom event with the price data
  const event = new CustomEvent('price-update', {
    detail: { symbol, price, timestamp: Date.now() }
  });
  
  // Broadcast to both window and document to maximize capture
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  
  // COMPLETELY DISABLE AUTO-CALCULATION EXCEPT FOR MANUAL TRIGGERS
  // This will allow manual calculation but prevent auto-updates entirely
  // ONLY update calculation timestamp without triggering calculation
  if (!(window as any).lastCalcTimestamp) {
    (window as any).lastCalcTimestamp = {};
  }
  // Update the timestamp only - no calculation events emitted
  if (!(window as any).lastCalcTimestamp[symbol]) {
    (window as any).lastCalcTimestamp[symbol] = Date.now();
  }
  
  console.log(`[Price] Broadcasting price update: ${symbol} = ${price} (2-minute system)`);
  
  // Also trigger a timer reset event
  resetPriceTimer();
}

/**
 * Reset the price timer - used when a new price update comes in
 */
function resetPriceTimer() {
  console.log(`[Price] TIMER RESET - Starting new 3-minute cycle`);
  lastFetchTime = Date.now();
  
  // Notify all components about the reset
  const resetEvent = new CustomEvent('price-timer-reset', {
    detail: { timestamp: lastFetchTime }
  });
  window.dispatchEvent(resetEvent);
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
 * Start polling for price updates at a strict 3-minute interval
 * Uses a centralized approach for all symbols with true synchronization
 */
export function startPricePolling(symbol: string): () => void {
  // Add this symbol to our tracking list
  activeSymbols.add(symbol);
  
  // Fetch immediately on first request
  getCurrentPrice(symbol);
  
  // Setup the global timer if it doesn't exist
  if (!globalPriceTimer) {
    console.log(`[Price] Setting up master 4-minute price polling timer`);
    
    // Check every minute if we need to fetch prices
    globalPriceTimer = setInterval(() => {
      const now = Date.now();
      const secondsSinceLastFetch = Math.floor((now - lastFetchTime) / 1000);
      
      console.log(`[Price] Timer check: ${secondsSinceLastFetch}s since last fetch`);
      
      // If 4 minutes have passed, fetch for all active symbols to match CoinGecko rate limits
      if (secondsSinceLastFetch >= 240) {
        console.log(`[Price] 4-MINUTE MARK REACHED - Fetching ALL prices`);
        
        // Fetch prices for all tracked symbols
        for (const trackedSymbol of activeSymbols) {
          getCurrentPrice(trackedSymbol);
        }
      }
    }, 60000); // Check every minute
  }
  
  // Return cleanup function
  return () => {
    activeSymbols.delete(symbol);
    
    // If no more symbols to track, clear the timer
    if (activeSymbols.size === 0 && globalPriceTimer) {
      clearInterval(globalPriceTimer);
      globalPriceTimer = null;
      console.log(`[Price] Stopped price polling (no active symbols)`);
    }
  };
}