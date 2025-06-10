/**
 * Legacy symbol mapping - deprecated in favor of optimizedSymbolMapping.ts
 * This file is kept for backward compatibility only
 */

export interface SymbolMapping {
  symbol: string;
  coinGeckoId: string;
  name: string;
  category: 'major' | 'altcoin' | 'defi' | 'layer1' | 'layer2' | 'meme' | 'stablecoin';
}

export const SYMBOL_MAPPINGS: SymbolMapping[] = [
  // Major cryptocurrencies
  { symbol: "BTC/USDT", coinGeckoId: "bitcoin", name: "Bitcoin", category: "major" },
  { symbol: "ETH/USDT", coinGeckoId: "ethereum", name: "Ethereum", category: "major" },
  { symbol: "BNB/USDT", coinGeckoId: "binancecoin", name: "Binance Coin", category: "major" },
  { symbol: "XRP/USDT", coinGeckoId: "ripple", name: "Ripple", category: "major" },
  { symbol: "SOL/USDT", coinGeckoId: "solana", name: "Solana", category: "layer1" },
  
  // Layer 1 blockchains
  { symbol: "ADA/USDT", coinGeckoId: "cardano", name: "Cardano", category: "layer1" },
  { symbol: "AVAX/USDT", coinGeckoId: "avalanche-2", name: "Avalanche", category: "layer1" },
  { symbol: "DOT/USDT", coinGeckoId: "polkadot", name: "Polkadot", category: "layer1" },
  { symbol: "ATOM/USDT", coinGeckoId: "cosmos", name: "Cosmos", category: "layer1" },
  { symbol: "NEAR/USDT", coinGeckoId: "near", name: "NEAR Protocol", category: "layer1" },
  { symbol: "ALGO/USDT", coinGeckoId: "algorand", name: "Algorand", category: "layer1" },
  { symbol: "ICP/USDT", coinGeckoId: "internet-computer", name: "Internet Computer", category: "layer1" },
  { symbol: "APT/USDT", coinGeckoId: "aptos", name: "Aptos", category: "layer1" },
  { symbol: "FLOW/USDT", coinGeckoId: "flow", name: "Flow", category: "layer1" },
  { symbol: "KAS/USDT", coinGeckoId: "kaspa", name: "Kaspa", category: "layer1" },
  
  // Layer 2 and scaling solutions
  { symbol: "MATIC/USDT", coinGeckoId: "matic-network", name: "Polygon", category: "layer2" },
  { symbol: "OP/USDT", coinGeckoId: "optimism", name: "Optimism", category: "layer2" },
  { symbol: "ARB/USDT", coinGeckoId: "arbitrum", name: "Arbitrum", category: "layer2" },
  { symbol: "IMX/USDT", coinGeckoId: "immutable-x", name: "Immutable", category: "layer2" },
  
  // DeFi tokens
  { symbol: "UNI/USDT", coinGeckoId: "uniswap", name: "Uniswap", category: "defi" },
  { symbol: "LINK/USDT", coinGeckoId: "chainlink", name: "Chainlink", category: "defi" },
  { symbol: "AAVE/USDT", coinGeckoId: "aave", name: "Aave", category: "defi" },
  { symbol: "MKR/USDT", coinGeckoId: "maker", name: "Maker", category: "defi" },
  { symbol: "RUNE/USDT", coinGeckoId: "thorchain", name: "THORChain", category: "defi" },
  { symbol: "CRV/USDT", coinGeckoId: "curve-dao-token", name: "Curve DAO", category: "defi" },
  { symbol: "DYDX/USDT", coinGeckoId: "dydx", name: "dYdX", category: "defi" },
  { symbol: "1INCH/USDT", coinGeckoId: "1inch", name: "1inch", category: "defi" },
  { symbol: "SUSHI/USDT", coinGeckoId: "sushi", name: "SushiSwap", category: "defi" },
  { symbol: "SNX/USDT", coinGeckoId: "havven", name: "Synthetix", category: "defi" },
  
  // Altcoins and utilities
  { symbol: "LTC/USDT", coinGeckoId: "litecoin", name: "Litecoin", category: "altcoin" },
  { symbol: "BCH/USDT", coinGeckoId: "bitcoin-cash", name: "Bitcoin Cash", category: "altcoin" },
  { symbol: "XLM/USDT", coinGeckoId: "stellar", name: "Stellar", category: "altcoin" },
  { symbol: "VET/USDT", coinGeckoId: "vechain", name: "VeChain", category: "altcoin" },
  { symbol: "FIL/USDT", coinGeckoId: "filecoin", name: "Filecoin", category: "altcoin" },
  { symbol: "HBAR/USDT", coinGeckoId: "hedera-hashgraph", name: "Hedera", category: "altcoin" },
  { symbol: "XMR/USDT", coinGeckoId: "monero", name: "Monero", category: "altcoin" },
  { symbol: "TRX/USDT", coinGeckoId: "tron", name: "TRON", category: "altcoin" },
  { symbol: "EOS/USDT", coinGeckoId: "eos", name: "EOS", category: "altcoin" },
  { symbol: "XTZ/USDT", coinGeckoId: "tezos", name: "Tezos", category: "altcoin" },
  { symbol: "NEO/USDT", coinGeckoId: "neo", name: "Neo", category: "altcoin" },
  { symbol: "IOTA/USDT", coinGeckoId: "iota", name: "IOTA", category: "altcoin" },
  { symbol: "XDC/USDT", coinGeckoId: "xdce-crowd-sale", name: "XinFin Network", category: "altcoin" },
  
  // Gaming and NFT tokens
  { symbol: "SAND/USDT", coinGeckoId: "the-sandbox", name: "The Sandbox", category: "defi" },
  { symbol: "MANA/USDT", coinGeckoId: "decentraland", name: "Decentraland", category: "defi" },
  { symbol: "AXS/USDT", coinGeckoId: "axie-infinity", name: "Axie Infinity", category: "defi" },
  { symbol: "ENJ/USDT", coinGeckoId: "enjincoin", name: "Enjin Coin", category: "defi" },
  { symbol: "CHZ/USDT", coinGeckoId: "chiliz", name: "Chiliz", category: "defi" },
  
  // Meme coins
  { symbol: "DOGE/USDT", coinGeckoId: "dogecoin", name: "Dogecoin", category: "meme" },
  { symbol: "SHIB/USDT", coinGeckoId: "shiba-inu", name: "Shiba Inu", category: "meme" },
  
  // Infrastructure and data
  { symbol: "GRT/USDT", coinGeckoId: "the-graph", name: "The Graph", category: "defi" },
  { symbol: "AR/USDT", coinGeckoId: "arweave", name: "Arweave", category: "altcoin" },
  { symbol: "API3/USDT", coinGeckoId: "api3", name: "API3", category: "defi" },
  { symbol: "BAND/USDT", coinGeckoId: "band-protocol", name: "Band Protocol", category: "defi" },
  { symbol: "OCEAN/USDT", coinGeckoId: "ocean-protocol", name: "Ocean Protocol", category: "defi" },
  
  // Privacy coins
  { symbol: "ZEC/USDT", coinGeckoId: "zcash", name: "Zcash", category: "altcoin" },
  { symbol: "DASH/USDT", coinGeckoId: "dash", name: "Dash", category: "altcoin" },
  
  // Stablecoins
  { symbol: "USDT/USD", coinGeckoId: "tether", name: "Tether", category: "stablecoin" },
  { symbol: "USDC/USD", coinGeckoId: "usd-coin", name: "USD Coin", category: "stablecoin" },
  { symbol: "BUSD/USD", coinGeckoId: "binance-usd", name: "Binance USD", category: "stablecoin" },
  { symbol: "DAI/USD", coinGeckoId: "dai", name: "Dai", category: "stablecoin" },
  
  // Exchange tokens
  { symbol: "LEO/USDT", coinGeckoId: "leo-token", name: "UNUS SED LEO", category: "altcoin" },
  { symbol: "HT/USDT", coinGeckoId: "huobi-token", name: "Huobi Token", category: "altcoin" },
  { symbol: "OKB/USDT", coinGeckoId: "okb", name: "OKB", category: "altcoin" },
  
  // AI and data tokens
  { symbol: "FET/USDT", coinGeckoId: "fetch-ai", name: "Fetch.ai", category: "defi" },
  { symbol: "AGIX/USDT", coinGeckoId: "singularitynet", name: "SingularityNET", category: "defi" },
  { symbol: "RNDR/USDT", coinGeckoId: "render-token", name: "Render", category: "defi" },
  
  // Additional popular tokens
  { symbol: "INJ/USDT", coinGeckoId: "injective-protocol", name: "Injective", category: "defi" },
  { symbol: "TON/USDT", coinGeckoId: "the-open-network", name: "Toncoin", category: "layer1" },
  { symbol: "SUI/USDT", coinGeckoId: "sui", name: "Sui", category: "layer1" },
  { symbol: "THETA/USDT", coinGeckoId: "theta-token", name: "Theta", category: "altcoin" },
  { symbol: "KAVA/USDT", coinGeckoId: "kava", name: "Kava", category: "defi" },
  { symbol: "MINA/USDT", coinGeckoId: "mina-protocol", name: "Mina", category: "layer1" },
  { symbol: "BLUR/USDT", coinGeckoId: "blur", name: "Blur", category: "defi" },
  { symbol: "LDO/USDT", coinGeckoId: "lido-dao", name: "Lido DAO", category: "defi" },
  { symbol: "STX/USDT", coinGeckoId: "blockstack", name: "Stacks", category: "layer2" },
  { symbol: "QNT/USDT", coinGeckoId: "quant-network", name: "Quant", category: "altcoin" }
];

/**
 * Get CoinGecko ID for a symbol
 */
export // Deprecated - use getCMCSymbol from optimizedSymbolMapping.ts instead
function getCoinGeckoId(symbol: string): string | null {
  const { getCMCSymbol } = require('./optimizedSymbolMapping.js');
  return getCMCSymbol(symbol);
}

/**
 * Get symbol information
 */
export function getSymbolInfo(symbol: string): SymbolMapping | null {
  return SYMBOL_MAPPINGS.find(m => m.symbol === symbol) || null;
}

/**
 * Get all supported symbols
 */
export function getAllSupportedSymbols(): string[] {
  return SYMBOL_MAPPINGS.map(m => m.symbol);
}

/**
 * Get symbols by category
 */
export function getSymbolsByCategory(category: string): SymbolMapping[] {
  return SYMBOL_MAPPINGS.filter(m => m.category === category);
}

/**
 * Check if symbol is supported
 */
export function isSymbolSupported(symbol: string): boolean {
  return SYMBOL_MAPPINGS.some(m => m.symbol === symbol);
}