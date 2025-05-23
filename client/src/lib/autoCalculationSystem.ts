/**
 * Auto Calculation System
 * 
 * This lightweight system coordinates automatic market analysis calculations
 * whenever price updates occur, maintaining the same display format.
 */

let isInitialized = false;

/**
 * Initialize the auto calculation system
 */
export function initAutoCalculationSystem() {
  if (isInitialized) {
    console.log('Auto calculation system already initialized');
    return;
  }
  
  console.log('✅ Initializing automatic calculation system');
  
  // Set up event listeners for price updates
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  window.addEventListener('live-price-update', handlePriceUpdate as EventListener);
  
  isInitialized = true;
  
  return () => {
    window.removeEventListener('price-update', handlePriceUpdate as EventListener);
    window.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
    isInitialized = false;
  };
}

/**
 * Handle price update events
 */
function handlePriceUpdate(event: Event) {
  const customEvent = event as CustomEvent;
  if (!customEvent.detail) return;
  
  const { symbol, price } = customEvent.detail;
  console.log(`Price update received: ${symbol} at ${price}`);
  
  // Create a calculation trigger event
  const calcEvent = new CustomEvent('calculation-needed', {
    detail: {
      symbol,
      price,
      timestamp: Date.now()
    }
  });
  
  // Dispatch the event to trigger calculations
  window.dispatchEvent(calcEvent);
}

/**
 * Check if auto calculation is enabled
 */
export function isAutoCalculationEnabled(): boolean {
  return isInitialized;
}

/**
 * Manually toggle auto calculation
 */
export function toggleAutoCalculation(enable: boolean): boolean {
  if (enable && !isInitialized) {
    initAutoCalculationSystem();
    return true;
  } else if (!enable && isInitialized) {
    window.removeEventListener('price-update', handlePriceUpdate as EventListener);
    window.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
    isInitialized = false;
    return false;
  }
  return isInitialized;
}