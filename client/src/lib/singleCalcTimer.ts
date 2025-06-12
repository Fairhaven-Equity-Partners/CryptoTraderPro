/**
 * FINAL SINGLE CALCULATION TIMER
 * 
 * This module provides a very strict, global calculation timer
 * that enforces a single calculation per 3-minute interval.
 */

// Global state for all calculation locks
let globalState = {
  // Last calculation time (globally)
  lastCalculationTime: Date.now(),
  
  // Flag to indicate if calculation is allowed
  calculationAllowed: false,
  
  // Track if we're in a calculation
  isCalculating: false
};

// Strict 3-minute interval (in milliseconds)
const CALCULATION_INTERVAL = 180000; // 3 minutes

/**
 * Initialize the timer system
 * - Sets up a timer to allow calculations every 3 minutes
 */
export function initSingleCalcTimer(): void {// Set initial state
  resetCalcTimer();
  
  // DISABLED: This was triggering additional calculations beyond our 2-minute throttle
  // The AdvancedSignalDashboard now has its own throttling mechanism
  
  /*
  setInterval(() => {
    if (!globalState.calculationAllowed) {globalState.calculationAllowed = true;
      
      // Broadcast that calculation is allowed
      broadcastCalcAllowed();
    }
  }, CALCULATION_INTERVAL);
  */}

/**
 * Reset the calculation timer
 */
export function resetCalcTimer(): void {
  globalState.lastCalculationTime = Date.now();
  globalState.calculationAllowed = false;}

/**
 * Check if calculation is allowed
 */
export function isCalcAllowed(): boolean {
  // Don't allow calculation if we're already calculating
  if (globalState.isCalculating) {return false;
  }
  
  return globalState.calculationAllowed;
}

/**
 * Mark that a calculation is starting
 */
export function startCalculation(): void {
  if (globalState.calculationAllowed) {
    globalState.isCalculating = true;}
}

/**
 * Mark that a calculation has completed
 */
export function completeCalculation(): void {
  globalState.isCalculating = false;
  globalState.calculationAllowed = false; // Don't allow another calculation until the next 3-minute mark
  globalState.lastCalculationTime = Date.now();}

/**
 * Broadcast that calculation is allowed - DISABLED
 */
function broadcastCalcAllowed(): void {
  // Disabled to prevent triggering extra calculations/* DISABLED TO PREVENT MULTIPLE CALCULATIONS
  const event = new CustomEvent('calculation-allowed', {
    detail: { 
      timestamp: Date.now(),
      singleCalcOnly: true
    }
  });
  window.dispatchEvent(event);
  */
}

/**
 * Subscribe to calculation allowed events
 */
export function subscribeToCalcAllowed(callback: (event: CustomEvent) => void): () => void {
  const handler = (event: Event) => callback(event as CustomEvent);
  window.addEventListener('calculation-allowed', handler);
  return () => window.removeEventListener('calculation-allowed', handler);
}