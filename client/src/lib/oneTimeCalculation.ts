// This system runs calculations once when requested
// Uses events to coordinate with other calculation systems

// Initialize and set up the system
export function initOneTimeCalculationSystem() {
  console.log("[ONE-TIME-CALC] Setting up one-time calculation system");
  
  // Add a global function to trigger calculations from anywhere
  window.triggerCalculation = (symbol: string, price: number) => {
    console.log(`[ONE-TIME-CALC] Calculation triggered for ${symbol} at price ${price}`);
    
    // Dispatch start event
    const startEvent = new CustomEvent('calculation-started', {
      detail: { symbol, price }
    });
    window.dispatchEvent(startEvent);
    
    // Simulate calculation with rich result data
    setTimeout(() => {
      // Create result data
      const result = {
        symbol,
        price,
        timestamp: Date.now(),
        displayReady: true,
        timeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M']
      };
      
      // Dispatch complete event
      const completeEvent = new CustomEvent('calculation-complete', {
        detail: result
      });
      window.dispatchEvent(completeEvent);
      
      console.log(`[ONE-TIME-CALC] Calculation completed for ${symbol}`);
      
      // Force update display
      const updateEvent = new CustomEvent('live-price-update', {
        detail: { symbol, price, forceRefresh: true }
      });
      window.dispatchEvent(updateEvent);
    }, 500);
  };
}