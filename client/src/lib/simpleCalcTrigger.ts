/**
 * SIMPLE CALCULATION TRIGGER
 * 
 * This module provides a very simple mechanism to trigger ONE calculation
 * after each price update, with no additional calculations until the next price update.
 */

// Global lock to prevent concurrent calculations
let calculationInProgress = false;

// Last price update time
let lastPriceUpdateTime = Date.now();

// Last calculation time
let lastCalculationTime = 0;

// Flag to track if we've calculated since last price update
let calculatedSinceLastUpdate = false;

/**
 * Setup the price update listener
 */
export function setupCalculationTrigger() {
  // Reset state
  calculationInProgress = false;
  calculatedSinceLastUpdate = false;
  
  // The event listeners have been moved to the dashboard component to prevent duplicate triggers
  // This function is kept for compatibility}

/**
 * Broadcast a calculation trigger event
 */
function broadcastCalculationTrigger(price: number) {
  // Don't trigger if we're already calculating
  if (calculationInProgress) {return;
  }
  
  // Don't trigger if we've already calculated since the last price update
  if (calculatedSinceLastUpdate) {return;
  }// Mark that calculation is in progress
  calculationInProgress = true;
  
  // Create and dispatch the event
  const event = new CustomEvent('simple-calc-trigger', {
    detail: { 
      timestamp: Date.now(),
      price: price,
      allowCalculation: true
    }
  });
  window.dispatchEvent(event);
}

/**
 * Mark that a calculation has started
 */
export function markCalculationStarted() {
  calculationInProgress = true;
  calculatedSinceLastUpdate = true;}

/**
 * Mark that a calculation has completed
 */
export function markCalculationCompleted() {
  calculationInProgress = false;
  lastCalculationTime = Date.now();}

/**
 * Reset calculation flags when a new price update is received
 * This allows the next calculation to proceed
 */
export function resetCalculationFlags() {
  calculatedSinceLastUpdate = false;
  calculationInProgress = false;
  lastPriceUpdateTime = Date.now();}

/**
 * Subscribe to calculation trigger events
 */
export function subscribeToCalculationTrigger(callback: (price: number) => void): () => void {
  const handler = (event: Event) => {
    const calcEvent = event as CustomEvent;
    if (calcEvent.detail && calcEvent.detail.allowCalculation) {
      callback(calcEvent.detail.price);
    }
  };
  
  window.addEventListener('simple-calc-trigger', handler);
  return () => window.removeEventListener('simple-calc-trigger', handler);
}