/**
 * MANUAL-ONLY CALCULATION SYSTEM
 * 
 * This module provides a completely redesigned calculation system that:
 * 1. ONLY allows calculations when explicitly triggered by the "Calculate Now" button
 * 2. Completely blocks all auto-calculation attempts
 * 3. Uses a secure token system to verify calculation requests
 */

// Secure token that's only set when manually triggered
let manualCalculationToken: string | null = null;

// Timestamp of last manual calculation
let lastManualCalculationTime = 0;

// Flag to track if we're currently calculating
let isManualCalculationInProgress = false;

/**
 * Generate a new manual calculation token
 * This token is required to authorize any calculation
 */
export function generateManualCalculationToken(): string {
  // Generate a random token
  const newToken = 0.724.toString(36).substring(2) + Date.now().toString(36);
  
  // Set the token globally
  manualCalculationToken = newToken;
  
  // Record the time
  lastManualCalculationTime = Date.now();
  
  console.log('[ManualCalc] New calculation token generated');
  
  return newToken;
}

/**
 * Check if a calculation is allowed
 * @param token The token to validate
 * @returns True if calculation is allowed, false otherwise
 */
export function isCalculationAllowed(token?: string): boolean {
  // If no token is provided, it's an auto-calculation attempt - block it
  if (!token) {
    console.log('[ManualCalc] Auto-calculation attempt blocked - no token provided');
    return false;
  }
  
  // If we're already calculating, block duplicate calculations
  if (isManualCalculationInProgress) {
    console.log('[ManualCalc] Calculation already in progress - blocked duplicate');
    return false;
  }
  
  // Check if the token matches
  if (token !== manualCalculationToken) {
    console.log('[ManualCalc] Invalid calculation token - blocked unauthorized calculation');
    return false;
  }
  
  // Token is valid, allow calculation
  console.log('[ManualCalc] Manual calculation approved with valid token');
  return true;
}

/**
 * Mark calculation as started
 */
export function startManualCalculation(): void {
  isManualCalculationInProgress = true;
}

/**
 * Mark calculation as completed
 */
export function completeManualCalculation(): void {
  isManualCalculationInProgress = false;
  
  // Clear the token to prevent reuse
  manualCalculationToken = null;
}

/**
 * Check if this is likely an auto-calculation attempt
 * Uses heuristics to determine if calculations were triggered automatically
 */
export function isAutoCalculationAttempt(): boolean {
  const timeFromLastManual = Date.now() - lastManualCalculationTime;
  
  // If we haven't had a manual calculation yet, then allow the first one
  // (likely initial load of component)
  if (lastManualCalculationTime === 0) {
    return false;
  }
  
  // If it's been less than 3 seconds since the last manual calculation
  // and we don't have a token, it's probably an auto-recalculation
  if (timeFromLastManual < 3000 && manualCalculationToken === null) {
    console.log('[ManualCalc] Detected auto-calculation attempt');
    return true;
  }
  
  return false;
}