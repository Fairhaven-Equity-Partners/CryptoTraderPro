/**
 * KILL SWITCH FOR AUTO-CALCULATIONS
 * 
 * This module provides a nuclear option to completely disable all automatic calculations
 * by wrapping the actual calculation function with a "guard" that prevents execution
 * unless specifically triggered by the Calculate Now button.
 */

// Global lock to track whether calculations should be allowed
let manualCalculationMode = true;
let lastManualTriggerTime = 0;
let manualTriggerInProgress = false;

// Cache of original calculation functions that we'll wrap
const originalFunctions: Record<string, Function> = {};

/**
 * Set up the kill switch for auto-calculations
 * This must be called as early as possible
 */
export function setupKillSwitch() {
  console.log('🔒 Setting up kill switch for auto-calculations 🔒');
  
  // Only in window context (browser)
  if (typeof window !== 'undefined') {
    // Create a global flag to indicate calculations are locked
    (window as any).__CALCULATIONS_LOCKED__ = true;
    
    // Store our manual calculation flag globally
    (window as any).__MANUAL_CALCULATION_MODE__ = true;
    
    // Create a method to allow manual triggering
    (window as any).__TRIGGER_MANUAL_CALCULATION__ = triggerManualCalculation;
    
    // Reset all auto-calculation flags
    lastManualTriggerTime = Date.now();
    manualTriggerInProgress = false;
  }
  
  console.log('✅ Kill switch initialized - auto-calculations disabled');
}

/**
 * Trigger a manual calculation
 * This is the ONLY way calculations should be allowed
 */
export function triggerManualCalculation() {
  console.log('🧮 Manual calculation triggered 🧮');
  
  // Set the manual trigger flag
  manualTriggerInProgress = true;
  lastManualTriggerTime = Date.now();
  
  // Create a window flag to allow calculations temporarily
  if (typeof window !== 'undefined') {
    (window as any).__CALCULATIONS_LOCKED__ = false;
  }
  
  // Clear the flag after a short delay to prevent any follow-up auto-calculations
  setTimeout(() => {
    manualTriggerInProgress = false;
    if (typeof window !== 'undefined') {
      (window as any).__CALCULATIONS_LOCKED__ = true;
    }
    console.log('🔒 Manual calculation completed, re-locking calculations 🔒');
  }, 5000); // 5 second window to complete calculations
  
  return true;
}

/**
 * Check if a calculation is allowed to execute
 * This should be called at the start of any calculation function
 */
export function isCalculationAllowed(source = 'unknown'): boolean {
  // Get the current locked status
  const isLocked = typeof window !== 'undefined' ? 
    (window as any).__CALCULATIONS_LOCKED__ === true : 
    true;
  
  if (isLocked) {
    console.log(`🛑 [${source}] Calculation blocked - system locked for auto-calculations`);
    return false;
  }
  
  // We're in manual trigger mode, allow the calculation
  console.log(`✅ [${source}] Calculation allowed - manual mode active`);
  return true;
}

/**
 * Wrap a calculation function to enforce the manual-only policy
 * @param fn The original calculation function
 * @param name Name of the function (for logging)
 */
export function wrapCalculationFunction<T extends (...args: any[]) => any>(
  fn: T, 
  name: string
): T {
  // Store the original function
  originalFunctions[name] = fn;
  
  // Return a wrapped version that checks permissions
  const wrapped = function(...args: Parameters<T>): ReturnType<T> | null {
    if (!isCalculationAllowed(name)) {
      console.log(`🚫 [${name}] Calculation blocked - returning null/cached result`);
      return null as unknown as ReturnType<T>;
    }
    
    // Allow the calculation to proceed
    console.log(`▶️ [${name}] Running calculation`);
    return fn(...args);
  };
  
  return wrapped as T;
}