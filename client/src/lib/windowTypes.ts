/**
 * Type augmentation for the browser window object
 * 
 * This file adds proper TypeScript definitions for our global objects that are
 * accessible from the window, making them available to all components without
 * explicit imports.
 */

import { ChartData, TimeFrame, SignalDirection, TechnicalIndicators, SignalStabilizationSystem, PriceEvent } from '../types';

// Extend the Window interface to include our technical indicators
declare global {
  interface Window {
    // Price synchronization utilities
    latestPriceEvents: Record<string, PriceEvent>;
    syncGlobalPrice: (symbol: string, price: number, timestamp?: number) => number;
    
    // Technical indicator utilities
    technicalIndicators?: TechnicalIndicators;
    
    // Signal stabilization system
    signalStabilizationSystem?: SignalStabilizationSystem;
    
    // Support and resistance functions
    generateSupportLevels?: (price: number, data: ChartData[]) => number[];
    generateResistanceLevels?: (price: number, data: ChartData[]) => number[];
  }
}

// No exports needed as this is solely for type augmentation