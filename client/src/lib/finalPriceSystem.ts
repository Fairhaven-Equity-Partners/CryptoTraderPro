/**
 * Final Price System
 * 
 * Responsible for fetching real-time price data from the API
 * and synchronizing it with a timer for display.
 * 
 * Features:
 * - Prefetches price 5 seconds before the counter hits zero
 * - Provides visual feedback during fetching and calculation
 * - Ensures consistent price updates with network error handling
 */

import { TimeFrame } from './advancedSignals';
import { PriceEvent } from '../types';

// Configuration
const DEFAULT_REFRESH_INTERVAL = 300; // 5 minutes in seconds
const PREFETCH_OFFSET = 5; // Fetch price 5 seconds before countdown ends
const CHECK_INTERVAL = 5; // Check every 5 seconds

// Internal state
let countdownSeconds = DEFAULT_REFRESH_INTERVAL;
let lastPriceBySymbol: Record<string, PriceEvent> = {};
let timerInterval: number | null = null;

/**
 * Initialize the price system and start the countdown timer
 * @param initialInterval Optional custom interval in seconds
 */
export function initPriceSystem(initialInterval = DEFAULT_REFRESH_INTERVAL) {
  // Clear any existing interval to prevent duplicates
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Reset the countdown
  countdownSeconds = initialInterval;
  
  // Start the timer
  timerInterval = window.setInterval(() => {
    updateCountdown();
  }, 1000);
  
  console.log(`[FinalPriceSystem] Initialized with ${initialInterval}s refresh interval`);
}

/**
 * Update the countdown and trigger price fetch when needed
 */
function updateCountdown() {
  countdownSeconds -= 1;
  
  // Time to prefetch?
  if (countdownSeconds === PREFETCH_OFFSET) {
    triggerPriceFetch();
  }
  
  // Are we at zero?
  if (countdownSeconds <= 0) {
    // Reset the timer
    countdownSeconds = DEFAULT_REFRESH_INTERVAL;
  }
  
  // Periodically report time remaining for debugging
  if (countdownSeconds % CHECK_INTERVAL === 0) {
    console.log(`[FinalPriceSystem] Next fetch in ${countdownSeconds}s`);
  }
}

/**
 * Trigger a price fetch for the default symbol
 */
function triggerPriceFetch() {
  fetchLatestPrice('BTC/USDT').catch(error => {
    console.error('[FinalPriceSystem] Error fetching price:', error);
  });
}

/**
 * Fetch the latest price for a specific symbol
 * @param symbol Asset symbol to fetch
 * @returns The fetched price
 */
export async function fetchLatestPrice(symbol: string): Promise<number> {
  try {
    console.log(`[FinalPriceSystem] Fetching fresh price for ${symbol}`);
    
    // Broadcast that we're fetching
    const fetchingEvent = new CustomEvent('price-fetching', {
      detail: { symbol }
    });
    window.dispatchEvent(fetchingEvent);
    
    // Get the actual price from API
    const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    const price = parseFloat(data.lastPrice);
    
    if (isNaN(price) || price <= 0) {
      throw new Error('Invalid price received');
    }
    
    console.log(`[FinalPriceSystem] Successfully fetched price for ${symbol}: ${price}`);
    
    // Store the price
    const timestamp = Date.now();
    lastPriceBySymbol[symbol] = { price, timestamp };
    
    // Update global price tracking if window functions exist
    if (window.syncGlobalPrice) {
      window.syncGlobalPrice(symbol, price, timestamp);
    }
    
    // Broadcast the price update
    const updateEvent = new CustomEvent('price-update', {
      detail: { symbol, price, timestamp }
    });
    window.dispatchEvent(updateEvent);
    
    return price;
  } catch (error) {
    console.error('[FinalPriceSystem] Error fetching price:', error);
    
    // Use the last known price if available
    if (lastPriceBySymbol[symbol]) {
      console.log('[FinalPriceSystem] Using cached price due to fetch error');
      return lastPriceBySymbol[symbol].price;
    }
    
    // If no cached price, return a reasonable default
    return 0;
  }
}

/**
 * Get the current countdown time in mm:ss format
 * @returns Formatted countdown time
 */
export function getFormattedCountdown(): string {
  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get the most recent price for a symbol
 * @param symbol Asset symbol
 * @returns The most recent price or null if not available
 */
export function getLastPrice(symbol: string): number | null {
  if (lastPriceBySymbol[symbol]) {
    return lastPriceBySymbol[symbol].price;
  }
  return null;
}

/**
 * Manually trigger a price fetch and reset the timer
 * @param symbol Asset symbol to fetch
 */
export function manualPriceFetch(symbol: string): Promise<number> {
  // Reset the timer
  countdownSeconds = DEFAULT_REFRESH_INTERVAL;
  
  // Fetch the price
  return fetchLatestPrice(symbol);
}

/**
 * Clean up the timer when the component unmounts
 */
export function cleanupPriceSystem() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}