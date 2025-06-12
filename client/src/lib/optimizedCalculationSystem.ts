/**
 * Optimized Calculation System
 * 
 * This system synchronizes price updates with calculations
 * ensuring accurate trading recommendations while preserving
 * the existing familiar UI display format.
 */

import { TimeFrame } from './advancedSignals';
import { 
  calculateIndicators, 
  generatePatternFormations,
  analyzeMacroTrends
} from './technicalIndicators';
import { stabilizeSignals } from './signalStabilizer';

// Storage for last signal results to prevent flip-flopping
const lastSignalsBySymbol: Record<string, Record<TimeFrame, any>> = {};

// Track last calculation times to prevent excessive recalculations
const lastCalculationTimes: Record<string, number> = {};

// Minimum time between calculations for the same symbol (in milliseconds)
const MIN_CALCULATION_INTERVAL = 10000; // 10 seconds

/**
 * Initialize the optimized calculation system
 */
export function initOptimizedCalculations() {
  // Set up event listeners for price updates
  window.addEventListener('price-update', handlePriceUpdate as EventListener);
  window.addEventListener('live-price-update', handlePriceUpdate as EventListener);return () => {
    // Cleanup function
    window.removeEventListener('price-update', handlePriceUpdate as EventListener);
    window.removeEventListener('live-price-update', handlePriceUpdate as EventListener);
  };
}

/**
 * Handle price update events
 */
function handlePriceUpdate(event: Event) {
  const customEvent = event as CustomEvent<{symbol: string, price: number}>;
  const { symbol, price } = customEvent.detail;
  
  // Check if we need to calculate based on timing
  const now = Date.now();
  const lastCalcTime = lastCalculationTimes[symbol] || 0;
  
  if (now - lastCalcTime < MIN_CALCULATION_INTERVAL) {return;
  }// Update last calculation time
  lastCalculationTimes[symbol] = now;
  
  // Perform calculation and broadcast results
  calculateForSymbol(symbol, price);
}

/**
 * Calculate signals for a symbol across all timeframes
 */
function calculateForSymbol(symbol: string, price: number) {
  // List of timeframes to calculate
  const timeframes: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
  
  // Store calculation results
  const results: Record<TimeFrame, any> = {} as any;
  
  // Get previous signals for this symbol
  const previousSignals = lastSignalsBySymbol[symbol] || {};
  
  // Calculate for each timeframe
  timeframes.forEach(timeframe => {
    try {
      // Get the previous signal for this timeframe if available
      const previousSignal = previousSignals[timeframe];
      
      // Calculate indicators based on technical analysis
      const technicalResults = calculateIndicators(symbol, price, timeframe);
      
      // Generate pattern formations
      const patterns = generatePatternFormations(symbol, price, timeframe);
      
      // Analyze macro trends
      const macroInsights = analyzeMacroTrends(symbol, price, timeframe);
      
      // Create a complete signal
      let signal = {
        direction: technicalResults.direction,
        confidence: technicalResults.confidence,
        entryPrice: price,
        stopLoss: technicalResults.stopLoss || (technicalResults.direction === 'LONG' ? price * 0.97 : price * 1.03),
        takeProfit: technicalResults.takeProfit || (technicalResults.direction === 'LONG' ? price * 1.05 : price * 0.95),
        indicators: technicalResults.indicators || {},
        environment: technicalResults.environment || {},
        timeframe: timeframe,
        patternFormations: patterns,
        supportLevels: technicalResults.supports || [price * 0.97, price * 0.95, price * 0.93],
        resistanceLevels: technicalResults.resistances || [price * 1.03, price * 1.05, price * 1.07],
        successProbability: technicalResults.successProbability || 
          (technicalResults.confidence > 70 ? 80 : technicalResults.confidence > 50 ? 65 : 50),
        macroInsights: macroInsights,
        timestamp: Date.now()
      };
      
      // Apply signal stabilization if we have a previous signal
      if (previousSignal) {
        signal = stabilizeSignals(signal, previousSignal);
      }
      
      // Store result
      results[timeframe] = signal;
    } catch (error) {// Use previous signal if available, otherwise null
      results[timeframe] = previousSignals[timeframe] || null;
    }
  });
  
  // Store results for future reference
  lastSignalsBySymbol[symbol] = results;
  
  // Broadcast results
  const calculationEvent = new CustomEvent('calculation-complete', {
    detail: {
      symbol,
      price,
      results,
      timestamp: Date.now()
    }
  });
  
  window.dispatchEvent(calculationEvent);}

/**
 * Get cached signals for a symbol
 */
export function getCachedSignals(symbol: string): Record<TimeFrame, any> | null {
  return lastSignalsBySymbol[symbol] || null;
}

/**
 * Manually trigger a calculation for a symbol
 */
export function triggerCalculation(symbol: string, price: number) {calculateForSymbol(symbol, price);
}

/**
 * Register a listener for calculation results
 */
export function onCalculationComplete(callback: (data: any) => void) {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };
  
  window.addEventListener('calculation-complete', listener as EventListener);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('calculation-complete', listener as EventListener);
  };
}