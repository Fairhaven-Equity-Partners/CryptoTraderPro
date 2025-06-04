/**
 * Streamlined Price Manager - Ultra-Optimized Data Flow
 */

import { calculateMultiTimeframeSignals } from './unifiedCalculationCore';
import { ChartData, TimeFrame } from '../types';

// Optimized state management with minimal overhead
let currentPrice = 0;
let lastCalcTime = 0;
let calculating = false;
let priceData: Record<TimeFrame, ChartData[]> = {} as any;

// Optimized constants
const CALC_THROTTLE = 180000; // 3 minutes
const PRICE_HANDLERS = new Set<(price: number) => void>();
const CALC_HANDLERS = new Set<(results: any) => void>();

/**
 * Initialize optimized price management
 */
export function initPriceManager(): void {
  console.log('[StreamlinedPriceManager] Initializing optimized price management');
  
  const handleUpdate = (event: CustomEvent) => {
    const { symbol, price } = event.detail;
    if (symbol === 'BTC/USDT') {
      currentPrice = price;
      console.log(`[StreamlinedPriceManager] Price update: ${price}`);
      PRICE_HANDLERS.forEach(h => h(price));
      checkCalculationTrigger();
    }
  };
  
  window.addEventListener('live-price-update', handleUpdate as EventListener);
  window.addEventListener('price-update', handleUpdate as EventListener);
}

/**
 * Optimized calculation trigger check
 */
function checkCalculationTrigger(): void {
  const now = Date.now();
  if (!calculating && (now - lastCalcTime) >= CALC_THROTTLE) {
    lastCalcTime = now;
    calculating = true;
    triggerCalculations();
  }
}

/**
 * Trigger optimized calculations
 */
async function triggerCalculations(): Promise<void> {
  try {
    console.log('🔄 Starting optimized calculations');
    const results = await calculateMultiTimeframeSignals('BTC/USDT', currentPrice);
    CALC_HANDLERS.forEach(h => h(results));
  } catch (error) {
    console.error('Calculation error:', error);
  } finally {
    calculating = false;
  }
}

/**
 * Subscribe to price updates - Optimized
 */
export function subscribeToPriceUpdates(handler: (price: number) => void): () => void {
  PRICE_HANDLERS.add(handler);
  return () => PRICE_HANDLERS.delete(handler);
}

/**
 * Subscribe to calculation results - Optimized
 */
export function subscribeToCalculations(handler: (results: any) => void): () => void {
  CALC_HANDLERS.add(handler);
  return () => CALC_HANDLERS.delete(handler);
}

/**
 * Update chart data - Optimized
 */
export function updateChartData(timeframe: TimeFrame, data: ChartData[]): void {
  priceData[timeframe] = data;
}

/**
 * Get current price - Optimized
 */
export function getCurrentPrice(): number {
  return currentPrice;
}

/**
 * Force calculation trigger - Optimized
 */
export function forceCalculation(): void {
  if (!calculating) {
    lastCalcTime = 0; // Reset to allow immediate calculation
    checkCalculationTrigger();
  }
}

/**
 * Get system status - Optimized
 */
export function getSystemStatus() {
  return {
    calculating,
    currentPrice,
    lastCalcTime: new Date(lastCalcTime),
    timeSinceLastCalc: Date.now() - lastCalcTime,
    dataLoaded: Object.keys(priceData).length > 0
  };
}