/**
 * ONE-TIME CALCULATION SYSTEM
 * 
 * This module provides a simple mechanism to trigger exactly one calculation
 * after each price update (every 3 minutes).
 */

// State management in a single object for better encapsulation
const state = {
  lastCalculationTime: 0,
  isCalculating: false,
  calculatedSinceLastUpdate: false,
  currentPrice: 0,
  calculationQueue: new Set<number>(), // Queue of prices waiting to be calculated
  calculationTimer: null as NodeJS.Timeout | null
};

// Constants
const CALCULATION_DELAY = 1000; // 1 second delay before calculation

/**
 * Initialize the one-time calculation system
 */
export function initOneTimeCalculation() {
  console.log('[ONE-TIME-CALC] Initializing one-time calculation system');
  resetState();
  
  // Single event handler for price updates
  window.addEventListener('final-price-update', handlePriceUpdate);
  
  // Single event handler for 3-minute refresh cycle
  window.addEventListener('final-price-refresh', handleRefreshCycle);
}

/**
 * Handle price updates from the finalPriceSystem
 */
function handlePriceUpdate(event: Event) {
  const e = event as CustomEvent;
  if (e?.detail?.price > 0) {
    // Store the price
    state.currentPrice = e.detail.price;
    state.calculatedSinceLastUpdate = false;
    
    console.log(`[ONE-TIME-CALC] Price update received: ${state.currentPrice}`);
    
    // Add to calculation queue
    scheduleCalculation();
  }
}

/**
 * Handle the 3-minute refresh cycle
 */
function handleRefreshCycle() {
  console.log('[ONE-TIME-CALC] 3-minute refresh cycle detected');
  state.calculatedSinceLastUpdate = false;
  
  // Schedule a calculation if not already scheduled
  scheduleCalculation();
}

/**
 * Schedule a calculation with a short delay
 */
function scheduleCalculation() {
  // Clear any existing timer
  if (state.calculationTimer) {
    clearTimeout(state.calculationTimer);
  }
  
  // Set a new timer
  state.calculationTimer = setTimeout(() => {
    if (!state.calculatedSinceLastUpdate && !state.isCalculating) {
      console.log('[ONE-TIME-CALC] Scheduling single calculation');
      triggerCalculation();
    }
  }, CALCULATION_DELAY);
}

/**
 * Reset the calculation state
 */
function resetState() {
  state.lastCalculationTime = 0;
  state.isCalculating = false;
  state.calculatedSinceLastUpdate = false;
  state.currentPrice = 0;
  state.calculationQueue.clear();
  
  if (state.calculationTimer) {
    clearTimeout(state.calculationTimer);
    state.calculationTimer = null;
  }
}

/**
 * Trigger a calculation
 * @param overridePrice Optional price to use instead of the current price
 */
export function triggerCalculation(overridePrice?: number) {
  // Skip if already calculating or if we've already calculated since the last update
  if (state.isCalculating) {
    console.log('[ONE-TIME-CALC] Already calculating, skipping');
    return;
  }
  
  if (state.calculatedSinceLastUpdate) {
    console.log('[ONE-TIME-CALC] Already calculated since last update, skipping');
    return;
  }
  
  console.log('[ONE-TIME-CALC] Triggering single calculation');
  
  // Mark that we're calculating and have calculated since the last update
  state.isCalculating = true;
  state.calculatedSinceLastUpdate = true;
  state.lastCalculationTime = Date.now();
  
  // Show a clear message that calculation is happening
  console.log('==================================================');
  console.log(`🔄 CALCULATION HAPPENING NOW - PRICE: ${state.currentPrice}`);
  
  // Use override price if provided
  const priceToUse = overridePrice !== undefined ? overridePrice : state.currentPrice;
  
  // Fire the calculation event
  window.dispatchEvent(new CustomEvent('one-time-calculation', {
    detail: {
      price: priceToUse,
      timestamp: Date.now()
    }
  }));
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
  return () => window.removeEventListener('one-time-calculation', handler);
}

/**
 * Mark that a calculation has started
 */
export function markCalculationStarted() {
  state.isCalculating = true;
  state.lastCalculationTime = Date.now();
  console.log('[ONE-TIME-CALC] Calculation started');
}

/**
 * Mark that a calculation has completed
 */
export function markCalculationCompleted() {
  state.isCalculating = false;
  console.log('[ONE-TIME-CALC] Calculation completed');
}

/**
 * Force a calculation even if one is already in progress
 * This is used for the manual "Calculate Now" button
 */
export function forceCalculation(price: number) {
  // Reset calculating flag to allow a new calculation
  state.isCalculating = false;
  state.calculatedSinceLastUpdate = false;
  
  // Update the current price
  state.currentPrice = price;
  
  // Call the trigger calculation function
  console.log(`[ONE-TIME-CALC] Force calculation with price: ${price}`);
  triggerCalculation(price);
}