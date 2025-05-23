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

// Also define the disableGlobalTriggers function to maintain compatibility
function disableGlobalTriggers() {
  // This function is maintained for backward compatibility
  // but now actually enables calculations
  enableGlobalTriggers();
}

// Re-enable global trigger functions for automatic calculations
function enableGlobalTriggers() {
  // Set flags to enable auto-calculations
  if (window) {
    // Set global flag to indicate auto-calculations are enabled
    (window as any).autoCalculationsDisabled = false;
    
    // Re-enable calculation triggers for price updates
    if ((window as any).syncGlobalPrice) {
      const originalSyncPrice = (window as any).syncGlobalPrice;
      (window as any).syncGlobalPrice = function(symbol: string, price: number) {
        // Update price and trigger calculations
        console.log(`[AUTO-CALC-ENABLED] Price updated for ${symbol}: ${price} (triggering calculation)`);
        
        // Create and dispatch calculation event
        const calcEvent = new CustomEvent('calculation-triggered', {
          detail: { symbol, price, timestamp: Date.now() }
        });
        window.dispatchEvent(calcEvent);
        
        return originalSyncPrice(symbol, price);
      };
    }
  }
}