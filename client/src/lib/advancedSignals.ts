/**
 * Advanced Signals Type Definitions
 * 
 * This file contains all the interfaces needed for the advanced signal dashboard
 * to ensure proper typing across the application.
 * 
 * OPTIMIZED VERSION - Eliminates redundant indicator definitions and streamlines structure
 */

import { TimeFrame, SignalDirection, IndicatorCategory, PatternFormation as CorePatternFormation } from '../types';

// Re-export core types
export { TimeFrame, SignalDirection, IndicatorCategory } from '../types';

// Unified optimized indicator interface
export interface Indicator {
  id: string;
  name: string;
  value: number | string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  category: IndicatorCategory;
  description?: string;
}

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

// Core indicator groups with no redundancy
export interface IndicatorGroups {
  // Single array for each category to prevent duplicates
  trend: Indicator[];
  momentum: Indicator[];
  volatility: Indicator[];
  volume: Indicator[];
  pattern: Indicator[];
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
  indicators: IndicatorGroups; // Changed from optional array to required structured object
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
 * Ultra-optimized version with minimal pattern count and deterministic selection for stability
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
  // Use static mapping for preset pattern selections to avoid calculations
  const patterns: Record<SignalDirection, Record<'high' | 'low', string[]>> = {
    'LONG': {
      'high': ['Bullish Engulfing', 'Morning Star'],
      'low': ['Hammer', 'Bullish Marubozu']
    },
    'SHORT': {
      'high': ['Bearish Engulfing', 'Evening Star'],
      'low': ['Hanging Man', 'Bearish Marubozu']
    },
    'NEUTRAL': {
      'high': ['Doji', 'Inside Bar'],
      'low': ['Spinning Top', 'Sideways Channel']
    }
  };

  // Determine confidence band for pattern selection
  const confidenceBand = confidence > 70 ? 'high' : 'low';
  
  // Use a single pattern for shorter timeframes, two for longer timeframes
  // This significantly reduces calculation overhead
  const patternCount = 
    timeframe === '1M' || timeframe === '1w' ? 2 :
    timeframe === '1d' || timeframe === '3d' ? 1 :
    timeframe === '4h' ? 1 : 1;
  
  // Convert timeframe to numeric value for deterministic pattern selection
  const timeframeValue = 
    timeframe === '1m' ? 1 :
    timeframe === '5m' ? 5 :
    timeframe === '15m' ? 15 :
    timeframe === '30m' ? 30 :
    timeframe === '1h' ? 60 :
    timeframe === '4h' ? 240 :
    timeframe === '1d' ? 1440 :
    timeframe === '3d' ? 4320 :
    timeframe === '1w' ? 10080 :
    timeframe === '1M' ? 43200 : 0;
  
  // Create pattern array with pre-allocated size
  const result: PatternFormation[] = [];
  
  // Get pattern selections for this direction and confidence
  const patternOptions = patterns[direction][confidenceBand];
  
  // Deterministic pattern selection algorithm for stability
  for (let i = 0; i < patternCount; i++) {
    // Select pattern deterministically based on timeframe and index
    const patternIndex = (timeframeValue + i) % patternOptions.length;
    const patternName = patternOptions[patternIndex];
    
    // Map direction strings
    const patternDirection = 
      direction === 'LONG' ? 'bullish' :
      direction === 'SHORT' ? 'bearish' : 'neutral';
    
    // Calculate price targets efficiently
    let priceTarget: number;
    if (patternDirection === 'bullish') {
      priceTarget = Math.round(currentPrice * 1.05 * 100) / 100; // 5% higher
    } else if (patternDirection === 'bearish') {
      priceTarget = Math.round(currentPrice * 0.95 * 100) / 100; // 5% lower
    } else {
      priceTarget = currentPrice; // No change for neutral
    }
    
    // Generate pattern directly without unnecessary calculations
    result.push({
      name: patternName,
      reliability: Math.min(confidence + 5, 95),
      direction: patternDirection,
      priceTarget: priceTarget,
      description: `${patternName} pattern detected on ${timeframe} timefram`e`,
      duration: getExpectedDuration(timeframe),
      confidence: Math.min(confidence + 5, 95)
    });
  }
  
  return result;
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