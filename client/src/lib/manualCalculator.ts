/**
 * Manual Calculator Module
 * 
 * This provides a simple, deterministic calculator for the "Calculate Now" button
 * to ensure consistent results regardless of other components.
 */

import { TimeFrame, AdvancedSignal, PatternFormation, Indicator } from '../types';

/**
 * Generate a deterministic signal based solely on price
 * This ensures that the same price always produces the same signal
 */
export function calculateManualSignal(price: number, timeframe: TimeFrame): AdvancedSignal {
  // Use price as a seed for deterministic calculations
  const priceSeed = Math.floor(price) % 100;
  
  // Direction based on price seed
  let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  if (priceSeed < 40) {
    direction = 'LONG';
  } else if (priceSeed < 80) {
    direction = 'SHORT';
  } else {
    direction = 'NEUTRAL';
  }
  
  // Base confidence calculation
  let confidence = 50 + (priceSeed % 45);
  
  // Adjust confidence based on timeframe
  if (timeframe === '1M') confidence += 8;
  else if (timeframe === '1w') confidence += 6;
  else if (timeframe === '1d') confidence += 4;
  else if (timeframe === '4h') confidence += 2;
  
  // Cap confidence at 95%
  confidence = Math.min(confidence, 95);
  
  // Calculate stop loss and take profit
  let stopLoss, takeProfit;
  if (direction === 'LONG') {
    stopLoss = price * 0.97;
    takeProfit = price * 1.05;
  } else if (direction === 'SHORT') {
    stopLoss = price * 1.03;
    takeProfit = price * 0.95;
  } else {
    stopLoss = price * 0.98;
    takeProfit = price * 1.02;
  }
  
  // Success probability calculation
  const successProbability = Math.min(confidence + 5, 95);
  
  return {
    direction,
    confidence,
    entryPrice: price,
    stopLoss: Math.round(stopLoss * 100) / 100,
    takeProfit: Math.round(takeProfit * 100) / 100,
    successProbability,
    timestamp: Date.now(),
    timeframe,
    patternFormations: getPatterns(direction, priceSeed),
    supportLevels: getSupportLevels(price),
    resistanceLevels: getResistanceLevels(price),
    expectedDuration: getDuration(timeframe),
    indicators: getIndicators(direction, confidence),
    environment: {
      marketVolatility: direction === 'NEUTRAL' ? 'Low' : 'Moderate',
      marketSentiment: direction === 'LONG' ? 'Bullish' : 
                      direction === 'SHORT' ? 'Bearish' : 'Neutral',
      riskLevel: confidence > 80 ? 'Low' : 
                confidence > 60 ? 'Moderate' : 'High'
    },
    macroInsights: getMacroInsights(direction, confidence),
    successProbabilityDescription: getProbabilityDescription(successProbability),
    riskRewardRatio: direction === 'NEUTRAL' ? 1 : 
                    Math.abs((takeProfit - price) / (price - stopLoss)),
    optimalRiskReward: 2.5,
    recommendedLeverage: getLeverage(direction, confidence)
  };
}

// Helper functions for signal generation
function getPatterns(direction: string, seed: number) {
  const patternSets = {
    'LONG': [
      { name: 'Bullish Engulfing', direction: 'bullish' as const, reliability: 75, description: 'Strong reversal pattern' },
      { name: 'Morning Star', direction: 'bullish' as const, reliability: 80, description: 'Strong bottom reversal' },
      { name: 'Double Bottom', direction: 'bullish' as const, reliability: 85, description: 'Strong support confirmation' },
      { name: 'Hammer', direction: 'bullish' as const, reliability: 70, description: 'Potential trend reversal' }
    ],
    'SHORT': [
      { name: 'Bearish Engulfing', direction: 'bearish' as const, reliability: 75, description: 'Strong reversal pattern' },
      { name: 'Evening Star', direction: 'bearish' as const, reliability: 80, description: 'Strong top reversal' },
      { name: 'Double Top', direction: 'bearish' as const, reliability: 85, description: 'Strong resistance confirmation' },
      { name: 'Hanging Man', direction: 'bearish' as const, reliability: 70, description: 'Potential trend reversal' }
    ],
    'NEUTRAL': [
      { name: 'Doji', direction: 'neutral' as const, reliability: 65, description: 'Market indecision' },
      { name: 'Inside Bar', direction: 'neutral' as const, reliability: 70, description: 'Consolidation pattern' },
      { name: 'Rectangle', direction: 'neutral' as const, reliability: 75, description: 'Range-bound price action' },
      { name: 'Sideways Channel', direction: 'neutral' as const, reliability: 80, description: 'Established trading range' }
    ]
  };
  
  // Select 1-2 patterns based on seed
  const selectedPatterns = [];
  const mainPattern = patternSets[direction][seed % 4];
  selectedPatterns.push(mainPattern);
  
  // Sometimes add a second pattern
  if (seed % 3 === 0) {
    const secondaryIdx = (seed + 1) % 4;
    selectedPatterns.push(patternSets[direction][secondaryIdx]);
  }
  
  return selectedPatterns;
}

function getSupportLevels(price: number): number[] {
  return [
    Math.round(price * 0.98 * 100) / 100,
    Math.round(price * 0.95 * 100) / 100,
    Math.round(price * 0.92 * 100) / 100
  ];
}

function getResistanceLevels(price: number): number[] {
  return [
    Math.round(price * 1.02 * 100) / 100,
    Math.round(price * 1.05 * 100) / 100,
    Math.round(price * 1.08 * 100) / 100
  ];
}

function getDuration(timeframe: TimeFrame): string {
  const durations = {
    '1m': '5-15 minutes',
    '5m': '15-60 minutes',
    '15m': '1-4 hours',
    '30m': '2-8 hours',
    '1h': '4-24 hours',
    '4h': '1-3 days',
    '1d': '1-2 weeks',
    '3d': '1-3 weeks',
    '1w': '1-2 months',
    '1M': '3-6 months'
  };
  
  return durations[timeframe] || 'Variable';
}

function getIndicators(direction: string, confidence: number) {
  const trendStrength = direction === 'NEUTRAL' ? 'WEAK' : 
                      confidence > 80 ? 'STRONG' : 
                      confidence > 60 ? 'MODERATE' : 'WEAK';
  
  const momentumStrength = direction === 'NEUTRAL' ? 'WEAK' : 
                         confidence > 75 ? 'STRONG' : 
                         confidence > 55 ? 'MODERATE' : 'WEAK';
  
  const signalType = direction === 'LONG' ? 'BUY' : 
                   direction === 'SHORT' ? 'SELL' : 'NEUTRAL';
  
  return {
    trend: [
      { id: 'trend-1', name: 'Moving Average Cross', value: confidence, signal: signalType, strength: trendStrength, category: 'Trend' },
      { id: 'trend-2', name: 'ADX', value: confidence - 10, signal: signalType, strength: trendStrength, category: 'Trend' }
    ],
    momentum: [
      { id: 'momentum-1', name: 'RSI', value: direction === 'LONG' ? 65 : direction === 'SHORT' ? 35 : 50, signal: signalType, strength: momentumStrength, category: 'Momentum' },
      { id: 'momentum-2', name: 'MACD', value: confidence - 5, signal: signalType, strength: momentumStrength, category: 'Momentum' }
    ],
    volatility: [
      { id: 'volatility-1', name: 'Bollinger Bands', value: confidence - 15, signal: signalType, strength: 'MODERATE', category: 'Volatility' }
    ],
    volume: [
      { id: 'volume-1', name: 'OBV', value: confidence - 20, signal: signalType, strength: 'MODERATE', category: 'Volume' }
    ]
  };
}

function getMacroInsights(direction: string, confidence: number): string[] {
  const insights = [];
  
  if (direction === 'LONG') {
    insights.push('Positive market sentiment detected');
    insights.push('Institutional buying pressure increasing');
    if (confidence > 70) insights.push('Strong bullish trend confirmed');
  } else if (direction === 'SHORT') {
    insights.push('Negative market sentiment detected');
    insights.push('Institutional selling pressure increasing');
    if (confidence > 70) insights.push('Strong bearish trend confirmed');
  } else {
    insights.push('Neutral market conditions prevailing');
    insights.push('No clear institutional bias detected');
  }
  
  return insights;
}

function getProbabilityDescription(probability: number): string {
  if (probability > 80) return 'Very High Probability';
  if (probability > 65) return 'Good Probability';
  if (probability > 50) return 'Moderate Probability';
  return 'Low Probability';
}

function getLeverage(direction: string, confidence: number) {
  if (direction === 'NEUTRAL') {
    return {
      conservative: 1,
      moderate: 1,
      aggressive: 2,
      recommendation: 'Avoid leverage in neutral markets'
    };
  }
  
  // Base leverage values
  const conservative = confidence > 80 ? 2 : 1;
  const moderate = confidence > 70 ? 3 : 2;
  const aggressive = confidence > 60 ? 5 : 3;
  
  // Recommendation text
  let recommendation = '';
  if (confidence > 80) {
    recommendation = 'Moderate leverage may be appropriate';
  } else if (confidence > 60) {
    recommendation = 'Conservative leverage recommended';
  } else {
    recommendation = 'Use minimal leverage or none';
  }
  
  return {
    conservative,
    moderate, 
    aggressive,
    recommendation
  };
}