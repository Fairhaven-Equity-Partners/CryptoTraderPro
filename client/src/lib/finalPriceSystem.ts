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
const DEFAULT_REFRESH_INTERVAL = 240; // Exactly 4 minutes in seconds to respect CoinGecko rate limits
const PREFETCH_OFFSET = 5; // Fetch price 5 seconds before countdown ends
const CHECK_INTERVAL = 10; // Check every 10 seconds - reduced log frequency

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
  
  // No need to add to the window object since we're exporting these functions directly
  
  console.log(`[FinalPriceSystem] Initialized with ${initialInterval}s refresh interval`);
}

/**
 * Update the countdown and trigger price fetch when needed
 * FINAL FIX: Only fetches prices exactly every 3 minutes and NEVER triggers calculations
 */
function updateCountdown() {
  countdownSeconds -= 1;
  
  // Only log the countdown, completely stopped auto-fetches
  
  // Are we at zero?
  if (countdownSeconds <= 0) {
    // Reset the timer to exactly 4 minutes (240 seconds) to match CoinGecko rate limits
    countdownSeconds = 240; // Fixed 4-minute interval
    
    // At zero, fetch price AND trigger a synchronized calculation
    console.log(`[FinalPriceSystem] 4-minute interval reached - fetching fresh price and triggering calculation`);
    
    fetchLatestPrice('BTC/USDT', true) // Pass true to indicate this is timer-triggered
      .then(price => {
        console.log(`[FinalPriceSystem] Price updated to ${price} - calculation will follow automatically`);
      })
      .catch(error => {
        console.error('[FinalPriceSystem] Error fetching price:', error);
      });
  }
  
  // Periodically report time remaining for debugging
  if (countdownSeconds % CHECK_INTERVAL === 0) {
    console.log(`[FinalPriceSystem] Next fetch in ${countdownSeconds}s`);
  }
}

/**
 * Trigger price fetch for all supported symbols with batch processing
 */
function triggerPriceFetch() {
  // Get supported symbols from multi-symbol engine
  const supportedSymbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'SOL/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'MATIC/USDT', 'UNI/USDT'];
  
  // Process symbols in batches to avoid overwhelming the API
  const batchSize = 3;
  const batches = [];
  
  for (let i = 0; i < supportedSymbols.length; i += batchSize) {
    batches.push(supportedSymbols.slice(i, i + batchSize));
  }
  
  // Process each batch with delays
  batches.forEach((batch, index) => {
    setTimeout(() => {
      batch.forEach((symbol, symbolIndex) => {
        setTimeout(() => {
          fetchLatestPrice(symbol, true).catch(error => {
            console.error(`[FinalPriceSystem] Error fetching price for ${symbol}:`, error);
          });
        }, symbolIndex * 200); // 200ms delay between symbols in batch
      });
    }, index * 1000); // 1 second delay between batches
  });
}

/**
 * Fetch the latest price for a specific symbol
 * @param symbol Asset symbol to fetch
 * @param isTimerTriggered Whether this fetch was triggered by the 3-minute timer
 * @returns The fetched price
 */
export async function fetchLatestPrice(symbol: string, isTimerTriggered: boolean = false): Promise<number> {
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
    
    // Broadcast the price update MORE WIDELY to ensure all listeners catch it
    // The AdvancedSignalDashboard will listen for these and handle throttled calculations
    const updateEvent = new CustomEvent('price-update', {
      detail: { symbol, price, timestamp }
    });
    window.dispatchEvent(updateEvent);
    document.dispatchEvent(updateEvent);
    
    // Also dispatch with the crypto-specific event name for wider compatibility
    const cryptoUpdateEvent = new CustomEvent('crypto-price-update', {
      detail: { symbol, price, timestamp }
    });
    window.dispatchEvent(cryptoUpdateEvent);
    
    // CRITICAL FIX: Only trigger calculation events when explicitly called by 3-minute timer
    if (isTimerTriggered) {
      console.log(`💯 DISPATCHING SYNCHRONIZED CALCULATION EVENT at 3-minute mark`);
      const synchronizedCalculationEvent = new CustomEvent('synchronized-calculation-trigger', {
        detail: { 
          symbol, 
          price, 
          timestamp, 
          isThreeMinuteMark: true,
          timerTriggered: true
        }
      });
      document.dispatchEvent(synchronizedCalculationEvent);
      
      // Also dispatch the legacy event for backward compatibility
      const liveUpdateEvent = new CustomEvent('live-price-update', {
        detail: { symbol, price, timestamp, forceCalculate: true, isThreeMinuteMark: true }
      });
      document.dispatchEvent(liveUpdateEvent);
    } else {
      console.log(`[FinalPriceSystem] Price fetch completed - no calculation trigger (not timer-triggered)`);
    }
    
    console.log(`[FinalPriceSystem] Price update broadcast for ${symbol}: ${price}`);
    
    console.log(`[FinalPriceSystem] Price fetch completed for ${symbol}: ${price}`);
    
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
 * Get the number of seconds until the next refresh
 * @returns Seconds until next refresh
 */
export function getSecondsUntilNextRefresh(): number {
  return countdownSeconds;
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
 * Subscribe to price updates for a symbol
 * @param symbol Asset symbol to track
 * @param callback Function to call when price updates
 */
export function subscribeToPriceUpdates(symbol: string, callback: (price: number) => void) {
  const handlePriceUpdate = (event: CustomEvent) => {
    if (event.detail.symbol === symbol) {
      callback(event.detail.price);
    }
  };
  
  // Remove any existing handler to avoid duplicates
  window.removeEventListener('price-update', handlePriceUpdate as EventListener);
  
  // Add the new handler
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  
  console.log(`[FinalPriceSystem] Subscribed to price updates for ${symbol}`);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('price-update', handlePriceUpdate as EventListener);
    console.log(`[FinalPriceSystem] Unsubscribed from price updates for ${symbol}`);
  };
}

/**
 * Start tracking price for a symbol
 * @param symbol Asset symbol to track
 */
export function startTracking(symbol: string) {
  // Initialize the price system if it's not already running
  if (!timerInterval) {
    initPriceSystem();
  }
  
  // Do an immediate fetch for the specified symbol
  fetchLatestPrice(symbol).catch(error => {
    console.error(`[FinalPriceSystem] Error in initial fetch for ${symbol}:`, error);
  });
  
  console.log(`[FinalPriceSystem] Started tracking ${symbol}`);
}

/**
 * Stop tracking price for a symbol
 * @param symbol Asset symbol to stop tracking
 */
export function stopTracking(symbol: string) {
  console.log(`[FinalPriceSystem] Stopped tracking ${symbol}`);
  // Symbol-specific cleanup could go here if needed
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