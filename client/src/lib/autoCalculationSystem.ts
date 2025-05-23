/**
 * Auto Calculation System
 * 
 * A centralized system that coordinates automatic calculations
 * whenever price updates occur, while maintaining the same display format.
 */

import { TimeFrame } from './advancedSignals';

// Define required types if needed
type CalculationCallback = (symbol: string, price: number) => void;

// Track registered calculation callbacks
const calculationCallbacks: CalculationCallback[] = [];

// Track initialization state
let isInitialized = false;

/**
 * Initialize the automatic calculation system
 */
export function initAutoCalculationSystem() {
  if (isInitialized) {
    console.log('Auto calculation system already initialized');
    return;
  }

  // Listen for price update events
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  window.addEventListener('live-price-update', handlePriceUpdate as EventListener);
  window.addEventListener('final-price-update', handlePriceUpdate as EventListener);
  
  console.log('✅ Auto calculation system initialized ✅');
  isInitialized = true;
}

/**
 * Handle price update events
 */
function handlePriceUpdate(event: Event) {
  const customEvent = event as CustomEvent<{symbol: string, price: number}>;
  const { symbol, price } = customEvent.detail;
  
  console.log(`🔄 Price update detected, triggering automatic calculation 🔄`);
  
  // Notify all registered callbacks
  calculationCallbacks.forEach(callback => {
    try {
      callback(symbol, price);
    } catch (error) {
      console.error('Error in calculation callback:', error);
    }
  });
}

/**
 * Register a calculation callback
 * @param callback Function to call when price updates
 * @returns Unregister function
 */
export function registerCalculationCallback(callback: CalculationCallback) {
  calculationCallbacks.push(callback);
  
  return () => {
    const index = calculationCallbacks.indexOf(callback);
    if (index !== -1) {
      calculationCallbacks.splice(index, 1);
    }
  };
}

/**
 * Clean up the auto calculation system
 */
export function cleanupAutoCalculationSystem() {
  window.removeEventListener('price-update', handlePriceUpdate as EventListener);
  window.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
  window.removeEventListener('final-price-update', handlePriceUpdate as EventListener);
  
  calculationCallbacks.length = 0;
  isInitialized = false;
  
  console.log('Auto calculation system cleaned up');
}