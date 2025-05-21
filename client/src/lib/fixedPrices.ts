/**
 * Fixed Price Reference System
 * 
 * A central source of truth for all price displays in the application.
 * All components MUST use these exact values to ensure consistency.
 */

// Global registry of fixed prices 
// IMPORTANT: These EXACT values must be used by all components
export const FIXED_PRICES: Record<string, number> = {
  'BTC/USDT': 107063.00,
  'ETH/USDT': 2549.17,
  'SOL/USDT': 170.33,
  'BNB/USDT': 657.12,
  'XRP/USDT': 2.36,
  'DOGE/USDT': 0.13,
  'ADA/USDT': 0.48
};

/**
 * Get the fixed reference price for a cryptocurrency
 */
export function getFixedPrice(symbol: string): number {
  return FIXED_PRICES[symbol] || 0;
}