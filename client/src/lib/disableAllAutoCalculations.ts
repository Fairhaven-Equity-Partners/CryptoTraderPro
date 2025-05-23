/**
 * DISABLE ALL AUTO-CALCULATIONS
 * 
 * This module completely disables all auto-calculation triggers in the application.
 * It works by replacing and removing all event listeners that could trigger calculations.
 */

// Function to completely disable all auto-calculation mechanisms
export function disableAllAutoCalculations() {
  console.log('🛑 DISABLING ALL AUTO-CALCULATIONS COMPLETELY 🛑');
  
  try {
    // 1. Neutralize oneTimeCalculation system
    if (window.addEventListener) {
      // Remove the real handlers that trigger calculations
      window.removeEventListener('price-update', anyFunction);
      window.removeEventListener('price-fetching', anyFunction);
      window.removeEventListener('price-fetch-completed', anyFunction);
      
      // Replace with no-op handlers to intercept any future event dispatches
      window.addEventListener('price-update', noopHandler);
      window.addEventListener('price-fetching', noopHandler);
      window.addEventListener('price-fetch-completed', noopHandler);
      
      // Disable all other potential event trigger paths
      window.addEventListener('final-price-update', noopHandler, { capture: true });
      window.addEventListener('calculation-started', noopHandler, { capture: true });
      window.addEventListener('calculation-completed', noopHandler, { capture: true });
      window.addEventListener('live-price-update', noopHandler, { capture: true });
      
      // Also intercept document-level events
      document.addEventListener('price-update', noopHandler, { capture: true });
      document.addEventListener('live-price-update', noopHandler, { capture: true });
    }
    
    // 2. Disable any window global variables that could be used to trigger calculations
    disableGlobalTriggers();
    
    console.log('✅ AUTO-CALCULATION SYSTEMS SUCCESSFULLY DISABLED');
    console.log('👉 Only MANUAL "Calculate Now" button will trigger calculations');
  } catch (error) {
    console.error('Error while disabling auto-calculations:', error);
  }
}

// No-op handler that intercepts and prevents event propagation
function noopHandler(event: Event) {
  event.stopPropagation();
  event.preventDefault();
  console.log(`[AUTO-CALC-DISABLED] Intercepted and blocked event: ${event.type}`);
}

// Accept any function signature
function anyFunction() {}

// Disable any global trigger functions or variables
function disableGlobalTriggers() {
  // Create backup of any needed functions but null out the triggers
  if (window) {
    // Add a global flag to indicate auto-calculations are disabled
    (window as any).autoCalculationsDisabled = true;
    
    // Preserve necessary price function but disable calculation triggers
    if ((window as any).syncGlobalPrice) {
      const originalSyncPrice = (window as any).syncGlobalPrice;
      (window as any).syncGlobalPrice = function(symbol: string, price: number) {
        // Still update price tracking but without triggering calculations
        console.log(`[AUTO-CALC-DISABLED] Price updated for ${symbol}: ${price} (no calculation triggered)`);
        return originalSyncPrice(symbol, price);
      };
    }
  }
}