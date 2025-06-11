/**
 * Signal Stabilizer
 * 
 * Provides functions to stabilize signals across timeframes and prevent
 * rapid changes in signal direction with minor price movements.
 */

import { TimeFrame } from './advancedSignals';

/**
 * Stabilize a new signal against a previous signal to prevent rapid changes
 * 
 * @param newSignal The newly calculated signal 
 * @param previousSignal The previous signal from the last calculation
 * @returns A stabilized signal
 */
export function stabilizeSignals(newSignal: any, previousSignal: any): any {
  // If there's no previous signal, just return the new one
  if (!previousSignal) {
    return newSignal;
  }
  
  // Don't change signal direction unless confidence is significantly higher
  if (previousSignal.direction !== newSignal.direction) {
    // Only switch if the new signal has much higher confidence
    if (newSignal.confidence > previousSignal.confidence + 15) {
      // Allow the switch to the new direction
      console.log(`Signal direction changed from ${previousSignal.direction} to ${newSignal.direction} (confident switch)`);
    } else {
      // Keep the previous direction but with slightly reduced confidence
      console.log(`Maintaining previous direction ${previousSignal.direction} (new direction ${newSignal.direction} not confident enough)`);
      newSignal = {
        ...newSignal,
        direction: previousSignal.direction,
        confidence: Math.max(previousSignal.confidence - 2, newSignal.confidence - 10)
      };
    }
  }
  
  // Stabilize support/resistance levels - don't let them change too much
  if (previousSignal.supportLevels && newSignal.supportLevels) {
    newSignal.supportLevels = newSignal.supportLevels.map((level: number, i: number) => {
      // If we have a previous level, blend them for stability
      const prevLevel = previousSignal.supportLevels[i];
      if (prevLevel) {
        return (0.7 * prevLevel) + (0.3 * level);
      }
      return level;
    });
  }
  
  if (previousSignal.resistanceLevels && newSignal.resistanceLevels) {
    newSignal.resistanceLevels = newSignal.resistanceLevels.map((level: number, i: number) => {
      // If we have a previous level, blend them for stability
      const prevLevel = previousSignal.resistanceLevels[i];
      if (prevLevel) {
        return (0.7 * prevLevel) + (0.3 * level);
      }
      return level;
    });
  }
  
  // Stabilize patterns - keep patterns that have high reliability
  if (previousSignal.patternFormations && previousSignal.patternFormations.length > 0 &&
      newSignal.patternFormations && newSignal.patternFormations.length > 0) {
    // Keep high reliability patterns from previous calculation
    const highReliabilityPatterns = previousSignal.patternFormations.filter((oldPattern: any) => {
      return oldPattern.reliability > 75;
    });
    
    // Add them to new patterns if they don't conflict with direction
    highReliabilityPatterns.forEach((newPattern: any) => {
      if ((newPattern.direction === 'bullish' && newSignal.direction === 'LONG') ||
          (newPattern.direction === 'bearish' && newSignal.direction === 'SHORT') ||
          newSignal.direction === 'NEUTRAL') {
        // Only add if not already present
        if (!newSignal.patternFormations.some((p: any) => p.name === newPattern.name)) {
          newSignal.patternFormations.push(newPattern);
        }
      }
    });
  }
  
  return newSignal;
}

/**
 * Apply timeframe hierarchy to ensure higher timeframes have more influence
 * on the signals of lower timeframes
 * 
 * @param signals Signals for all timeframes
 * @returns Harmonized signals with timeframe influence
 */
export function harmonizeSignalsAcrossTimeframes(signals: Record<string, any>): Record<string, any> {
  const result = { ...signals };
  
  // Define timeframes in descending order of importance
  const timeframeOrder: TimeFrame[] = ['1M', '1w', '3d', '1d', '4h', '1h', '30m', '15m', '5m', '1m'];
  
  // Higher timeframes influence lower timeframes
  for (let i = 0; i < timeframeOrder.length - 1; i++) {
    const higherTf = timeframeOrder[i];
    const higherSignal = signals[higherTf];
    
    if (!higherSignal) continue;
    
    // Only strong signals influence lower timeframes
    if (higherSignal.confidence > 80) {
      // Apply influence to the next 2-3 lower timeframes only
      const influenceRange = Math.min(3, timeframeOrder.length - i - 1);
      
      for (let j = i + 1; j <= i + influenceRange; j++) {
        const lowerTf = timeframeOrder[j];
        const lowerSignal = result[lowerTf];
        
        if (!lowerSignal) continue;
        
        // Calculate influence factor based on timeframe distance
        const influenceFactor = 0.2 / (j - i);
        
        // Apply influence to confidence
        lowerSignal.confidence = Math.round(
          (1 - influenceFactor) * lowerSignal.confidence + 
          influenceFactor * higherSignal.confidence
        );
        
        // Potentially influence direction for very strong higher timeframe signals
        if (higherSignal.confidence > 90 && 0.65 < influenceFactor) {
          lowerSignal.direction = higherSignal.direction;
        }
      }
    }
  }
  
  return result;
}

/**
 * Get a stabilized signal - this is a convenience function that combines both stabilization
 * and harmonization for the dashboard component
 * 
 * @param newSignals New signals for all timeframes
 * @param previousSignals Previous signals for all timeframes
 * @returns Stabilized and harmonized signals
 */
export function getStabilizedSignal(newSignals: Record<string, any>, previousSignals: Record<string, any>): Record<string, any> {
  // First stabilize each timeframe independently
  const stabilizedSignals: Record<string, any> = {};
  
  Object.keys(newSignals).forEach((timeframe) => {
    const newSignal = newSignals[timeframe];
    const prevSignal = previousSignals[timeframe];
    
    if (newSignal) {
      stabilizedSignals[timeframe] = stabilizeSignals(newSignal, prevSignal);
    } else {
      stabilizedSignals[timeframe] = prevSignal || null;
    }
  });
  
  // Then harmonize across timeframes
  return harmonizeSignalsAcrossTimeframes(stabilizedSignals);
}