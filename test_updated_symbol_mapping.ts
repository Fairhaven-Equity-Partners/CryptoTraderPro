/**
 * Updated Symbol Mapping for CoinMarketCap Integration
 * Replaces coinGeckoId with cmcSymbol for direct API compatibility
 */

export interface SymbolMapping {
  symbol: string;
  cmcSymbol: string;  // Replaced coinGeckoId
  name: string;
  category: string;
  tradingViewSymbol?: string;
}

export const TOP_50_SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Top 10
  { symbol: "BTC/USDT", cmcSymbol: "BTC", name: "Bitcoin", category: "layer1" },
  { symbol: "ETH/USDT", cmcSymbol: "ETH", name: "Ethereum", category: "layer1" },
  { symbol: "BNB/USDT", cmcSymbol: "BNB", name: "BNB", category: "exchange" },
  { symbol: "SOL/USDT", cmcSymbol: "SOL", name: "Solana", category: "layer1" },
  { symbol: "XRP/USDT", cmcSymbol: "XRP", name: "XRP", category: "altcoin" },
  { symbol: "USDC/USD", cmcSymbol: "USDC", name: "USD Coin", category: "stablecoin" },
  { symbol: "ADA/USDT", cmcSymbol: "ADA", name: "Cardano", category: "layer1" },
  { symbol: "AVAX/USDT", cmcSymbol: "AVAX", name: "Avalanche", category: "layer1" },
  { symbol: "DOGE/USDT", cmcSymbol: "DOGE", name: "Dogecoin", category: "meme" },
  { symbol: "TRX/USDT", cmcSymbol: "TRX", name: "TRON", category: "layer1" },
  
  // Additional mappings would continue...
];

export function getCMCSymbol(tradingSymbol: string): string | null {
  const mapping = TOP_50_SYMBOL_MAPPINGS.find(m => m.symbol === tradingSymbol);
  return mapping?.cmcSymbol || null;
}