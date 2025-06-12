/**
 * Enhanced Auto Calculation System
 * 
 * This system ensures that market analysis calculations run exactly once
 * after each price fetch, not repeatedly, while maintaining consistent
 * recommendations across all timeframes.
 */

// Time between calculations (in seconds)
const MIN_CALCULATION_INTERVAL = 300; // 5 minutes between full calculations

// Store the last calculation time for each symbol
const lastCalculationTimes: Record<string, number> = {};

// Flag to track if system has been initialized
let systemInitialized = false;

/**
 * Initialize the auto calculation system
 */
export function initAutoCalculationSystem() {
  if (systemInitialized) {return;
  }systemInitialized = true;
  
  // Listen for price update events
  window.addEventListener('priceUpdate', handlePriceUpdate as EventListener);
  
  // Schedule regular synchronization points
  setupSynchronizedCalculations();
}

/**
 * Handle price update events
 */
function handlePriceUpdate(event: CustomEvent) {
  const { symbol, price } = event.detail;// Check if enough time has passed since the last calculation
  const now = Date.now();
  const lastCalcTime = lastCalculationTimes[symbol] || 0;
  const timeSinceLastCalc = Math.floor((now - lastCalcTime) / 1000);
  
  if (timeSinceLastCalc < MIN_CALCULATION_INTERVAL) {`);
    return;
  }
  
  // Trigger calculationtriggerCalculation(symbol, price);
}

/**
 * Trigger a full calculation for all timeframes
 */
function triggerCalculation(symbol: string, price: number) {try {
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
  // Check every 30 seconds if we need to calculate
  setInterval(() => {
    const now = new Date();
    
    // Trigger calculations at the 0, 5, 10, 15... minute marks for better synchronization
    if (now.getMinutes() % 5 === 0 && now.getSeconds() < 30) {// Fetch current price and trigger calculation for active symbols
      const activeSymbol = document.querySelector('[data-active-symbol]')?.getAttribute('data-active-symbol') || 'BTC/USDT';
      const priceElement = document.querySelector('[data-current-price]');
      const currentPrice = priceElement ? parseFloat(priceElement.textContent || '0') : 0;
      
      if (currentPrice > 0) {
        triggerCalculation(activeSymbol, currentPrice);
      }
    }
  }, 30000); // Reduced frequency from 15s to 30s
}

/**
 * Mark signals as calculated for a symbol
 */
export function markCalculationComplete(symbol: string, signalCount: number) {lastCalculationTimes[symbol] = Date.now();
}