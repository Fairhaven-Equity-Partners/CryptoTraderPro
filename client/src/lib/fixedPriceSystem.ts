/**
 * FIXED PRICE SYNCHRONIZATION SYSTEM
 * 
 * This module provides a unified price system that fetches prices at a strict
 * 3-minute interval to minimize signal volatility while ensuring all
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

// Track symbols that need price updates
const activeSymbols: Set<string> = new Set();

// Track the last time we actually fetched price data
let lastFetchTime = Date.now();

// Single global timer - ensures we only have one timer running
let globalTimer: NodeJS.Timeout | null = null;

/**
 * Get the current price for a symbol
 * Returns cached price if available and not expired, otherwise fetches new price
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  console.log(`[PriceSystem] getCurrentPrice called for ${symbol}`);
  const now = Date.now();
  const cachedData = priceCache[symbol];
  
  // Add this symbol to our tracking list
  if (!activeSymbols.has(symbol)) {
    activeSymbols.add(symbol);
    console.log(`[PriceSystem] Added ${symbol} to active tracking list`);
  }
  
  // If we have a recent price (less than 3 minutes old), use it
  if (cachedData && (now - cachedData.timestamp) < REFRESH_INTERVAL) {
    console.log(`[PriceSystem] Using cached price for ${symbol}: ${cachedData.price}`);
    return cachedData.price;
  }
  
  // Fetch a fresh price - but only if enough time has passed since last fetch
  const timeSinceLastFetch = now - lastFetchTime;
  if (timeSinceLastFetch < REFRESH_INTERVAL && cachedData) {
    console.log(`[PriceSystem] Using slightly outdated price - only ${Math.floor(timeSinceLastFetch/1000)}s since last fetch`);
    return cachedData.price; // Use slightly outdated data to avoid too frequent fetches
  }
  
  // If we reach here, we need to fetch fresh data
  try {
    console.log(`[PriceSystem] Fetching fresh price for ${symbol}...`);
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
    
    // Broadcast this new price to all components
    broadcastPriceUpdate(symbol, data.price);
    
    return data.price;
  } catch (error) {
    console.error(`[PriceSystem] Error fetching price for ${symbol}:`, error);
    // Return cached price if available, otherwise 0
    return cachedData ? cachedData.price : 0;
  }
}

/**
 * Broadcast price update to all listening components
 */
export function broadcastPriceUpdate(symbol: string, price: number) {
  // Create and dispatch a custom event with the price data
  const event = new CustomEvent('price-update', {
    detail: { symbol, price, timestamp: Date.now() }
  });
  
  // Broadcast to both window and document to maximize capture
  window.dispatchEvent(event);
  document.dispatchEvent(event);
  
  console.log(`[PriceSystem] Broadcast price update: ${symbol} = ${price} (3-minute system)`);
  
  // Reset the countdown timer in all components
  notifyTimerReset();
}

/**
 * Tell all components to reset their countdown displays
 */
export function notifyTimerReset() {
  console.log(`[PriceSystem] Reset countdown timers - new 3 minute cycle begins`);
  
  // Send a timer reset notification
  const resetEvent = new CustomEvent('price-timer-reset', {
    detail: { timestamp: lastFetchTime }
  });
  window.dispatchEvent(resetEvent);
}

/**
 * Subscribe to price updates
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
  
  // Return an unsubscribe function
  return () => {
    window.removeEventListener('price-update', handler);
  };
}

/**
 * Start polling for price updates at a fixed 3-minute interval
 * Uses a single global timer for all tracked symbols
 */
export function startPricePolling(symbol: string): () => void {
  // Add this symbol to tracking
  activeSymbols.add(symbol);
  
  // Fetch immediately on first request
  getCurrentPrice(symbol);
  
  // Setup the global timer if it doesn't exist yet
  if (!globalTimer) {
    console.log(`[PriceSystem] Starting master 4-minute price polling timer`);
    
    // Check every minute if we need to fetch prices
    globalTimer = setInterval(() => {
      const now = Date.now();
      const secondsSinceLastFetch = Math.floor((now - lastFetchTime) / 1000);
      
      console.log(`[PriceSystem] Timer check: ${secondsSinceLastFetch}s since last fetch`);
      
      // If 4 minutes (240 seconds) have passed, fetch for all active symbols
      if (secondsSinceLastFetch >= 240) {
        console.log(`[PriceSystem] 4-MINUTE MARK REACHED - Fetching fresh prices`);
        
        // Fetch prices for all tracked symbols
        activeSymbols.forEach(trackedSymbol => {
          getCurrentPrice(trackedSymbol);
        });
      }
    }, 60000); // Check every minute
  }
  
  // Return a cleanup function
  return () => {
    activeSymbols.delete(symbol);
    
    // If no more symbols to track, clear the global timer
    if (activeSymbols.size === 0 && globalTimer) {
      clearInterval(globalTimer);
      globalTimer = null;
      console.log(`[PriceSystem] Stopped price polling (no active symbols)`);
    }
  };
}

/**
 * Get seconds remaining until next refresh
 */
export function getSecondsUntilNextRefresh(): number {
  const now = Date.now();
  const elapsed = Math.floor((now - lastFetchTime) / 1000);
  const remaining = Math.max(0, 180 - elapsed);
  return remaining;
}

/**
 * Get the timer value as a formatted string (MM:SS)
 */
export function getFormattedCountdown(): string {
  const seconds = getSecondsUntilNextRefresh();
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}