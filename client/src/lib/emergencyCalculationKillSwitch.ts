/**
 * EMERGENCY KILL SWITCH - Stops excessive calculations immediately
 * This file disables all automatic calculation triggers except manual ones
 */

// Global flag to block all automatic calculations
let calculationsBlocked = true;
let lastAllowedCalculation = 0;
const MIN_CALCULATION_INTERVAL = 240000; // 4 minutes

/**
 * Check if calculation is allowed
 */
export function isCalculationAllowed(trigger: string): boolean {
  const now = Date.now();
  const timeSinceLastCalc = now - lastAllowedCalculation;
  
  // Always allow manual calculations
  if (trigger === 'manual') {
    lastAllowedCalculation = now;
    console.log('✅ Manual calculation allowed');
    return true;
  }
  
  // Block all automatic calculations if less than 4 minutes
  if (timeSinceLastCalc < MIN_CALCULATION_INTERVAL) {
    const remaining = Math.round((MIN_CALCULATION_INTERVAL - timeSinceLastCalc) / 1000);
    console.log(`🛑 Calculation blocked: ${remaining}s until next 4-minute interval`);
    return false;
  }
  
  // Allow 4-minute synchronized calculations with multiple valid triggers
  if (trigger === '4-minute-sync' || trigger === 'automated-system' || trigger === 'timer-trigger' || trigger === 'scheduled' || trigger === 'unknown' || trigger === 'initial' || trigger === 'data-loaded') {
    lastAllowedCalculation = now;
    console.log(`✅ 4-minute calculation allowed (trigger: ${trigger})`);
    return true;
  }
  
  console.log(`🛑 Calculation blocked: ${trigger} not allowed (only manual and 4-minute intervals permitted)`);
  return false;
}

/**
 * Force allow manual calculation
 */
export function allowManualCalculation(): void {
  lastAllowedCalculation = Date.now();
  console.log('🔓 Manual calculation override activated');
}

/**
 * Reset calculation timer (for testing)
 */
export function resetCalculationTimer(): void {
  lastAllowedCalculation = 0;
  console.log('🔄 Calculation timer reset');
}

/**
 * Get time until next allowed calculation
 */
export function getTimeUntilNextCalculation(): number {
  const now = Date.now();
  const timeSinceLastCalc = now - lastAllowedCalculation;
  const remaining = MIN_CALCULATION_INTERVAL - timeSinceLastCalc;
  return Math.max(0, remaining);
}