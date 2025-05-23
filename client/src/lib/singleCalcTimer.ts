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
export function initSingleCalcTimer(): void {
  console.log('[SINGLE-CALC-TIMER] Initializing calculation timer system');
  
  // Set initial state
  resetCalcTimer();
  
  // Set up a periodic timer to allow calculations every 3 minutes
  setInterval(() => {
    if (!globalState.calculationAllowed) {
      console.log('[SINGLE-CALC-TIMER] 3-minute mark reached - allowing ONE calculation');
      globalState.calculationAllowed = true;
      
      // Broadcast that calculation is allowed
      broadcastCalcAllowed();
    }
  }, CALCULATION_INTERVAL);
}

/**
 * Reset the calculation timer
 */
export function resetCalcTimer(): void {
  globalState.lastCalculationTime = Date.now();
  globalState.calculationAllowed = false;
  console.log('[SINGLE-CALC-TIMER] Timer reset, next calculation in 3 minutes');
}

/**
 * Check if calculation is allowed
 */
export function isCalcAllowed(): boolean {
  // Don't allow calculation if we're already calculating
  if (globalState.isCalculating) {
    console.log('[SINGLE-CALC-TIMER] Calculation in progress, not allowing another');
    return false;
  }
  
  return globalState.calculationAllowed;
}

/**
 * Mark that a calculation is starting
 */
export function startCalculation(): void {
  if (globalState.calculationAllowed) {
    globalState.isCalculating = true;
    console.log('[SINGLE-CALC-TIMER] Starting calculation - locking calculation state');
  }
}

/**
 * Mark that a calculation has completed
 */
export function completeCalculation(): void {
  globalState.isCalculating = false;
  globalState.calculationAllowed = false; // Don't allow another calculation until the next 3-minute mark
  globalState.lastCalculationTime = Date.now();
  console.log('[SINGLE-CALC-TIMER] Calculation complete - locked until next 3-minute cycle');
}

/**
 * Broadcast that calculation is allowed - DISABLED
 */
function broadcastCalcAllowed(): void {
  // Disabled to prevent triggering extra calculations
  console.log('[SINGLE-CALC-TIMER] Auto broadcasting disabled - using direct API only');
  
  /* DISABLED TO PREVENT MULTIPLE CALCULATIONS
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