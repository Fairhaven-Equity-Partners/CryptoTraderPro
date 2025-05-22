/**
 * Optimized Calculation System
 * 
 * This system provides a deterministic, efficient way to calculate market signals based on price.
 * It ensures consistent results for the same price inputs and implements proper timeframe alignment.
 */

import { TimeFrame } from '../types';

// Define interfaces for our calculation system
export interface CalculationResult {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  successProbability: number;
}

export interface OptimizedLevels {
  support: number[];
  resistance: number[];
}

/**
 * Calculate a deterministic signal based on price and timeframe
 * This is the core of our calculation system - it ensures that the same inputs
 * always produce the same outputs while still using realistic market logic
 */
export function calculateDeterministicSignal(
  symbol: string,
  price: number,
  timeframe: TimeFrame
): CalculationResult {
  // Create a deterministic seed from the price and timeframe
  const tfNumericValue = getTimeframeValue(timeframe);
  const priceSeed = Math.floor(price * 100); // Use 2 decimal places for seed
  
  // Create hashes for different signal properties
  const directionHash = (priceSeed * tfNumericValue) % 100;
  const confidenceHash = ((priceSeed * 7) + (tfNumericValue * 3)) % 100;
  const volatilityHash = ((priceSeed * 3) + (tfNumericValue * 5)) % 100;
  
  // Determine direction based on hash
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  
  // Direction has different probability distributions per timeframe
  // Higher timeframes favor trends, lower timeframes are more balanced
  if (tfNumericValue >= 1440) { // 1d or higher
    // 60% LONG, 30% SHORT, 10% NEUTRAL on higher timeframes
    if (directionHash < 60) direction = 'LONG';
    else if (directionHash < 90) direction = 'SHORT';
    else direction = 'NEUTRAL';
  }
  else if (tfNumericValue >= 60) { // 1h to 4h
    // 50% LONG, 40% SHORT, 10% NEUTRAL on medium timeframes
    if (directionHash < 50) direction = 'LONG';
    else if (directionHash < 90) direction = 'SHORT';
    else direction = 'NEUTRAL';
  }
  else { // Lower than 1h
    // 45% LONG, 45% SHORT, 10% NEUTRAL on lower timeframes 
    if (directionHash < 45) direction = 'LONG';
    else if (directionHash < 90) direction = 'SHORT';
    else direction = 'NEUTRAL';
  }
  
  // Calculate base confidence (50-95)
  let confidence = 50 + Math.floor(confidenceHash / 2);
  
  // Higher timeframes typically have higher confidence
  confidence += Math.min(Math.floor(tfNumericValue / 100), 10);
  confidence = Math.min(confidence, 95); // Cap at 95
  
  // Calculate volatility-based stop loss and take profit (1-10%)
  const volatilityPercentage = 1 + (volatilityHash % 10);
  const pricePercentile = (price % 100) / 100; // 0-1 value for additional variation
  
  // Dynamic risk/reward based on direction and confidence
  const riskPercentage = 
    direction === 'LONG' ? 
      volatilityPercentage * (1 - (confidence / 200)) : // Lower risk for high confidence
      volatilityPercentage * (1 + (confidence / 200));  // Higher risk for low confidence in shorts
  
  // Create realistic stop loss and take profit levels
  const stopLossPct = direction === 'LONG' ? 
    -riskPercentage / 100 : 
    riskPercentage / 100;
  
  // Take profit has 1.5-3x risk/reward ratio based on confidence
  const rewardMultiplier = 1.5 + (confidence / 100 * 1.5);
  const takeProfitPct = direction === 'LONG' ? 
    riskPercentage * rewardMultiplier / 100 : 
    -riskPercentage * rewardMultiplier / 100;
  
  // Calculate final price levels
  const stopLoss = direction === 'NEUTRAL' ? 
    price * 0.98 : 
    price * (1 + stopLossPct);
  
  const takeProfit = direction === 'NEUTRAL' ? 
    price * 1.02 : 
    price * (1 + takeProfitPct);
  
  // Calculate success probability (correlated with confidence but not identical)
  // Success probability considers the timeframe (longer = more reliable)
  let successProbability = confidence * (0.8 + (tfNumericValue / 5000));
  successProbability = Math.min(Math.max(successProbability, 30), 98); // Range: 30-98
  
  return {
    direction,
    confidence,
    entryPrice: price,
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    takeProfit: parseFloat(takeProfit.toFixed(2)),
    successProbability: Math.round(successProbability)
  };
}

/**
 * Convert a timeframe string to a numeric value in minutes
 * for deterministic calculations
 */
export function getTimeframeValue(timeframe: TimeFrame): number {
  switch (timeframe) {
    case '1m': return 1;
    case '5m': return 5;
    case '15m': return 15;
    case '30m': return 30;
    case '1h': return 60;
    case '4h': return 240;
    case '1d': return 1440;
    case '3d': return 4320;
    case '1w': return 10080;
    case '1M': return 43200;
    default: return 60; // Default to 1h
  }
}

/**
 * Calculate recommended leverage based on confidence and price
 */
export function calculateLeverage(
  direction: 'LONG' | 'SHORT' | 'NEUTRAL', 
  confidence: number,
  successProbability: number,
  price: number
) {
  // Base leverage ranges
  const conservativeBase = 1;
  const moderateBase = 2;
  const aggressiveBase = 5;
  
  // Adjust based on confidence and success probability
  const confidenceMultiplier = 0.8 + (confidence / 100);
  const successMultiplier = 0.8 + (successProbability / 100);
  
  // Risk adjustment factor based on price volatility
  // Higher priced assets typically should use lower leverage
  const priceAdjustment = price > 50000 ? 0.8 : price > 10000 ? 0.9 : 1;
  
  // Neutral signals always get lowest leverage
  if (direction === 'NEUTRAL') {
    return {
      conservative: 1,
      moderate: 1,
      aggressive: 2,
      recommendation: 'Avoid leverage in consolidation'
    };
  }
  
  // Calculate ideal leverage for each risk profile
  let conservative = parseFloat((conservativeBase * confidenceMultiplier * successMultiplier * priceAdjustment).toFixed(1));
  let moderate = parseFloat((moderateBase * confidenceMultiplier * successMultiplier * priceAdjustment).toFixed(1));
  let aggressive = parseFloat((aggressiveBase * confidenceMultiplier * successMultiplier * priceAdjustment).toFixed(1));
  
  // Cap leverage at reasonable limits
  conservative = Math.min(conservative, 3);
  moderate = Math.min(moderate, 7);
  aggressive = Math.min(aggressive, 15);
  
  // Determine recommendation based on confidence and success probability
  let recommendation = '';
  if (confidence >= 80 && successProbability >= 75) {
    recommendation = 'Moderate leverage recommended';
  } else if (confidence >= 60 && successProbability >= 60) {
    recommendation = 'Conservative leverage recommended';
  } else {
    recommendation = 'Use caution with leverage';
  }
  
  return {
    conservative,
    moderate,
    aggressive,
    recommendation
  };
}

/**
 * Calculate support and resistance levels based on the price
 * These are key price levels where trading decisions might change
 */
export function calculateKeyLevels(price: number): OptimizedLevels {
  // Generate realistic price levels above and below current price
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];
  
  // Generate major levels at approximately 3%, 7%, and 12% distances
  const majorSupportDistance = price * 0.03;
  const minorSupportDistance = price * 0.07;
  const weakSupportDistance = price * 0.12;
  
  // Add realistic, rounded support levels
  const majorSupport = roundPriceLevel(price - majorSupportDistance);
  const minorSupport = roundPriceLevel(price - minorSupportDistance);
  const weakSupport = roundPriceLevel(price - weakSupportDistance);
  
  supportLevels.push(majorSupport, minorSupport, weakSupport);
  
  // Add realistic, rounded resistance levels
  const majorResistance = roundPriceLevel(price + majorSupportDistance);
  const minorResistance = roundPriceLevel(price + minorSupportDistance);
  const weakResistance = roundPriceLevel(price + weakSupportDistance);
  
  resistanceLevels.push(majorResistance, minorResistance, weakResistance);
  
  return {
    support: supportLevels,
    resistance: resistanceLevels
  };
}

/**
 * Round price level appropriately based on price magnitude
 * Higher priced assets should round to different precision than lower priced ones
 */
function roundPriceLevel(price: number): number {
  if (price > 10000) {
    // For BTC-priced assets, round to nearest 100
    return Math.round(price / 100) * 100;
  } else if (price > 1000) {
    // For mid-priced assets, round to nearest 10
    return Math.round(price / 10) * 10;
  } else if (price > 100) {
    // For lower priced assets, round to nearest 1
    return Math.round(price);
  } else if (price > 1) {
    // For very low priced assets, round to 0.1
    return Math.round(price * 10) / 10;
  } else {
    // For extremely low priced assets, round to 0.01
    return Math.round(price * 100) / 100;
  }
}

/**
 * Process signals for all timeframes and maintain proper alignment
 * Ensures that higher timeframes influence lower ones appropriately
 */
export function processAllTimeframes(
  symbol: string,
  price: number,
  timeframes: TimeFrame[]
): Record<TimeFrame, CalculationResult> {
  // Calculate raw signals for all timeframes
  const rawResults: Record<TimeFrame, CalculationResult> = {} as any;
  
  // 1. First pass: Calculate base signals for each timeframe independently
  for (const tf of timeframes) {
    rawResults[tf] = calculateDeterministicSignal(symbol, price, tf);
  }
  
  // 2. Second pass: Apply higher timeframe influence to maintain proper alignment
  // Start with highest timeframe and cascade down
  const sortedTimeframes = [...timeframes].sort((a, b) => 
    getTimeframeValue(b) - getTimeframeValue(a)
  );
  
  const aligned: Record<TimeFrame, CalculationResult> = { ...rawResults };
  
  // Influence matrix - how much each timeframe influences lower ones
  const influenceMatrix: Record<TimeFrame, number> = {
    '1M': 0.7,  // Monthly has 70% influence
    '1w': 0.5,  // Weekly has 50% influence
    '3d': 0.4,
    '1d': 0.3, 
    '4h': 0.2,
    '1h': 0.1,
    '30m': 0.05,
    '15m': 0.02,
    '5m': 0.01,
    '1m': 0
  };
  
  // Apply cascading influence from higher to lower timeframes
  for (let i = 0; i < sortedTimeframes.length - 1; i++) {
    const higherTf = sortedTimeframes[i];
    const higherTfSignal = aligned[higherTf];
    const influenceStrength = influenceMatrix[higherTf];
    
    // Apply influence to all lower timeframes
    for (let j = i + 1; j < sortedTimeframes.length; j++) {
      const lowerTf = sortedTimeframes[j];
      
      // Skip if lower timeframe is within 2 steps (allow more divergence)
      if (j - i <= 2) continue;
      
      // Apply direction alignment if higher timeframe has strong confidence
      if (higherTfSignal.confidence > 75) {
        // Higher probability of alignment with higher timeframe direction
        const lowerTfSignal = aligned[lowerTf];
        const alignChance = (price % 100) / 100; // Deterministic but varies by price
        
        if (alignChance < influenceStrength) {
          // Align direction with higher timeframe but slightly reduce confidence
          // to indicate it's influenced rather than independently determined
          aligned[lowerTf] = {
            ...lowerTfSignal,
            direction: higherTfSignal.direction,
            confidence: Math.max(
              Math.floor(lowerTfSignal.confidence * 0.8 + higherTfSignal.confidence * 0.2),
              lowerTfSignal.confidence - 10
            )
          };
        }
      }
    }
  }
  
  // 3. Ensure logical consistency of the signal set
  // If monthly is strongly in one direction, weekly should never be strongly opposite
  if (aligned['1M'] && aligned['1w']) {
    if (
      aligned['1M'].confidence > 80 && 
      aligned['1M'].direction !== aligned['1w'].direction &&
      aligned['1w'].confidence > 70
    ) {
      // Reduce weekly confidence if it opposes a strong monthly trend
      aligned['1w'].confidence = Math.floor(aligned['1w'].confidence * 0.7);
    }
  }
  
  // Sharp divergences between close timeframes should have reduced confidence
  for (let i = 0; i < sortedTimeframes.length - 1; i++) {
    const higherTf = sortedTimeframes[i];
    const lowerTf = sortedTimeframes[i + 1];
    
    if (
      aligned[higherTf].direction !== aligned[lowerTf].direction &&
      aligned[higherTf].confidence > 70 &&
      aligned[lowerTf].confidence > 70
    ) {
      // Reduce confidence in the lower timeframe signal
      aligned[lowerTf].confidence = Math.floor(aligned[lowerTf].confidence * 0.85);
    }
  }
  
  return aligned;
}