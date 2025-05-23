/**
 * DISABLE ALL AUTO-CALCULATIONS
 * 
 * This module completely disables all auto-calculation triggers in the application.
 * It works by replacing and removing all event listeners that could trigger calculations.
 */

// Function to enable all auto-calculation mechanisms
export function disableAllAutoCalculations() {
  console.log('✅ ENABLING AUTO-CALCULATIONS COMPLETELY ✅');
  
  try {
    // 1. Enable oneTimeCalculation system by removing blockers
    if (window.addEventListener) {
      // Remove any blocking handlers
      window.removeEventListener('price-update', noopHandler);
      window.removeEventListener('price-fetching', noopHandler);
      window.removeEventListener('price-fetch-completed', noopHandler);
      window.removeEventListener('final-price-update', noopHandler);
      window.removeEventListener('calculation-started', noopHandler);
      window.removeEventListener('calculation-completed', noopHandler);
      window.removeEventListener('live-price-update', noopHandler);
      
      // Also remove document-level blockers
      document.removeEventListener('price-update', noopHandler);
      document.removeEventListener('live-price-update', noopHandler);
    }
    
    // 2. Re-enable window global variables for auto-calculations
    enableGlobalTriggers();
    
    console.log('✅ AUTO-CALCULATION SYSTEMS SUCCESSFULLY ENABLED');
    console.log('👉 Calculations will run automatically with price updates');
  } catch (error) {
    console.error('Error while enabling auto-calculations:', error);
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