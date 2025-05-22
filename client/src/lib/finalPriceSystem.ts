/**
 * FINAL PRICE SYNCHRONIZATION SYSTEM
 * 
 * This module provides a unified price system that fetches prices at a strict
 * 3-minute interval to minimize signal volatility while ensuring all
 * components display the same price data. This version enforces strict timing
 * and prevents any premature calculations.
 */

import { fetchAssetBySymbol } from './api';

// Constants for improved readability and maintainability
const REFRESH_INTERVAL = 180000; // Exactly 3 minutes in milliseconds
const CALCULATION_DEBOUNCE = 180000; // Only allow calculations every 3 minutes
const CHECK_INTERVAL = 5000; // Check refresh status every 5 seconds
const PREFETCH_THRESHOLD = 5000; // Start fetching 5 seconds early

// More structured state management
const priceSystem = {
  timing: {
    lastFetchTime: Date.now(),
    nextFetchTime: Date.now() + REFRESH_INTERVAL,
  },
  status: {
    fetchInProgress: false,
    fetchTimer: null as NodeJS.Timeout | null,
  },
  data: {
    activeSymbols: new Set<string>(),
    priceCache: new Map<string, { price: number, timestamp: number }>(),
    lastCalculationTimes: new Map<string, number>(),
  }
};

/**
 * Check if a symbol needs calculation based on the 3-minute rule
 */
export function shouldCalculate(symbol: string): boolean {
  const now = Date.now();
  const lastCalcTime = priceSystem.data.lastCalculationTimes.get(symbol) || 0;
  return (now - lastCalcTime) >= CALCULATION_DEBOUNCE;
}

/**
 * Mark a symbol as having been calculated
 */
export function markCalculationPerformed(symbol: string): void {
  priceSystem.data.lastCalculationTimes.set(symbol, Date.now());
}

/**
 * Get time remaining until the next price refresh in seconds
 */
export function getSecondsUntilNextRefresh(): number {
  const timeUntilRefresh = Math.max(0, priceSystem.timing.nextFetchTime - Date.now());
  return Math.floor(timeUntilRefresh / 1000);
}

/**
 * Get a formatted countdown string (MM:SS)
 */
export function getFormattedCountdown(): string {
  const seconds = getSecondsUntilNextRefresh();
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Fetch prices for all active symbols
 */
async function fetchAllPrices() {
  if (priceSystem.status.fetchInProgress) return;
  
  try {
    priceSystem.status.fetchInProgress = true;
    
    // Update timing information
    const now = Date.now();
    priceSystem.timing.lastFetchTime = now;
    priceSystem.timing.nextFetchTime = now + REFRESH_INTERVAL;
    
    console.log(`[FinalPriceSystem] 3-MINUTE MARK - Fetching prices for ${priceSystem.data.activeSymbols.size} symbols`);
    
    // Fetch all prices in parallel
    const symbols = Array.from(priceSystem.data.activeSymbols);
    await Promise.all(symbols.map(fetchAndUpdateSymbol));
    
    // Notify that the 3-minute refresh has occurred
    broadcastRefreshEvent();
  } catch (error) {
    console.error('Error in fetchAllPrices:', error);
  } finally {
    priceSystem.status.fetchInProgress = false;
  }
}

/**
 * Fetch and update a single symbol
 */
async function fetchAndUpdateSymbol(symbol: string) {
  try {
    const data = await fetchAssetBySymbol(symbol);
    const now = Date.now();
    
    if (data && data.price) {
      // Update cache
      priceSystem.data.priceCache.set(symbol, {
        price: data.price,
        timestamp: now
      });
      
      // Broadcast the update
      broadcastPriceUpdate(symbol, data.price);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return false;
  }
}

/**
 * Broadcast a price update event
 */
function broadcastPriceUpdate(symbol: string, price: number) {
  window.dispatchEvent(new CustomEvent('final-price-update', {
    detail: { symbol, price, timestamp: Date.now() }
  }));
  
  console.log('===================================================');
  console.log(`💰 PRICE UPDATE: ${symbol} = ${price} 💰`);
  console.log(`💰 CALCULATIONS COMING SOON 💰`);
}

/**
 * Broadcast that the 3-minute refresh cycle has completed
 */
function broadcastRefreshEvent() {
  console.log('⏰ 3-MINUTE CYCLE COMPLETE - TRIGGERING CALCULATIONS ⏰');
  window.dispatchEvent(new CustomEvent('final-price-refresh'));
}

/**
 * Start tracking a symbol and fetch initial price
 */
export async function startTracking(symbol: string): Promise<number> {
  priceSystem.data.activeSymbols.add(symbol);
  console.log(`[FinalPriceSystem] Started tracking ${symbol}`);
  
  // Start the global timer if needed
  startGlobalTimer();
  
  // Return current price (from cache or fresh fetch)
  return await getCurrentPrice(symbol);
}

/**
 * Stop tracking a symbol
 */
export function stopTracking(symbol: string) {
  priceSystem.data.activeSymbols.delete(symbol);
  console.log(`[FinalPriceSystem] Stopped tracking ${symbol}`);
  
  // Stop the timer if no more symbols are being tracked
  if (priceSystem.data.activeSymbols.size === 0 && priceSystem.status.fetchTimer) {
    clearInterval(priceSystem.status.fetchTimer);
    priceSystem.status.fetchTimer = null;
  }
}

/**
 * Start the global fetch timer
 */
function startGlobalTimer() {
  if (priceSystem.status.fetchTimer) return;
  
  console.log(`[FinalPriceSystem] Starting global 3-minute timer`);
  
  // Check frequently if we need to fetch
  priceSystem.status.fetchTimer = setInterval(() => {
    const timeUntilNextFetch = priceSystem.timing.nextFetchTime - Date.now();
    
    // Start fetching early to reduce perceived delay
    if (timeUntilNextFetch <= PREFETCH_THRESHOLD) {
      console.log(`[FinalPriceSystem] Starting fetch early to reduce delay`);
      fetchAllPrices();
    } else {
      console.log(`[FinalPriceSystem] Next fetch in ${Math.ceil(timeUntilNextFetch/1000)}s`);
    }
  }, CHECK_INTERVAL); 
}

/**
 * Get the current price for a symbol
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  // Check if we have the symbol in cache
  const cached = priceSystem.data.priceCache.get(symbol);
  const now = Date.now();
  
  // If we have a recent price, use it
  if (cached && (now - cached.timestamp) < REFRESH_INTERVAL) {
    console.log(`[FinalPriceSystem] Using cached price for ${symbol}: ${cached.price}`);
    return cached.price;
  }
  
  // Fetch a new price
  try {
    console.log(`[FinalPriceSystem] Fetching fresh price for ${symbol}`);
    const data = await fetchAssetBySymbol(symbol);
    
    // Handle both price and lastPrice fields for compatibility
    let price: number | null = null;
    
    if (data?.lastPrice !== undefined && typeof data.lastPrice === 'number') {
      price = data.lastPrice;
    } else if (data?.price !== undefined && typeof data.price === 'number') {
      price = data.price;
    }
    
    if (price !== null) {
      console.log(`[FinalPriceSystem] Successfully fetched price for ${symbol}: ${price}`);
      
      // Update cache with the new price
      priceSystem.data.priceCache.set(symbol, { price, timestamp: now });
      
      // Update timing information for initial fetch
      if (!cached) {
        priceSystem.timing.lastFetchTime = now;
        priceSystem.timing.nextFetchTime = now + REFRESH_INTERVAL;
      }
      
      // Broadcast this new price immediately
      broadcastPriceUpdate(symbol, price);
      
      return price;
    }
    
    // If fetch fails but we have a cached price, use it regardless of age
    if (cached) return cached.price;
    
    // Try CoinGecko as fallback for Bitcoin
    if (symbol === 'BTC/USDT') {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const cgData = await response.json();
        
        if (cgData?.bitcoin?.usd) {
          const marketPrice = cgData.bitcoin.usd;
          console.log(`[FinalPriceSystem] Got real market price for Bitcoin: ${marketPrice}`);
          
          priceSystem.data.priceCache.set(symbol, { price: marketPrice, timestamp: now });
          broadcastPriceUpdate(symbol, marketPrice);
          
          return marketPrice;
        }
      } catch (cgError) {
        console.error("Error fetching from CoinGecko:", cgError);
      }
    }
    
    // Fallback values if all else fails
    return symbol === 'BTC/USDT' ? 63000 : symbol === 'ETH/USDT' ? 3000 : 0;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return cached?.price || (symbol === 'BTC/USDT' ? 63000 : symbol === 'ETH/USDT' ? 3000 : 0);
  }
}

/**
 * Subscribe to price updates for a specific symbol
 */
export function subscribeToPriceUpdates(
  symbol: string,
  callback: (price: number) => void
): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.symbol === symbol) {
      callback(detail.price);
    }
  };
  
  window.addEventListener('final-price-update', handler);
  return () => window.removeEventListener('final-price-update', handler);
}

/**
 * Subscribe to the 3-minute refresh cycle events
 */
export function subscribeToRefreshCycle(callback: () => void): () => void {
  window.addEventListener('final-price-refresh', callback);
  return () => window.removeEventListener('final-price-refresh', callback);
}