// Type definitions for global window object
// This enables TypeScript to recognize custom properties and methods

declare global {
  interface Window {
    // Price system properties
    _priceSystemInitialized?: boolean;
    latestPriceEvents: Record<string, { price: number, timestamp: number }>;
    syncGlobalPrice: (symbol: string, price: number, timestamp?: number) => number;
    
    // Calculation triggers
    triggerCalculation: (symbol: string, price: number) => void;
  }
}