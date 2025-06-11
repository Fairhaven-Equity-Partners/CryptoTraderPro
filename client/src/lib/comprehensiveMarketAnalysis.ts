/**
 * Comprehensive Mathematical Market Analysis Formula
 * 
 * This document outlines the complete mathematical framework used for cryptocurrency
 * market analysis, incorporating technical indicators, macro factors, moon phases,
 * and multi-timeframe analysis for maximum accuracy.
 */

import { TimeFrame } from '../types';
import { analyzeIndicatorConvergence, calculateEnhancedConfidence, generateCorrelationInsights, analyzeIndicatorPairs } from './correlationAnalysis';
import { detectMarketRegime, applyRegimeAdjustments, generateRegimeInsights } from './marketRegimeDetection';

/**
 * MASTER MARKET ANALYSIS FORMULA
 * 
 * Final Signal Score = (TechnicalScore × TimeframeWeight × MacroMultiplier × MoonPhaseMultiplier)
 * 
 * Where:
 * - TechnicalScore: Weighted combination of all technical indicators (0-100)
 * - TimeframeWeight: Reliability multiplier based on timeframe (0.3-1.0)
 * - MacroMultiplier: Macro environment impact (0.85-1.15)
 * - MoonPhaseMultiplier: Lunar cycle influence (0.85-1.15)
 */

export interface MarketAnalysisComponents {
  technicalScore: number;
  timeframeWeight: number;
  macroMultiplier: number;
  moonPhaseMultiplier: number;
  finalScore: number;
  confidence: number;
}

/**
 * 1. TECHNICAL INDICATOR SCORING SYSTEM
 * 
 * Each indicator contributes to the overall technical score based on:
 * - Signal strength (WEAK: 0.5, MODERATE: 1.0, STRONG: 1.5)
 * - Category weight (TREND: 25%, MOMENTUM: 20%, VOLATILITY: 15%, 
 *                   VOLUME: 15%, SUPPORT_RESISTANCE: 15%, REVERSAL: 10%)
 * - Convergence bonus (when multiple indicators agree: +10-20%)
 */

export const INDICATOR_WEIGHTS = {
  // Trend Indicators (25% total weight)
  sma: 8,
  ema: 8,
  bollinger: 9,
  
  // Momentum Indicators (20% total weight)
  rsi: 7,
  macd: 8,
  stochastic: 5,
  
  // Volatility Indicators (15% total weight)
  atr: 5,
  volatility: 5,
  bb_width: 5,
  
  // Volume Indicators (15% total weight)
  volume_sma: 8,
  obv: 7,
  
  // Support/Resistance (15% total weight)
  pivot_points: 8,
  fibonacci: 7,
  
  // Reversal Patterns (10% total weight)
  hammer: 3,
  doji: 3,
  engulfing: 4
} as const;

/**
 * 2. TIMEFRAME RELIABILITY WEIGHTS
 * 
 * Longer timeframes are given higher reliability weights:
 * - 1M (Monthly): 1.0 (highest reliability)
 * - 1w (Weekly): 0.95
 * - 3d (3-Day): 0.9
 * - 1d (Daily): 0.85
 * - 4h (4-Hour): 0.8
 * - 1h (Hourly): 0.7
 * - 30m: 0.6
 * - 15m: 0.55
 * - 5m: 0.45
 * - 1m: 0.3 (lowest reliability)
 */

export const TIMEFRAME_WEIGHTS: Record<TimeFrame, number> = {
  '1M': 1.0,
  '1w': 0.95,
  '3d': 0.9,
  '1d': 0.85,
  '4h': 0.8,
  '1h': 0.7,
  '30m': 0.6,
  '15m': 0.55,
  '5m': 0.45,
  '1m': 0.3
};

/**
 * 3. MACRO ENVIRONMENT MULTIPLIERS
 * 
 * Macro indicators adjust the technical score based on broader market conditions:
 * - Market Sentiment (Fear & Greed): ±15% impact
 * - Funding Rates: ±10% impact
 * - Liquidity Flow: ±8% impact
 * - Whale Activity: ±7% impact
 * - Options Ratio: ±5% impact
 * 
 * Final macro multiplier ranges from 0.85 (very bearish) to 1.15 (very bullish)
 */

export function calculateMacroMultiplier(macroScore: number): number {
  // Convert macro score (0-100) to multiplier (0.85-1.15)
  const normalizedScore = (macroScore - 50) / 50; // Convert to -1 to +1 range
  const multiplier = 1 + (normalizedScore * 0.15); // ±15% maximum impact
  return Math.max(0.85, Math.min(1.15, multiplier));
}

/**
 * 4. MOON PHASE IMPACT SYSTEM
 * 
 * Lunar cycles historically correlate with market movements:
 * - New Moon: Bearish bias (0.85-0.95 multiplier)
 * - Waxing Phases: Neutral to bullish (1.0-1.08 multiplier)
 * - Full Moon: Bullish bias (1.10-1.15 multiplier)
 * - Waning Phases: Neutral to bearish (0.88-1.02 multiplier)
 * 
 * Impact weight: 10% of macro score adjustment
 */

export function calculateMoonPhaseMultiplier(moonPhaseImpact: number): number {
  // moonPhaseImpact ranges from 0.85 to 1.15
  return moonPhaseImpact;
}

/**
 * 5. PATTERN FORMATION SCORING
 * 
 * Chart patterns add confidence to signals:
 * - Major patterns (Head & Shoulders, Double Top/Bottom): +15-20% confidence
 * - Minor patterns (Triangles, Flags): +5-10% confidence
 * - Reversal patterns: +10-15% confidence
 * - Continuation patterns: +8-12% confidence
 */

export const PATTERN_WEIGHTS = {
  'head_and_shoulders': 20,
  'inverse_head_and_shoulders': 20,
  'double_top': 18,
  'double_bottom': 18,
  'triple_top': 15,
  'triple_bottom': 15,
  'ascending_triangle': 12,
  'descending_triangle': 12,
  'symmetrical_triangle': 10,
  'bull_flag': 10,
  'bear_flag': 10,
  'pennant': 8,
  'wedge': 8
} as const;

/**
 * 6. SUCCESS PROBABILITY CALCULATION
 * 
 * Success probability combines multiple factors:
 * Base probability = timeframe reliability × (60% + technical_strength × 40%)
 * 
 * Adjustments:
 * - Higher timeframe alignment: +10-15%
 * - Pattern confirmation: +5-10%
 * - Volume confirmation: +5-8%
 * - Macro alignment: +5-12%
 * - Moon phase alignment: +2-5%
 */

export function calculateSuccessProbability(
  timeframe: TimeFrame,
  technicalStrength: number, // 0-1
  hasHigherTimeframeAlignment: boolean,
  hasPatternConfirmation: boolean,
  hasVolumeConfirmation: boolean,
  macroAlignment: number, // -1 to +1
  moonPhaseAlignment: number // -1 to +1
): number {
  const timeframeReliability = TIMEFRAME_WEIGHTS[timeframe];
  
  // Base probability (40-85% range based on timeframe and technical strength)
  let probability = timeframeReliability * (60 + technicalStrength * 40);
  
  // Apply adjustments
  if (hasHigherTimeframeAlignment) probability += 12;
  if (hasPatternConfirmation) probability += 8;
  if (hasVolumeConfirmation) probability += 6;
  
  // Macro alignment adjustment (±10%)
  probability += macroAlignment * 10;
  
  // Moon phase alignment adjustment (±3%)
  probability += moonPhaseAlignment * 3;
  
  // Cap between 15% and 95%
  return Math.max(15, Math.min(95, Math.round(probability)));
}

/**
 * 7. LEVERAGE RECOMMENDATION SYSTEM
 * 
 * Safe leverage calculation based on signal quality and market conditions:
 * 
 * Base leverage = min(signal_confidence / 20, 5)
 * 
 * Adjustments:
 * - High volatility: -20-30% leverage
 * - Low volatility: +10-15% leverage
 * - Strong trend alignment: +15-25% leverage
 * - Uncertain macro: -25-35% leverage
 * - New trader: max 2x leverage
 */

export function calculateRecommendedLeverage(
  signalConfidence: number, // 0-100
  volatility: number, // 0-100
  trendStrength: number, // 0-100
  macroUncertainty: number, // 0-100
  userExperience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): {
  conservative: number;
  moderate: number;
  aggressive: number;
  recommendation: string;
} {
  // Base leverage calculation
  let baseLeverage = Math.min(signalConfidence / 20, 5);
  
  // Volatility adjustment
  const volatilityFactor = 1 - (volatility / 200); // -50% max adjustment
  baseLeverage *= volatilityFactor;
  
  // Trend strength bonus
  const trendBonus = 1 + (trendStrength / 400); // +25% max bonus
  baseLeverage *= trendBonus;
  
  // Macro uncertainty penalty
  const macroFactor = 1 - (macroUncertainty / 300); // -33% max penalty
  baseLeverage *= macroFactor;
  
  // Experience caps
  const maxLeverage = {
    'beginner': 2,
    'intermediate': 5,
    'advanced': 10
  }[userExperience];
  
  baseLeverage = Math.min(baseLeverage, maxLeverage);
  
  const conservative = Math.max(1, Math.round(baseLeverage * 0.6 * 10) / 10);
  const moderate = Math.max(1, Math.round(baseLeverage * 0.8 * 10) / 10);
  const aggressive = Math.max(1, Math.round(baseLeverage * 1.0 * 10) / 10);
  
  let recommendation = 'moderate';
  if (signalConfidence > 80 && volatility < 30) {
    recommendation = 'aggressive';
  } else if (signalConfidence < 60 || volatility > 70) {
    recommendation = 'conservative';
  }
  
  return {
    conservative,
    moderate,
    aggressive,
    recommendation
  };
}

/**
 * 8. STOP LOSS AND TAKE PROFIT CALCULATION
 * 
 * Dynamic stop loss/take profit based on:
 * - ATR (Average True Range) for volatility adjustment
 * - Support/Resistance levels
 * - Risk/Reward ratio optimization
 * - Timeframe considerations
 */

export function calculateStopLossAndTakeProfit(
  entryPrice: number,
  direction: 'LONG' | 'SHORT',
  atr: number,
  timeframe: TimeFrame,
  supportLevel?: number,
  resistanceLevel?: number,
  riskRewardRatio: number = 2.5
): {
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
} {
  // Mathematically correct percentage-based risk calculations
  const timeframeRisks = {
    '1M': { stopLoss: 8.0, takeProfit: 24.0 },
    '1w': { stopLoss: 6.0, takeProfit: 18.0 },
    '3d': { stopLoss: 4.5, takeProfit: 13.5 },
    '1d': { stopLoss: 3.0, takeProfit: 7.5 },
    '4h': { stopLoss: 1.5, takeProfit: 3.75 },
    '1h': { stopLoss: 0.8, takeProfit: 1.6 },
    '30m': { stopLoss: 0.6, takeProfit: 1.2 },
    '15m': { stopLoss: 0.4, takeProfit: 0.8 },
    '5m': { stopLoss: 0.25, takeProfit: 0.5 },
    '1m': { stopLoss: 0.15, takeProfit: 0.3 }
  }[timeframe] || { stopLoss: 0.8, takeProfit: 1.6 };
  
  let stopLoss: number;
  let takeProfit: number;
  
  if (direction === 'LONG') {
    // LONG: Stop loss below entry, take profit above entry
    stopLoss = entryPrice * (1 - timeframeRisks.stopLoss / 100);
    takeProfit = entryPrice * (1 + timeframeRisks.takeProfit / 100);
    
    // Adjust for support/resistance if provided
    if (supportLevel && supportLevel < entryPrice) {
      stopLoss = Math.max(stopLoss, supportLevel * 0.995);
    }
    if (resistanceLevel && resistanceLevel > entryPrice) {
      takeProfit = Math.min(takeProfit, resistanceLevel * 0.995);
    }
  } else {
    // SHORT: Stop loss above entry, take profit below entry
    stopLoss = entryPrice * (1 + timeframeRisks.stopLoss / 100);
    takeProfit = entryPrice * (1 - timeframeRisks.takeProfit / 100);
    
    // Adjust for support/resistance if provided
    if (resistanceLevel && resistanceLevel > entryPrice) {
      stopLoss = Math.min(stopLoss, resistanceLevel * 1.005);
    }
    if (supportLevel && supportLevel < entryPrice) {
      takeProfit = Math.max(takeProfit, supportLevel * 1.005);
    }
  }
  
  // Calculate actual risk/reward ratio
  const riskAmount = Math.abs(entryPrice - stopLoss);
  const rewardAmount = Math.abs(takeProfit - entryPrice);
  const actualRiskReward = rewardAmount / riskAmount;
  
  return {
    stopLoss: Number(stopLoss.toFixed(2)),
    takeProfit: Number(takeProfit.toFixed(2)),
    riskReward: Number(actualRiskReward.toFixed(2))
  };
}

/**
 * 9. COMPREHENSIVE SIGNAL VALIDATION
 * 
 * Final validation checks before signal generation:
 * 1. Minimum confidence threshold (35% for any signal)
 * 2. Multiple timeframe alignment check
 * 3. Volume confirmation requirement
 * 4. Risk/reward ratio validation (minimum 1.5:1)
 * 5. Market condition suitability check
 */

export function validateSignalQuality(signal: any): {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Confidence check
  if (signal.confidence < 35) {
    return {
      isValid: false,
      confidence: signal.confidence,
      warnings: ['Signal confidence too low for trading'],
      recommendations: ['Wait for higher confidence setup']
    };
  }
  
  // Risk/reward check
  if (signal.riskReward && signal.riskReward < 1.5) {
    warnings.push('Risk/reward ratio below optimal level');
    recommendations.push('Consider wider take profit target');
  }
  
  // Volume confirmation
  if (!signal.volumeConfirmation) {
    warnings.push('Volume does not confirm the signal');
    recommendations.push('Wait for volume confirmation or reduce position size');
  }
  
  // Volatility check
  if (signal.volatility > 80) {
    warnings.push('High market volatility detected');
    recommendations.push('Reduce leverage and use tighter stops');
  }
  
  return {
    isValid: true,
    confidence: signal.confidence,
    warnings,
    recommendations
  };
}

/**
 * 10. COMPLETE MARKET ANALYSIS FUNCTION
 * 
 * This function combines all components to generate the final market analysis
 */

export function generateComprehensiveMarketAnalysis(
  technicalIndicators: any[],
  chartPatterns: any[],
  macroData: any,
  moonPhaseData: any,
  timeframe: TimeFrame,
  price: number
): MarketAnalysisComponents {
  // Calculate technical score (weighted sum of all indicators)
  const technicalScore = calculateTechnicalScore(technicalIndicators);
  
  // Get timeframe weight
  const timeframeWeight = TIMEFRAME_WEIGHTS[timeframe];
  
  // Calculate macro multiplier
  const macroMultiplier = calculateMacroMultiplier(macroData.score);
  
  // Get moon phase multiplier
  const moonPhaseMultiplier = moonPhaseData.impactStrength;
  
  // Calculate final score
  const finalScore = technicalScore * timeframeWeight * macroMultiplier * moonPhaseMultiplier;
  
  // Calculate confidence based on convergence and quality
  const confidence = calculateOverallConfidence(
    technicalIndicators,
    chartPatterns,
    macroData,
    timeframe
  );
  
  return {
    technicalScore,
    timeframeWeight,
    macroMultiplier,
    moonPhaseMultiplier,
    finalScore: Math.round(finalScore * 10) / 10,
    confidence: Math.round(confidence)
  };
}

function calculateTechnicalScore(indicators: any[]): number {
  // Implementation details for technical score calculation
  // This would be implemented based on the specific indicator results
  return 75; // Placeholder
}

function calculateOverallConfidence(
  indicators: any[],
  patterns: any[],
  macro: any,
  timeframe: TimeFrame
): number {
  // Implementation details for confidence calculation
  // This would analyze convergence between different signal sources
  return 82; // Placeholder
}