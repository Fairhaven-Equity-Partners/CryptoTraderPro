/**
 * Manual-Only Calculation System
 * 
 * A completely simplified calculation system with only two triggers:
 * 1. Manual calculation via the "Calculate Now" button
 * 2. First-time loading of the application
 * 
 * NO auto-calculations from price updates or any other automatic trigger
 */

import { TimeFrame } from './advancedSignals';

// Simple tracking variables - minimal state
let isCalculationInProgress = false;
let lastCalculationTime: Record<string, number> = {};

// Custom event names
const CALCULATION_STARTED_EVENT = 'calculation-started';
const CALCULATION_COMPLETED_EVENT = 'calculation-completed';

/**
 * Trigger a manual calculation for a specific asset
 * 
 * @param symbol The crypto symbol to calculate signals for
 * @param timeframe The specific timeframe to focus on
 * @param price The current price to use for calculation
 * @returns True if calculation was triggered, false if already in progress
 */
export function triggerManualCalculation(
  symbol: string, 
  timeframe: TimeFrame, 
  price: number
): boolean {
  // Don't allow multiple calculations at once
  if (isCalculationInProgress) {
    console.log(`[MANUAL-CALC] Calculation already in progress for ${symbol}, please wait`);
    return false;
  }
  
  console.log(`[MANUAL-CALC] Manual calculation triggered for ${symbol} (${timeframe}) at price ${price}`);
  
  // Start the calculation process
  isCalculationInProgress = true;
  
  // Dispatch calculation started event
  const startEvent = new CustomEvent(CALCULATION_STARTED_EVENT, {
    detail: { symbol, timeframe, price, timestamp: Date.now() }
  });
  window.dispatchEvent(startEvent);
  
  // Perform the calculation asynchronously
  setTimeout(() => {
    // The calculation itself happens elsewhere through event listeners
    // This just makes sure we eventually mark it as complete
    completeCalculation(symbol);
  }, 10000); // 10 second safeguard timeout
  
  return true;
}

/**
 * Mark a calculation as complete
 * 
 * @param symbol The crypto symbol that was calculated
 */
function completeCalculation(symbol: string) {
  if (!isCalculationInProgress) {
    return; // Already completed
  }
  
  // Update last calculation time
  lastCalculationTime[symbol] = Date.now();
  
  // Reset calculation status
  isCalculationInProgress = false;
  
  // Dispatch calculation completed event
  const completeEvent = new CustomEvent(CALCULATION_COMPLETED_EVENT, {
    detail: { symbol, timestamp: Date.now() }
  });
  window.dispatchEvent(completeEvent);
  
  console.log(`[MANUAL-CALC] Calculation complete for ${symbol}`);
}

/**
 * Check if a calculation is currently in progress
 * 
 * @returns True if calculation is in progress, false otherwise
 */
export function isCalculating(): boolean {
  return isCalculationInProgress;
}

/**
 * Get the time of the last calculation for a specific symbol
 * 
 * @param symbol The crypto symbol to check
 * @returns Timestamp of last calculation, or 0 if never calculated
 */
export function getLastCalculationTime(symbol: string): number {
  return lastCalculationTime[symbol] || 0;
}

/**
 * Manually mark a calculation as complete
 * This is used by external components when they finish their calculations
 * 
 * @param symbol The crypto symbol that was calculated 
 */
export function notifyCalculationComplete(symbol: string) {
  completeCalculation(symbol);
}