/**
 * ONE-TIME CALCULATION SYSTEM
 * 
 * This module provides a simple mechanism to trigger exactly one calculation
 * after each price update (every 3 minutes).
 */

// Track when we last calculated
let lastCalculationTime = 0;

// Flag to prevent concurrent calculations
let isCalculating = false;

// Track whether we already calculated after the last price update
let calculatedSinceLastUpdate = false;

// Global reference to the latest price
let currentPrice = 0;

/**
 * Initialize the one-time calculation system
 */
export function initOneTimeCalculation() {
  console.log('[ONE-TIME-CALC] Initializing one-time calculation system');
  resetState();
  
  // Set up listener for price updates from finalPriceSystem
  window.addEventListener('final-price-update', (event: Event) => {
    const e = event as CustomEvent;
    if (e?.detail?.price > 0) {
      // Store the price
      currentPrice = e.detail.price;
      
      // Reset calculation flag - we need to calculate again
      calculatedSinceLastUpdate = false;
      
      console.log(`[ONE-TIME-CALC] Price update received: ${currentPrice}`);
      
      // Schedule a calculation after a 1-second delay
      // This ensures we have the latest price
      setTimeout(() => {
        // Only calculate if we haven't calculated since the last update
        if (!calculatedSinceLastUpdate && !isCalculating) {
          console.log('[ONE-TIME-CALC] Scheduling single calculation');
          triggerCalculation();
        }
      }, 1000);
    }
  });
  
  // Listen for 3-minute refresh cycle
  window.addEventListener('final-price-refresh', () => {
    console.log('[ONE-TIME-CALC] 3-minute refresh cycle detected');
    // Reset calculation flag
    calculatedSinceLastUpdate = false;
    
    // Trigger a calculation after a 1-second delay
    // This ensures we have the latest price
    setTimeout(() => {
      if (!calculatedSinceLastUpdate && !isCalculating) {
        console.log('[ONE-TIME-CALC] Triggering single calculation after 3-minute cycle');
        triggerCalculation();
      }
    }, 1000);
  });
}

/**
 * Reset the calculation state
 */
function resetState() {
  lastCalculationTime = 0;
  isCalculating = false;
  calculatedSinceLastUpdate = false;
  currentPrice = 0;
}

/**
 * Trigger a calculation
 */
function triggerCalculation() {
  if (isCalculating) {
    console.log('[ONE-TIME-CALC] Already calculating, skipping');
    return;
  }
  
  if (calculatedSinceLastUpdate) {
    console.log('[ONE-TIME-CALC] Already calculated since last update, skipping');
    return;
  }
  
  console.log('[ONE-TIME-CALC] Triggering single calculation');
  
  // Mark that we're calculating and have calculated since the last update
  isCalculating = true;
  calculatedSinceLastUpdate = true;
  
  // Fire the calculation event
  const event = new CustomEvent('one-time-calculation', {
    detail: {
      price: currentPrice,
      timestamp: Date.now()
    }
  });
  window.dispatchEvent(event);
}

/**
 * Subscribe to one-time calculation events
 */
export function subscribeToOneTimeCalculation(callback: (price: number) => void): () => void {
  const handler = (event: Event) => {
    const e = event as CustomEvent;
    callback(e.detail.price);
  };
  
  window.addEventListener('one-time-calculation', handler);
  return () => {
    window.removeEventListener('one-time-calculation', handler);
  };
}

/**
 * Mark that a calculation has started
 */
export function markCalculationStarted() {
  isCalculating = true;
  lastCalculationTime = Date.now();
  console.log('[ONE-TIME-CALC] Calculation started');
}

/**
 * Mark that a calculation has completed
 */
export function markCalculationCompleted() {
  isCalculating = false;
  console.log('[ONE-TIME-CALC] Calculation completed');
}