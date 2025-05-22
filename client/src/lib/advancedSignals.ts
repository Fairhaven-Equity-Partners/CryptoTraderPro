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
  // List of potential pattern names for each direction
  const bullishPatterns = [
    'Bullish Engulfing', 'Morning Star', 'Hammer', 'Bullish Harami',
    'Three White Soldiers', 'Piercing Line', 'Bullish Marubozu',
    'Bullish Kicker', 'Tweezer Bottom', 'Inverted Hammer'
  ];
  
  const bearishPatterns = [
    'Bearish Engulfing', 'Evening Star', 'Hanging Man', 'Bearish Harami',
    'Three Black Crows', 'Dark Cloud Cover', 'Bearish Marubozu',
    'Bearish Kicker', 'Tweezer Top', 'Shooting Star'
  ];
  
  const neutralPatterns = [
    'Doji', 'Spinning Top', 'High Wave', 'Long-Legged Doji',
    'Dragonfly Doji', 'Gravestone Doji', 'Four Price Doji',
    'Inside Bar', 'Outside Bar', 'Harami Cross'
  ];
  
  // Generate between 0-3 patterns based on the timeframe and confidence level
  const patternCount = Math.min(
    Math.floor(Math.random() * 4) + (timeframe.includes('d') || timeframe.includes('w') || timeframe.includes('M') ? 2 : 0),
    8
  );
  
  const patterns: PatternFormation[] = [];
  
  // Generate random patterns based on direction
  for (let i = 0; i < patternCount; i++) {
    let patternDirection: 'bullish' | 'bearish' | 'neutral';
    let patternNames: string[];
    
    // Higher chance to match the signal direction
    const randomValue = Math.random() * 100;
    
    if (direction === 'LONG' && randomValue < 70) {
      patternDirection = 'bullish';
      patternNames = bullishPatterns;
    } else if (direction === 'SHORT' && randomValue < 70) {
      patternDirection = 'bearish';
      patternNames = bearishPatterns;
    } else if (direction === 'NEUTRAL' && randomValue < 70) {
      patternDirection = 'neutral';
      patternNames = neutralPatterns;
    } else {
      // Opposite direction or neutral with a lower probability
      const rand = Math.random();
      if (direction === 'LONG') {
        patternDirection = rand < 0.7 ? 'neutral' : 'bearish';
        patternNames = rand < 0.7 ? neutralPatterns : bearishPatterns;
      } else if (direction === 'SHORT') {
        patternDirection = rand < 0.7 ? 'neutral' : 'bullish';
        patternNames = rand < 0.7 ? neutralPatterns : bullishPatterns;
      } else {
        patternDirection = rand < 0.5 ? 'bullish' : 'bearish';
        patternNames = rand < 0.5 ? bullishPatterns : bearishPatterns;
      }
    }
    
    // Select a random pattern name from the appropriate list
    const nameIndex = Math.floor(Math.random() * patternNames.length);
    const name = patternNames[nameIndex];
    
    // Calculate a reliability based on confidence
    const reliability = Math.min(
      Math.max(confidence - 15 + Math.floor(Math.random() * 30), 30),
      95
    );
    
    // Calculate a random price target based on direction and current price
    const priceTarget = patternDirection === 'bullish' 
      ? currentPrice * (1 + (0.02 + Math.random() * 0.05)) // 2%-7% higher
      : patternDirection === 'bearish'
        ? currentPrice * (1 - (0.02 + Math.random() * 0.05)) // 2%-7% lower
        : currentPrice * (1 + (Math.random() * 0.04 - 0.02)); // ±2%
    
    // Add the pattern to the array if it doesn't already exist
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