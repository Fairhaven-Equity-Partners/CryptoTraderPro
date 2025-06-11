/**
 * Corrected Mathematical Calculation Framework
 * Unified system to eliminate calculation inconsistencies
 */


function calculateCorrectedConfidence(baseConfidence, timeframe) {
  const timeframeWeights = {
  "1m": 0.7,
  "5m": 0.88,
  "15m": 0.92,
  "30m": 0.95,
  "1h": 0.98,
  "4h": 1,
  "1d": 0.95,
  "3d": 0.92,
  "1w": 0.9,
  "1M": 0.85
};
  
  const reliabilityMultiplier = timeframeWeights[timeframe] || 1.0;
  const adjustedConfidence = Math.min(95, baseConfidence * reliabilityMultiplier);
  
  // Ensure single calculation per pair
  return Math.round(adjustedConfidence);
}

// Unified timeframe weights for all components
export const UNIFIED_TIMEFRAME_WEIGHTS = {
  "1m": 0.7,
  "5m": 0.88,
  "15m": 0.92,
  "30m": 0.95,
  "1h": 0.98,
  "4h": 1,
  "1d": 0.95,
  "3d": 0.92,
  "1w": 0.9,
  "1M": 0.85
};

// Corrected heatmap calculation method
export function calculateHeatmapEntry(signal, timeframe) {
  const baseConfidence = signal.confidence || 50;
  const adjustedConfidence = calculateCorrectedConfidence(baseConfidence, timeframe);
  
  return {
    confidence: adjustedConfidence,
    // ... other properties
  };
}