/**
 * Advanced Technical Indicators for Crypto Signal Pro
 * 
 * This module provides sophisticated technical analysis indicators
 * that go beyond basic indicators to provide higher-probability signals
 */

import { ChartData, TimeFrame } from '../types';

/**
 * Detects regular and hidden divergences between price and RSI
 * @param data Price data points
 * @param rsiValues Pre-calculated RSI values
 * @param lookback Number of candles to look back for divergence pattern
 * @returns Object containing bullish and bearish divergences with their locations
 */
export function detectRSIDivergence(
  data: ChartData[], 
  rsiValues: number[], 
  lookback: number = 10
): { bullish: number[], bearish: number[], hiddenBullish: number[], hiddenBearish: number[] } {
  const result = {
    bullish: [] as number[],  // Regular bullish divergence (price lower low, RSI higher low)
    bearish: [] as number[],  // Regular bearish divergence (price higher high, RSI lower high)
    hiddenBullish: [] as number[], // Hidden bullish (price higher low, RSI lower low)
    hiddenBearish: [] as number[]  // Hidden bearish (price lower high, RSI higher high)
  };
  
  if (data.length < lookback || rsiValues.length < lookback) {
    return result;
  }
  
  // Find local minima and maxima in price and RSI
  for (let i = 2; i < Math.min(data.length, rsiValues.length) - 2; i++) {
    // Local price minimum
    if (data[i].low < data[i-1].low && data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && data[i].low < data[i+2].low) {
      
      // Find previous minimum within lookback period
      for (let j = i - 3; j >= Math.max(0, i - lookback); j--) {
        if (data[j].low < data[j-1].low && data[j].low < data[j+1].low) {
          // Regular bullish divergence: price made lower low, but RSI made higher low
          if (data[i].low < data[j].low && rsiValues[i] > rsiValues[j]) {
            result.bullish.push(i);
          }
          // Hidden bullish divergence: price made higher low, but RSI made lower low
          else if (data[i].low > data[j].low && rsiValues[i] < rsiValues[j]) {
            result.hiddenBullish.push(i);
          }
          break;
        }
      }
    }
    
    // Local price maximum
    if (data[i].high > data[i-1].high && data[i].high > data[i-2].high && 
        data[i].high > data[i+1].high && data[i].high > data[i+2].high) {
      
      // Find previous maximum within lookback period
      for (let j = i - 3; j >= Math.max(0, i - lookback); j--) {
        if (data[j].high > data[j-1].high && data[j].high > data[j+1].high) {
          // Regular bearish divergence: price made higher high, but RSI made lower high
          if (data[i].high > data[j].high && rsiValues[i] < rsiValues[j]) {
            result.bearish.push(i);
          }
          // Hidden bearish divergence: price made lower high, but RSI made higher high
          else if (data[i].high < data[j].high && rsiValues[i] > rsiValues[j]) {
            result.hiddenBearish.push(i);
          }
          break;
        }
      }
    }
  }
  
  return result;
}

/**
 * Calculates Fibonacci retracement levels from swing high to swing low
 * @param high Highest price in the range
 * @param low Lowest price in the range
 * @returns Object containing Fibonacci retracement levels
 */
export function calculateFibonacciRetracement(high: number, low: number): { 
  level0: number, level236: number, level382: number, level5: number, 
  level618: number, level786: number, level1: number 
} {
  const range = high - low;
  
  return {
    level0: high,
    level236: high - (range * 0.236),
    level382: high - (range * 0.382),
    level5: high - (range * 0.5),
    level618: high - (range * 0.618),
    level786: high - (range * 0.786),
    level1: low
  };
}

/**
 * Calculates Fibonacci extension levels from a swing high to swing low to swing high pattern
 * @param firstHigh First swing high
 * @param low Swing low
 * @param secondHigh Second swing high (retracement high)
 * @returns Object containing Fibonacci extension levels
 */
export function calculateFibonacciExtension(firstHigh: number, low: number, secondHigh: number): {
  level0: number, level618: number, level1: number, level1618: number, level2: number, level2618: number, level3618: number
} {
  const range = firstHigh - low;
  const base = secondHigh;
  
  return {
    level0: base,
    level618: base + (range * 0.618),
    level1: base + range,
    level1618: base + (range * 1.618),
    level2: base + (range * 2),
    level2618: base + (range * 2.618),
    level3618: base + (range * 3.618)
  };
}

/**
 * Analyzes recent price action to identify important market structure breaks
 * @param data Price data array
 * @param swingSize Minimum number of candles required for a swing point
 * @returns Object describing market structure changes
 */
export function detectMarketStructureBreak(
  data: ChartData[],
  swingSize: number = 3
): { 
  isBullishMSB: boolean, 
  isBearishMSB: boolean, 
  breakIndex: number,
  previousStructure: 'uptrend' | 'downtrend' | 'range' | 'undefined',
  newStructure: 'uptrend' | 'downtrend' | 'range' | 'undefined',
  confidence: number
} {
  const result = {
    isBullishMSB: false,
    isBearishMSB: false,
    breakIndex: -1,
    previousStructure: 'undefined' as 'uptrend' | 'downtrend' | 'range' | 'undefined',
    newStructure: 'undefined' as 'uptrend' | 'downtrend' | 'range' | 'undefined',
    confidence: 0
  };
  
  if (data.length < swingSize * 4) {
    return result;
  }
  
  // Find swing highs and lows
  const swingHighs: { index: number, price: number }[] = [];
  const swingLows: { index: number, price: number }[] = [];
  
  for (let i = swingSize; i < data.length - swingSize; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;
    
    // Check if this is a swing high
    for (let j = i - swingSize; j <= i + swingSize; j++) {
      if (j === i) continue;
      if (data[j].high >= data[i].high) {
        isSwingHigh = false;
        break;
      }
    }
    
    // Check if this is a swing low
    for (let j = i - swingSize; j <= i + swingSize; j++) {
      if (j === i) continue;
      if (data[j].low <= data[i].low) {
        isSwingLow = false;
        break;
      }
    }
    
    if (isSwingHigh) {
      swingHighs.push({ index: i, price: data[i].high });
    }
    
    if (isSwingLow) {
      swingLows.push({ index: i, price: data[i].low });
    }
  }
  
  // We need at least 2 swing highs and 2 swing lows to detect a market structure break
  if (swingHighs.length < 2 || swingLows.length < 2) {
    return result;
  }
  
  // Check for bullish market structure break (higher low followed by break of previous high)
  if (swingLows.length >= 2) {
    const lastSwingLow = swingLows[swingLows.length - 1];
    const previousSwingLow = swingLows[swingLows.length - 2];
    
    if (lastSwingLow.price > previousSwingLow.price) {
      // We have a higher low, now check if we broke the previous swing high
      for (let i = lastSwingLow.index; i < data.length; i++) {
        // Find the most recent swing high before the last swing low
        let relevantSwingHigh = null;
        for (let j = swingHighs.length - 1; j >= 0; j--) {
          if (swingHighs[j].index < lastSwingLow.index) {
            relevantSwingHigh = swingHighs[j];
            break;
          }
        }
        
        if (relevantSwingHigh && data[i].high > relevantSwingHigh.price) {
          result.isBullishMSB = true;
          result.breakIndex = i;
          result.previousStructure = 'downtrend';
          result.newStructure = 'uptrend';
          
          // Calculate confidence based on the strength of the break
          const breakStrength = (data[i].high - relevantSwingHigh.price) / relevantSwingHigh.price;
          result.confidence = Math.min(95, Math.round(50 + breakStrength * 5000));
          break;
        }
      }
    }
  }
  
  // Check for bearish market structure break (lower high followed by break of previous low)
  if (!result.isBullishMSB && swingHighs.length >= 2) {
    const lastSwingHigh = swingHighs[swingHighs.length - 1];
    const previousSwingHigh = swingHighs[swingHighs.length - 2];
    
    if (lastSwingHigh.price < previousSwingHigh.price) {
      // We have a lower high, now check if we broke the previous swing low
      for (let i = lastSwingHigh.index; i < data.length; i++) {
        // Find the most recent swing low before the last swing high
        let relevantSwingLow = null;
        for (let j = swingLows.length - 1; j >= 0; j--) {
          if (swingLows[j].index < lastSwingHigh.index) {
            relevantSwingLow = swingLows[j];
            break;
          }
        }
        
        if (relevantSwingLow && data[i].low < relevantSwingLow.price) {
          result.isBearishMSB = true;
          result.breakIndex = i;
          result.previousStructure = 'uptrend';
          result.newStructure = 'downtrend';
          
          // Calculate confidence based on the strength of the break
          const breakStrength = (relevantSwingLow.price - data[i].low) / relevantSwingLow.price;
          result.confidence = Math.min(95, Math.round(50 + breakStrength * 5000));
          break;
        }
      }
    }
  }
  
  return result;
}

/**
 * Identifies fair value gaps (FVG) in the price data
 * @param data Price data array
 * @param threshold Minimum percentage gap size to consider
 * @returns Array of fair value gaps with their properties
 */
export function findFairValueGaps(
  data: ChartData[],
  threshold: number = 0.005
): { 
  bullish: { index: number, low: number, high: number, magnitude: number }[],
  bearish: { index: number, low: number, high: number, magnitude: number }[]
} {
  const result = {
    bullish: [] as { index: number, low: number, high: number, magnitude: number }[],
    bearish: [] as { index: number, low: number, high: number, magnitude: number }[]
  };
  
  if (data.length < 3) {
    return result;
  }
  
  for (let i = 1; i < data.length - 1; i++) {
    // Bullish FVG (gap up)
    if (data[i + 1].low > data[i - 1].high) {
      const gapSize = data[i + 1].low - data[i - 1].high;
      const gapPercentage = gapSize / data[i - 1].high;
      
      if (gapPercentage >= threshold) {
        result.bullish.push({
          index: i,
          low: data[i - 1].high,
          high: data[i + 1].low,
          magnitude: gapPercentage
        });
      }
    }
    
    // Bearish FVG (gap down)
    if (data[i + 1].high < data[i - 1].low) {
      const gapSize = data[i - 1].low - data[i + 1].high;
      const gapPercentage = gapSize / data[i - 1].low;
      
      if (gapPercentage >= threshold) {
        result.bearish.push({
          index: i,
          high: data[i - 1].low,
          low: data[i + 1].high,
          magnitude: gapPercentage
        });
      }
    }
  }
  
  return result;
}

/**
 * Evaluates the current price against significant Fibonacci levels
 * @param price Current price
 * @param fibLevels Fibonacci retracement or extension levels
 * @returns Analysis of price relative to Fibonacci levels
 */
export function analyzeFibonacciLevels(
  price: number,
  fibLevels: Record<string, number>
): {
  nearestLevel: string,
  distancePercentage: number,
  isSupport: boolean,
  isResistance: boolean,
  strength: number
} {
  // Sort levels by price
  const sortedLevels = Object.entries(fibLevels)
    .sort((a, b) => a[1] - b[1]);
  
  // Find the nearest levels
  let nearestLevel = sortedLevels[0][0];
  let minDistance = Math.abs(price - sortedLevels[0][1]);
  
  for (let i = 1; i < sortedLevels.length; i++) {
    const distance = Math.abs(price - sortedLevels[i][1]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLevel = sortedLevels[i][0];
    }
  }
  
  // Find support and resistance levels
  let supportIndex = -1;
  let resistanceIndex = -1;
  
  for (let i = 0; i < sortedLevels.length; i++) {
    if (sortedLevels[i][1] <= price) {
      supportIndex = i;
    } else {
      resistanceIndex = i;
      break;
    }
  }
  
  const supportLevel = supportIndex >= 0 ? sortedLevels[supportIndex][1] : null;
  const resistanceLevel = resistanceIndex >= 0 ? sortedLevels[resistanceIndex][1] : null;
  
  // Calculate distance percentage from nearest level
  const nearestValue = fibLevels[nearestLevel];
  const distancePercentage = Math.abs((price - nearestValue) / price) * 100;
  
  // Determine if current price is at a support or resistance level
  const isSupport = distancePercentage < 0.5 && supportLevel === nearestValue;
  const isResistance = distancePercentage < 0.5 && resistanceLevel === nearestValue;
  
  // Calculate strength based on the specific Fibonacci level
  // Key levels like 0.618, 1.618 are stronger
  let strength = 50;
  if (nearestLevel.includes('618')) {
    strength = 85;
  } else if (nearestLevel.includes('1')) {
    strength = 80;
  } else if (nearestLevel.includes('5')) {
    strength = 75;
  } else if (nearestLevel.includes('382')) {
    strength = 70;
  } else if (nearestLevel.includes('236')) {
    strength = 65;
  }
  
  // Adjust strength based on distance from level
  if (distancePercentage < 0.1) {
    strength += 15;
  } else if (distancePercentage < 0.25) {
    strength += 10;
  } else if (distancePercentage < 0.5) {
    strength += 5;
  } else if (distancePercentage > 1) {
    strength -= 10;
  }
  
  strength = Math.min(95, Math.max(50, strength));
  
  return {
    nearestLevel,
    distancePercentage,
    isSupport,
    isResistance,
    strength
  };
}

/**
 * Enhance signal probability based on multiple advanced indicators
 * @param data Chart data
 * @param timeframe Current timeframe
 * @param baseConfidence Initial confidence from primary indicators
 * @param direction Initial signal direction
 * @returns Enhanced confidence and additional signal insights
 */
export function enhanceSignalWithAdvancedIndicators(
  data: ChartData[],
  timeframe: TimeFrame,
  baseConfidence: number,
  direction: 'LONG' | 'SHORT' | 'NEUTRAL'
): {
  enhancedConfidence: number;
  additionalInsights: string[];
  keyLevels: { type: string, price: number, strength: number }[];
} {
  const result = {
    enhancedConfidence: baseConfidence,
    additionalInsights: [] as string[],
    keyLevels: [] as { type: string, price: number, strength: number }[]
  };
  
  if (data.length < 30) {
    return result;
  }
  
  let confidenceAdjustment = 0;
  
  // Get current price (most recent close)
  const currentPrice = data[data.length - 1].close;
  
  // 1. Find major swing points for Fibonacci analysis
  const lookbackPeriods: Record<TimeFrame, number> = {
    '1m': 60,
    '5m': 48,
    '15m': 32,
    '30m': 24,
    '1h': 24,
    '4h': 18,
    '1d': 14,
    '3d': 10,
    '1w': 8,
    '1M': 6
  };
  
  const lookback = lookbackPeriods[timeframe] || 24;
  const startIndex = Math.max(0, data.length - lookback);
  
  // Find highest high and lowest low in the lookback period
  let highestHigh = -Infinity;
  let lowestLow = Infinity;
  let highestHighIndex = -1;
  let lowestLowIndex = -1;
  
  for (let i = startIndex; i < data.length; i++) {
    if (data[i].high > highestHigh) {
      highestHigh = data[i].high;
      highestHighIndex = i;
    }
    
    if (data[i].low < lowestLow) {
      lowestLow = data[i].low;
      lowestLowIndex = i;
    }
  }
  
  // 2. Calculate Fibonacci retracement levels
  let fibLevels;
  let fibRetracements;
  let fibMessage = '';
  
  // Determine if we're in an uptrend or downtrend for proper Fibonacci calculation
  const isUptrend = highestHighIndex > lowestLowIndex;
  
  if (isUptrend) {
    fibRetracements = calculateFibonacciRetracement(highestHigh, lowestLow);
    fibLevels = analyzeFibonacciLevels(currentPrice, fibRetracements);
    
    // Add key Fibonacci levels to our result
    result.keyLevels.push(
      { type: 'Fib 0.618 Support', price: fibRetracements.level618, strength: 80 },
      { type: 'Fib 0.5 Support', price: fibRetracements.level5, strength: 75 },
      { type: 'Fib 0.382 Support', price: fibRetracements.level382, strength: 70 }
    );
    
    // Generate insight message
    if (fibLevels.isSupport) {
      fibMessage = `Price at key Fibonacci support (${fibLevels.nearestLevel.replace('level', '')}). `;
      confidenceAdjustment += direction === 'LONG' ? 15 : -5;
    } else if (fibLevels.isResistance) {
      fibMessage = `Price at key Fibonacci resistance (${fibLevels.nearestLevel.replace('level', '')}). `;
      confidenceAdjustment += direction === 'SHORT' ? 15 : -5;
    } else {
      fibMessage = `Price between Fibonacci levels, nearest is ${fibLevels.nearestLevel.replace('level', '')}. `;
    }
  } else {
    // Downtrend - reverse the high and low for proper retracement
    fibRetracements = calculateFibonacciRetracement(lowestLow, highestHigh);
    fibLevels = analyzeFibonacciLevels(currentPrice, fibRetracements);
    
    // Add key Fibonacci levels to our result
    result.keyLevels.push(
      { type: 'Fib 0.618 Resistance', price: fibRetracements.level618, strength: 80 },
      { type: 'Fib 0.5 Resistance', price: fibRetracements.level5, strength: 75 },
      { type: 'Fib 0.382 Resistance', price: fibRetracements.level382, strength: 70 }
    );
    
    // Generate insight message
    if (fibLevels.isSupport) {
      fibMessage = `Price at key Fibonacci support (${fibLevels.nearestLevel.replace('level', '')}). `;
      confidenceAdjustment += direction === 'LONG' ? 15 : -5;
    } else if (fibLevels.isResistance) {
      fibMessage = `Price at key Fibonacci resistance (${fibLevels.nearestLevel.replace('level', '')}). `;
      confidenceAdjustment += direction === 'SHORT' ? 15 : -5;
    } else {
      fibMessage = `Price between Fibonacci levels, nearest is ${fibLevels.nearestLevel.replace('level', '')}. `;
    }
  }
  
  result.additionalInsights.push(fibMessage);
  
  // 3. Detect market structure breaks
  const msbResult = detectMarketStructureBreak(data);
  if (msbResult.isBullishMSB) {
    result.additionalInsights.push(`Bullish market structure break detected (${msbResult.confidence}% confidence).`);
    confidenceAdjustment += direction === 'LONG' ? 20 : -10;
    
    result.keyLevels.push({ 
      type: 'Bullish MSB Level', 
      price: data[msbResult.breakIndex].high, 
      strength: 85
    });
  } else if (msbResult.isBearishMSB) {
    result.additionalInsights.push(`Bearish market structure break detected (${msbResult.confidence}% confidence).`);
    confidenceAdjustment += direction === 'SHORT' ? 20 : -10;
    
    result.keyLevels.push({ 
      type: 'Bearish MSB Level', 
      price: data[msbResult.breakIndex].low, 
      strength: 85
    });
  }
  
  // 4. Find Fair Value Gaps (FVG)
  const fvgResults = findFairValueGaps(data);
  if (fvgResults.bullish.length > 0 || fvgResults.bearish.length > 0) {
    // Sort by recency (index) and take the most recent
    const recentBullishFVG = fvgResults.bullish.sort((a, b) => b.index - a.index)[0];
    const recentBearishFVG = fvgResults.bearish.sort((a, b) => b.index - a.index)[0];
    
    if (recentBullishFVG) {
      result.additionalInsights.push(`Bullish fair value gap at ${recentBullishFVG.low.toFixed(2)}-${recentBullishFVG.high.toFixed(2)}.`);
      result.keyLevels.push({ 
        type: 'Bullish FVG', 
        price: (recentBullishFVG.low + recentBullishFVG.high) / 2, 
        strength: 75
      });
      
      if (currentPrice >= recentBullishFVG.low && currentPrice <= recentBullishFVG.high) {
        confidenceAdjustment += direction === 'LONG' ? 15 : -5;
      }
    }
    
    if (recentBearishFVG) {
      result.additionalInsights.push(`Bearish fair value gap at ${recentBearishFVG.low.toFixed(2)}-${recentBearishFVG.high.toFixed(2)}.`);
      result.keyLevels.push({ 
        type: 'Bearish FVG', 
        price: (recentBearishFVG.low + recentBearishFVG.high) / 2, 
        strength: 75
      });
      
      if (currentPrice >= recentBearishFVG.low && currentPrice <= recentBearishFVG.high) {
        confidenceAdjustment += direction === 'SHORT' ? 15 : -5;
      }
    }
  }
  
  // Apply confidence adjustment based on timeframe weight
  // Higher timeframes should have more impact on confidence
  const timeframeWeight = {
    '1m': 0.4,
    '5m': 0.5,
    '15m': 0.6,
    '30m': 0.7,
    '1h': 0.8,
    '4h': 0.9,
    '1d': 1.0,
    '3d': 1.1,
    '1w': 1.2,
    '1M': 1.3
  };
  
  const weight = timeframeWeight[timeframe] || 0.8;
  const weightedAdjustment = confidenceAdjustment * weight;
  
  // Apply the weighted adjustment to the base confidence
  result.enhancedConfidence = Math.min(98, Math.max(50, 
    Math.round(baseConfidence + weightedAdjustment)));
  
  return result;
}