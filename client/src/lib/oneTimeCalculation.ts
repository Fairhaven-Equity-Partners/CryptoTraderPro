/**
 * One-Time Calculation System - REDESIGNED
 * 
 * COMPLETELY REDESIGNED AUTO UPDATE FEATURE:
 * - Only calculates once immediately after a new price fetch
 * - Does not calculate again until either:
 *   1. Next price fetch occurs, or
 *   2. User manually triggers with "Calculate now" button
 * - Provides visual feedback during calculation process
 */

import { PriceEvent } from '../types';

// Tracking variables
let isCalculationInProgress = false;
let lastCalculatedTimestamp: Record<string, number> = {};
let lastCalculatedPrice: Record<string, number> = {}; // Track the last price we calculated with
let pendingCalculations: Record<string, PriceEvent> = {};
let calculationTimeouts: Record<string, NodeJS.Timeout> = {};
let priceUpdateTracker: Record<string, number> = {}; // Track when we last received a price update
let calculationLockUntil: Record<string, number> = {}; // Lock to prevent excessive calculations

// Custom event names
const CALCULATION_STARTED_EVENT = 'calculation-started';
const CALCULATION_COMPLETED_EVENT = 'calculation-completed';
const PRICE_FETCH_COMPLETED = 'price-fetch-completed';

/**
 * Initialize the one-time calculation system with the new price-based calculation model
 */
export function initOneTimeCalculationSystem() {
  console.log('[ONE-TIME-CALC] Initializing redesigned one-time calculation system');
  
  // Clear any existing handlers to prevent duplicates during hot reload
  window.removeEventListener('price-update', handlePriceUpdate as EventListener);
  window.removeEventListener('price-fetching', handlePriceFetching as EventListener);
  window.removeEventListener('price-fetch-completed', handlePriceFetchCompleted as EventListener);
  
  // Add event listeners
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  window.addEventListener('price-fetching', handlePriceFetching as EventListener);
  window.addEventListener('price-fetch-completed', handlePriceFetchCompleted as EventListener);
  
  console.log('[ONE-TIME-CALC] Event handlers registered for redesigned system');
}

/**
 * Handle when a price fetch starts (used to show loading indicators)
 */
function handlePriceFetching(event: CustomEvent) {
  const { symbol } = event.detail;
  console.log('[ONE-TIME-CALC] Price fetch started for', symbol);
  
  // Mark that we're starting a new fetch cycle
  priceUpdateTracker[symbol] = Date.now();
}

/**
 * Handle when a price fetch completes - this is the key event that should trigger calculation
 * This is explicitly emitted by the price fetching system
 */
function handlePriceFetchCompleted(event: CustomEvent) {
  const { symbol, price } = event.detail;
  console.log('[ONE-TIME-CALC] Price fetch completed for', symbol, 'with price', price);
  
  // Schedule a calculation since we just got a fresh price
  scheduleCalculation(symbol, price, true);
}

/**
 * Handle a price update event
 * With the redesigned system, we only schedule a calculation if:
 * 1. This is a new price we haven't calculated with before, AND
 * 2. We've recently had a price fetch completed event for this symbol
 */
function handlePriceUpdate(event: CustomEvent) {
  const { symbol, price } = event.detail;
  
  if (!symbol || !price) {
    console.warn('[ONE-TIME-CALC] Invalid price update received', event.detail);
    return;
  }
  
  // Store this as the latest price
  pendingCalculations[symbol] = { 
    price, 
    timestamp: Date.now() 
  };
  
  // If we already calculated with this exact price, don't recalculate
  if (lastCalculatedPrice[symbol] === price) {
    console.log(`[ONE-TIME-CALC] Skipping calculation, already calculated with price ${price}`);
    return;
  }
  
  // Check if we're within the "fresh price fetch" window
  const lastPriceFetch = priceUpdateTracker[symbol] || 0;
  const timeSinceFetch = Date.now() - lastPriceFetch;
  
  // Only calculate if we're within 5 seconds of a price fetch event
  // Or this is the first time we're seeing a price
  if (timeSinceFetch < 5000 || !lastCalculatedTimestamp[symbol]) {
    console.log(`[ONE-TIME-CALC] Scheduling calculation after fresh price fetch: ${price}`);
    scheduleCalculation(symbol, price, true);
  } else {
    console.log(`[ONE-TIME-CALC] Not scheduling calculation - not following a fresh price fetch`);
  }
}

/**
 * Schedule a calculation with the new system's rules
 */
function scheduleCalculation(symbol: string, price: number, isAfterPriceFetch: boolean) {
  // If a calculation is in progress, just update the pending queue
  if (isCalculationInProgress) {
    console.log('[ONE-TIME-CALC] Calculation in progress, queueing update');
    pendingCalculations[symbol] = { 
      price, 
      timestamp: Date.now() 
    };
    return;
  }
  
  // Clear any existing timeout to prevent race conditions
  if (calculationTimeouts[symbol]) {
    clearTimeout(calculationTimeouts[symbol]);
  }
  
  // Check if we're in a calculation lockout period for this symbol
  const now = Date.now();
  const lockoutUntil = calculationLockUntil[symbol] || 0;
  
  if (now < lockoutUntil) {
    console.log(`[ONE-TIME-CALC] Calculation for ${symbol} is locked until ${new Date(lockoutUntil).toLocaleTimeString()}`);
    return;
  }
  
  // Schedule the calculation with a slight delay to allow UI updates
  calculationTimeouts[symbol] = setTimeout(() => {
    triggerCalculation(symbol, price);
    
    // Set a lockout period of 20 seconds to prevent frequent recalculations
    calculationLockUntil[symbol] = Date.now() + 20000;
  }, 800);
  
  console.log('[ONE-TIME-CALC] Scheduling single calculation after price fetch');
}

/**
 * Trigger the actual calculation and dispatch appropriate events
 * With the redesigned system, we also track the price we calculated with
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
  
  // Store when we last calculated for this symbol and the price we used
  lastCalculatedTimestamp[symbol] = Date.now();
  lastCalculatedPrice[symbol] = price;
  
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
 * With the redesigned system, we only process pending calculations if they 
 * were explicitly triggered by a price fetch completed event or manual calculation
 * @param symbol Asset symbol that was calculated
 */
function finishCalculation(symbol: string) {
  // Mark calculation as completed
  isCalculationInProgress = false;
  
  // Dispatch a calculation-completed event for UI feedback
  const completeEvent = new CustomEvent(CALCULATION_COMPLETED_EVENT, {
    detail: { 
      symbol, 
      timestamp: Date.now(),
      price: lastCalculatedPrice[symbol]
    }
  });
  window.dispatchEvent(completeEvent);
  
  console.log('[ONE-TIME-CALC] Calculation completed');
  
  // For now, don't automatically process pending calculations
  // Only calculate again when the next price fetch occurs
  // or when the user manually requests a calculation
}

/**
 * Manually trigger a calculation for a specific symbol and price
 * This is explicitly called when the user clicks the "Calculate now" button
 * @param symbol Asset symbol
 * @param price Current price
 */
export function triggerManualCalculation(symbol: string, price: number) {
  console.log(`[ONE-TIME-CALC] Manual calculation requested for ${symbol} at $${price}`);
  
  // Clear any existing calculation info to force a new one
  delete lastCalculatedPrice[symbol];
  
  // Dispatch a special event so the system knows this was manually requested
  const manualEvent = new CustomEvent('manual-calculation-requested', {
    detail: { symbol, price }
  });
  window.dispatchEvent(manualEvent);
  
  // Bypass all the normal checks and force a calculation
  triggerCalculation(symbol, price);
}

// Export event names for components to listen for
export const CalculationEvents = {
  STARTED: CALCULATION_STARTED_EVENT,
  COMPLETED: CALCULATION_COMPLETED_EVENT,
  PRICE_FETCH_COMPLETED: PRICE_FETCH_COMPLETED
};

/**
 * Force a calculation update immediately with the current price
 * @param symbol Asset symbol to update
 * @param price Current price
 */
export function forceCalculation(symbol: string, price: number) {
  // This is the same as a manual trigger by the user
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