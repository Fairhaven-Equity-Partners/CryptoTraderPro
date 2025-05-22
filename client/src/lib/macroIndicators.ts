/**
 * Macro Indicators Module
 * 
 * This module provides macroeconomic indicators and market sentiment analysis
 * to enhance trading signals with broader market context
 */

// Interface for macro data that might be expected by other components
export interface MacroData {
  marketSentiment: number;
  liquidityFlow: number;
  fundingRate: number;
  exchangeReserve: number;
  institutionalFlow: number;
  whaleActivity: number;
  optionsRatio: number;
}

// Functions that might be expected by other parts of the application
export function getMacroIndicators(): MacroData {
  return {
    marketSentiment: 65,
    liquidityFlow: 55,
    fundingRate: 0.01,
    exchangeReserve: 0.15,
    institutionalFlow: 5,
    whaleActivity: 60,
    optionsRatio: 0.8
  };
}

export function analyzeMacroEnvironment(symbol: string): { score: number; classification: string; insights: string[] } {
  const macroSignal = calculateMacroSignal(calculateMacroIndicators(symbol, '1d'));
  
  return {
    score: macroSignal.confidence,
    classification: macroSignal.signal,
    insights: macroSignal.topIndicators.map(i => `${i.type}: ${i.description}`)
  };
}

export function getMacroEnvironmentClassification(symbol: string): string {
  const macroSignal = calculateMacroSignal(calculateMacroIndicators(symbol, '1d'));
  return macroSignal.signal;
}

export function getMacroInsights(symbol: string): string[] {
  const macroSignal = calculateMacroSignal(calculateMacroIndicators(symbol, '1d'));
  return macroSignal.topIndicators.map(i => `${i.type}: ${i.description}`);
}

import { TimeFrame } from '../types';

// Types of macro indicators
export type MacroIndicatorType = 
  | 'Market Sentiment'
  | 'Liquidity Flow'
  | 'Volatility Index'
  | 'Exchange Inflow/Outflow'
  | 'Funding Rate'
  | 'Open Interest'
  | 'Liquidation Data'
  | 'MVRV Ratio'
  | 'NVT Ratio'
  | 'Stablecoin Supply Ratio'
  | 'Exchange Reserve'
  | 'Futures Premium'
  | 'Options Put/Call Ratio'
  | 'Social Volume'
  | 'Developer Activity'
  | 'Token Unlocks'
  | 'Whale Transactions'
  | 'Institutional Flow';

// Macro indicator result
export interface MacroIndicator {
  type: MacroIndicatorType;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  timeframe: TimeFrame;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Calculate all macro indicators for a specific asset and timeframe
 * @param symbol Asset symbol
 * @param timeframe Analysis timeframe
 * @returns Array of macro indicators
 */
export function calculateMacroIndicators(
  symbol: string,
  timeframe: TimeFrame
): MacroIndicator[] {
  const result: MacroIndicator[] = [];
  
  // Since we don't have real API access to these data sources,
  // we'll intelligently simulate the indicators with realistic values
  // that would be expected for each timeframe and current market conditions
  
  // Market Sentiment (Fear & Greed Index)
  result.push(simulateMarketSentiment(symbol, timeframe));
  
  // Liquidity Flow (Exchange Net Flows)
  result.push(simulateLiquidityFlow(symbol, timeframe));
  
  // Funding Rate (from perpetual futures)
  result.push(simulateFundingRate(symbol, timeframe));
  
  // Open Interest
  result.push(simulateOpenInterest(symbol, timeframe));
  
  // Options Put/Call Ratio
  result.push(simulateOptionsRatio(symbol, timeframe));
  
  // Whale Transactions
  result.push(simulateWhaleActivity(symbol, timeframe));
  
  // MVRV Ratio (Market Value to Realized Value)
  if (symbol.includes('BTC') || symbol.includes('ETH')) {
    result.push(simulateMVRV(symbol, timeframe));
  }
  
  // Add more macro indicators based on the timeframe
  if (timeframeWeight(timeframe) >= 6) { // 1d and higher
    // Stablecoin Supply Ratio
    result.push(simulateStablecoinRatio(symbol, timeframe));
    
    // Exchange Reserve
    result.push(simulateExchangeReserve(symbol, timeframe));
    
    // Institutional Flow
    result.push(simulateInstitutionalFlow(symbol, timeframe));
  }
  
  return result;
}

/**
 * Calculate the combined signal from all macro indicators
 * @param indicators Array of macro indicators
 * @returns Object with combined signal and confidence
 */
export function calculateMacroSignal(indicators: MacroIndicator[]): {
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  topIndicators: MacroIndicator[];
  description: string;
} {
  if (indicators.length === 0) {
    return {
      signal: 'neutral',
      confidence: 50,
      topIndicators: [],
      description: 'No macro indicators available'
    };
  }
  
  // Count signals weighted by their confidence and impact
  let bullishWeight = 0;
  let bearishWeight = 0;
  let totalWeight = 0;
  
  for (const indicator of indicators) {
    // Calculate impact multiplier
    const impactMultiplier = 
      indicator.impact === 'high' ? 2.0 :
      indicator.impact === 'medium' ? 1.5 : 1.0;
    
    // Calculate weight based on confidence and impact
    const weight = (indicator.confidence / 100) * impactMultiplier;
    totalWeight += weight;
    
    if (indicator.signal === 'bullish') {
      bullishWeight += weight;
    } else if (indicator.signal === 'bearish') {
      bearishWeight += weight;
    }
  }
  
  // Normalize weights
  const bullishPercentage = totalWeight > 0 ? (bullishWeight / totalWeight) * 100 : 33.33;
  const bearishPercentage = totalWeight > 0 ? (bearishWeight / totalWeight) * 100 : 33.33;
  const neutralPercentage = 100 - bullishPercentage - bearishPercentage;
  
  // Determine the overall signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let confidence = 50;
  
  if (bullishPercentage > bearishPercentage && bullishPercentage > neutralPercentage) {
    signal = 'bullish';
    confidence = 50 + (bullishPercentage - Math.max(bearishPercentage, neutralPercentage)) / 2;
  } else if (bearishPercentage > bullishPercentage && bearishPercentage > neutralPercentage) {
    signal = 'bearish';
    confidence = 50 + (bearishPercentage - Math.max(bullishPercentage, neutralPercentage)) / 2;
  } else {
    signal = 'neutral';
    confidence = 50 + neutralPercentage / 4;
  }
  
  // Cap confidence at 95
  confidence = Math.min(95, confidence);
  
  // Get top indicators (those with highest confidence and impact)
  const sortedIndicators = [...indicators].sort((a, b) => {
    const aScore = a.confidence * (a.impact === 'high' ? 2 : a.impact === 'medium' ? 1.5 : 1);
    const bScore = b.confidence * (b.impact === 'high' ? 2 : b.impact === 'medium' ? 1.5 : 1);
    return bScore - aScore;
  });
  
  const topIndicators = sortedIndicators.slice(0, 3);
  
  // Generate description
  let description = '';
  if (signal === 'bullish') {
    description = `Macro conditions favor bullish scenarios (${Math.round(bullishPercentage)}% bullish signals). `;
  } else if (signal === 'bearish') {
    description = `Macro conditions favor bearish scenarios (${Math.round(bearishPercentage)}% bearish signals). `;
  } else {
    description = `Macro conditions are mostly neutral (${Math.round(neutralPercentage)}% neutral signals). `;
  }
  
  if (topIndicators.length > 0) {
    description += `Key factors: ${topIndicators.map(i => i.type).join(', ')}.`;
  }
  
  return {
    signal,
    confidence: Math.round(confidence),
    topIndicators,
    description
  };
}

/**
 * Enhance a signal with macro indicators
 * @param symbol Asset symbol
 * @param timeframe Analysis timeframe
 * @param baseSignal Original signal direction
 * @param baseConfidence Original confidence
 * @returns Enhanced signal and confidence
 */
export function enhanceSignalWithMacro(
  symbol: string,
  timeframe: TimeFrame,
  baseSignal: 'LONG' | 'SHORT' | 'NEUTRAL',
  baseConfidence: number
): {
  enhancedSignal: 'LONG' | 'SHORT' | 'NEUTRAL';
  enhancedConfidence: number;
  macroOverlay: {
    signal: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    description: string;
    indicators: MacroIndicator[];
  }
} {
  // Calculate macro indicators
  const macroIndicators = calculateMacroIndicators(symbol, timeframe);
  
  // Calculate macro signal
  const macroSignal = calculateMacroSignal(macroIndicators);
  
  // Determine if macro and technical signals align
  const technicalSignal = baseSignal === 'LONG' ? 'bullish' : 
                          baseSignal === 'SHORT' ? 'bearish' : 'neutral';
  
  const signalsAlign = technicalSignal === macroSignal.signal;
  
  // Calculate weight of macro influence based on timeframe
  const timeframeInfluence = timeframeWeight(timeframe) / 10; // 0.1 to 1.0
  
  // Calculate adjustment to confidence
  let confidenceAdjustment = 0;
  
  if (signalsAlign) {
    // Signals align, boost confidence
    confidenceAdjustment = macroSignal.confidence * 0.15 * timeframeInfluence;
  } else if (technicalSignal !== 'neutral' && macroSignal.signal !== 'neutral') {
    // Signals conflict, reduce confidence
    confidenceAdjustment = -macroSignal.confidence * 0.1 * timeframeInfluence;
  }
  
  // Apply adjustment
  let enhancedConfidence = baseConfidence + confidenceAdjustment;
  
  // Cap confidence between 25 and 98
  enhancedConfidence = Math.min(98, Math.max(25, enhancedConfidence));
  
  // Determine if signal direction should change
  // Only change signal if macro is very strong and technical is weak
  let enhancedSignal = baseSignal;
  
  if (!signalsAlign && 
      macroSignal.confidence > 85 && 
      baseConfidence < 60 && 
      timeframeInfluence > 0.7) {
    // Strong macro signal overrides weak technical signal on higher timeframes
    enhancedSignal = macroSignal.signal === 'bullish' ? 'LONG' : 
                     macroSignal.signal === 'bearish' ? 'SHORT' : 'NEUTRAL';
  }
  
  return {
    enhancedSignal,
    enhancedConfidence: Math.round(enhancedConfidence),
    macroOverlay: {
      signal: macroSignal.signal,
      confidence: macroSignal.confidence,
      description: macroSignal.description,
      indicators: macroSignal.topIndicators
    }
  };
}

// Helper functions to simulate realistic macro indicators

function simulateMarketSentiment(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Current overall crypto sentiment (May 2025 simulation)
  // Reasonably bullish sentiment with Bitcoin above $100k
  const baseSentiment = 65; // 0-100, where 0 is extreme fear, 100 is extreme greed
  
  // Add some variation based on symbol
  const symbolAdjustment = 
    symbol.includes('BTC') ? 10 :
    symbol.includes('ETH') ? 5 :
    symbol.includes('SOL') ? 8 :
    symbol.includes('BNB') ? 2 : 0;
  
  // Add timeframe variation
  const timeframeAdjustment = 
    timeframe === '1M' ? 15 :
    timeframe === '1w' ? 10 :
    timeframe === '3d' ? 8 :
    timeframe === '1d' ? 5 : 0;
  
  // Calculate sentiment value
  const sentimentValue = Math.min(100, Math.max(0, baseSentiment + symbolAdjustment + timeframeAdjustment));
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (sentimentValue >= 70) signal = 'bullish';
  else if (sentimentValue <= 30) signal = 'bearish';
  
  // Calculate confidence based on how extreme the sentiment is
  const confidence = 50 + Math.abs(sentimentValue - 50);
  
  return {
    type: 'Market Sentiment',
    value: sentimentValue,
    signal,
    confidence,
    timeframe,
    description: sentimentValue >= 70 ? 'Market showing excessive greed' :
                sentimentValue <= 30 ? 'Market showing excessive fear' :
                'Market sentiment in neutral zone',
    impact: 'high'
  };
}

function simulateLiquidityFlow(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Base flow depends on symbol - simulating current market conditions
  const baseFlow = 
    symbol.includes('BTC') ? 45 :
    symbol.includes('ETH') ? 40 :
    symbol.includes('SOL') ? 60 : 50;
  
  // Add random variation
  const variation = (Math.random() * 20) - 10; // -10 to +10
  
  // Calculate flow value (0-100, where >50 means net inflow, <50 means net outflow)
  const flowValue = Math.min(100, Math.max(0, baseFlow + variation));
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (flowValue >= 60) signal = 'bullish';
  else if (flowValue <= 40) signal = 'bearish';
  
  // Calculate confidence
  const confidence = 50 + Math.abs(flowValue - 50);
  
  return {
    type: 'Liquidity Flow',
    value: flowValue,
    signal,
    confidence,
    timeframe,
    description: flowValue >= 60 ? 'Strong net inflows to exchanges' :
                flowValue <= 40 ? 'Strong net outflows from exchanges' :
                'Balanced exchange flows',
    impact: 'medium'
  };
}

function simulateFundingRate(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Base funding rate - simulating realistic perpetual futures funding
  // Values between -0.2% and 0.2% per 8 hours are realistic
  const baseFunding = 
    symbol.includes('BTC') ? 0.01 :
    symbol.includes('ETH') ? 0.015 :
    symbol.includes('SOL') ? 0.025 : 0.02;
  
  // Add random variation
  const variation = (Math.random() * 0.04) - 0.02; // -0.02% to +0.02%
  
  // Final funding rate
  const fundingRate = Math.min(0.1, Math.max(-0.1, baseFunding + variation));
  
  // For display and calculations, convert to a 0-100 scale
  const normalizedValue = 50 + (fundingRate * 500); // -0.1 -> 0, 0 -> 50, 0.1 -> 100
  
  // Determine signal (positive funding rate means longs pay shorts, indicating bullish sentiment)
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (fundingRate >= 0.02) signal = 'bullish';
  else if (fundingRate <= -0.02) signal = 'bearish';
  
  // Higher absolute values indicate stronger sentiment
  const confidence = 50 + Math.abs(fundingRate * 1000); // 0 -> 50, 0.05 -> 100
  
  return {
    type: 'Funding Rate',
    value: normalizedValue,
    signal,
    confidence: Math.min(95, confidence),
    timeframe,
    description: fundingRate >= 0.02 ? 'High positive funding rate indicates long bias' :
                fundingRate <= -0.02 ? 'Negative funding rate indicates short bias' :
                'Neutral funding rate',
    impact: 'high'
  };
}

function simulateOpenInterest(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Base open interest change (percentage vs 30d average)
  const baseOI = 
    symbol.includes('BTC') ? 15 :
    symbol.includes('ETH') ? 20 :
    symbol.includes('SOL') ? 30 : 10;
  
  // Add random variation
  const variation = (Math.random() * 30) - 15; // -15% to +15%
  
  // Calculate OI change value
  const oiChange = baseOI + variation;
  
  // Normalize to 0-100 scale
  const normalizedValue = 50 + (oiChange);
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (oiChange >= 20) signal = 'bullish';
  else if (oiChange <= -20) signal = 'bearish';
  
  // Calculate confidence
  const confidence = 50 + Math.min(45, Math.abs(oiChange));
  
  return {
    type: 'Open Interest',
    value: normalizedValue,
    signal,
    confidence,
    timeframe,
    description: oiChange >= 20 ? 'Rising open interest indicates new money entering market' :
                oiChange <= -20 ? 'Falling open interest indicates position unwinding' :
                'Stable open interest',
    impact: 'medium'
  };
}

function simulateOptionsRatio(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Only relevant for major cryptos
  if (!symbol.includes('BTC') && !symbol.includes('ETH')) {
    return {
      type: 'Options Put/Call Ratio',
      value: 50,
      signal: 'neutral',
      confidence: 50,
      timeframe,
      description: 'Options data not significant for this asset',
      impact: 'low'
    };
  }
  
  // Base put/call ratio (1.0 means equal puts and calls)
  // For crypto options, ratio is often below 1.0 in bull markets
  const baseRatio = symbol.includes('BTC') ? 0.85 : 0.9;
  
  // Add variation based on timeframe
  const timeframeAdjustment = 
    timeframe === '1M' ? 0.2 :
    timeframe === '1w' ? 0.1 :
    timeframe === '3d' ? 0.05 : 0;
  
  // Add random variation
  const randomAdjustment = (Math.random() * 0.4) - 0.2; // -0.2 to +0.2
  
  // Calculate final ratio
  const ratio = Math.max(0.3, baseRatio + timeframeAdjustment + randomAdjustment);
  
  // Normalize to 0-100 scale (0.5 -> 50, 1.0 -> 0, 2.0 -> 100)
  const normalizedValue = 50 + ((1 - ratio) * 100);
  
  // Determine signal
  // Low P/C ratio (below 0.7) is bullish, high (above 1.3) is bearish
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (ratio <= 0.7) signal = 'bullish';
  else if (ratio >= 1.3) signal = 'bearish';
  
  // Calculate confidence
  const confidence = 50 + Math.abs(1 - ratio) * 80;
  
  return {
    type: 'Options Put/Call Ratio',
    value: normalizedValue,
    signal,
    confidence: Math.min(95, confidence),
    timeframe,
    description: ratio <= 0.7 ? 'Low put/call ratio indicates bullish options sentiment' :
                ratio >= 1.3 ? 'High put/call ratio indicates bearish hedging activity' :
                'Balanced put/call ratio',
    impact: 'medium'
  };
}

function simulateWhaleActivity(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Base whale activity (net accumulation vs distribution)
  const baseActivity = 
    symbol.includes('BTC') ? 20 :
    symbol.includes('ETH') ? 15 :
    symbol.includes('SOL') ? 25 : 0;
  
  // Add variation based on timeframe
  const timeframeAdjustment = 
    timeframe === '1M' ? 15 :
    timeframe === '1w' ? 10 :
    timeframe === '3d' ? 5 : 0;
  
  // Add random variation
  const randomAdjustment = (Math.random() * 30) - 15; // -15 to +15
  
  // Calculate activity score (-100 to +100, positive means accumulation)
  const activityScore = baseActivity + timeframeAdjustment + randomAdjustment;
  
  // Normalize to 0-100
  const normalizedValue = 50 + (activityScore / 2);
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (activityScore >= 15) signal = 'bullish';
  else if (activityScore <= -15) signal = 'bearish';
  
  // Calculate confidence
  const confidence = 50 + Math.min(45, Math.abs(activityScore));
  
  return {
    type: 'Whale Transactions',
    value: normalizedValue,
    signal,
    confidence,
    timeframe,
    description: activityScore >= 15 ? 'Whale wallets are in net accumulation phase' :
                activityScore <= -15 ? 'Whale wallets are in net distribution phase' :
                'Balanced whale activity',
    impact: 'high'
  };
}

function simulateMVRV(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // MVRV (Market Value to Realized Value) - only relevant for BTC and ETH
  // Base value (1.0 means market and realized value are equal)
  const baseMVRV = symbol.includes('BTC') ? 2.5 : 2.2; // simulate slightly overvalued market (May 2025)
  
  // Add random variation
  const variation = (Math.random() * 0.6) - 0.3; // -0.3 to +0.3
  
  // Calculate MVRV
  const mvrv = Math.max(0.5, baseMVRV + variation);
  
  // Normalize to 0-100 scale
  // MVRV of 3.5+ is historically high, 1.0 is neutral, 0.5 is low
  const normalizedValue = (mvrv - 0.5) * 33.33;
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (mvrv <= 1.2) signal = 'bullish'; // undervalued
  else if (mvrv >= 3.0) signal = 'bearish'; // overvalued
  
  // Calculate confidence
  const confidence = mvrv <= 1.2 ? 50 + (1.2 - mvrv) * 100 :
                    mvrv >= 3.0 ? 50 + (mvrv - 3.0) * 25 : 50;
  
  return {
    type: 'MVRV Ratio',
    value: normalizedValue,
    signal,
    confidence: Math.min(95, confidence),
    timeframe,
    description: mvrv <= 1.2 ? 'Low MVRV ratio indicates undervaluation' :
                mvrv >= 3.0 ? 'High MVRV ratio indicates potential overvaluation' :
                'MVRV ratio in neutral range',
    impact: 'medium'
  };
}

function simulateStablecoinRatio(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Stablecoin Supply Ratio (SSR) - simulates market's buying power
  // Higher ratio means more stablecoins relative to market cap (more buying power)
  const baseRatio = 0.08; // 8% ratio
  
  // Add random variation
  const variation = (Math.random() * 0.04) - 0.02; // -2% to +2%
  
  // Calculate SSR
  const ssr = Math.max(0.01, baseRatio + variation);
  
  // Normalize to 0-100 scale (0.12+ is very high, 0.02 is very low)
  const normalizedValue = (ssr / 0.12) * 100;
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (ssr >= 0.1) signal = 'bullish'; // high buying power
  else if (ssr <= 0.04) signal = 'bearish'; // low buying power
  
  // Calculate confidence
  const confidence = ssr >= 0.1 ? 50 + (ssr - 0.1) * 1000 :
                    ssr <= 0.04 ? 50 + (0.04 - ssr) * 1000 : 50;
  
  return {
    type: 'Stablecoin Supply Ratio',
    value: normalizedValue,
    signal,
    confidence: Math.min(95, confidence),
    timeframe,
    description: ssr >= 0.1 ? 'High stablecoin ratio indicates strong buying power' :
                ssr <= 0.04 ? 'Low stablecoin ratio indicates limited buying power' :
                'Moderate stablecoin buying power',
    impact: 'medium'
  };
}

function simulateExchangeReserve(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Exchange Reserve - simulates % of total supply on exchanges
  // Lower values are generally bullish (less selling pressure)
  const baseReserve = 
    symbol.includes('BTC') ? 0.12 : // 12% of BTC on exchanges
    symbol.includes('ETH') ? 0.15 : // 15% of ETH on exchanges
    symbol.includes('SOL') ? 0.18 : 0.2; // 20% for others
  
  // Add variation based on current trend (simulate slow decrease)
  const trendAdjustment = -0.02; // -2% year-on-year trend
  
  // Add random variation
  const randomAdjustment = (Math.random() * 0.04) - 0.02; // -2% to +2%
  
  // Calculate reserve
  const reserve = Math.max(0.05, baseReserve + trendAdjustment + randomAdjustment);
  
  // Normalize to 0-100 scale (0.3+ is very high, 0.05 is very low)
  // Inverted so higher values = lower reserves = more bullish
  const normalizedValue = 100 - ((reserve / 0.3) * 100);
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (reserve <= 0.1) signal = 'bullish'; // low reserves
  else if (reserve >= 0.25) signal = 'bearish'; // high reserves
  
  // Calculate confidence
  const confidence = reserve <= 0.1 ? 50 + (0.1 - reserve) * 500 :
                    reserve >= 0.25 ? 50 + (reserve - 0.25) * 500 : 50;
  
  return {
    type: 'Exchange Reserve',
    value: normalizedValue,
    signal,
    confidence: Math.min(95, confidence),
    timeframe,
    description: reserve <= 0.1 ? 'Low exchange reserves indicate reduced selling pressure' :
                reserve >= 0.25 ? 'High exchange reserves indicate increased selling pressure' :
                'Exchange reserves at neutral levels',
    impact: 'medium'
  };
}

function simulateInstitutionalFlow(symbol: string, timeframe: TimeFrame): MacroIndicator {
  // Only relevant for Bitcoin and Ethereum
  if (!symbol.includes('BTC') && !symbol.includes('ETH')) {
    return {
      type: 'Institutional Flow',
      value: 50,
      signal: 'neutral',
      confidence: 50,
      timeframe,
      description: 'Institutional flows not significant for this asset',
      impact: 'low'
    };
  }
  
  // Base flow (% change in institutional holdings)
  const baseFlow = symbol.includes('BTC') ? 5 : 3; // simulate slow institutional accumulation
  
  // Add variation based on timeframe
  const timeframeAdjustment = 
    timeframe === '1M' ? 3 :
    timeframe === '1w' ? 2 :
    timeframe === '3d' ? 1 : 0;
  
  // Add random variation
  const randomAdjustment = (Math.random() * 10) - 5; // -5% to +5%
  
  // Calculate flow
  const flow = baseFlow + timeframeAdjustment + randomAdjustment;
  
  // Normalize to 0-100 scale
  const normalizedValue = 50 + (flow * 2);
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (flow >= 5) signal = 'bullish';
  else if (flow <= -5) signal = 'bearish';
  
  // Calculate confidence
  const confidence = 50 + Math.min(45, Math.abs(flow) * 3);
  
  return {
    type: 'Institutional Flow',
    value: normalizedValue,
    signal,
    confidence,
    timeframe,
    description: flow >= 5 ? 'Strong institutional buying detected' :
                flow <= -5 ? 'Institutional outflows detected' :
                'Neutral institutional activity',
    impact: 'high'
  };
}

// Helper function to determine timeframe weight
function timeframeWeight(timeframe: TimeFrame): number {
  return timeframe === '1M' ? 10 :
         timeframe === '1w' ? 9 :
         timeframe === '3d' ? 8 :
         timeframe === '1d' ? 7 :
         timeframe === '4h' ? 6 :
         timeframe === '1h' ? 5 :
         timeframe === '30m' ? 4 :
         timeframe === '15m' ? 3 :
         timeframe === '5m' ? 2 : 1;
}