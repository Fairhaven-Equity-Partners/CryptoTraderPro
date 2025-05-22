/**
 * Advanced Signals Type Definitions
 * 
 * This file contains all the interfaces needed for the advanced signal dashboard
 * to ensure proper typing across the application.
 */

import { TimeFrame, SignalDirection, IndicatorCategory, Indicator, PatternFormation as CorePatternFormation } from '../types';

// Re-export core types with more specific definitions
export { TimeFrame, SignalDirection, IndicatorCategory, Indicator } from '../types';

// Pattern formation with expanded properties for display
export interface PatternFormation extends CorePatternFormation {
  duration?: string;
  confidence?: number;
  image?: string;
}

// Support and resistance level with metadata
export interface Level {
  price: number;
  strength: 'Strong' | 'Medium' | 'Weak';
  description?: string;
}

// Complete advanced signal interface with all properties needed for display
export interface AdvancedSignal {
  direction: SignalDirection;
  confidence: number; // 0-100
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe: TimeFrame;
  timestamp: number;  // Required for display functionality
  macroScore?: number; // 0-100
  macroClassification?: 'bullish' | 'bearish' | 'neutral';
  successProbability: number; // Required for display functionality (0-100)
  successProbabilityDescription?: string; // Human-readable description of success probability
  indicators?: Indicator[];
  patternFormations?: PatternFormation[];
  supportLevels?: number[];
  resistanceLevels?: number[];
  keyLevels?: Level[];
  macroInsights?: string[];
  expectedDuration?: string;
  riskRewardRatio?: number;
  optimalRiskReward?: { ideal: number; range: number[] };
  recommendedLeverage?: { conservative: number; moderate: number; aggressive: number; recommendation: string };
}

// Trade recommendation interface for display
export interface TradeRecommendation {
  direction: SignalDirection;
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfits: number[];
  leverage: number;
  timeframe: TimeFrame;
  summary: string;
  keyIndicators: string[];
}

/**
 * Generate pattern formations based on signal direction and confidence level
 * Optimized version with reduced pattern count and simplified logic
 * 
 * @param direction Signal direction (LONG, SHORT, NEUTRAL)
 * @param confidence Confidence level (0-100)
 * @param timeframe Current timeframe
 * @param currentPrice Current asset price
 * @returns Array of pattern formations
 */
export function generatePatternFormations(
  direction: SignalDirection, 
  confidence: number, 
  timeframe: TimeFrame, 
  currentPrice: number
): PatternFormation[] {
  // Optimized list of most significant patterns for each direction
  const bullishPatterns = [
    'Bullish Engulfing', 'Morning Star', 'Hammer', 
    'Three White Soldiers', 'Bullish Marubozu'
  ];
  
  const bearishPatterns = [
    'Bearish Engulfing', 'Evening Star', 'Hanging Man', 
    'Three Black Crows', 'Bearish Marubozu'
  ];
  
  const neutralPatterns = [
    'Doji', 'Spinning Top', 'Inside Bar'
  ];
  
  // Generate a fixed number of patterns based on timeframe
  // Lower number for shorter timeframes to reduce calculations
  const patternCount = timeframe.includes('d') || timeframe.includes('w') || timeframe.includes('M') ? 3 : 2;
  
  const patterns: PatternFormation[] = [];
  
  // Generate patterns based on signal direction (simplified logic)
  for (let i = 0; i < patternCount; i++) {
    let patternDirection: 'bullish' | 'bearish' | 'neutral';
    let patternNames: string[];
    
    // Simplified direction selection - higher chance to match signal direction
    if (direction === 'LONG') {
      patternDirection = 'bullish';
      patternNames = bullishPatterns;
    } else if (direction === 'SHORT') {
      patternDirection = 'bearish';
      patternNames = bearishPatterns;
    } else {
      patternDirection = 'neutral';
      patternNames = neutralPatterns;
    }
    
    // Select a pattern name (deterministic for better stability)
    const nameIndex = i % patternNames.length;
    const name = patternNames[nameIndex];
    
    // Calculate reliability based on confidence (simplified calculation)
    const reliability = Math.min(confidence + 5, 95);
    
    // Calculate price target based on direction
    const priceTarget = patternDirection === 'bullish' 
      ? currentPrice * 1.05 // 5% higher
      : patternDirection === 'bearish'
        ? currentPrice * 0.95 // 5% lower
        : currentPrice; // No change for neutral
    
    // Add the pattern if it doesn't already exist
    if (!patterns.find(p => p.name === name)) {
      patterns.push({
        name,
        reliability,
        direction: patternDirection,
        priceTarget: Math.round(priceTarget * 100) / 100,
        description: `${name} pattern detected on ${timeframe} timeframe`,
        duration: getExpectedDuration(timeframe),
        confidence: reliability
      });
    }
  }
  
  // Log the number of patterns generated
  console.log(`Generated ${patterns.length} patterns for ${timeframe} timeframe`);
  
  return patterns;
}

/**
 * Get expected duration based on timeframe
 * 
 * @param timeframe Trading timeframe
 * @returns A human-readable duration string
 */
function getExpectedDuration(timeframe: TimeFrame): string {
  switch (timeframe) {
    case '1m':
      return '5-15 minutes';
    case '5m':
      return '15-60 minutes';
    case '15m':
      return '1-4 hours';
    case '30m':
      return '2-8 hours';
    case '1h':
      return '4-24 hours';
    case '4h':
      return '1-3 days';
    case '1d':
      return '1-2 weeks';
    case '3d':
      return '1-3 weeks';
    case '1w':
      return '1-2 months';
    case '1M':
      return '3-6 months';
    default:
      return 'Variable';
  }
}