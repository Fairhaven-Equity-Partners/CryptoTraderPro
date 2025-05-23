/**
 * Signal Stabilizer
 * 
 * This module helps prevent signals from flip-flopping between different directions
 * with each price update, providing more stable and consistent trading recommendations.
 */

// The minimum confidence threshold for changing a signal direction
const DIRECTION_CHANGE_THRESHOLD = 15;

// The minimum time (in milliseconds) before allowing a direction change
const DIRECTION_CHANGE_COOLDOWN = 300000; // 5 minutes

/**
 * Stabilize a new signal by comparing it with the previous signal
 * This ensures signal directions don't flip-flop with small price movements
 * 
 * @param newSignal The newly calculated signal
 * @param previousSignal The previous signal for the same timeframe
 * @returns A stabilized signal
 */
export function stabilizeSignals(newSignal: any, previousSignal: any): any {
  // If no previous signal, return the new one as is
  if (!previousSignal) {
    return newSignal;
  }

  // Create a copy of the new signal
  const stabilizedSignal = { ...newSignal };
  
  // Check if the direction is trying to change
  if (newSignal.direction !== previousSignal.direction) {
    const timeSinceLastChange = Date.now() - (previousSignal.timestamp || 0);
    const confidenceDifference = newSignal.confidence - previousSignal.confidence;
    
    // Only allow direction change if:
    // 1. Sufficient time has passed since the last change
    // 2. The new signal has significantly higher confidence
    if (timeSinceLastChange < DIRECTION_CHANGE_COOLDOWN && confidenceDifference < DIRECTION_CHANGE_THRESHOLD) {
      console.log(`Stabilizing signal direction: keeping ${previousSignal.direction} instead of changing to ${newSignal.direction}`);
      stabilizedSignal.direction = previousSignal.direction;
      
      // Adjust confidence but allow it to gradually move toward the new value
      stabilizedSignal.confidence = Math.max(
        previousSignal.confidence - 2, 
        Math.min(previousSignal.confidence + 2, newSignal.confidence)
      );
    }
  }
  
  // Gradually adjust success probability - don't allow wild swings
  if (typeof previousSignal.successProbability === 'number' && typeof newSignal.successProbability === 'number') {
    const maxProbabilityChange = 5; // Max 5% change at a time
    stabilizedSignal.successProbability = Math.max(
      previousSignal.successProbability - maxProbabilityChange,
      Math.min(previousSignal.successProbability + maxProbabilityChange, newSignal.successProbability)
    );
  }
  
  // Smooth out leverage recommendations
  if (typeof previousSignal.recommendedLeverage === 'number' && typeof newSignal.recommendedLeverage === 'number') {
    const maxLeverageChange = 1; // Maximum 1x change at a time
    stabilizedSignal.recommendedLeverage = Math.max(
      previousSignal.recommendedLeverage - maxLeverageChange,
      Math.min(previousSignal.recommendedLeverage + maxLeverageChange, newSignal.recommendedLeverage)
    );
  }
  
  // Keep some recent pattern formations for consistency
  if (previousSignal.patternFormations && previousSignal.patternFormations.length > 0 &&
      newSignal.patternFormations && newSignal.patternFormations.length > 0) {
    // Always keep at least one pattern from previous signal if available
    const oldPatterns = previousSignal.patternFormations.slice(0, 1);
    const newPatterns = newSignal.patternFormations;
    
    // Merge patterns, avoiding duplicates
    stabilizedSignal.patternFormations = [...newPatterns];
    oldPatterns.forEach(oldPattern => {
      // Only add old pattern if it's not already in the new patterns
      if (!newPatterns.some(newPattern => newPattern.name === oldPattern.name)) {
        stabilizedSignal.patternFormations.unshift(oldPattern);
      }
    });
    
    // Limit to maximum 3 patterns
    if (stabilizedSignal.patternFormations.length > 3) {
      stabilizedSignal.patternFormations = stabilizedSignal.patternFormations.slice(0, 3);
    }
  }
  
  return stabilizedSignal;
}

/**
 * Apply timeframe hierarchy to ensure higher timeframes have more influence
 * on the signals of lower timeframes
 * 
 * @param signals Signals for all timeframes
 * @returns Harmonized signals with timeframe influence
 */
export function harmonizeSignalsAcrossTimeframes(signals: Record<string, any>): Record<string, any> {
  const timeframes = Object.keys(signals);
  const result = { ...signals };
  
  // Define timeframe influence weights
  const timeframeWeights = {
    '1m': 1,
    '5m': 2,
    '15m': 3,
    '30m': 4,
    '1h': 5,
    '4h': 7,
    '1d': 10,
    '3d': 12,
    '1w': 15,
    '1M': 20
  };
  
  // Sort timeframes by weight (higher timeframes first)
  const sortedTimeframes = timeframes.sort((a, b) => 
    (timeframeWeights[b as keyof typeof timeframeWeights] || 0) - 
    (timeframeWeights[a as keyof typeof timeframeWeights] || 0)
  );
  
  // Higher timeframes influence lower timeframes, but not vice versa
  for (let i = 0; i < sortedTimeframes.length; i++) {
    const higherTf = sortedTimeframes[i];
    const higherSignal = signals[higherTf];
    
    // Skip if no valid signal for this timeframe
    if (!higherSignal) continue;
    
    // Apply influence to all lower timeframes
    for (let j = i + 1; j < sortedTimeframes.length; j++) {
      const lowerTf = sortedTimeframes[j];
      const lowerSignal = signals[lowerTf];
      
      // Skip if no valid signal for lower timeframe
      if (!lowerSignal) continue;
      
      // Calculate influence factor based on timeframe difference
      const higherWeight = timeframeWeights[higherTf as keyof typeof timeframeWeights] || 1;
      const lowerWeight = timeframeWeights[lowerTf as keyof typeof timeframeWeights] || 1;
      const weightDiff = higherWeight - lowerWeight;
      
      // Higher timeframe influence (0-30%)
      const influenceFactor = Math.min(0.3, weightDiff * 0.03);
      
      // Only strong signals on higher timeframes influence lower timeframes
      if (higherSignal.confidence > 70) {
        // Slightly pull lower timeframe confidence toward higher timeframe
        result[lowerTf].confidence = Math.round(
          (1 - influenceFactor) * lowerSignal.confidence + 
          influenceFactor * higherSignal.confidence
        );
        
        // If higher timeframe has a very strong signal, increase the chance of direction alignment
        if (higherSignal.confidence > 85 && Math.random() < influenceFactor * 2) {
          result[lowerTf].direction = higherSignal.direction;
        }
      }
    }
  }
  
  return result;
}