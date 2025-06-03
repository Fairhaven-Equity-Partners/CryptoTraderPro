/**
 * Streamlined Price Manager - Optimized Data Flow
 * 
 * Single source for price updates and calculation triggers
 * Eliminates redundant API calls and calculation overlaps
 */

import { calculateMultiTimeframeSignals } from './unifiedCalculationCore';
import { ChartData, TimeFrame } from '../types';

// Global state management
let currentPrice = 0;
let lastCalculationTime = 0;
let isCalculating = false;
let priceData: Record<TimeFrame, ChartData[]> = {} as any;

// Calculation throttling - 3 minutes
const CALCULATION_INTERVAL = 180000;

// Price update handlers
const priceUpdateHandlers = new Set<(price: number) => void>();
const calculationCompleteHandlers = new Set<(results: any) => void>();

/**
 * Initialize the streamlined price manager
 */
export function initPriceManager(): void {
  console.log('[StreamlinedPriceManager] Initializing optimized price management');
  
  // Listen for price updates from the server
  window.addEventListener('live-price-update', handlePriceUpdate as EventListener);
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
}

/**
 * Handle incoming price updates
 */
function handlePriceUpdate(event: CustomEvent): void {
  const { symbol, price } = event.detail;
  
  if (symbol !== 'BTC/USDT') return;
  
  currentPrice = price;
  console.log(`[StreamlinedPriceManager] Price update: ${price}`);
  
  // Notify price update handlers
  priceUpdateHandlers.forEach(handler => handler(price));
  
  // Check if calculation is needed
  checkCalculationTrigger();
}

/**
 * Check if calculation should be triggered
 */
function checkCalculationTrigger(): void {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  
  // Only calculate if enough time has passed and we're not already calculating
  if (timeSinceLastCalc >= CALCULATION_INTERVAL && !isCalculating) {
    triggerCalculation();
  }
}

/**
 * Trigger calculation with current data
 */
async function triggerCalculation(): Promise<void> {
  if (isCalculating || !currentPrice || Object.keys(priceData).length === 0) {
    return;
  }
  
  isCalculating = true;
  lastCalculationTime = Date.now();
  
  console.log('[StreamlinedPriceManager] Starting calculation cycle');
  
  try {
    // Calculate signals for all timeframes
    const results = calculateMultiTimeframeSignals(priceData, 'BTC/USDT', currentPrice);
    
    // Notify calculation complete handlers
    calculationCompleteHandlers.forEach(handler => handler(results));
    
    console.log('[StreamlinedPriceManager] Calculation cycle complete');
  } catch (error) {
    console.error('[StreamlinedPriceManager] Calculation error:', error);
  } finally {
    isCalculating = false;
  }
}

/**
 * Update chart data for a specific timeframe
 */
export function updateChartData(timeframe: TimeFrame, data: ChartData[]): void {
  priceData[timeframe] = data;
}

/**
 * Get current price
 */
export function getCurrentPrice(): number {
  return currentPrice;
}

/**
 * Subscribe to price updates
 */
export function subscribeToPrice(handler: (price: number) => void): () => void {
  priceUpdateHandlers.add(handler);
  return () => priceUpdateHandlers.delete(handler);
}

/**
 * Subscribe to calculation results
 */
export function subscribeToCalculations(handler: (results: any) => void): () => void {
  calculationCompleteHandlers.add(handler);
  return () => calculationCompleteHandlers.delete(handler);
}

/**
 * Force a calculation (for manual triggers)
 */
export function forceCalculation(): void {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  
  // Allow forced calculation if at least 30 seconds have passed
  if (timeSinceLastCalc >= 30000 && !isCalculating) {
    triggerCalculation();
  }
}

/**
 * Get calculation status
 */
export function getCalculationStatus(): { isCalculating: boolean; timeSinceLastCalc: number } {
  return {
    isCalculating,
    timeSinceLastCalc: Date.now() - lastCalculationTime
  };
}