/**
 * ULTRA SIMPLE CALCULATION SYSTEM
 * 
 * This module replaces all the complex timing logic with a very simple system:
 * 1. Fetch price data every 3 minutes
 * 2. After fetch completes, run calculations ONCE
 * 3. Display countdown timer until next calculation
 */

// Global tracking
let lastCalculationTime = Date.now();
let nextCalculationTime = Date.now() + 180000; // 3 minutes
let calculationInProgress = false;

// Listeners for calculation events
const calculationListeners: Function[] = [];

// Constants
const CALC_INTERVAL = 180000; // 3 minutes in milliseconds

/**
 * Initialize the system
 */
export function initializeSimpleCalcSystem(): void {
  console.log('[SIMPLE-CALC] Initializing simple calculation system');
  
  // Set up the timer to fetch and calculate every 3 minutes
  setInterval(() => {
    triggerPriceFetchAndCalculation();
  }, CALC_INTERVAL);
}

/**
 * Trigger a price fetch followed by a single calculation
 */
export function triggerPriceFetchAndCalculation(): void {
  if (calculationInProgress) {
    console.log('[SIMPLE-CALC] Calculation already in progress, skipping');
    return;
  }
  
  // Start the process
  calculationInProgress = true;
  console.log('[SIMPLE-CALC] 3-minute mark reached - fetching prices then calculating ONCE');
  
  // We'll manually fetch the latest price and then trigger calculation
  fetchLatestPrice()
    .then(price => {
      if (price > 0) {
        // Update timing info
        lastCalculationTime = Date.now();
        nextCalculationTime = Date.now() + CALC_INTERVAL;
        
        // Trigger the calculation with the fresh price
        triggerCalculation(price);
      }
    })
    .catch(err => {
      console.error('[SIMPLE-CALC] Error fetching price:', err);
    })
    .finally(() => {
      calculationInProgress = false;
    });
}

/**
 * Fetch the latest price
 */
async function fetchLatestPrice(): Promise<number> {
  try {
    // Fetch price from server
    const response = await fetch('/api/crypto/BTC%2FUSDT');
    if (!response.ok) throw new Error('Price fetch failed');
    
    const data = await response.json();
    if (data && data.price) {
      console.log(`[SIMPLE-CALC] Successfully fetched fresh price: ${data.price}`);
      return data.price;
    }
    
    return 0;
  } catch (error) {
    console.error('[SIMPLE-CALC] Error fetching price:', error);
    return 0;
  }
}

/**
 * Trigger a single calculation with the given price
 */
function triggerCalculation(price: number): void {
  console.log(`[SIMPLE-CALC] Triggering ONE calculation with price ${price}`);
  
  // Notify all calculation listeners
  calculationListeners.forEach(listener => {
    try {
      listener(price);
    } catch (err) {
      console.error('[SIMPLE-CALC] Error in calculation listener:', err);
    }
  });
}

/**
 * Register a calculation listener
 */
export function onCalculation(callback: (price: number) => void): () => void {
  calculationListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = calculationListeners.indexOf(callback);
    if (index > -1) {
      calculationListeners.splice(index, 1);
    }
  };
}

/**
 * Get seconds until next calculation
 */
export function getSecondsUntilNextCalc(): number {
  const now = Date.now();
  const timeRemaining = Math.max(0, nextCalculationTime - now);
  return Math.floor(timeRemaining / 1000);
}

/**
 * Get formatted countdown string
 */
export function getFormattedCountdown(): string {
  const seconds = getSecondsUntilNextCalc();
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}