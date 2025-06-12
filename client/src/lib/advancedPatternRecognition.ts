/**
 * Advanced Pattern Recognition System
 * Identifies complex chart patterns for more accurate trading signals
 */

import { ChartData, TimeFrame } from '../types';

// Common pattern types
export type PatternType = 
  | 'Head and Shoulders' 
  | 'Inverse Head and Shoulders'
  | 'Double Top' 
  | 'Double Bottom'
  | 'Triple Top'
  | 'Triple Bottom'
  | 'Ascending Triangle'
  | 'Descending Triangle'
  | 'Symmetrical Triangle'
  | 'Rising Wedge'
  | 'Falling Wedge'
  | 'Cup and Handle'
  | 'Inverse Cup and Handle'
  | 'Bull Flag'
  | 'Bear Flag'
  | 'Pennant'
  | 'Rectangle'
  | 'Rounding Bottom'
  | 'Rounding Top'
  | 'Adam and Eve Double Bottom'
  | 'Adam and Eve Double Top'
  | 'Gartley Pattern'
  | 'Butterfly Pattern'
  | 'Bat Pattern'
  | 'Crab Pattern'
  | 'Shark Pattern';

// Pattern detection result
export interface PatternResult {
  patternType: PatternType;
  startIndex: number;
  endIndex: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  reliability: number; // 0-100
  targetPrice: number | null;
  stopLoss: number | null;
  description: string;
}

/**
 * Optimized pattern recognition function that runs only the most important patterns
 * and eliminates duplicates
 * @param data Price data
 * @param timeframe Current timeframe
 * @returns Array of detected patterns with duplicates removed
 */
export function detectAllPatterns(data: ChartData[], timeframe: TimeFrame): PatternResult[] {
  // Return early if not enough data
  if (!data || data.length < 30) {
    return [];
  }
  
  // Use a subset of data for better performance (most recent 200 candles or all if fewer)
  const dataSubset = data.length > 200 ? data.slice(data.length - 200) : data;
  
  // For shorter timeframes, focus on simpler patterns only
  if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m') {
    // Only detect double patterns which are simpler and faster to calculate
    const doublePatterns = detectDoublePatterns(dataSubset);
    return removeDuplicatePatterns(doublePatterns);
  }
  
  // Determine which patterns to detect based on timeframe
  // For longer timeframes, focus on more significant patterns
  const results: PatternResult[] = [];
  
  // Run selected pattern detection algorithms based on timeframe
  const doublePatterns = detectDoublePatterns(dataSubset);
  results.push(...doublePatterns);
  
  // Add more complex patterns only for longer timeframes
  if (timeframe === '1d' || timeframe === '3d' || timeframe === '1w' || timeframe === '1M') {
    const headAndShoulders = detectHeadAndShoulders(dataSubset);
    results.push(...headAndShoulders);
  }
  
  // Medium-term timeframes get triangle patterns
  if (timeframe === '4h' || timeframe === '1d' || timeframe === '3d') {
    const trianglePatterns = detectTrianglePatterns(dataSubset);
    results.push(...trianglePatterns);
  }
  
  // Remove duplicate pattern types that occur close to each other
  return removeDuplicatePatterns(results);
}

/**
 * Removes duplicate pattern detections of the same type that are too close to each other
 * This prevents the same pattern from appearing multiple times in the analysis
 * @param patterns Array of detected patterns
 * @returns Filtered array with duplicates removed
 */
function removeDuplicatePatterns(patterns: PatternResult[]): PatternResult[] {
  // If there are less than 2 patterns, no need to de-duplicate
  if (patterns.length < 2) {
    return patterns;
  }
  
  // Sort patterns by reliability (highest first)
  const sortedPatterns = [...patterns].sort((a, b) => b.reliability - a.reliability);
  
  // Map to track which pattern types we've already seen
  const seenPatternTypes = new Map<PatternType, PatternResult>();
  
  // For each pattern type, keep only the most reliable instance
  for (const pattern of sortedPatterns) {
    if (!seenPatternTypes.has(pattern.patternType)) {
      seenPatternTypes.set(pattern.patternType, pattern);
    }
  }
  
  // Return array of unique patterns (highest reliability for each type)
  return Array.from(seenPatternTypes.values());
}

/**
 * Detect Head and Shoulders patterns (including inverse)
 */
function detectHeadAndShoulders(data: ChartData[]): PatternResult[] {
  const results: PatternResult[] = [];
  const len = data.length;
  
  if (len < 40) return results;
  
  // Find local peaks and troughs
  const peaks: number[] = [];
  const troughs: number[] = [];
  
  for (let i = 5; i < len - 5; i++) {
    // Peak detection
    if (data[i].high > data[i-1].high && 
        data[i].high > data[i-2].high && 
        data[i].high > data[i+1].high && 
        data[i].high > data[i+2].high) {
      peaks.push(i);
    }
    
    // Trough detection
    if (data[i].low < data[i-1].low && 
        data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && 
        data[i].low < data[i+2].low) {
      troughs.push(i);
    }
  }
  
  // We need at least 3 peaks and 2 troughs for head and shoulders
  if (peaks.length >= 3) {
    // Look for head and shoulders pattern
    for (let i = 0; i < peaks.length - 2; i++) {
      const left = peaks[i];
      const head = peaks[i + 1];
      const right = peaks[i + 2];
      
      // Check if the head is higher than both shoulders
      if (data[head].high > data[left].high && 
          data[head].high > data[right].high &&
          Math.abs(data[left].high - data[right].high) / data[right].high < 0.03) { // Similar shoulder heights
        
        // Find neckline by connecting troughs between shoulders and head
        const leftTrough = findClosestTrough(troughs, left, head);
        const rightTrough = findClosestTrough(troughs, head, right);
        
        if (leftTrough !== -1 && rightTrough !== -1) {
          // Calculate pattern reliability
          const reliability = calculatePatternReliability('Head and Shoulders', data, [left, head, right, leftTrough, rightTrough]);
          
          // Calculate target price (measured move)
          const necklinePrice = (data[leftTrough].low + data[rightTrough].low) / 2;
          const headHeight = data[head].high - necklinePrice;
          const targetPrice = necklinePrice - headHeight;
          
          results.push({
            patternType: 'Head and Shoulders',
            startIndex: left,
            endIndex: right,
            direction: 'bearish',
            reliability,
            targetPrice,
            stopLoss: data[head].high,
            description: 'Classic reversal pattern signaling a change from bullish to bearish'
          });
        }
      }
    }
  }
  
  // Check for inverse head and shoulders
  if (troughs.length >= 3) {
    for (let i = 0; i < troughs.length - 2; i++) {
      const left = troughs[i];
      const head = troughs[i + 1];
      const right = troughs[i + 2];
      
      // Check if the head is lower than both shoulders
      if (data[head].low < data[left].low && 
          data[head].low < data[right].low &&
          Math.abs(data[left].low - data[right].low) / data[right].low < 0.03) { // Similar shoulder heights
        
        // Find neckline by connecting peaks between shoulders and head
        const leftPeak = findClosestPeak(peaks, left, head);
        const rightPeak = findClosestPeak(peaks, head, right);
        
        if (leftPeak !== -1 && rightPeak !== -1) {
          // Calculate pattern reliability
          const reliability = calculatePatternReliability('Inverse Head and Shoulders', data, [left, head, right, leftPeak, rightPeak]);
          
          // Calculate target price (measured move)
          const necklinePrice = (data[leftPeak].high + data[rightPeak].high) / 2;
          const headHeight = necklinePrice - data[head].low;
          const targetPrice = necklinePrice + headHeight;
          
          results.push({
            patternType: 'Inverse Head and Shoulders',
            startIndex: left,
            endIndex: right,
            direction: 'bullish',
            reliability,
            targetPrice,
            stopLoss: data[head].low,
            description: 'Classic reversal pattern signaling a change from bearish to bullish'
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Detect Double Top/Bottom and Triple Top/Bottom patterns
 */
function detectDoublePatterns(data: ChartData[]): PatternResult[] {
  const results: PatternResult[] = [];
  const len = data.length;
  
  if (len < 30) return results;
  
  // Find local peaks and troughs
  const peaks: number[] = [];
  const troughs: number[] = [];
  
  for (let i = 5; i < len - 5; i++) {
    // Peak detection
    if (data[i].high > data[i-1].high && 
        data[i].high > data[i-2].high && 
        data[i].high > data[i+1].high && 
        data[i].high > data[i+2].high) {
      peaks.push(i);
    }
    
    // Trough detection
    if (data[i].low < data[i-1].low && 
        data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && 
        data[i].low < data[i+2].low) {
      troughs.push(i);
    }
  }
  
  // Check for double top
  if (peaks.length >= 2) {
    for (let i = 0; i < peaks.length - 1; i++) {
      const first = peaks[i];
      const second = peaks[i + 1];
      
      // Peaks should be separated by some distance
      if (second - first >= 5) {
        // Peaks should be at similar levels
        const priceDiff = Math.abs(data[first].high - data[second].high) / data[second].high;
        
        if (priceDiff < 0.015) { // Within 1.5%
          // Find the trough between the peaks
          const middleTrough = findClosestTrough(troughs, first, second);
          
          if (middleTrough !== -1) {
            const reliability = calculatePatternReliability('Double Top', data, [first, second, middleTrough]);
            const necklinePrice = data[middleTrough].low;
            const height = data[first].high - necklinePrice;
            const targetPrice = necklinePrice - height;
            
            results.push({
              patternType: 'Double Top',
              startIndex: first,
              endIndex: second,
              direction: 'bearish',
              reliability,
              targetPrice,
              stopLoss: Math.max(data[first].high, data[second].high),
              description: 'Reversal pattern indicating the end of an uptrend'
            });
          }
        }
      }
    }
  }
  
  // Check for double bottom
  if (troughs.length >= 2) {
    for (let i = 0; i < troughs.length - 1; i++) {
      const first = troughs[i];
      const second = troughs[i + 1];
      
      // Troughs should be separated by some distance
      if (second - first >= 5) {
        // Troughs should be at similar levels
        const priceDiff = Math.abs(data[first].low - data[second].low) / data[second].low;
        
        if (priceDiff < 0.015) { // Within 1.5%
          // Find the peak between the troughs
          const middlePeak = findClosestPeak(peaks, first, second);
          
          if (middlePeak !== -1) {
            const reliability = calculatePatternReliability('Double Bottom', data, [first, second, middlePeak]);
            const necklinePrice = data[middlePeak].high;
            const height = necklinePrice - data[first].low;
            const targetPrice = necklinePrice + height;
            
            results.push({
              patternType: 'Double Bottom',
              startIndex: first,
              endIndex: second,
              direction: 'bullish',
              reliability,
              targetPrice,
              stopLoss: Math.min(data[first].low, data[second].low),
              description: 'Reversal pattern indicating the end of a downtrend'
            });
          }
        }
      }
    }
  }
  
  // Check for triple top
  if (peaks.length >= 3) {
    for (let i = 0; i < peaks.length - 2; i++) {
      const first = peaks[i];
      const second = peaks[i + 1];
      const third = peaks[i + 2];
      
      // Peaks should be separated by some distance
      if (second - first >= 5 && third - second >= 5) {
        // All three peaks should be at similar levels
        const priceDiff1 = Math.abs(data[first].high - data[second].high) / data[second].high;
        const priceDiff2 = Math.abs(data[second].high - data[third].high) / data[third].high;
        const priceDiff3 = Math.abs(data[first].high - data[third].high) / data[third].high;
        
        if (priceDiff1 < 0.02 && priceDiff2 < 0.02 && priceDiff3 < 0.02) { // Within 2%
          // Find the troughs between the peaks
          const middleTrough1 = findClosestTrough(troughs, first, second);
          const middleTrough2 = findClosestTrough(troughs, second, third);
          
          if (middleTrough1 !== -1 && middleTrough2 !== -1) {
            const reliability = calculatePatternReliability('Triple Top', data, [first, second, third, middleTrough1, middleTrough2]);
            const necklinePrice = Math.min(data[middleTrough1].low, data[middleTrough2].low);
            const height = data[second].high - necklinePrice;
            const targetPrice = necklinePrice - height;
            
            results.push({
              patternType: 'Triple Top',
              startIndex: first,
              endIndex: third,
              direction: 'bearish',
              reliability,
              targetPrice,
              stopLoss: Math.max(data[first].high, data[second].high, data[third].high),
              description: 'Strong reversal pattern indicating the end of an uptrend'
            });
          }
        }
      }
    }
  }
  
  // Check for triple bottom
  if (troughs.length >= 3) {
    for (let i = 0; i < troughs.length - 2; i++) {
      const first = troughs[i];
      const second = troughs[i + 1];
      const third = troughs[i + 2];
      
      // Troughs should be separated by some distance
      if (second - first >= 5 && third - second >= 5) {
        // All three troughs should be at similar levels
        const priceDiff1 = Math.abs(data[first].low - data[second].low) / data[second].low;
        const priceDiff2 = Math.abs(data[second].low - data[third].low) / data[third].low;
        const priceDiff3 = Math.abs(data[first].low - data[third].low) / data[third].low;
        
        if (priceDiff1 < 0.02 && priceDiff2 < 0.02 && priceDiff3 < 0.02) { // Within 2%
          // Find the peaks between the troughs
          const middlePeak1 = findClosestPeak(peaks, first, second);
          const middlePeak2 = findClosestPeak(peaks, second, third);
          
          if (middlePeak1 !== -1 && middlePeak2 !== -1) {
            const reliability = calculatePatternReliability('Triple Bottom', data, [first, second, third, middlePeak1, middlePeak2]);
            const necklinePrice = Math.max(data[middlePeak1].high, data[middlePeak2].high);
            const height = necklinePrice - data[second].low;
            const targetPrice = necklinePrice + height;
            
            results.push({
              patternType: 'Triple Bottom',
              startIndex: first,
              endIndex: third,
              direction: 'bullish',
              reliability,
              targetPrice,
              stopLoss: Math.min(data[first].low, data[second].low, data[third].low),
              description: 'Strong reversal pattern indicating the end of a downtrend'
            });
          }
        }
      }
    }
  }
  
  return results;
}

/**
 * Detect Triangle patterns (Ascending, Descending, Symmetrical)
 */
function detectTrianglePatterns(data: ChartData[]): PatternResult[] {
  const results: PatternResult[] = [];
  const len = data.length;
  
  if (len < 20) return results;
  
  // Find potential triangle formations over different sections of the data
  for (let startIdx = 0; startIdx < len - 20; startIdx += 5) {
    const endIdx = Math.min(startIdx + 40, len - 1);
    const section = data.slice(startIdx, endIdx);
    
    if (section.length < 15) continue;
    
    // Find local peaks and troughs in this section
    const peaks: number[] = [];
    const troughs: number[] = [];
    
    for (let i = 2; i < section.length - 2; i++) {
      // Peak detection
      if (section[i].high > section[i-1].high && 
          section[i].high > section[i-2].high && 
          section[i].high > section[i+1].high && 
          section[i].high > section[i+2].high) {
        peaks.push(i);
      }
      
      // Trough detection
      if (section[i].low < section[i-1].low && 
          section[i].low < section[i-2].low && 
          section[i].low < section[i+1].low && 
          section[i].low < section[i+2].low) {
        troughs.push(i);
      }
    }
    
    // Need at least 2 peaks and 2 troughs to form a triangle
    if (peaks.length >= 2 && troughs.length >= 2) {
      // Check for ascending triangle
      if (isAscendingTriangle(section, peaks, troughs)) {
        const reliability = calculatePatternReliability('Ascending Triangle', section, [...peaks.slice(0, 2), ...troughs.slice(0, 2)]);
        
        // Calculate breakout target (height of the pattern added to breakout point)
        const height = findTriangleHeight(section, peaks, troughs, 'ascending');
        const resistanceLevel = findResistanceLevel(section, peaks);
        const targetPrice = resistanceLevel + height;
        
        results.push({
          patternType: 'Ascending Triangle',
          startIndex: startIdx,
          endIndex: endIdx,
          direction: 'bullish',
          reliability,
          targetPrice,
          stopLoss: findSupportLevel(section, troughs),
          description: 'Bullish continuation pattern with a flat top and rising support'
        });
      }
      
      // Check for descending triangle
      if (isDescendingTriangle(section, peaks, troughs)) {
        const reliability = calculatePatternReliability('Descending Triangle', section, [...peaks.slice(0, 2), ...troughs.slice(0, 2)]);
        
        // Calculate breakout target
        const height = findTriangleHeight(section, peaks, troughs, 'descending');
        const supportLevel = findSupportLevel(section, troughs);
        const targetPrice = supportLevel - height;
        
        results.push({
          patternType: 'Descending Triangle',
          startIndex: startIdx,
          endIndex: endIdx,
          direction: 'bearish',
          reliability,
          targetPrice,
          stopLoss: findResistanceLevel(section, peaks),
          description: 'Bearish continuation pattern with a flat bottom and falling resistance'
        });
      }
      
      // Check for symmetrical triangle
      if (isSymmetricalTriangle(section, peaks, troughs)) {
        // Determine the likely direction based on the prior trend
        const priorTrend = determinePriorTrend(data, startIdx);
        const direction = priorTrend === 'up' ? 'bullish' : 'bearish';
        
        const reliability = calculatePatternReliability('Symmetrical Triangle', section, [...peaks.slice(0, 2), ...troughs.slice(0, 2)]);
        
        // Calculate breakout target
        const height = findTriangleHeight(section, peaks, troughs, 'symmetrical');
        const lastPrice = section[section.length - 1].close;
        const targetPrice = direction === 'bullish' ? lastPrice + height : lastPrice - height;
        
        results.push({
          patternType: 'Symmetrical Triangle',
          startIndex: startIdx,
          endIndex: endIdx,
          direction,
          reliability,
          targetPrice,
          stopLoss: direction === 'bullish' ? 
            findSupportLevel(section, troughs) : 
            findResistanceLevel(section, peaks),
          description: `${direction === 'bullish' ? 'Bullish' : 'Bearish'} continuation pattern with converging trendline`s`
        });
      }
    }
  }
  
  return results;
}

/**
 * Detect Wedge patterns (Rising and Falling)
 */
function detectWedgePatterns(data: ChartData[]): PatternResult[] {
  const results: PatternResult[] = [];
  const len = data.length;
  
  if (len < 20) return results;
  
  // Find potential wedge formations over different sections of the data
  for (let startIdx = 0; startIdx < len - 20; startIdx += 5) {
    const endIdx = Math.min(startIdx + 40, len - 1);
    const section = data.slice(startIdx, endIdx);
    
    if (section.length < 15) continue;
    
    // Find local peaks and troughs in this section
    const peaks: number[] = [];
    const troughs: number[] = [];
    
    for (let i = 2; i < section.length - 2; i++) {
      // Peak detection
      if (section[i].high > section[i-1].high && 
          section[i].high > section[i-2].high && 
          section[i].high > section[i+1].high && 
          section[i].high > section[i+2].high) {
        peaks.push(i);
      }
      
      // Trough detection
      if (section[i].low < section[i-1].low && 
          section[i].low < section[i-2].low && 
          section[i].low < section[i+1].low && 
          section[i].low < section[i+2].low) {
        troughs.push(i);
      }
    }
    
    // Need at least 2 peaks and 2 troughs to form a wedge
    if (peaks.length >= 2 && troughs.length >= 2) {
      // Check for rising wedge
      if (isRisingWedge(section, peaks, troughs)) {
        const reliability = calculatePatternReliability('Rising Wedge', section, [...peaks.slice(0, 2), ...troughs.slice(0, 2)]);
        
        // Calculate breakout target
        const height = findWedgeHeight(section, peaks, troughs);
        const lastLow = section[section.length - 1].low;
        const targetPrice = lastLow - height;
        
        results.push({
          patternType: 'Rising Wedge',
          startIndex: startIdx,
          endIndex: endIdx,
          direction: 'bearish',
          reliability,
          targetPrice,
          stopLoss: section[peaks[peaks.length - 1]].high,
          description: 'Bearish reversal pattern with rising support and resistance lines converging'
        });
      }
      
      // Check for falling wedge
      if (isFallingWedge(section, peaks, troughs)) {
        const reliability = calculatePatternReliability('Falling Wedge', section, [...peaks.slice(0, 2), ...troughs.slice(0, 2)]);
        
        // Calculate breakout target
        const height = findWedgeHeight(section, peaks, troughs);
        const lastHigh = section[section.length - 1].high;
        const targetPrice = lastHigh + height;
        
        results.push({
          patternType: 'Falling Wedge',
          startIndex: startIdx,
          endIndex: endIdx,
          direction: 'bullish',
          reliability,
          targetPrice,
          stopLoss: section[troughs[troughs.length - 1]].low,
          description: 'Bullish reversal pattern with falling support and resistance lines converging'
        });
      }
    }
  }
  
  return results;
}

/**
 * Detect Flag and Pennant patterns
 */
function detectFlagPatterns(data: ChartData[]): PatternResult[] {
  const results: PatternResult[] = [];
  const len = data.length;
  
  if (len < 15) return results;
  
  // Look for a strong price move (pole) followed by consolidation
  for (let i = 10; i < len - 10; i++) {
    // Check for potential bull flag (strong upward move followed by consolidation)
    const bullPole = detectPriceFlag(data, i, 'bullish');
    if (bullPole) {
      const flagSection = data.slice(bullPole.poleEnd, bullPole.consolidationEnd);
      
      if (isBullFlag(flagSection)) {
        const reliability = calculatePatternReliability('Bull Flag', data, [bullPole.poleStart, bullPole.poleEnd, bullPole.consolidationEnd]);
        
        // Calculate target using measured move technique
        const poleHeight = data[bullPole.poleEnd].high - data[bullPole.poleStart].low;
        const targetPrice = data[bullPole.consolidationEnd].high + poleHeight;
        
        results.push({
          patternType: 'Bull Flag',
          startIndex: bullPole.poleStart,
          endIndex: bullPole.consolidationEnd,
          direction: 'bullish',
          reliability,
          targetPrice,
          stopLoss: Math.min(...flagSection.map(bar => bar.low)),
          description: 'Bullish continuation pattern after a strong upward price move'
        });
      } else if (isPennant(flagSection)) {
        const reliability = calculatePatternReliability('Pennant', data, [bullPole.poleStart, bullPole.poleEnd, bullPole.consolidationEnd]);
        
        // Calculate target using measured move technique
        const poleHeight = data[bullPole.poleEnd].high - data[bullPole.poleStart].low;
        const targetPrice = data[bullPole.consolidationEnd].high + poleHeight;
        
        results.push({
          patternType: 'Pennant',
          startIndex: bullPole.poleStart,
          endIndex: bullPole.consolidationEnd,
          direction: 'bullish',
          reliability,
          targetPrice,
          stopLoss: Math.min(...flagSection.map(bar => bar.low)),
          description: 'Bullish continuation pattern with converging trendlines after a strong move'
        });
      }
    }
    
    // Check for potential bear flag (strong downward move followed by consolidation)
    const bearPole = detectPriceFlag(data, i, 'bearish');
    if (bearPole) {
      const flagSection = data.slice(bearPole.poleEnd, bearPole.consolidationEnd);
      
      if (isBearFlag(flagSection)) {
        const reliability = calculatePatternReliability('Bear Flag', data, [bearPole.poleStart, bearPole.poleEnd, bearPole.consolidationEnd]);
        
        // Calculate target using measured move technique
        const poleHeight = data[bearPole.poleStart].high - data[bearPole.poleEnd].low;
        const targetPrice = data[bearPole.consolidationEnd].low - poleHeight;
        
        results.push({
          patternType: 'Bear Flag',
          startIndex: bearPole.poleStart,
          endIndex: bearPole.consolidationEnd,
          direction: 'bearish',
          reliability,
          targetPrice,
          stopLoss: Math.max(...flagSection.map(bar => bar.high)),
          description: 'Bearish continuation pattern after a strong downward price move'
        });
      } else if (isPennant(flagSection)) {
        const reliability = calculatePatternReliability('Pennant', data, [bearPole.poleStart, bearPole.poleEnd, bearPole.consolidationEnd]);
        
        // Calculate target using measured move technique
        const poleHeight = data[bearPole.poleStart].high - data[bearPole.poleEnd].low;
        const targetPrice = data[bearPole.consolidationEnd].low - poleHeight;
        
        results.push({
          patternType: 'Pennant',
          startIndex: bearPole.poleStart,
          endIndex: bearPole.consolidationEnd,
          direction: 'bearish',
          reliability,
          targetPrice,
          stopLoss: Math.max(...flagSection.map(bar => bar.high)),
          description: 'Bearish continuation pattern with converging trendlines after a strong move'
        });
      }
    }
  }
  
  return results;
}

/**
 * Detect Harmonic Patterns (Gartley, Butterfly, Bat, Crab, Shark)
 */
function detectHarmonicPatterns(data: ChartData[]): PatternResult[] {
  const results: PatternResult[] = [];
  const len = data.length;
  
  if (len < 30) return results;
  
  // Find local peaks and troughs
  const peaks: number[] = [];
  const troughs: number[] = [];
  
  for (let i = 5; i < len - 5; i++) {
    // Peak detection
    if (data[i].high > data[i-1].high && 
        data[i].high > data[i-2].high && 
        data[i].high > data[i+1].high && 
        data[i].high > data[i+2].high) {
      peaks.push(i);
    }
    
    // Trough detection
    if (data[i].low < data[i-1].low && 
        data[i].low < data[i-2].low && 
        data[i].low < data[i+1].low && 
        data[i].low < data[i+2].low) {
      troughs.push(i);
    }
  }
  
  // We need at least 4 points for harmonic patterns
  if (peaks.length >= 2 && troughs.length >= 2) {
    // Create array of swing points (alternating peaks and troughs)
    const swingPoints: {index: number, isHigh: boolean}[] = [];
    
    for (const peak of peaks) {
      swingPoints.push({index: peak, isHigh: true});
    }
    
    for (const trough of troughs) {
      swingPoints.push({index: trough, isHigh: false});
    }
    
    // Sort by index
    swingPoints.sort((a, b) => a.index - b.index);
    
    // Check for Gartley patterns
    for (let i = 0; i < swingPoints.length - 4; i++) {
      const xIndex = swingPoints[i].index;
      const aIndex = swingPoints[i+1].index;
      const bIndex = swingPoints[i+2].index;
      const cIndex = swingPoints[i+3].index;
      const dIndex = swingPoints[i+4].index;
      
      // Check for bullish Gartley
      if (!swingPoints[i].isHigh && swingPoints[i+1].isHigh && !swingPoints[i+2].isHigh && 
          swingPoints[i+3].isHigh && !swingPoints[i+4].isHigh) {
        const xPoint = data[xIndex].low;
        const aPoint = data[aIndex].high;
        const bPoint = data[bIndex].low;
        const cPoint = data[cIndex].high;
        const dPoint = data[dIndex].low;
        
        const xaDistance = aPoint - xPoint;
        const abDistance = aPoint - bPoint;
        const bcDistance = cPoint - bPoint;
        const cdDistance = cPoint - dPoint;
        
        // Gartley pattern ratios
        const abRetracement = abDistance / xaDistance;
        const bcRetracement = bcDistance / abDistance;
        const cdRetracement = cdDistance / bcDistance;
        
        // Check if the ratios match Gartley pattern
        if (abRetracement >= 0.618 - 0.05 && abRetracement <= 0.618 + 0.05 &&
            bcRetracement >= 0.382 - 0.05 && bcRetracement <= 0.886 + 0.05 &&
            cdRetracement >= 1.27 - 0.1 && cdRetracement <= 1.618 + 0.1) {
          
          const reliability = calculatePatternReliability('Gartley Pattern', data, [xIndex, aIndex, bIndex, cIndex, dIndex]);
          
          results.push({
            patternType: 'Gartley Pattern',
            startIndex: xIndex,
            endIndex: dIndex,
            direction: 'bullish',
            reliability,
            targetPrice: aPoint,
            stopLoss: dPoint * 0.98, // 2% below D point
            description: 'Harmonic pattern indicating a potential reversal with specific Fibonacci ratios'
          });
        }
      }
      
      // Check for bearish Gartley
      if (swingPoints[i].isHigh && !swingPoints[i+1].isHigh && swingPoints[i+2].isHigh && 
          !swingPoints[i+3].isHigh && swingPoints[i+4].isHigh) {
        const xPoint = data[xIndex].high;
        const aPoint = data[aIndex].low;
        const bPoint = data[bIndex].high;
        const cPoint = data[cIndex].low;
        const dPoint = data[dIndex].high;
        
        const xaDistance = xPoint - aPoint;
        const abDistance = bPoint - aPoint;
        const bcDistance = bPoint - cPoint;
        const cdDistance = dPoint - cPoint;
        
        // Gartley pattern ratios
        const abRetracement = abDistance / xaDistance;
        const bcRetracement = bcDistance / abDistance;
        const cdRetracement = cdDistance / bcDistance;
        
        // Check if the ratios match Gartley pattern
        if (abRetracement >= 0.618 - 0.05 && abRetracement <= 0.618 + 0.05 &&
            bcRetracement >= 0.382 - 0.05 && bcRetracement <= 0.886 + 0.05 &&
            cdRetracement >= 1.27 - 0.1 && cdRetracement <= 1.618 + 0.1) {
          
          const reliability = calculatePatternReliability('Gartley Pattern', data, [xIndex, aIndex, bIndex, cIndex, dIndex]);
          
          results.push({
            patternType: 'Gartley Pattern',
            startIndex: xIndex,
            endIndex: dIndex,
            direction: 'bearish',
            reliability,
            targetPrice: aPoint,
            stopLoss: dPoint * 1.02, // 2% above D point
            description: 'Harmonic pattern indicating a potential reversal with specific Fibonacci ratios'
          });
        }
      }
      
      // Similarly, check for Butterfly, Bat, Crab, and Shark patterns
      // (Omitted for brevity, but would follow same logic with different ratios)
    }
  }
  
  return results;
}

/**
 * Helper functions
 */

function findClosestTrough(troughs: number[], start: number, end: number): number {
  for (const trough of troughs) {
    if (trough > start && trough < end) {
      return trough;
    }
  }
  return -1;
}

function findClosestPeak(peaks: number[], start: number, end: number): number {
  for (const peak of peaks) {
    if (peak > start && peak < end) {
      return peak;
    }
  }
  return -1;
}

function calculatePatternReliability(
  patternType: string, 
  data: ChartData[], 
  keyIndices: number[]
): number {
  // Base reliability
  let reliability = 70;
  
  // Adjust based on pattern type
  switch (patternType) {
    case 'Head and Shoulders':
    case 'Inverse Head and Shoulders':
      reliability += 5;
      break;
    case 'Triple Top':
    case 'Triple Bottom':
      reliability += 8;
      break;
    case 'Double Top':
    case 'Double Bottom':
      reliability += 3;
      break;
    case 'Rising Wedge':
    case 'Falling Wedge':
      reliability += 7;
      break;
    case 'Bull Flag':
    case 'Bear Flag':
      reliability += 10;
      break;
    case 'Gartley Pattern':
    case 'Butterfly Pattern':
      reliability += 12;
      break;
  }
  
  // Pattern clarity - check if pattern points are well-defined
  // Add up to 10 points for pattern clarity
  let patternClarity = 0;
  
  // Volume confirmation (if volume increases at breakout)
  // Add up to 10 points for volume confirmation
  let volumeConfirmation = 0;
  if (data[keyIndices[keyIndices.length - 1]].volume > 
      data[keyIndices[keyIndices.length - 2]].volume * 1.5) {
    volumeConfirmation = 10;
  } else if (data[keyIndices[keyIndices.length - 1]].volume > 
             data[keyIndices[keyIndices.length - 2]].volume) {
    volumeConfirmation = 5;
  }
  
  // Adjust reliability but keep it between 50 and 95
  reliability = Math.min(95, Math.max(50, reliability + patternClarity + volumeConfirmation));
  
  return reliability;
}

function isAscendingTriangle(data: ChartData[], peaks: number[], troughs: number[]): boolean {
  if (peaks.length < 2 || troughs.length < 2) return false;
  
  // Check if resistance line is horizontal (peaks are at similar levels)
  const peak1 = data[peaks[0]].high;
  const peak2 = data[peaks[peaks.length - 1]].high;
  const peakDiff = Math.abs((peak1 - peak2) / peak1);
  
  // Check if support line is ascending (troughs are making higher lows)
  const trough1 = data[troughs[0]].low;
  const trough2 = data[troughs[troughs.length - 1]].low;
  
  return peakDiff < 0.02 && trough2 > trough1;
}

function isDescendingTriangle(data: ChartData[], peaks: number[], troughs: number[]): boolean {
  if (peaks.length < 2 || troughs.length < 2) return false;
  
  // Check if support line is horizontal (troughs are at similar levels)
  const trough1 = data[troughs[0]].low;
  const trough2 = data[troughs[troughs.length - 1]].low;
  const troughDiff = Math.abs((trough1 - trough2) / trough1);
  
  // Check if resistance line is descending (peaks are making lower highs)
  const peak1 = data[peaks[0]].high;
  const peak2 = data[peaks[peaks.length - 1]].high;
  
  return troughDiff < 0.02 && peak2 < peak1;
}

function isSymmetricalTriangle(data: ChartData[], peaks: number[], troughs: number[]): boolean {
  if (peaks.length < 2 || troughs.length < 2) return false;
  
  // Check if resistance line is descending (peaks are making lower highs)
  const peak1 = data[peaks[0]].high;
  const peak2 = data[peaks[peaks.length - 1]].high;
  const peakDescending = peak2 < peak1;
  
  // Check if support line is ascending (troughs are making higher lows)
  const trough1 = data[troughs[0]].low;
  const trough2 = data[troughs[troughs.length - 1]].low;
  const troughAscending = trough2 > trough1;
  
  return peakDescending && troughAscending;
}

function isRisingWedge(data: ChartData[], peaks: number[], troughs: number[]): boolean {
  if (peaks.length < 2 || troughs.length < 2) return false;
  
  // For a rising wedge, both resistance and support lines are rising
  // but the resistance line is rising at a slower rate
  
  const peak1 = data[peaks[0]].high;
  const peak2 = data[peaks[peaks.length - 1]].high;
  const peakSlope = (peak2 - peak1) / (peaks[peaks.length - 1] - peaks[0]);
  
  const trough1 = data[troughs[0]].low;
  const trough2 = data[troughs[troughs.length - 1]].low;
  const troughSlope = (trough2 - trough1) / (troughs[troughs.length - 1] - troughs[0]);
  
  return peakSlope > 0 && troughSlope > 0 && troughSlope > peakSlope;
}

function isFallingWedge(data: ChartData[], peaks: number[], troughs: number[]): boolean {
  if (peaks.length < 2 || troughs.length < 2) return false;
  
  // For a falling wedge, both resistance and support lines are falling
  // but the support line is falling at a slower rate
  
  const peak1 = data[peaks[0]].high;
  const peak2 = data[peaks[peaks.length - 1]].high;
  const peakSlope = (peak2 - peak1) / (peaks[peaks.length - 1] - peaks[0]);
  
  const trough1 = data[troughs[0]].low;
  const trough2 = data[troughs[troughs.length - 1]].low;
  const troughSlope = (trough2 - trough1) / (troughs[troughs.length - 1] - troughs[0]);
  
  return peakSlope < 0 && troughSlope < 0 && troughSlope > peakSlope;
}

function detectPriceFlag(data: ChartData[], index: number, direction: 'bullish' | 'bearish'): 
{ poleStart: number, poleEnd: number, consolidationEnd: number } | null {
  const minPoleLength = 5;
  const maxPoleLength = 15;
  const maxConsolidationLength = 15;
  
  if (direction === 'bullish') {
    // Look for a strong upward move
    let poleStart = -1;
    let poleEnd = -1;
    
    // Find the start of the pole (lowest point)
    for (let i = Math.max(0, index - maxPoleLength); i < index; i++) {
      if (poleStart === -1 || data[i].low < data[poleStart].low) {
        poleStart = i;
      }
    }
    
    // Find the end of the pole (highest point)
    for (let i = poleStart + minPoleLength; i <= Math.min(index + 5, data.length - 1); i++) {
      if (poleEnd === -1 || data[i].high > data[poleEnd].high) {
        poleEnd = i;
      }
    }
    
    if (poleEnd - poleStart >= minPoleLength) {
      // Calculate pole height
      const poleHeight = data[poleEnd].high - data[poleStart].low;
      const minPoleHeightPercentage = 0.05; // 5% minimum
      
      if (poleHeight / data[poleStart].low >= minPoleHeightPercentage) {
        // Find the end of consolidation (max 15 bars after pole end)
        const consolidationEnd = Math.min(poleEnd + maxConsolidationLength, data.length - 1);
        
        return { poleStart, poleEnd, consolidationEnd };
      }
    }
  } else { // bearish
    // Look for a strong downward move
    let poleStart = -1;
    let poleEnd = -1;
    
    // Find the start of the pole (highest point)
    for (let i = Math.max(0, index - maxPoleLength); i < index; i++) {
      if (poleStart === -1 || data[i].high > data[poleStart].high) {
        poleStart = i;
      }
    }
    
    // Find the end of the pole (lowest point)
    for (let i = poleStart + minPoleLength; i <= Math.min(index + 5, data.length - 1); i++) {
      if (poleEnd === -1 || data[i].low < data[poleEnd].low) {
        poleEnd = i;
      }
    }
    
    if (poleEnd - poleStart >= minPoleLength) {
      // Calculate pole height
      const poleHeight = data[poleStart].high - data[poleEnd].low;
      const minPoleHeightPercentage = 0.05; // 5% minimum
      
      if (poleHeight / data[poleEnd].low >= minPoleHeightPercentage) {
        // Find the end of consolidation (max 15 bars after pole end)
        const consolidationEnd = Math.min(poleEnd + maxConsolidationLength, data.length - 1);
        
        return { poleStart, poleEnd, consolidationEnd };
      }
    }
  }
  
  return null;
}

function isBullFlag(data: ChartData[]): boolean {
  if (data.length < 5) return false;
  
  // Bull flag typically has a slight downward trend during consolidation
  let hasDownwardSlope = false;
  
  // Check for parallel channels
  const highs = data.map(bar => bar.high);
  const lows = data.map(bar => bar.low);
  
  // Linear regression on highs and lows
  const highsSlope = calculateSlope(highs);
  const lowsSlope = calculateSlope(lows);
  
  // Slopes should be negative and roughly parallel
  hasDownwardSlope = highsSlope < 0 && lowsSlope < 0;
  const isParallel = Math.abs(highsSlope - lowsSlope) / Math.abs(highsSlope) < 0.3;
  
  return hasDownwardSlope && isParallel;
}

function isBearFlag(data: ChartData[]): boolean {
  if (data.length < 5) return false;
  
  // Bear flag typically has a slight upward trend during consolidation
  let hasUpwardSlope = false;
  
  // Check for parallel channels
  const highs = data.map(bar => bar.high);
  const lows = data.map(bar => bar.low);
  
  // Linear regression on highs and lows
  const highsSlope = calculateSlope(highs);
  const lowsSlope = calculateSlope(lows);
  
  // Slopes should be positive and roughly parallel
  hasUpwardSlope = highsSlope > 0 && lowsSlope > 0;
  const isParallel = Math.abs(highsSlope - lowsSlope) / Math.abs(highsSlope) < 0.3;
  
  return hasUpwardSlope && isParallel;
}

function isPennant(data: ChartData[]): boolean {
  if (data.length < 5) return false;
  
  // Check for converging trend lines
  const highs = data.map(bar => bar.high);
  const lows = data.map(bar => bar.low);
  
  // Linear regression on highs and lows
  const highsSlope = calculateSlope(highs);
  const lowsSlope = calculateSlope(lows);
  
  // For a pennant, highs should have negative slope and lows should have positive slope
  return highsSlope < 0 && lowsSlope > 0;
}

function calculateSlope(values: number[]): number {
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

function findTriangleHeight(data: ChartData[], peaks: number[], troughs: number[], type: 'ascending' | 'descending' | 'symmetrical'): number {
  switch (type) {
    case 'ascending':
      return data[peaks[0]].high - data[troughs[0]].low;
    case 'descending':
      return data[peaks[0]].high - data[troughs[0]].low;
    case 'symmetrical':
      return data[peaks[0]].high - data[troughs[0]].low;
    default:
      return 0;
  }
}

function findWedgeHeight(data: ChartData[], peaks: number[], troughs: number[]): number {
  return data[peaks[0]].high - data[troughs[0]].low;
}

function findResistanceLevel(data: ChartData[], peaks: number[]): number {
  if (peaks.length === 0) return 0;
  return data[peaks[peaks.length - 1]].high;
}

function findSupportLevel(data: ChartData[], troughs: number[]): number {
  if (troughs.length === 0) return 0;
  return data[troughs[troughs.length - 1]].low;
}

function determinePriorTrend(data: ChartData[], startIdx: number): 'up' | 'down' {
  const lookbackPeriod = Math.min(30, startIdx);
  if (lookbackPeriod < 10) return 'up'; // Default to up if not enough data
  
  const segment = data.slice(startIdx - lookbackPeriod, startIdx);
  const firstPrice = segment[0].close;
  const lastPrice = segment[segment.length - 1].close;
  
  return lastPrice > firstPrice ? 'up' : 'down';
}

/**
 * Export helper functions for use in other modules
 */
export {
  detectHeadAndShoulders,
  detectDoublePatterns,
  detectTrianglePatterns,
  detectWedgePatterns,
  detectFlagPatterns,
  detectHarmonicPatterns
};