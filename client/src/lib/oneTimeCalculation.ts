/**
 * One-Time Calculation System
 * 
 * Ensures calculations happen exactly once after each price update
 * Prevents redundant calculations and provides visual feedback
 * during the calculation process
 */

import { PriceEvent } from '../types';

// Tracking variables
let isCalculationInProgress = false;
let lastCalculatedTimestamp: Record<string, number> = {};
let pendingCalculations: Record<string, PriceEvent> = {};
let calculationTimeouts: Record<string, NodeJS.Timeout> = {};

// Custom event names
const CALCULATION_STARTED_EVENT = 'calculation-started';
const CALCULATION_COMPLETED_EVENT = 'calculation-completed';

/**
 * Initialize the one-time calculation system
 */
export function initOneTimeCalculationSystem() {
  console.log('[ONE-TIME-CALC] Initializing one-time calculation system');
  
  // Clear any existing handlers to prevent duplicates during hot reload
  window.removeEventListener('price-update', handlePriceUpdate as EventListener);
  
  // Add price update event listener
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  
  console.log('[ONE-TIME-CALC] Event handlers registered');
}

/**
 * Handle a price update by scheduling a single calculation
 * @param event Custom event with symbol and price data
 */
function handlePriceUpdate(event: CustomEvent) {
  const { symbol, price } = event.detail;
  
  if (!symbol || !price) {
    console.warn('[ONE-TIME-CALC] Invalid price update received', event.detail);
    return;
  }
  
  console.log(`[ONE-TIME-CALC] Price update received: ${price}`);
  
  // If we're already calculating, just store this update for later
  if (isCalculationInProgress) {
    console.log('[ONE-TIME-CALC] Calculation in progress, queueing update');
    pendingCalculations[symbol] = { 
      price, 
      timestamp: Date.now() 
    };
    return;
  }
  
  // If we recently calculated with this exact price, skip
  if (lastCalculatedTimestamp[symbol] && 
      Math.abs(Date.now() - lastCalculatedTimestamp[symbol]) < 2000) {
    console.log('[ONE-TIME-CALC] Skipping duplicate calculation (recent)');
    return;
  }
  
  // Clear any existing timeout to prevent race conditions
  if (calculationTimeouts[symbol]) {
    clearTimeout(calculationTimeouts[symbol]);
  }
  
  // Schedule the calculation with a slight delay to allow UI updates
  calculationTimeouts[symbol] = setTimeout(() => {
    triggerCalculation(symbol, price);
  }, 800);
  
  console.log('[ONE-TIME-CALC] Scheduling single calculation');
}

/**
 * Trigger the actual calculation and dispatch appropriate events
 * @param symbol Asset symbol
 * @param price Current price
 */
function triggerCalculation(symbol: string, price: number) {
  if (isCalculationInProgress) {
    console.log('[ONE-TIME-CALC] Already calculating, will process later');
    pendingCalculations[symbol] = { price, timestamp: Date.now() };
    return;
  }
  
  // Mark calculation as started
  isCalculationInProgress = true;
  
  // Dispatch a calculation-started event for UI feedback
  const startEvent = new CustomEvent(CALCULATION_STARTED_EVENT, {
    detail: { symbol, price }
  });
  window.dispatchEvent(startEvent);
  
  console.log('==================================================');
  console.log(`🔄 CALCULATION HAPPENING NOW - PRICE: ${price}`);
  
  // Store when we last calculated for this symbol
  lastCalculatedTimestamp[symbol] = Date.now();
  
  // Trigger the actual calculation
  const calculateEvent = new CustomEvent('calculate-signals', {
    detail: { symbol, price }
  });
  window.dispatchEvent(calculateEvent);
  
  // After a reasonable delay to allow calculation to complete,
  // mark the calculation as complete and check for any pending updates
  setTimeout(() => {
    finishCalculation(symbol);
  }, 2000);
}

/**
 * Mark the current calculation as complete and process any pending updates
 * @param symbol Asset symbol that was calculated
 */
function finishCalculation(symbol: string) {
  // Mark calculation as completed
  isCalculationInProgress = false;
  
  // Dispatch a calculation-completed event for UI feedback
  const completeEvent = new CustomEvent(CALCULATION_COMPLETED_EVENT, {
    detail: { symbol, timestamp: Date.now() }
  });
  window.dispatchEvent(completeEvent);
  
  console.log('[ONE-TIME-CALC] Calculation completed');
  
  // Check if we have any pending calculations
  if (Object.keys(pendingCalculations).length > 0) {
    // Take the oldest pending calculation
    const nextSymbol = Object.keys(pendingCalculations)[0];
    const nextCalculation = pendingCalculations[nextSymbol];
    
    // Remove it from pending list
    delete pendingCalculations[nextSymbol];
    
    // Schedule it
    setTimeout(() => {
      triggerCalculation(nextSymbol, nextCalculation.price);
    }, 500);
  }
}

/**
 * Manually trigger a calculation for a specific symbol and price
 * This can be called from a UI button or other user action
 * @param symbol Asset symbol
 * @param price Current price
 */
export function triggerManualCalculation(symbol: string, price: number) {
  console.log(`[ONE-TIME-CALC] Manual calculation requested for ${symbol} at $${price}`);
  triggerCalculation(symbol, price);
}

// Export event names for components to listen for
export const CalculationEvents = {
  STARTED: CALCULATION_STARTED_EVENT,
  COMPLETED: CALCULATION_COMPLETED_EVENT
};

/**
 * Force a calculation update immediately with the current price
 * @param symbol Asset symbol to update
 * @param price Current price
 */
export function forceCalculation(symbol: string, price: number) {
  triggerManualCalculation(symbol, price);
}

/**
 * Subscribes to one-time calculation events
 * @param symbol Asset symbol to monitor
 * @param priceCallback Function to call with price during calculation
 * @param completeCallback Function to call when calculation completes
 */
export function subscribeToOneTimeCalculation(
  symbol: string, 
  priceCallback: (price: number) => void,
  completeCallback?: () => void
) {
  const handleCalculationStart = (event: CustomEvent) => {
    if (event.detail.symbol === symbol) {
      priceCallback(event.detail.price);
    }
  };
  
  const handleCalculationComplete = (event: CustomEvent) => {
    if (event.detail.symbol === symbol && completeCallback) {
      completeCallback();
    }
  };
  
  // Add event listeners
  window.addEventListener(CALCULATION_STARTED_EVENT, handleCalculationStart as EventListener);
  window.addEventListener(CALCULATION_COMPLETED_EVENT, handleCalculationComplete as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(CALCULATION_STARTED_EVENT, handleCalculationStart as EventListener);
    window.removeEventListener(CALCULATION_COMPLETED_EVENT, handleCalculationComplete as EventListener);
  };
}

/**
 * Mark calculation as started for UI feedback
 * @param symbol Asset symbol
 */
export function markCalculationStarted(symbol: string) {
  const startEvent = new CustomEvent(CALCULATION_STARTED_EVENT, {
    detail: { symbol, price: 0 }
  });
  window.dispatchEvent(startEvent);
}

/**
 * Mark calculation as completed for UI feedback
 * @param symbol Asset symbol
 */
export function markCalculationCompleted(symbol: string) {
  const completeEvent = new CustomEvent(CALCULATION_COMPLETED_EVENT, {
    detail: { symbol, timestamp: Date.now() }
  });
  window.dispatchEvent(completeEvent);
}

// Alias for backward compatibility
export const initOneTimeCalculation = initOneTimeCalculationSystem;