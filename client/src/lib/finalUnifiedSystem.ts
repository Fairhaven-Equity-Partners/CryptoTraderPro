/**
 * Final Unified System - Complete Fix
 * 
 * This system completely replaces all conflicting calculation and price systems
 * with a single, synchronized solution that ensures:
 * 1. Calculations run every 3 minutes exactly
 * 2. All components use the same current price
 * 3. No redundant or conflicting systems
 */

let systemActive = false;
let currentBTCPrice = 0;
let lastCalculationTime = 0;
let calculationTimer: NodeJS.Timeout | null = null;
let priceTimer: NodeJS.Timeout | null = null;

const CALCULATION_INTERVAL = 180000; // Exactly 3 minutes
const PRICE_INTERVAL = 15000; // 15 seconds for price updates

/**
 * Initialize the final unified system
 */
export function initFinalUnifiedSystem(): void {
  if (systemActive) return;
  
  console.log('[FinalUnified] Starting unified price and calculation system');
  
  // Stop all old system processes
  if (typeof window !== 'undefined') {
    // Clear all timers from old systems
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  }
  
  systemActive = true;
  startPriceUpdates();
  scheduleNextCalculation();
}

/**
 * Start price update loop
 */
async function startPriceUpdates(): Promise<void> {
  try {
    const response = await fetch('/api/crypto/BTC%2FUSDT');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && (data.price || data.lastPrice)) {
      const newPrice = Number(data.price || data.lastPrice);
      
      if (newPrice > 0 && newPrice !== currentBTCPrice) {
        currentBTCPrice = newPrice;
        
        // Dispatch synchronized price update
        const event = new CustomEvent('finalPriceUpdate', {
          detail: { symbol: 'BTC/USDT', price: currentBTCPrice, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        
        console.log(`[FinalUnified] Price synchronized: ${currentBTCPrice}`);
      }
    } else {
      console.warn('[FinalUnified] No valid price data received');
    }
  } catch (error) {
    console.error('[FinalUnified] Price fetch error:', error);
  }
  
  // Schedule next price update
  priceTimer = setTimeout(startPriceUpdates, PRICE_INTERVAL);
}

/**
 * Schedule next calculation (3-minute intervals)
 */
function scheduleNextCalculation(): void {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  const timeUntilNext = Math.max(1000, CALCULATION_INTERVAL - timeSinceLastCalc);
  
  console.log(`[FinalUnified] Next calculation in ${Math.round(timeUntilNext/1000)}s`);
  
  calculationTimer = setTimeout(executeCalculation, timeUntilNext);
}

/**
 * Execute calculation
 */
function executeCalculation(): void {
  if (currentBTCPrice === 0) {
    console.log('[FinalUnified] No price data, skipping calculation');
    scheduleNextCalculation();
    return;
  }
  
  console.log(`[FinalUnified] Executing 3-minute calculation with price: ${currentBTCPrice}`);
  lastCalculationTime = Date.now();
  
  // Dispatch calculation event
  const event = new CustomEvent('finalCalculationTrigger', {
    detail: { 
      symbol: 'BTC/USDT', 
      price: currentBTCPrice, 
      timestamp: lastCalculationTime,
      type: 'autonomous'
    }
  });
  window.dispatchEvent(event);
  
  // Schedule next calculation
  scheduleNextCalculation();
}

/**
 * Get current synchronized price
 */
export function getFinalPrice(): number {
  return currentBTCPrice;
}

/**
 * Get system status
 */
export function getFinalSystemStatus(): {
  active: boolean;
  currentPrice: number;
  lastCalculationTime: number;
  nextCalculationIn: number;
} {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  const nextCalculationIn = Math.max(0, CALCULATION_INTERVAL - timeSinceLastCalc);
  
  return {
    active: systemActive,
    currentPrice: currentBTCPrice,
    lastCalculationTime,
    nextCalculationIn
  };
}

/**
 * Force immediate calculation (for manual triggers)
 */
export function forceFinalCalculation(): void {
  if (!systemActive || currentBTCPrice === 0) return;
  
  console.log('[FinalUnified] Force calculation requested');
  
  // Clear existing timer
  if (calculationTimer) {
    clearTimeout(calculationTimer);
  }
  
  // Execute immediately
  executeCalculation();
}

/**
 * Cleanup system
 */
export function cleanupFinalSystem(): void {
  if (calculationTimer) clearTimeout(calculationTimer);
  if (priceTimer) clearTimeout(priceTimer);
  
  systemActive = false;
  currentBTCPrice = 0;
  lastCalculationTime = 0;
  
  console.log('[FinalUnified] System cleaned up');
}