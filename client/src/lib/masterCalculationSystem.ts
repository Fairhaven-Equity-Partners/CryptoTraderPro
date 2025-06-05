/**
 * Master Calculation System
 * 
 * Single source of truth for all market calculations and price synchronization.
 * Replaces all conflicting calculation trigger systems.
 */

import { generateStreamlinedSignal } from './streamlinedCalculationEngine';
import { AdvancedSignal, TradeRecommendation } from './advancedSignals';
import { TimeFrame } from '../types';

// System state
let isInitialized = false;
let isCalculating = false;
let lastCalculationTime = 0;
let currentPrice = 0;
let calculationInterval: NodeJS.Timeout | null = null;
let priceUpdateTimeout: NodeJS.Timeout | null = null;

// Event handlers
const priceUpdateHandlers = new Set<(price: number) => void>();
const calculationCompleteHandlers = new Set<(results: any) => void>();

// Configuration
const CALCULATION_INTERVAL_MS = 180000; // 3 minutes
const PRICE_UPDATE_INTERVAL_MS = 15000; // 15 seconds

/**
 * Initialize the master calculation system
 */
export function initializeMasterSystem(): void {
  if (isInitialized) {
    console.log('[MasterSystem] Already initialized');
    return;
  }

  console.log('[MasterSystem] Initializing unified calculation and price system');
  
  // Set up price updates
  setupPriceUpdates();
  
  // Set up calculation timer
  setupCalculationTimer();
  
  isInitialized = true;
  console.log('[MasterSystem] System ready - 3-minute autonomous calculations');
}

/**
 * Set up regular price updates from CoinGecko
 */
function setupPriceUpdates(): void {
  const fetchPrice = async () => {
    try {
      const response = await fetch('/api/crypto/BTC/USDT');
      const data = await response.json();
      
      if (data && data.price) {
        const newPrice = data.price;
        
        // Only update if price actually changed
        if (newPrice !== currentPrice) {
          console.log(`[MasterSystem] Price update: ${currentPrice} → ${newPrice}`);
          currentPrice = newPrice;
          
          // Notify all price update handlers
          priceUpdateHandlers.forEach(handler => handler(newPrice));
          
          // Broadcast price update event
          const event = new CustomEvent('priceUpdate', {
            detail: { symbol: 'BTC/USDT', price: newPrice, timestamp: Date.now() }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('[MasterSystem] Price fetch error:', error);
    }
    
    // Schedule next price update
    priceUpdateTimeout = setTimeout(fetchPrice, PRICE_UPDATE_INTERVAL_MS);
  };
  
  // Start price updates
  fetchPrice();
}

/**
 * Set up calculation timer for autonomous 3-minute intervals
 */
function setupCalculationTimer(): void {
  const runCalculation = async () => {
    if (isCalculating) {
      console.log('[MasterSystem] Calculation already in progress, skipping');
      return;
    }
    
    if (currentPrice === 0) {
      console.log('[MasterSystem] No price data available, skipping calculation');
      return;
    }
    
    const now = Date.now();
    const timeSinceLastCalc = now - lastCalculationTime;
    
    // Ensure minimum interval between calculations
    if (timeSinceLastCalc < CALCULATION_INTERVAL_MS - 5000) {
      console.log(`[MasterSystem] Too soon for calculation (${Math.round(timeSinceLastCalc/1000)}s ago)`);
      return;
    }
    
    console.log(`[MasterSystem] Starting autonomous calculation with price: ${currentPrice}`);
    isCalculating = true;
    
    try {
      const results = await performFullCalculation(currentPrice);
      
      // Notify calculation complete handlers
      calculationCompleteHandlers.forEach(handler => handler(results));
      
      // Broadcast calculation complete event
      const event = new CustomEvent('calculationComplete', {
        detail: { results, price: currentPrice, timestamp: now }
      });
      window.dispatchEvent(event);
      
      lastCalculationTime = now;
      console.log('[MasterSystem] Calculation completed successfully');
      
    } catch (error) {
      console.error('[MasterSystem] Calculation error:', error);
    } finally {
      isCalculating = false;
    }
  };
  
  // Run calculation immediately, then every 3 minutes
  setTimeout(runCalculation, 5000); // Initial delay to allow system setup
  calculationInterval = setInterval(runCalculation, CALCULATION_INTERVAL_MS);
}

/**
 * Perform full market analysis calculation
 */
async function performFullCalculation(price: number): Promise<{
  signals: AdvancedSignal[];
  recommendations: Record<TimeFrame, TradeRecommendation>;
}> {
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  const signals: AdvancedSignal[] = [];
  const recommendations: Record<TimeFrame, TradeRecommendation> = {} as any;
  
  console.log(`[MasterSystem] Calculating signals for all timeframes with price: ${price}`);
  
  for (const timeframe of timeframes) {
    try {
      const signal = await generateStreamlinedSignal('BTC/USDT', timeframe);
      if (signal) {
        signals.push(signal);
        
        // Generate trade recommendation
        const recommendation: TradeRecommendation = {
          timeframe,
          direction: signal.direction,
          confidence: signal.confidence,
          stopLoss: signal.stopLoss || (signal.direction === 'LONG' ? price * 0.95 : price * 1.05),
          takeProfit: signal.takeProfit || (signal.direction === 'LONG' ? price * 1.08 : price * 0.92),
          reasoning: `${signal.direction} signal with ${signal.confidence}% confidence`,
          riskLevel: signal.confidence > 80 ? 'LOW' : signal.confidence > 60 ? 'MEDIUM' : 'HIGH'
        };
        recommendations[timeframe] = recommendation;
        
        console.log(`[MasterSystem] ${timeframe}: ${signal.direction} (${signal.confidence}%)`);
      }
    } catch (error) {
      console.error(`[MasterSystem] Error calculating ${timeframe}:`, error);
    }
  }
  
  return { signals, recommendations };
}

/**
 * Get current system status
 */
export function getSystemStatus(): {
  isInitialized: boolean;
  isCalculating: boolean;
  currentPrice: number;
  lastCalculationTime: number;
  nextCalculationIn: number;
} {
  const now = Date.now();
  const timeSinceLastCalc = now - lastCalculationTime;
  const nextCalculationIn = Math.max(0, CALCULATION_INTERVAL_MS - timeSinceLastCalc);
  
  return {
    isInitialized,
    isCalculating,
    currentPrice,
    lastCalculationTime,
    nextCalculationIn
  };
}

/**
 * Subscribe to price updates
 */
export function subscribeToPrice(handler: (price: number) => void): () => void {
  priceUpdateHandlers.add(handler);
  
  // Immediately call with current price if available
  if (currentPrice > 0) {
    handler(currentPrice);
  }
  
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
 * Force immediate calculation (for manual triggers)
 */
export function forceCalculation(): Promise<void> {
  return new Promise((resolve) => {
    if (isCalculating) {
      console.log('[MasterSystem] Calculation in progress, cannot force');
      resolve();
      return;
    }
    
    if (currentPrice === 0) {
      console.log('[MasterSystem] No price data for forced calculation');
      resolve();
      return;
    }
    
    console.log('[MasterSystem] Force calculation requested');
    lastCalculationTime = 0; // Reset to allow immediate calculation
    
    // Trigger calculation on next tick
    setTimeout(async () => {
      try {
        isCalculating = true;
        const results = await performFullCalculation(currentPrice);
        calculationCompleteHandlers.forEach(handler => handler(results));
        
        const event = new CustomEvent('calculationComplete', {
          detail: { results, price: currentPrice, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        
        lastCalculationTime = Date.now();
      } catch (error) {
        console.error('[MasterSystem] Force calculation error:', error);
      } finally {
        isCalculating = false;
        resolve();
      }
    }, 100);
  });
}

/**
 * Get current synchronized price
 */
export function getCurrentPrice(): number {
  return currentPrice;
}

/**
 * Cleanup system resources
 */
export function cleanup(): void {
  if (calculationInterval) {
    clearInterval(calculationInterval);
    calculationInterval = null;
  }
  
  if (priceUpdateTimeout) {
    clearTimeout(priceUpdateTimeout);
    priceUpdateTimeout = null;
  }
  
  priceUpdateHandlers.clear();
  calculationCompleteHandlers.clear();
  
  isInitialized = false;
  isCalculating = false;
  currentPrice = 0;
  lastCalculationTime = 0;
  
  console.log('[MasterSystem] System cleaned up');
}