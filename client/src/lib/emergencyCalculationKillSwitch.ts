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
  
  // Always allow manual calculations and pair selections
  if (trigger === 'manual' || trigger === 'pair-selection' || trigger === 'heatmap-selection' || trigger === 'dropdown-selection') {
    lastAllowedCalculation = now;return true;
  }
  
  // Block all automatic calculations if less than 4 minutes
  if (timeSinceLastCalc < MIN_CALCULATION_INTERVAL) {
    const remaining = Math.round((MIN_CALCULATION_INTERVAL - timeSinceLastCalc) / 1000);return false;
  }
  
  // Allow 4-minute synchronized calculations with multiple valid triggers
  if (trigger === '4-minute-sync' || trigger === 'automated-system' || trigger === 'timer-trigger' || trigger === 'scheduled' || trigger === 'unknown' || trigger === 'initial' || trigger === 'data-loaded') {
    lastAllowedCalculation = now;`);
    return true;
  }`);
  return false;
}

/**
 * Force allow manual calculation
 */
export function allowManualCalculation(): void {
  lastAllowedCalculation = Date.now();}

/**
 * Reset calculation timer (for testing)
 */
export function resetCalculationTimer(): void {
  lastAllowedCalculation = 0;}

/**
 * Get time until next allowed calculation
 */
export function getTimeUntilNextCalculation(): number {
  const now = Date.now();
  const timeSinceLastCalc = now - lastAllowedCalculation;
  const remaining = MIN_CALCULATION_INTERVAL - timeSinceLastCalc;
  return Math.max(0, remaining);
}