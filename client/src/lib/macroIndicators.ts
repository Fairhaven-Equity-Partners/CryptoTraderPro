/**
 * Macro Indicators Module
 * 
 * In a production app, this would be connected to real data sources like:
 * - CoinGecko API for market metrics
 * - Alternative.me for Fear & Greed Index
 * - Glassnode/Chainalysis for on-chain metrics
 * - FRED API for macroeconomic data
 * 
 * For this prototype, we use static data with small variations to simulate real API responses
 */

// Performance optimization: Cache for macro indicators
const macroCache = {
  lastFetch: 0,
  macroData: null as MacroData | null,
  environmentScore: 0,
  classification: '',
  insights: [] as string[]
};

// Cache expiration time in milliseconds (60 seconds)
const MACRO_CACHE_EXPIRATION = 60 * 1000;

export interface MacroData {
  // Market sentiment
  fearGreedIndex: number;         // 0-100 scale, <20 extreme fear, >80 extreme greed
  fearGreedClassification: string; // "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"
  
  // Market dominance metrics
  btcDominance: number;           // Bitcoin dominance percentage
  usdtDominance: number;          // Stablecoin dominance percentage
  totalStablecoinSupply: number;  // in billions USD
  
  // On-chain metrics
  exchangeFlowsNet: number;       // Net BTC flow to/from exchanges (negative = outflow)
  activeBTCAddresses: number;     // Active addresses on BTC network (24h)
  averageTransactionFee: number;  // Average BTC transaction fee in USD
  whaleTransactions: number;      // Number of transactions >$1M in last 24h
  
  // Macro economic data
  m2MoneySupply: number;          // in trillions USD
  m2ChangeYoY: number;            // Year-over-year percentage change
  fedFundsRate: number;           // Current Fed funds rate (percentage)
  
  // Correlation metrics
  btcStockCorrelation: number;    // Correlation between BTC and S&P 500 (-1 to 1)
  btcGoldCorrelation: number;     // Correlation between BTC and Gold (-1 to 1)
  
  // Updated timestamp
  lastUpdated: number;            // Unix timestamp
}

// Default values with current market estimates
const defaultMacroData: MacroData = {
  fearGreedIndex: 55,
  fearGreedClassification: "Neutral",
  btcDominance: 50.2,
  usdtDominance: 7.8,
  totalStablecoinSupply: 138.6, // billions
  exchangeFlowsNet: -2124, // negative means outflow from exchanges
  activeBTCAddresses: 781254,
  averageTransactionFee: 8.72,
  whaleTransactions: 156,
  m2MoneySupply: 20.7, // trillions
  m2ChangeYoY: 2.1,
  fedFundsRate: 5.25,
  btcStockCorrelation: 0.32,
  btcGoldCorrelation: 0.18,
  lastUpdated: Date.now()
};

// Current data storage - initially set to default values
let currentMacroData: MacroData = {...defaultMacroData};

/**
 * Generate a classification based on the fear & greed index value
 */
function getFearGreedClassification(value: number): string {
  if (value <= 20) return "Extreme Fear";
  else if (value <= 40) return "Fear";
  else if (value <= 60) return "Neutral";
  else if (value <= 80) return "Greed";
  else return "Extreme Greed";
}

/**
 * Refresh all macro indicators 
 * For this prototype, we simulate updated data with slight variations
 * In a production app, this would fetch from real data sources
 */
export async function refreshMacroIndicators(): Promise<MacroData> {
  try {
    // Simulate data refresh by adding small random variations to base values
    const randomVariation = (base: number, variance: number) => 
      base + ((Math.random() * 2 - 1) * variance);
    
    // Update timestamp and add slight variations to each value
    currentMacroData = {
      ...currentMacroData,
      fearGreedIndex: Math.min(100, Math.max(0, Math.round(randomVariation(currentMacroData.fearGreedIndex, 3)))),
      btcDominance: randomVariation(currentMacroData.btcDominance, 0.3),
      usdtDominance: randomVariation(currentMacroData.usdtDominance, 0.2),
      totalStablecoinSupply: randomVariation(currentMacroData.totalStablecoinSupply, 0.5),
      exchangeFlowsNet: randomVariation(currentMacroData.exchangeFlowsNet, 150),
      activeBTCAddresses: Math.round(randomVariation(currentMacroData.activeBTCAddresses, 5000)),
      averageTransactionFee: randomVariation(currentMacroData.averageTransactionFee, 0.5),
      whaleTransactions: Math.round(randomVariation(currentMacroData.whaleTransactions, 8)),
      lastUpdated: Date.now()
    };
    
    // Update classification based on fear/greed index
    const fearGreedIndex = currentMacroData.fearGreedIndex;
    if (fearGreedIndex <= 20) currentMacroData.fearGreedClassification = "Extreme Fear";
    else if (fearGreedIndex <= 40) currentMacroData.fearGreedClassification = "Fear";
    else if (fearGreedIndex <= 60) currentMacroData.fearGreedClassification = "Neutral";
    else if (fearGreedIndex <= 80) currentMacroData.fearGreedClassification = "Greed";
    else currentMacroData.fearGreedClassification = "Extreme Greed";
    
    return currentMacroData;
  } catch (error) {
    console.error("Error refreshing macro indicators:", error);
    
    // If refresh fails, return current data with updated timestamp
    currentMacroData.lastUpdated = Date.now();
    return currentMacroData;
  }
}

/**
 * Get current macro indicators with caching
 */
export function getMacroIndicators(): MacroData {
  const now = Date.now();
  
  // If we have a valid cached value, return it
  if (macroCache.macroData && (now - macroCache.lastFetch < MACRO_CACHE_EXPIRATION)) {
    return macroCache.macroData;
  }
  
  // Attempt to refresh in the background
  refreshMacroIndicators().catch(console.error);
  
  // Cache the current data
  macroCache.macroData = currentMacroData;
  macroCache.lastFetch = now;
  
  // Return current data
  return currentMacroData;
}

/**
 * Analyze macro environment and determine if it's supportive for crypto
 * Returns a score from 0-100 with caching for performance
 */
export function analyzeMacroEnvironment(): number {
  const now = Date.now();
  
  // If we have a valid cached value, return it
  if (macroCache.environmentScore > 0 && (now - macroCache.lastFetch < MACRO_CACHE_EXPIRATION)) {
    return macroCache.environmentScore;
  }
  
  // Get latest data
  const data = currentMacroData;
  
  // Define weights for different factors
  const weights = {
    fearGreed: 0.15,
    marketStructure: 0.15,
    onChain: 0.25,
    monetary: 0.25,
    correlations: 0.20
  };
  
  // Fear & Greed score (0-100 directly)
  const fearGreedScore = data.fearGreedIndex;
  
  // Market structure score (0-100)
  let marketStructureScore = 0;
  
  // BTC dominance factor - higher dominance is generally positive for crypto market health
  if (data.btcDominance > 60) marketStructureScore += 90;
  else if (data.btcDominance > 50) marketStructureScore += 75;
  else if (data.btcDominance > 40) marketStructureScore += 60;
  else marketStructureScore += 40;
  
  // USDT dominance factor - too high means less risk appetite, too low could mean instability
  if (data.usdtDominance > 12) marketStructureScore -= 20; // Too much stablecoin dominance
  else if (data.usdtDominance > 8) marketStructureScore -= 10;
  else if (data.usdtDominance < 3) marketStructureScore -= 10; // Too little stablecoin usage
  
  // Ensure in range
  marketStructureScore = Math.max(0, Math.min(100, marketStructureScore));
  
  // On-chain metrics score (0-100)
  let onChainScore = 50; // Start at neutral
  
  // Exchange flows - negative means outflow (bullish)
  if (data.exchangeFlowsNet < -5000) onChainScore += 30;
  else if (data.exchangeFlowsNet < -2000) onChainScore += 20;
  else if (data.exchangeFlowsNet < 0) onChainScore += 10;
  else if (data.exchangeFlowsNet > 5000) onChainScore -= 30;
  else if (data.exchangeFlowsNet > 2000) onChainScore -= 20;
  else if (data.exchangeFlowsNet > 0) onChainScore -= 10;
  
  // Active addresses - more activity is positive
  if (data.activeBTCAddresses > 1000000) onChainScore += 15;
  else if (data.activeBTCAddresses > 800000) onChainScore += 10;
  else if (data.activeBTCAddresses > 600000) onChainScore += 5;
  else if (data.activeBTCAddresses < 400000) onChainScore -= 10;
  
  // Whale transactions - more large transactions can indicate institutional interest
  if (data.whaleTransactions > 200) onChainScore += 15;
  else if (data.whaleTransactions > 150) onChainScore += 10;
  else if (data.whaleTransactions > 100) onChainScore += 5;
  else if (data.whaleTransactions < 50) onChainScore -= 10;
  
  // Ensure in range
  onChainScore = Math.max(0, Math.min(100, onChainScore));
  
  // Monetary policy score (0-100)
  let monetaryScore = 50; // Start at neutral
  
  // M2 money supply change - higher growth is bullish for crypto as inflation hedge
  if (data.m2ChangeYoY > 10) monetaryScore += 30;
  else if (data.m2ChangeYoY > 5) monetaryScore += 20;
  else if (data.m2ChangeYoY > 2) monetaryScore += 10;
  else if (data.m2ChangeYoY < 0) monetaryScore -= 20; // Monetary contraction is bearish
  
  // Fed Funds Rate - lower rates are more bullish for risk assets
  if (data.fedFundsRate < 1) monetaryScore += 20;
  else if (data.fedFundsRate < 2.5) monetaryScore += 10;
  else if (data.fedFundsRate > 5) monetaryScore -= 20;
  else if (data.fedFundsRate > 4) monetaryScore -= 10;
  
  // Ensure in range
  monetaryScore = Math.max(0, Math.min(100, monetaryScore));
  
  // Correlations score (0-100)
  let correlationsScore = 50; // Start at neutral
  
  // BTC-Stock correlation - lower correlation is more positive for crypto as a diversifier
  if (data.btcStockCorrelation < 0) correlationsScore += 25; // Negative correlation is very bullish
  else if (data.btcStockCorrelation < 0.3) correlationsScore += 15;
  else if (data.btcStockCorrelation > 0.7) correlationsScore -= 15;
  
  // BTC-Gold correlation - higher correlation can be positive for crypto as digital gold narrative
  if (data.btcGoldCorrelation > 0.5) correlationsScore += 10;
  else if (data.btcGoldCorrelation < -0.3) correlationsScore -= 10;
  
  // Ensure in range
  correlationsScore = Math.max(0, Math.min(100, correlationsScore));
  
  // Calculate weighted average score
  const finalScore = 
    (fearGreedScore * weights.fearGreed) +
    (marketStructureScore * weights.marketStructure) +
    (onChainScore * weights.onChain) +
    (monetaryScore * weights.monetary) +
    (correlationsScore * weights.correlations);
  
  // Calculate rounded score
  const roundedScore = Math.round(finalScore);
  
  // Cache the result for future use
  macroCache.environmentScore = roundedScore;
  
  // Return rounded score
  return roundedScore;
}

/**
 * Get macro environment classification with caching for performance
 */
export function getMacroEnvironmentClassification(): string {
  const now = Date.now();
  
  // If we have a valid cached value, return it
  if (macroCache.classification && (now - macroCache.lastFetch < MACRO_CACHE_EXPIRATION)) {
    return macroCache.classification;
  }
  
  const score = analyzeMacroEnvironment();
  let classification: string;
  
  if (score >= 80) classification = "Strongly Bullish";
  else if (score >= 65) classification = "Moderately Bullish";
  else if (score >= 55) classification = "Slightly Bullish";
  else if (score >= 45) classification = "Neutral";
  else if (score >= 35) classification = "Slightly Bearish";
  else if (score >= 20) classification = "Moderately Bearish";
  else classification = "Strongly Bearish";
  
  // Cache the result for future use
  macroCache.classification = classification;
  
  return classification;
}

/**
 * Get specific macro insights based on current indicators
 * With caching for performance
 */
export function getMacroInsights(): string[] {
  const now = Date.now();
  
  // If we have valid cached insights, return them
  if (macroCache.insights && macroCache.insights.length > 0 && 
      (now - macroCache.lastFetch < MACRO_CACHE_EXPIRATION)) {
    return macroCache.insights;
  }
  
  const data = currentMacroData;
  const insights: string[] = [];
  
  // Fear & Greed insights
  if (data.fearGreedIndex >= 80) {
    insights.push("Extreme greed detected - potential market top forming");
  } else if (data.fearGreedIndex <= 20) {
    insights.push("Extreme fear detected - potential buying opportunity");
  }
  
  // BTC dominance insights
  if (data.btcDominance > 60) {
    insights.push("High BTC dominance signals risk-off sentiment in crypto");
  } else if (data.btcDominance < 40) {
    insights.push("Low BTC dominance suggests alt season in progress");
  }
  
  // Exchange flow insights
  if (data.exchangeFlowsNet < -3000) {
    insights.push("Strong BTC outflow from exchanges - accumulation pattern");
  } else if (data.exchangeFlowsNet > 3000) {
    insights.push("Large BTC inflow to exchanges - potential selling pressure");
  }
  
  // Monetary policy insights
  if (data.m2ChangeYoY > 8) {
    insights.push("Rapid money supply growth may benefit inflation hedges");
  } else if (data.m2ChangeYoY < 1) {
    insights.push("Slowing money supply growth - potential macro headwind");
  }
  
  if (data.fedFundsRate > 4.5) {
    insights.push("High interest rates may pressure crypto as risk assets");
  } else if (data.fedFundsRate < 2) {
    insights.push("Low interest rates support risk asset valuations");
  }
  
  // Correlation insights
  if (data.btcStockCorrelation > 0.7) {
    insights.push("BTC highly correlated with stocks - less diversification value");
  } else if (data.btcStockCorrelation < 0) {
    insights.push("BTC negatively correlated with stocks - strong diversifier");
  }
  
  if (data.btcGoldCorrelation > 0.5) {
    insights.push("BTC-Gold correlation high - digital gold narrative strengthening");
  }
  
  // Stablecoin insights
  if (data.totalStablecoinSupply > 150) {
    insights.push("Large stablecoin supply indicates high dry powder for crypto");
  }
  
  // If we don't have enough insights, add some general ones
  if (insights.length < 3) {
    insights.push("On-chain activity shows moderate network usage");
    
    if (data.whaleTransactions > 150) {
      insights.push("Elevated whale activity indicates institutional interest");
    } else {
      insights.push("Retail dominates current market transactions");
    }
  }
  
  // Limit to 5 most important insights
  return insights.slice(0, 5);
}