/**
 * Enhanced Symbol Mapping for 100% Data Coverage
 * Ensures all 50 symbols have reliable CoinMarketCap mappings
 */

export interface SymbolMapping {
  display: string;
  cmc: string;
  fallback?: string[];
  tier: 1 | 2 | 3;
}

export const ENHANCED_SYMBOL_MAPPINGS: Record<string, SymbolMapping> = {
  // Tier 1: Top 5 - Critical pairs (60s cache)
  'BTC/USDT': { display: 'BTC/USDT', cmc: 'BTC', tier: 1 },
  'ETH/USDT': { display: 'ETH/USDT', cmc: 'ETH', tier: 1 },
  'BNB/USDT': { display: 'BNB/USDT', cmc: 'BNB', tier: 1 },
  'XRP/USDT': { display: 'XRP/USDT', cmc: 'XRP', tier: 1 },
  'SOL/USDT': { display: 'SOL/USDT', cmc: 'SOL', tier: 1 },
  
  // Tier 2: Major pairs (180s cache)
  'USDC/USD': { display: 'USDC/USD', cmc: 'USDC', fallback: ['USDC'], tier: 2 },
  'ADA/USDT': { display: 'ADA/USDT', cmc: 'ADA', tier: 2 },
  'AVAX/USDT': { display: 'AVAX/USDT', cmc: 'AVAX', tier: 2 },
  'DOGE/USDT': { display: 'DOGE/USDT', cmc: 'DOGE', tier: 2 },
  'TRX/USDT': { display: 'TRX/USDT', cmc: 'TRX', tier: 2 },
  'TON/USDT': { display: 'TON/USDT', cmc: 'TON', tier: 2 },
  'LINK/USDT': { display: 'LINK/USDT', cmc: 'LINK', tier: 2 },
  'MATIC/USDT': { display: 'MATIC/USDT', cmc: 'MATIC', fallback: ['POL'], tier: 2 },
  'SHIB/USDT': { display: 'SHIB/USDT', cmc: 'SHIB', tier: 2 },
  'LTC/USDT': { display: 'LTC/USDT', cmc: 'LTC', tier: 2 },
  'BCH/USDT': { display: 'BCH/USDT', cmc: 'BCH', tier: 2 },
  'UNI/USDT': { display: 'UNI/USDT', cmc: 'UNI', tier: 2 },
  'DOT/USDT': { display: 'DOT/USDT', cmc: 'DOT', tier: 2 },
  'XLM/USDT': { display: 'XLM/USDT', cmc: 'XLM', tier: 2 },
  'ATOM/USDT': { display: 'ATOM/USDT', cmc: 'ATOM', tier: 2 },
  
  // Tier 3: Extended pairs (300s cache) - Enhanced mappings for problematic symbols
  'XMR/USDT': { display: 'XMR/USDT', cmc: 'XMR', tier: 3 },
  'ETC/USDT': { display: 'ETC/USDT', cmc: 'ETC', tier: 3 },
  'HBAR/USDT': { display: 'HBAR/USDT', cmc: 'HBAR', tier: 3 },
  'FIL/USDT': { display: 'FIL/USDT', cmc: 'FIL', tier: 3 },
  'ICP/USDT': { display: 'ICP/USDT', cmc: 'ICP', tier: 3 },
  'VET/USDT': { display: 'VET/USDT', cmc: 'VET', tier: 3 },
  'APT/USDT': { display: 'APT/USDT', cmc: 'APT', tier: 3 },
  'NEAR/USDT': { display: 'NEAR/USDT', cmc: 'NEAR', tier: 3 },
  'AAVE/USDT': { display: 'AAVE/USDT', cmc: 'AAVE', tier: 3 },
  'ARB/USDT': { display: 'ARB/USDT', cmc: 'ARB', tier: 3 },
  'OP/USDT': { display: 'OP/USDT', cmc: 'OP', tier: 3 },
  'MKR/USDT': { display: 'MKR/USDT', cmc: 'MKR', tier: 3 },
  'GRT/USDT': { display: 'GRT/USDT', cmc: 'GRT', tier: 3 },
  'STX/USDT': { display: 'STX/USDT', cmc: 'STX', tier: 3 },
  'INJ/USDT': { display: 'INJ/USDT', cmc: 'INJ', tier: 3 },
  'ALGO/USDT': { display: 'ALGO/USDT', cmc: 'ALGO', tier: 3 },
  'LDO/USDT': { display: 'LDO/USDT', cmc: 'LDO', tier: 3 },
  'THETA/USDT': { display: 'THETA/USDT', cmc: 'THETA', tier: 3 },
  'SUI/USDT': { display: 'SUI/USDT', cmc: 'SUI', tier: 3 },
  'RUNE/USDT': { display: 'RUNE/USDT', cmc: 'RUNE', tier: 3 },
  'MANA/USDT': { display: 'MANA/USDT', cmc: 'MANA', tier: 3 },
  'SAND/USDT': { display: 'SAND/USDT', cmc: 'SAND', tier: 3 },
  'FET/USDT': { display: 'FET/USDT', cmc: 'FET', tier: 3 },
  
  // Enhanced mapping for problematic RNDR symbol with comprehensive fallbacks
  'RNDR/USDT': { display: 'RNDR/USDT', cmc: 'RNDR', fallback: ['RENDER', 'RNDR'], tier: 2 },
  
  'KAVA/USDT': { display: 'KAVA/USDT', cmc: 'KAVA', tier: 3 },
  'MINA/USDT': { display: 'MINA/USDT', cmc: 'MINA', tier: 3 },
  'FLOW/USDT': { display: 'FLOW/USDT', cmc: 'FLOW', tier: 3 },
  'XTZ/USDT': { display: 'XTZ/USDT', cmc: 'XTZ', tier: 3 },
  'BLUR/USDT': { display: 'BLUR/USDT', cmc: 'BLUR', tier: 3 },
  'QNT/USDT': { display: 'QNT/USDT', cmc: 'QNT', tier: 3 }
};

/**
 * Get CMC symbol with fallback support
 */
export function getCMCSymbol(displaySymbol: string): string[] {
  const mapping = ENHANCED_SYMBOL_MAPPINGS[displaySymbol];
  if (!mapping) return [displaySymbol.split('/')[0]];
  
  const symbols = [mapping.cmc];
  if (mapping.fallback) {
    symbols.push(...mapping.fallback);
  }
  return symbols;
}

/**
 * Get cache tier for symbol
 */
export function getSymbolTier(displaySymbol: string): number {
  return ENHANCED_SYMBOL_MAPPINGS[displaySymbol]?.tier || 3;
}

/**
 * Get all symbols by tier
 */
export function getSymbolsByTier(): Record<number, string[]> {
  const tiers: Record<number, string[]> = { 1: [], 2: [], 3: [] };
  
  Object.entries(ENHANCED_SYMBOL_MAPPINGS).forEach(([symbol, mapping]) => {
    tiers[mapping.tier].push(symbol);
  });
  
  return tiers;
}