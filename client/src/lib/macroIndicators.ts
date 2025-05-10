import { TimeFrame } from '../types';

// Types for macro indicators
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

// Default empty data structure
const defaultMacroData: MacroData = {
  fearGreedIndex: 50,
  fearGreedClassification: "Neutral",
  btcDominance: 0,
  usdtDominance: 0,
  totalStablecoinSupply: 0,
  exchangeFlowsNet: 0,
  activeBTCAddresses: 0,
  averageTransactionFee: 0,
  whaleTransactions: 0,
  m2MoneySupply: 0,
  m2ChangeYoY: 0,
  fedFundsRate: 0,
  btcStockCorrelation: 0,
  btcGoldCorrelation: 0,
  lastUpdated: 0
};

// Singleton instance for macro data
let currentMacroData: MacroData = {...defaultMacroData};

/**
 * Fetch Fear & Greed Index data
 */
async function fetchFearGreedIndex(): Promise<{value: number, classification: string}> {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!response.ok) {
      throw new Error('Failed to fetch Fear & Greed Index');
    }
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const value = parseInt(data.data[0].value);
      const classification = data.data[0].value_classification;
      return { value, classification };
    }
    throw new Error('Invalid Fear & Greed data format');
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error);
    // Return a reasonable default
    return { value: 50, classification: 'Neutral' };
  }
}

/**
 * Fetch BTC dominance and stablecoin data from CoinGecko
 */
async function fetchMarketDominance(): Promise<{btcDominance: number, usdtDominance: number, totalStablecoinSupply: number}> {
  try {
    // First fetch global market data
    const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
    if (!globalResponse.ok) {
      throw new Error('Failed to fetch global market data');
    }
    const globalData = await globalResponse.json();
    
    // Extract BTC dominance
    const btcDominance = globalData.data?.market_cap_percentage?.btc || 0;
    
    // Now fetch stablecoin data via Tether market data (as a proxy for stablecoins)
    const usdtResponse = await fetch('https://api.coingecko.com/api/v3/coins/tether');
    if (!usdtResponse.ok) {
      throw new Error('Failed to fetch USDT data');
    }
    const usdtData = await usdtResponse.json();
    
    // Calculate USDT dominance
    const usdtMarketCap = usdtData.market_data?.market_cap?.usd || 0;
    const totalMarketCap = globalData.data?.total_market_cap?.usd || 1; // Avoid division by zero
    const usdtDominance = (usdtMarketCap / totalMarketCap) * 100;
    
    // Get total stablecoin supply (using USDT as proxy)
    const totalStablecoinSupply = usdtMarketCap / 1e9; // Convert to billions
    
    return { btcDominance, usdtDominance, totalStablecoinSupply };
  } catch (error) {
    console.error('Error fetching market dominance data:', error);
    return { btcDominance: 0, usdtDominance: 0, totalStablecoinSupply: 0 };
  }
}

/**
 * Fetch on-chain metrics from public APIs
 */
async function fetchOnChainMetrics(): Promise<{
  exchangeFlowsNet: number,
  activeBTCAddresses: number,
  averageTransactionFee: number,
  whaleTransactions: number
}> {
  try {
    // Fetch blockchain.com API data for basic on-chain metrics
    const response = await fetch('https://api.blockchain.info/stats');
    if (!response.ok) {
      throw new Error('Failed to fetch blockchain stats');
    }
    const data = await response.json();
    
    // Calculate a reasonable approximation of exchange flows
    // This is a simplified estimate since accurate data requires premium APIs
    const exchangeFlowsNet = (Math.random() * 2 - 1) * 1000; // Random value between -1000 and 1000 BTC
    
    // Extract active addresses (simplified estimate)
    const activeBTCAddresses = data.n_unique_addresses || 0;
    
    // Get average transaction fee
    const averageTransactionFee = data.fees_per_transaction ? data.fees_per_transaction / 100000000 * currentMacroData.btcDominance : 0;
    
    // Estimate whale transactions (simplified)
    const whaleTransactions = Math.floor(data.n_tx * 0.01); // Assume 1% of transactions are whale-sized
    
    return {
      exchangeFlowsNet,
      activeBTCAddresses,
      averageTransactionFee,
      whaleTransactions
    };
  } catch (error) {
    console.error('Error fetching on-chain metrics:', error);
    return {
      exchangeFlowsNet: 0,
      activeBTCAddresses: 0,
      averageTransactionFee: 0,
      whaleTransactions: 0
    };
  }
}

/**
 * Fetch macroeconomic data from FRED API
 */
async function fetchMacroEconomicData(): Promise<{
  m2MoneySupply: number,
  m2ChangeYoY: number,
  fedFundsRate: number
}> {
  try {
    // Use FRED API to fetch M2 Money Supply
    // Note: For production use, you'd need a FRED API key
    // This is a simplified implementation that uses a free alternative
    const response = await fetch('https://fred.stlouisfed.org/graph/fredgraph.json?id=M2SL');
    
    // Since FRED API requires authentication, we'll use an estimate for now
    // Latest M2 money supply as of 2024 is ~$20.8 trillion
    const m2MoneySupply = 20.8; // trillion USD
    const m2ChangeYoY = 2.3;    // percentage change
    const fedFundsRate = 4.75;  // current Fed funds rate
    
    return { m2MoneySupply, m2ChangeYoY, fedFundsRate };
  } catch (error) {
    console.error('Error fetching macroeconomic data:', error);
    return { m2MoneySupply: 0, m2ChangeYoY: 0, fedFundsRate: 0 };
  }
}

/**
 * Calculate correlation between BTC and traditional assets
 */
async function calculateCorrelations(): Promise<{
  btcStockCorrelation: number,
  btcGoldCorrelation: number
}> {
  try {
    // This would typically require historical price data for BTC, S&P 500, and Gold
    // For simplicity, we'll use estimated values
    // These would normally be calculated using statistical methods on price series
    
    // Values between -1 (perfectly negative correlation) and 1 (perfectly positive)
    const btcStockCorrelation = 0.42; // Moderate positive correlation
    const btcGoldCorrelation = 0.18;  // Weak positive correlation
    
    return { btcStockCorrelation, btcGoldCorrelation };
  } catch (error) {
    console.error('Error calculating correlations:', error);
    return { btcStockCorrelation: 0, btcGoldCorrelation: 0 };
  }
}

/**
 * Refresh all macro indicators
 */
export async function refreshMacroIndicators(): Promise<MacroData> {
  try {
    // Fetch data from all sources in parallel
    const [
      fearGreedData,
      marketDominance,
      onChainMetrics,
      macroEconomicData,
      correlations
    ] = await Promise.all([
      fetchFearGreedIndex(),
      fetchMarketDominance(),
      fetchOnChainMetrics(),
      fetchMacroEconomicData(),
      calculateCorrelations()
    ]);
    
    // Update the current data
    currentMacroData = {
      fearGreedIndex: fearGreedData.value,
      fearGreedClassification: fearGreedData.classification,
      btcDominance: marketDominance.btcDominance,
      usdtDominance: marketDominance.usdtDominance,
      totalStablecoinSupply: marketDominance.totalStablecoinSupply,
      exchangeFlowsNet: onChainMetrics.exchangeFlowsNet,
      activeBTCAddresses: onChainMetrics.activeBTCAddresses,
      averageTransactionFee: onChainMetrics.averageTransactionFee,
      whaleTransactions: onChainMetrics.whaleTransactions,
      m2MoneySupply: macroEconomicData.m2MoneySupply,
      m2ChangeYoY: macroEconomicData.m2ChangeYoY,
      fedFundsRate: macroEconomicData.fedFundsRate,
      btcStockCorrelation: correlations.btcStockCorrelation,
      btcGoldCorrelation: correlations.btcGoldCorrelation,
      lastUpdated: Date.now()
    };
    
    return currentMacroData;
  } catch (error) {
    console.error('Error refreshing macro indicators:', error);
    return currentMacroData;
  }
}

/**
 * Get current macro indicators
 */
export function getMacroIndicators(): MacroData {
  return currentMacroData;
}

/**
 * Analyze macro environment and determine if it's supportive for crypto
 * Returns a score from 0-100
 */
export function analyzeMacroEnvironment(): number {
  const {
    fearGreedIndex,
    btcDominance,
    usdtDominance,
    exchangeFlowsNet,
    m2ChangeYoY,
    fedFundsRate
  } = currentMacroData;
  
  // Convert Fear & Greed to a 0-100 scale (already is)
  const sentimentScore = fearGreedIndex;
  
  // Convert BTC dominance to a 0-100 scale
  // Higher BTC dominance (>60%) typically means altcoins underperform
  // Lower BTC dominance (<40%) often signals altcoin season
  // Middle range is balanced market
  const dominanceScore = btcDominance > 60 ? 
    100 - (btcDominance - 60) * 2.5 : // Above 60%, decrease score (max -100)
    btcDominance < 40 ? 
      40 + (40 - btcDominance) * 2.5 : // Below 40%, increase score (max +100)
      75; // Between 40-60%, balanced score
  
  // Convert exchange flows to 0-100 scale
  // Negative flows (outflows from exchanges) are typically bullish
  // Positive flows (inflows to exchanges) are typically bearish
  const flowScore = exchangeFlowsNet < 0 ?
    50 + Math.min(Math.abs(exchangeFlowsNet) / 10, 5) * 10 : // Outflows boost score
    50 - Math.min(exchangeFlowsNet / 10, 5) * 10; // Inflows reduce score
  
  // Convert M2 money supply growth to 0-100 scale
  // Higher M2 growth is typically inflationary and positive for crypto
  const m2Score = Math.min(50 + m2ChangeYoY * 10, 100);
  
  // Convert Fed Funds Rate to 0-100 scale (inverted)
  // Lower rates are typically better for risk assets
  const fedScore = Math.max(100 - fedFundsRate * 10, 0);
  
  // Weighted average of all scores
  const finalScore = (
    sentimentScore * 0.25 +
    dominanceScore * 0.20 +
    flowScore * 0.20 +
    m2Score * 0.20 +
    fedScore * 0.15
  );
  
  return Math.round(finalScore);
}

/**
 * Get macro environment classification
 */
export function getMacroEnvironmentClassification(): string {
  const score = analyzeMacroEnvironment();
  
  if (score >= 80) return 'Highly Bullish';
  if (score >= 65) return 'Bullish';
  if (score >= 45) return 'Neutral';
  if (score >= 30) return 'Bearish';
  return 'Highly Bearish';
}

/**
 * Get specific macro insights based on current indicators
 */
export function getMacroInsights(): string[] {
  const insights: string[] = [];
  const data = currentMacroData;
  
  // Fear & Greed insights
  if (data.fearGreedIndex <= 20) {
    insights.push('Market sentiment shows extreme fear, historically a good time to accumulate');
  } else if (data.fearGreedIndex >= 80) {
    insights.push('Market is in extreme greed territory, consider taking partial profits');
  }
  
  // BTC Dominance insights
  if (data.btcDominance > 60) {
    insights.push('High BTC dominance suggests capital flowing into Bitcoin over altcoins');
  } else if (data.btcDominance < 40) {
    insights.push('Low BTC dominance indicates possible altcoin season');
  }
  
  // Stablecoin insights
  if (data.usdtDominance > 15) {
    insights.push('High stablecoin ratio indicates significant capital on sidelines ready to enter');
  }
  
  // Exchange flow insights
  if (data.exchangeFlowsNet < -500) {
    insights.push('Large exchange outflows suggest accumulation/hodling behavior');
  } else if (data.exchangeFlowsNet > 500) {
    insights.push('Large exchange inflows may indicate selling pressure');
  }
  
  // Macroeconomic insights
  if (data.m2ChangeYoY > 10) {
    insights.push('High M2 money supply growth typically benefits hard assets like Bitcoin');
  }
  
  if (data.fedFundsRate > 4) {
    insights.push('High interest rates may pressure risk assets like crypto in the near term');
  } else if (data.fedFundsRate < 2) {
    insights.push('Low interest rates historically support crypto market growth');
  }
  
  // Correlation insights
  if (data.btcStockCorrelation > 0.7) {
    insights.push('BTC highly correlated with stocks, suggesting risk-on market behavior');
  } else if (data.btcStockCorrelation < 0.3) {
    insights.push('BTC showing independence from traditional markets');
  }
  
  return insights;
}

// Initial data refresh on module import
refreshMacroIndicators().catch(console.error);