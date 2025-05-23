/**
 * This file is intentionally disabled!
 * We are migrating to automatic calculations that run anytime price data is updated.
 */

export function disableAllAutoCalculations() {
  console.log('ℹ️ Auto-calculation disabling function is now a no-op');
  // Do nothing - keep auto-calculations enabled
  return false;
}

function noopHandler(event: Event) {
  // This is intentionally empty
}

// This function is intentionally always returns false now
export function anyFunction() {
  return false;
}

// These functions are intentionally empty
export function disableGlobalTriggers() {
  // Do nothing
}

export function enableGlobalTriggers() {
  // Do nothing
}