/**
 * Auto Calculation System
 * 
 * This module ensures that all price updates trigger calculations exactly once,
 * maintaining consistency across all timeframes and preventing calculation errors.
 */

import { TimeFrame } from '../types';
import { calculateAllTimeframeSignals } from './advancedSignalsNew';

// Configuration
const CALCULATION_INTERVAL = 180000; // 3 minutes in milliseconds
let lastCalculationTime = 0;
let isCalculationInProgress = false;
let calculationQueue: {symbol: string, price: number}[] = [];

// Event handler references
let priceUpdateHandler: ((event: Event) => void) | null = null;
let calculationHandler: ((event: Event) => void) | null = null;

/**
 * Initialize the auto calculation system
 */
export function initAutoCalculation() {
  // Clean up any existing handlers
  cleanupAutoCalculation();
  
  // Set up event listener for price updates
  priceUpdateHandler = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { symbol, price, forceCalculate } = customEvent.detail || {};
    
    if (symbol && price) {
      handlePriceUpdate(symbol, price, !!forceCalculate);
    }
  };
  
  // Set up event listener for forced calculations
  calculationHandler = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { symbol, timestamp } = customEvent.detail || {};
    
    if (symbol) {
      // Get the current price
      const priceElements = document.querySelectorAll('[data-symbol="' + symbol + '"]');
      let price = 0;
      
      if (priceElements.length > 0) {
        const priceStr = priceElements[0].textContent || '0';
        price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      }
      
      if (price > 0) {
        console.log(`[AutoCalculation] Forced calculation for ${symbol} at price ${price}`);
        performCalculation(symbol, price);
      } else {
        console.log(`[AutoCalculation] Unable to get price for forced calculation on ${symbol}`);
      }
    }
  };
  
  // Add event listeners
  window.addEventListener('live-price-update', priceUpdateHandler);
  window.addEventListener('price-update', priceUpdateHandler);
  window.addEventListener('trigger-calculation', calculationHandler);
  
  console.log('[AutoCalculation] System initialized and listening for price updates');
}

/**
 * Handle a price update event
 */
function handlePriceUpdate(symbol: string, price: number, forceCalculate: boolean) {
  const now = Date.now();
  const timeSinceLastCalculation = now - lastCalculationTime;
  
  // Only calculate if:
  // 1. We're explicitly forced to calculate (at the 3-minute mark)
  // 2. It's been at least 3 minutes since the last calculation
  if (forceCalculate || timeSinceLastCalculation >= CALCULATION_INTERVAL) {
    console.log(`[AutoCalculation] Triggering calculation for ${symbol} at price ${price}`);
    queueCalculation(symbol, price);
    lastCalculationTime = now;
  } else {
    // Log but don't calculate
    console.log(`[AutoCalculation] Skipping calculation for ${symbol} (calculated ${Math.floor(timeSinceLastCalculation/1000)}s ago)`);
  }
}

/**
 * Queue a calculation to prevent multiple simultaneous calculations
 */
function queueCalculation(symbol: string, price: number) {
  // Add to the queue
  calculationQueue.push({ symbol, price });
  
  // Process the queue if not already in progress
  if (!isCalculationInProgress) {
    processCalculationQueue();
  }
}

/**
 * Process the calculation queue one at a time
 */
function processCalculationQueue() {
  if (calculationQueue.length === 0) {
    isCalculationInProgress = false;
    return;
  }
  
  isCalculationInProgress = true;
  
  // Get the next item
  const { symbol, price } = calculationQueue.shift()!;
  
  // Perform the calculation
  performCalculation(symbol, price)
    .finally(() => {
      // Process the next item in the queue
      setTimeout(() => {
        processCalculationQueue();
      }, 100);
    });
}

/**
 * Perform calculation for all timeframes
 */
async function performCalculation(symbol: string, price: number): Promise<void> {
  try {
    console.log(`[AutoCalculation] Calculating signals for ${symbol} at price ${price}`);
    
    // Broadcast calculation start
    const startEvent = new CustomEvent('calculation-start', {
      detail: { symbol, price, timestamp: Date.now() }
    });
    window.dispatchEvent(startEvent);
    
    // Use our improved calculation function that handles all timeframes
    const signals = calculateAllTimeframeSignals(symbol, price);
    
    // Check if signals were generated successfully
    const validSignalCount = Object.values(signals).filter(s => s !== null).length;
    console.log(`[AutoCalculation] Generated ${validSignalCount} valid signals for ${symbol}`);
    
    // Broadcast the results
    const resultEvent = new CustomEvent('calculation-complete', {
      detail: { symbol, price, signals, timestamp: Date.now() }
    });
    window.dispatchEvent(resultEvent);
    
    // Also dispatch an event for the legacy system
    const legacyEvent = new CustomEvent('market-analysis-complete', {
      detail: { symbol, price, signals, timestamp: Date.now() }
    });
    window.dispatchEvent(legacyEvent);
    
    return Promise.resolve();
  } catch (error) {
    console.error(`[AutoCalculation] Error calculating signals for ${symbol}:`, error);
    
    // Broadcast error
    const errorEvent = new CustomEvent('calculation-error', {
      detail: { symbol, price, error, timestamp: Date.now() }
    });
    window.dispatchEvent(errorEvent);
    
    return Promise.reject(error);
  }
}

/**
 * Manually trigger a calculation
 */
export function triggerManualCalculation(symbol: string, price: number): void {
  console.log(`[AutoCalculation] Manual calculation triggered for ${symbol} at price ${price}`);
  performCalculation(symbol, price);
}

/**
 * Register for calculation events
 */
export function onCalculationComplete(callback: (data: any) => void): () => void {
  const handleEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener('calculation-complete', handleEvent as EventListener);
  
  return () => {
    window.removeEventListener('calculation-complete', handleEvent as EventListener);
  };
}

/**
 * Clean up event handlers
 */
export function cleanupAutoCalculation(): void {
  if (priceUpdateHandler) {
    window.removeEventListener('live-price-update', priceUpdateHandler);
    window.removeEventListener('price-update', priceUpdateHandler);
    priceUpdateHandler = null;
  }
  
  if (calculationHandler) {
    window.removeEventListener('trigger-calculation', calculationHandler);
    calculationHandler = null;
  }
}