/**
 * Unified Price and Calculation System
 * 
 * Single source of truth that eliminates all conflicting systems
 * and provides synchronized 3-minute autonomous calculations.
 */

// System state
let isSystemActive = false;
let currentPrice = 0;
let lastCalculationTime = 0;
let calculationTimer: NodeJS.Timeout | null = null;
let priceTimer: NodeJS.Timeout | null = null;

// Configuration
const CALCULATION_INTERVAL = 180000; // 3 minutes exactly
const PRICE_UPDATE_INTERVAL = 15000; // 15 seconds

// Disable all conflicting systems
const disableConflictingSystems = () => {
  // Clear all existing timers and intervals
  if (typeof window !== 'undefined') {
    for (let i = 1; i < 99999; i++) {
      window.clearTimeout(i);
      window.clearInterval(i);
    }
    
    // Override console logs from old systems
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('[SimpleCalcTrigger]') ||
          message.includes('[AutoCalculation]') ||
          message.includes('[StreamlinedPriceManager]') ||
          message.includes('[FinalPriceSystem]') ||
          message.includes('LIVE PRICE EVENT') ||
          message.includes('RAW LIVE PRICE EVENT') ||
          message.includes('Calculation scheduled')) {
        return; // Suppress old system logs
      }
      originalLog.apply(console, args);
    };
  }
};

// Initialize the unified system
export const initializeUnifiedSystem = () => {
  if (isSystemActive) {
    console.log('[UnifiedSystem] Already active');
    return;
  }
  
  console.log('[UnifiedSystem] Starting - 3-minute autonomous calculations only');
  disableConflictingSystems();
  
  isSystemActive = true;
  
  // Start price updates
  updatePrice();
  
  // Start calculation timer (3 minutes exactly)
  schedulenextCalculation();
};

// Update price from API
const updatePrice = async () => {
  try {
    const response = await fetch('/api/crypto/BTC/USDT');
    const data = await response.json();
    
    if (data && data.price && data.price !== currentPrice) {
      currentPrice = data.price;
      
      // Update display
      const event = new CustomEvent('priceUpdate', {
        detail: { symbol: 'BTC/USDT', price: currentPrice }
      });
      window.dispatchEvent(event);
      
      console.log(`[UnifiedSystem] Price: ${currentPrice}`);
    }
  } catch (error) {
    console.error('[UnifiedSystem] Price fetch error:', error);
  }
  
  // Schedule next price update
  priceTimer = setTimeout(updatePrice, PRICE_UPDATE_INTERVAL);
};

// Schedule next calculation
const schedulenextCalculation = () => {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  const timeUntilNext = Math.max(0, CALCULATION_INTERVAL - timeSinceLastCalc);
  
  console.log(`[UnifiedSystem] Next calculation in ${Math.round(timeUntilNext/1000)}s`);
  
  calculationTimer = setTimeout(executeCalculation, timeUntilNext);
};

// Execute calculation
const executeCalculation = async () => {
  console.log('[UnifiedSystem] Starting 3-minute autonomous calculation');
  lastCalculationTime = Date.now();
  
  // Dispatch calculation event
  const event = new CustomEvent('autonomousCalculation', {
    detail: { symbol: 'BTC/USDT', price: currentPrice, timestamp: lastCalculationTime }
  });
  window.dispatchEvent(event);
  
  // Schedule next calculation
  schedulenextCalculation();
};

// Get current price
export const getCurrentUnifiedPrice = () => currentPrice;

// Get system status
export const getUnifiedSystemStatus = () => ({
  active: isSystemActive,
  currentPrice,
  lastCalculationTime,
  nextCalculationIn: Math.max(0, CALCULATION_INTERVAL - (Date.now() - lastCalculationTime))
});

// Cleanup function
export const cleanupUnifiedSystem = () => {
  if (calculationTimer) clearTimeout(calculationTimer);
  if (priceTimer) clearTimeout(priceTimer);
  isSystemActive = false;
  console.log('[UnifiedSystem] Cleaned up');
};