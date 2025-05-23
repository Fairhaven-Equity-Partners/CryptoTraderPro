/**
 * Auto Calculation System
 * 
 * This module ensures that calculations happen automatically when price data is updated,
 * eliminating the need for manual "Calculate Now" or "Quick Update" buttons.
 */

let autoCalculationEnabled = true;

/**
 * Initialize the automatic calculation system
 * This sets up event listeners to trigger calculations on price updates
 */
export function initAutoCalculationSystem() {
  console.log('🧮 Initializing automatic calculation system 🧮');
  
  // Remove any disabling flags
  if (typeof window !== 'undefined') {
    (window as any).autoCalculationsDisabled = false;
    (window as any).__CALCULATIONS_LOCKED__ = false;
  }
  
  // Listen for price updates and trigger calculations
  window.addEventListener('price-update', handlePriceUpdate);
  window.addEventListener('live-price-update', handlePriceUpdate);
  window.addEventListener('price-fetching', handlePriceUpdate);
  
  console.log('✅ Auto calculation system initialized and enabled ✅');
  
  // Dispatch an event to notify the system
  const enableEvent = new CustomEvent('auto-calculations-enabled');
  window.dispatchEvent(enableEvent);
}

/**
 * Enable automatic calculations
 */
export function enableAutoCalculation() {
  console.log('✅ Enabling automatic calculations ✅');
  autoCalculationEnabled = true;
  
  // Dispatch an event to notify the system
  const enableEvent = new CustomEvent('auto-calculations-enabled');
  window.dispatchEvent(enableEvent);
}

/**
 * Disable automatic calculations (for debugging only)
 */
export function disableAutoCalculation() {
  console.log('⛔ Disabling automatic calculations ⛔');
  autoCalculationEnabled = false;
  
  // Dispatch an event to notify the system
  const disableEvent = new CustomEvent('auto-calculations-disabled');
  window.dispatchEvent(disableEvent);
}

/**
 * Handle price update events by triggering calculations
 */
function handlePriceUpdate(event: Event) {
  if (!autoCalculationEnabled) {
    console.log('Auto calculations are disabled, skipping calculation');
    return;
  }
  
  console.log('🔄 Price update detected, triggering automatic calculation 🔄');
  
  // Trigger calculation by dispatching an event
  const calcEvent = new CustomEvent('trigger-calculation', {
    detail: (event as CustomEvent).detail
  });
  
  window.dispatchEvent(calcEvent);
}

// Initialize auto calculation on module import
if (typeof window !== 'undefined') {
  console.log('Auto calculation system module loaded');
}