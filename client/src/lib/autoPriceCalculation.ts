/**
 * Auto Price Calculation System
 * 
 * This system automatically triggers calculations whenever price updates occur,
 * while maintaining the same familiar display format users are accustomed to.
 */

// Set up simple event handling for connecting price updates to calculations
let isInitialized = false;
let lastCalculationTime: Record<string, number> = {};
const MIN_CALCULATION_INTERVAL = 5000; // 5 seconds minimum between calculations

/**
 * Initialize the auto calculation system
 * DISABLED: Previously, this was causing duplicate calculation triggers
 * Now all calculation logic is centralized in AdvancedSignalDashboard.tsx
 */
export function initAutoCalculation() {
  if (isInitialized) {
    return;
  }
  
  console.log('✅ Auto-calculation system is now DISABLED - using AdvancedSignalDashboard throttling only');
  
  // NO LONGER LISTENING TO PRICE EVENTS TO PREVENT DUPLICATE CALCULATION TRIGGERS
  // window.addEventListener('price-update', handlePriceUpdate);
  // window.addEventListener('live-price-update', handlePriceUpdate);
  
  isInitialized = true;
  
  // Create a hidden element to indicate auto-calculation is disabled
  const autoCalcIndicator = document.createElement('div');
  autoCalcIndicator.id = 'auto-calculation-enabled';
  autoCalcIndicator.style.display = 'none';
  autoCalcIndicator.dataset.enabled = 'false';  // IMPORTANT: Set to 'false' to prevent duplicate calculations
  document.body.appendChild(autoCalcIndicator);
  
  return () => {
    // No event listeners to remove anymore
    isInitialized = false;
    
    // Remove the indicator
    const indicator = document.getElementById('auto-calculation-enabled');
    if (indicator) {
      document.body.removeChild(indicator);
    }
  };
}

/**
 * Handle price update events
 */
function handlePriceUpdate(event: any) {
  const priceEvent = event as CustomEvent;
  const { symbol, price } = priceEvent.detail;
  
  // IMPORTANT: This function is now DISABLED to prevent conflicts with 
  // the throttling in AdvancedSignalDashboard
  
  // Just log that we received the price but won't do anything
  console.log(`🔄 Price update detected for ${symbol} (${price}), but not triggering calculation - throttling in dashboard`);
  
  /* DISABLED to prevent conflicts with dashboard throttling
  // Determine if we should calculate now
  const now = Date.now();
  const lastCalc = lastCalculationTime[symbol] || 0;
  
  if (now - lastCalc > MIN_CALCULATION_INTERVAL) {
    console.log(`🔄 Price update detected, triggering automatic calculation for ${symbol} at price ${price}`);
    
    // Trigger a calculation-needed event that the dashboard can listen for
    const calcEvent = new CustomEvent('calculation-needed', {
      detail: {
        symbol,
        price,
        timestamp: now,
        trigger: 'auto'
      }
    });
    
    window.dispatchEvent(calcEvent);
    
    // Update last calculation time
    lastCalculationTime[symbol] = now;
  }
  */
}

/**
 * Check if auto calculation is enabled
 */
export function isAutoCalculationEnabled(): boolean {
  const indicator = document.getElementById('auto-calculation-enabled');
  return indicator?.dataset.enabled === 'true';
}

/**
 * Manually trigger a calculation for a symbol
 */
export function triggerCalculation(symbol: string, price: number) {
  console.log(`Manual calculation triggered for ${symbol} at price ${price}`);
  
  const calcEvent = new CustomEvent('calculation-needed', {
    detail: {
      symbol,
      price,
      timestamp: Date.now(),
      trigger: 'manual'
    }
  });
  
  window.dispatchEvent(calcEvent);
}