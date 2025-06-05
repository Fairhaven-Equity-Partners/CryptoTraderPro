/**
 * Optimized Symbol Mapping for Top 50 Cryptocurrencies
 * Designed to work within CoinGecko free tier rate limits (50 requests/minute)
 * With 4-minute intervals, supports sustainable price fetching for all pairs
 */

export interface SymbolMapping {
  symbol: string;
  coinGeckoId: string;
  name: string;
  category: 'major' | 'altcoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'stablecoin';
}

export const TOP_50_SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Top 10 by market cap
  { symbol: "BTC/USDT", coinGeckoId: "bitcoin", name: "Bitcoin", category: "major" },
  { symbol: "ETH/USDT", coinGeckoId: "ethereum", name: "Ethereum", category: "major" },
  { symbol: "BNB/USDT", coinGeckoId: "binancecoin", name: "BNB", category: "major" },
  { symbol: "XRP/USDT", coinGeckoId: "ripple", name: "XRP", category: "major" },
  { symbol: "SOL/USDT", coinGeckoId: "solana", name: "Solana", category: "layer1" },
  { symbol: "USDC/USD", coinGeckoId: "usd-coin", name: "USD Coin", category: "stablecoin" },
  { symbol: "ADA/USDT", coinGeckoId: "cardano", name: "Cardano", category: "layer1" },
  { symbol: "AVAX/USDT", coinGeckoId: "avalanche-2", name: "Avalanche", category: "layer1" },
  { symbol: "DOGE/USDT", coinGeckoId: "dogecoin", name: "Dogecoin", category: "meme" },
  { symbol: "TRX/USDT", coinGeckoId: "tron", name: "TRON", category: "layer1" },

  // Top 11-20
  { symbol: "TON/USDT", coinGeckoId: "the-open-network", name: "Toncoin", category: "layer1" },
  { symbol: "LINK/USDT", coinGeckoId: "chainlink", name: "Chainlink", category: "defi" },
  { symbol: "MATIC/USDT", coinGeckoId: "matic-network", name: "Polygon", category: "layer2" },
  { symbol: "SHIB/USDT", coinGeckoId: "shiba-inu", name: "Shiba Inu", category: "meme" },
  { symbol: "LTC/USDT", coinGeckoId: "litecoin", name: "Litecoin", category: "altcoin" },
  { symbol: "BCH/USDT", coinGeckoId: "bitcoin-cash", name: "Bitcoin Cash", category: "altcoin" },
  { symbol: "UNI/USDT", coinGeckoId: "uniswap", name: "Uniswap", category: "defi" },
  { symbol: "DOT/USDT", coinGeckoId: "polkadot", name: "Polkadot", category: "layer1" },
  { symbol: "XLM/USDT", coinGeckoId: "stellar", name: "Stellar", category: "altcoin" },
  { symbol: "ATOM/USDT", coinGeckoId: "cosmos", name: "Cosmos", category: "layer1" },

  // Top 21-30
  { symbol: "XMR/USDT", coinGeckoId: "monero", name: "Monero", category: "altcoin" },
  { symbol: "ETC/USDT", coinGeckoId: "ethereum-classic", name: "Ethereum Classic", category: "altcoin" },
  { symbol: "HBAR/USDT", coinGeckoId: "hedera-hashgraph", name: "Hedera", category: "altcoin" },
  { symbol: "FIL/USDT", coinGeckoId: "filecoin", name: "Filecoin", category: "altcoin" },
  { symbol: "ICP/USDT", coinGeckoId: "internet-computer", name: "Internet Computer", category: "layer1" },
  { symbol: "VET/USDT", coinGeckoId: "vechain", name: "VeChain", category: "altcoin" },
  { symbol: "APT/USDT", coinGeckoId: "aptos", name: "Aptos", category: "layer1" },
  { symbol: "NEAR/USDT", coinGeckoId: "near", name: "NEAR Protocol", category: "layer1" },
  { symbol: "AAVE/USDT", coinGeckoId: "aave", name: "Aave", category: "defi" },
  { symbol: "ARB/USDT", coinGeckoId: "arbitrum", name: "Arbitrum", category: "layer2" },

  // Top 31-40
  { symbol: "OP/USDT", coinGeckoId: "optimism", name: "Optimism", category: "layer2" },
  { symbol: "MKR/USDT", coinGeckoId: "maker", name: "Maker", category: "defi" },
  { symbol: "GRT/USDT", coinGeckoId: "the-graph", name: "The Graph", category: "defi" },
  { symbol: "STX/USDT", coinGeckoId: "blockstack", name: "Stacks", category: "layer1" },
  { symbol: "INJ/USDT", coinGeckoId: "injective-protocol", name: "Injective", category: "layer1" },
  { symbol: "ALGO/USDT", coinGeckoId: "algorand", name: "Algorand", category: "layer1" },
  { symbol: "LDO/USDT", coinGeckoId: "lido-dao", name: "Lido DAO", category: "defi" },
  { symbol: "THETA/USDT", coinGeckoId: "theta-token", name: "Theta Network", category: "altcoin" },
  { symbol: "SUI/USDT", coinGeckoId: "sui", name: "Sui", category: "layer1" },
  { symbol: "RUNE/USDT", coinGeckoId: "thorchain", name: "THORChain", category: "defi" },

  // Top 41-50
  { symbol: "MANA/USDT", coinGeckoId: "decentraland", name: "Decentraland", category: "defi" },
  { symbol: "SAND/USDT", coinGeckoId: "the-sandbox", name: "The Sandbox", category: "defi" },
  { symbol: "FET/USDT", coinGeckoId: "fetch-ai", name: "Fetch.ai", category: "defi" },
  { symbol: "RNDR/USDT", coinGeckoId: "render-token", name: "Render", category: "defi" },
  { symbol: "KAVA/USDT", coinGeckoId: "kava", name: "Kava", category: "layer1" },
  { symbol: "MINA/USDT", coinGeckoId: "mina-protocol", name: "Mina", category: "layer1" },
  { symbol: "FLOW/USDT", coinGeckoId: "flow", name: "Flow", category: "layer1" },
  { symbol: "XTZ/USDT", coinGeckoId: "tezos", name: "Tezos", category: "altcoin" },
  { symbol: "BLUR/USDT", coinGeckoId: "blur", name: "Blur", category: "defi" },
  { symbol: "QNT/USDT", coinGeckoId: "quant-network", name: "Quant", category: "altcoin" }
];

/**
 * Get CoinGecko ID for a symbol
 */
export function getCoinGeckoId(symbol: string): string | null {
  const mapping = TOP_50_SYMBOL_MAPPINGS.find(m => m.symbol === symbol);
  return mapping ? mapping.coinGeckoId : null;
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
 * Well within CoinGecko free tier limit of 50 requests/minute
 */
export const RATE_LIMIT_INFO = {
  totalSymbols: TOP_50_SYMBOL_MAPPINGS.length,
  intervalMinutes: 4,
  requestsPerInterval: TOP_50_SYMBOL_MAPPINGS.length,
  requestsPerMinute: TOP_50_SYMBOL_MAPPINGS.length / 4,
  coinGeckoFreeLimit: 50
};