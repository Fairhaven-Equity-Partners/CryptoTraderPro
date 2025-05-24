/**
 * Enhanced Auto Calculation System
 * 
 * This system ensures that market analysis calculations run exactly once
 * after each price fetch, not repeatedly, while maintaining consistent
 * recommendations across all timeframes.
 */

// Time between calculations (in seconds)
const MIN_CALCULATION_INTERVAL = 180; // 3 minutes between full calculations

// Store the last calculation time for each symbol
const lastCalculationTimes: Record<string, number> = {};

// Flag to track if system has been initialized
let systemInitialized = false;

/**
 * Initialize the auto calculation system
 */
export function initAutoCalculationSystem() {
  if (systemInitialized) {
    console.log('[AutoCalculation] System already initialized');
    return;
  }
  
  console.log('[AutoCalculation] System initialized and listening for price updates');
  systemInitialized = true;
  
  // Listen for price update events
  window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);
  
  // Schedule regular synchronization points
  setupSynchronizedCalculations();
}

/**
 * Handle price update events
 */
function handlePriceUpdate(event: CustomEvent) {
  const { symbol, price } = event.detail;
  
  console.log(`🔄 Price update detected for ${symbol}: ${price}`);
  
  // Check if enough time has passed since the last calculation
  const now = Date.now();
  const lastCalcTime = lastCalculationTimes[symbol] || 0;
  const timeSinceLastCalc = Math.floor((now - lastCalcTime) / 1000);
  
  if (timeSinceLastCalc < MIN_CALCULATION_INTERVAL) {
    console.log(`[AutoCalculation] Skipping calculation for ${symbol} (calculated ${timeSinceLastCalc}s ago)`);
    return;
  }
  
  // Trigger calculation
  console.log(`[AutoCalculation] Triggering calculation for ${symbol} at price ${price}`);
  triggerCalculation(symbol, price);
}

/**
 * Trigger a full calculation for all timeframes
 */
function triggerCalculation(symbol: string, price: number) {
  console.log(`[AutoCalculation] Calculating signals for ${symbol} at price ${price}`);
  
  try {
    // Dispatch calculation event
    const calculationEvent = new CustomEvent('calculateSignals', {
      detail: { symbol, price }
    });
    window.dispatchEvent(calculationEvent);
    
    // Update last calculation time
    lastCalculationTimes[symbol] = Date.now();
  } catch (error) {
    console.error(`[AutoCalculation] Error triggering calculation:`, error);
  }
}

/**
 * Set up synchronized calculation points
 * This ensures calculations happen at regular intervals regardless of price updates
 */
function setupSynchronizedCalculations() {
  // Check every 15 seconds if we need to calculate
  setInterval(() => {
    const now = new Date();
    console.log(`Scheduled price update check (15-second interval) at ${now.toLocaleTimeString()}`);
    
    // Trigger calculations at the 0, 3, 6, 9... minute marks for better synchronization
    if (now.getMinutes() % 3 === 0 && now.getSeconds() < 15) {
      console.log('💯 DISPATCHING SYNCHRONIZED CALCULATION EVENT at 3-minute mark');
      
      // Fetch current price and trigger calculation for active symbols
      const activeSymbol = document.querySelector('[data-active-symbol]')?.getAttribute('data-active-symbol') || 'BTC/USDT';
      const priceElement = document.querySelector('[data-current-price]');
      const currentPrice = priceElement ? parseFloat(priceElement.textContent || '0') : 0;
      
      if (currentPrice > 0) {
        console.log(`🚀 LIVE PRICE EVENT RECEIVED: ${activeSymbol} price=${currentPrice}`);
        console.log(`💯 TIMER-SYNCHRONIZED CALCULATION TRIGGERED for ${activeSymbol} with price ${currentPrice}`);
        triggerCalculation(activeSymbol, currentPrice);
      }
    }
  }, 15000);
}

/**
 * Mark signals as calculated for a symbol
 */
export function markCalculationComplete(symbol: string, signalCount: number) {
  console.log(`[AutoCalculation] Generated ${signalCount} valid signals for ${symbol}`);
  lastCalculationTimes[symbol] = Date.now();
}