/**
 * Optimized Symbol Mapping for Top 50 Cryptocurrencies
 * Updated to use CoinMarketCap API for real-time price data
 * Supports efficient batch price fetching for all pairs
 */

export interface SymbolMapping {
  symbol: string;
  cmcSymbol: string;
  name: string;
  category: 'major' | 'altcoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'stablecoin';
}

export const TOP_50_SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Top 10 by market cap
  { symbol: "BTC/USDT", cmcSymbol: "BTC", name: "Bitcoin", category: "major" },
  { symbol: "ETH/USDT", cmcSymbol: "ETH", name: "Ethereum", category: "major" },
  { symbol: "BNB/USDT", cmcSymbol: "BNB", name: "BNB", category: "major" },
  { symbol: "XRP/USDT", cmcSymbol: "XRP", name: "XRP", category: "major" },
  { symbol: "SOL/USDT", cmcSymbol: "SOL", name: "Solana", category: "layer1" },
  { symbol: "USDC/USD", cmcSymbol: "USDC", name: "USD Coin", category: "stablecoin" },
  { symbol: "ADA/USDT", cmcSymbol: "ADA", name: "Cardano", category: "layer1" },
  { symbol: "AVAX/USDT", cmcSymbol: "AVAX", name: "Avalanche", category: "layer1" },
  { symbol: "DOGE/USDT", cmcSymbol: "DOGE", name: "Dogecoin", category: "meme" },
  { symbol: "TRX/USDT", cmcSymbol: "TRX", name: "TRON", category: "layer1" },

  // Top 11-20
  { symbol: "TON/USDT", cmcSymbol: "TON", name: "Toncoin", category: "layer1" },
  { symbol: "LINK/USDT", cmcSymbol: "LINK", name: "Chainlink", category: "defi" },
  { symbol: "MATIC/USDT", cmcSymbol: "MATIC", name: "Polygon", category: "layer2" },
  { symbol: "SHIB/USDT", cmcSymbol: "SHIB", name: "Shiba Inu", category: "meme" },
  { symbol: "LTC/USDT", cmcSymbol: "LTC", name: "Litecoin", category: "altcoin" },
  { symbol: "BCH/USDT", cmcSymbol: "BCH", name: "Bitcoin Cash", category: "altcoin" },
  { symbol: "UNI/USDT", cmcSymbol: "UNI", name: "Uniswap", category: "defi" },
  { symbol: "DOT/USDT", cmcSymbol: "DOT", name: "Polkadot", category: "layer1" },
  { symbol: "XLM/USDT", cmcSymbol: "XLM", name: "Stellar", category: "altcoin" },
  { symbol: "ATOM/USDT", cmcSymbol: "ATOM", name: "Cosmos", category: "layer1" },

  // Top 21-30
  { symbol: "XMR/USDT", cmcSymbol: "XMR", name: "Monero", category: "altcoin" },
  { symbol: "ETC/USDT", cmcSymbol: "ETC", name: "Ethereum Classic", category: "altcoin" },
  { symbol: "HBAR/USDT", cmcSymbol: "HBAR", name: "Hedera", category: "altcoin" },
  { symbol: "FIL/USDT", cmcSymbol: "FIL", name: "Filecoin", category: "altcoin" },
  { symbol: "ICP/USDT", cmcSymbol: "ICP", name: "Internet Computer", category: "layer1" },
  { symbol: "VET/USDT", cmcSymbol: "VET", name: "VeChain", category: "altcoin" },
  { symbol: "APT/USDT", cmcSymbol: "APT", name: "Aptos", category: "layer1" },
  { symbol: "NEAR/USDT", cmcSymbol: "NEAR", name: "NEAR Protocol", category: "layer1" },
  { symbol: "AAVE/USDT", cmcSymbol: "AAVE", name: "Aave", category: "defi" },
  { symbol: "ARB/USDT", cmcSymbol: "ARB", name: "Arbitrum", category: "layer2" },

  // Top 31-40
  { symbol: "OP/USDT", cmcSymbol: "OP", name: "Optimism", category: "layer2" },
  { symbol: "MKR/USDT", cmcSymbol: "MKR", name: "Maker", category: "defi" },
  { symbol: "GRT/USDT", cmcSymbol: "GRT", name: "The Graph", category: "defi" },
  { symbol: "STX/USDT", cmcSymbol: "STX", name: "Stacks", category: "layer1" },
  { symbol: "INJ/USDT", cmcSymbol: "INJ", name: "Injective", category: "layer1" },
  { symbol: "ALGO/USDT", cmcSymbol: "ALGO", name: "Algorand", category: "layer1" },
  { symbol: "LDO/USDT", cmcSymbol: "LDO", name: "Lido DAO", category: "defi" },
  { symbol: "THETA/USDT", cmcSymbol: "THETA", name: "Theta Network", category: "altcoin" },
  { symbol: "SUI/USDT", cmcSymbol: "SUI", name: "Sui", category: "layer1" },
  { symbol: "RUNE/USDT", cmcSymbol: "RUNE", name: "THORChain", category: "defi" },

  // Top 41-50
  { symbol: "MANA/USDT", cmcSymbol: "MANA", name: "Decentraland", category: "defi" },
  { symbol: "SAND/USDT", cmcSymbol: "SAND", name: "The Sandbox", category: "defi" },
  { symbol: "FET/USDT", cmcSymbol: "FET", name: "Fetch.ai", category: "defi" },
  { symbol: "RNDR/USDT", cmcSymbol: "RNDR", name: "Render", category: "defi" },
  { symbol: "KAVA/USDT", cmcSymbol: "KAVA", name: "Kava", category: "layer1" },
  { symbol: "MINA/USDT", cmcSymbol: "MINA", name: "Mina", category: "layer1" },
  { symbol: "FLOW/USDT", cmcSymbol: "FLOW", name: "Flow", category: "layer1" },
  { symbol: "XTZ/USDT", cmcSymbol: "XTZ", name: "Tezos", category: "altcoin" },
  { symbol: "BLUR/USDT", cmcSymbol: "BLUR", name: "Blur", category: "defi" },
  { symbol: "QNT/USDT", cmcSymbol: "QNT", name: "Quant", category: "altcoin" }
];

/**
 * Get CoinMarketCap symbol for a trading symbol
 */
export function getCMCSymbol(symbol: string): string | null {
  const mapping = TOP_50_SYMBOL_MAPPINGS.find(m => m.symbol === symbol);
  return mapping ? mapping.cmcSymbol : null;
}

/**
 * Get symbol information
 */
export function getSymbolInfo(symbol: string): SymbolMapping | null {
  return TOP_50_SYMBOL_MAPPINGS.find(m => m.symbol === symbol) || null;
}

/**
 * Get all supported symbols
 */
export function getAllSupportedSymbols(): string[] {
  return TOP_50_SYMBOL_MAPPINGS.map(m => m.symbol);
}

/**
 * Get symbols by category
 */
export function getSymbolsByCategory(category: string): SymbolMapping[] {
  return TOP_50_SYMBOL_MAPPINGS.filter(m => m.category === category);
}

/**
 * Check if symbol is supported
 */
export function isSymbolSupported(symbol: string): boolean {
  return TOP_50_SYMBOL_MAPPINGS.some(m => m.symbol === symbol);
}

/**
 * Rate limiting calculation:
 * 50 symbols × 1 request per symbol = 50 requests
 * With 4-minute intervals = 12.5 requests/minute
 * Well within CoinMarketCap API limits
 */
export const RATE_LIMIT_INFO = {
  totalSymbols: TOP_50_SYMBOL_MAPPINGS.length,
  intervalMinutes: 4,
  requestsPerInterval: TOP_50_SYMBOL_MAPPINGS.length,
  requestsPerMinute: TOP_50_SYMBOL_MAPPINGS.length / 4,
  coinGeckoFreeLimit: 50
};