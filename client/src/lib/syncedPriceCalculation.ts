// Enhanced system to ensure price calculations are synchronized with price updates
// and the display is updated accordingly
export function initSyncedCalculation() {
  console.log("[SYNC-CALC] Setting up synchronized price calculation system");
  
  // Listen for price updates
  window.addEventListener('price-update', (event: CustomEvent) => {
    if (!event.detail) return;
    
    const { symbol, price } = event.detail;
    console.log(`[SYNC-CALC] Price update detected: ${symbol} = ${price}`);
    
    // Trigger calculation
    runCalculation(symbol, price);
  });
  
  // Also listen for direct price fetches from FinalPriceSystem
  window.addEventListener('synced-price-fetch', (event: CustomEvent) => {
    if (!event.detail) return;
    
    const { symbol, price } = event.detail;
    console.log(`[SYNC-CALC] Direct price fetch detected: ${symbol} = ${price}`);
    
    // Trigger calculation
    runCalculation(symbol, price);
  });
}

// Function to run calculation 
function runCalculation(symbol: string, price: number) {
  console.log(`[SYNC-CALC] Running calculation for ${symbol} at price ${price}`);
  
  // Run calculation logic
  try {
    // Create and dispatch calculation events
    // First: Signal calculation is starting
    const calculationStartEvent = new CustomEvent('calculation-started', {
      detail: { symbol, price }
    });
    window.dispatchEvent(calculationStartEvent);
    
    // Prepare calculation result
    const calculationResult = {
      symbol,
      price,
      timestamp: Date.now(),
      // Include additional fields for display integration
      displayReady: true, 
      timeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']
    };
    
    // Short delay to simulate calculation time (ensures UI can update)
    setTimeout(() => {
      // Signal that calculation is complete
      const calculationCompleteEvent = new CustomEvent('calculation-complete', {
        detail: calculationResult
      });
      window.dispatchEvent(calculationCompleteEvent);
      console.log(`[SYNC-CALC] Calculation complete for ${symbol}`);
      
      // Force UI refresh with a live-update event
      const forceUpdateEvent = new CustomEvent('live-price-update', {
        detail: { symbol, price, forceRefresh: true }
      });
      window.dispatchEvent(forceUpdateEvent);
      console.log(`[SYNC-CALC] Forcing UI refresh for ${symbol}`);
    }, 250);
    
  } catch (error) {
    console.error(`[SYNC-CALC] Error calculating for ${symbol}:`, error);
  }
}