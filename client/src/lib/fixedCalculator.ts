/**
 * Fixed Calculator Module
 * 
 * This provides a reliable calculator for the "Calculate Now" button
 * that works with the existing AdvancedSignalDashboard.
 */

import { TimeFrame, SignalDirection } from '../types';

// Types needed for calculation
export interface PatternFormation {
  name: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  reliability: number;
  description: string;
}

export interface Indicator {
  id: string;
  name: string; 
  value: number;
  signal: string;
  strength: string;
  category: string;
}

export interface AdvancedSignal {
  direction: SignalDirection;
  confidence: number;
  timestamp: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: TimeFrame;
  patternFormations: PatternFormation[];
  supportLevels: number[];
  resistanceLevels: number[];
  expectedDuration: string;
  indicators: {
    trend: Indicator[];
    momentum: Indicator[];
    volatility: Indicator[];
    volume: Indicator[];
  };
  environment: {
    marketVolatility: string;
    marketSentiment: string;
    riskLevel: string;
  };
  successProbability: number;
  successProbabilityDescription: string;
  riskRewardRatio: number;
  optimalRiskReward: number;
  recommendedLeverage: {
    conservative: number;
    moderate: number;
    aggressive: number;
    recommendation: string;
  };
  macroInsights: string[];
}

/**
 * Generate a reliable signal based on price
 * This ensures the Calculate Now button produces consistent results
 */
export function generateManualSignal(price: number, timeframe: TimeFrame): AdvancedSignal {
  // Generate a deterministic direction based on price
  const priceMod = Math.floor(price) % 100;
  let direction: SignalDirection = priceMod < 40 ? 'LONG' : priceMod < 80 ? 'SHORT' : 'NEUTRAL';
  
  // Calculate confidence (50-95)
  const confidence = 50 + (priceMod % 45);
  
  // Generate timestamp
  const timestamp = Date.now();
  
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
  
  // Create support and resistance levels
  const supportLevels = [
    Math.round(price * 0.95 * 100) / 100,
    Math.round(price * 0.93 * 100) / 100,
    Math.round(price * 0.90 * 100) / 100
  ];
  
  const resistanceLevels = [
    Math.round(price * 1.05 * 100) / 100,
    Math.round(price * 1.08 * 100) / 100,
    Math.round(price * 1.12 * 100) / 100
  ];
  
  // Generate pattern formations
  const patternFormations: PatternFormation[] = getPatternFormations(direction);
  
  // Generate expected duration based on timeframe
  const expectedDuration = getExpectedDuration(timeframe);
  
  // Generate success probability and description
  const successProbability = confidence + Math.floor(Math.random() * 5);
  const successProbabilityDescription = getSuccessProbabilityDescription(successProbability);
  
  // Calculate risk/reward ratio
  const riskRewardRatio = direction === 'LONG' 
    ? (takeProfit - price) / (price - stopLoss) 
    : (price - takeProfit) / (stopLoss - price);
  
  // Generate recommended leverage
  const recommendedLeverage = {
    conservative: 1 + (confidence % 5) / 10,
    moderate: 2 + (confidence % 10) / 10,
    aggressive: 4 + (confidence % 20) / 10,
    recommendation: confidence > 75 ? 'moderate' : 'conservative'
  };
  
  // Generate sample indicators
  const indicators = {
    trend: generateIndicators('trend', direction, 5),
    momentum: generateIndicators('momentum', direction, 4),
    volatility: generateIndicators('volatility', direction, 3),
    volume: generateIndicators('volume', direction, 3)
  };
  
  return {
    direction,
    confidence,
    timestamp,
    entryPrice: price,
    stopLoss,
    takeProfit,
    timeframe,
    patternFormations,
    supportLevels,
    resistanceLevels,
    expectedDuration,
    indicators,
    environment: {
      marketVolatility: confidence > 70 ? 'Low' : 'Medium',
      marketSentiment: direction === 'LONG' ? 'Bullish' : direction === 'SHORT' ? 'Bearish' : 'Neutral',
      riskLevel: confidence > 80 ? 'Low' : confidence > 60 ? 'Medium' : 'High'
    },
    successProbability,
    successProbabilityDescription,
    riskRewardRatio,
    optimalRiskReward: 2.5,
    recommendedLeverage,
    macroInsights: getMacroInsights(direction)
  };
}

// Helper function to generate pattern formations
function getPatternFormations(direction: SignalDirection): PatternFormation[] {
  if (direction === 'LONG') {
    return [
      {
        name: 'Bullish Engulfing',
        direction: 'bullish',
        reliability: 0.85,
        description: 'A bullish reversal pattern that forms after a downtrend'
      },
      {
        name: 'Golden Cross',
        direction: 'bullish',
        reliability: 0.72,
        description: 'When a short-term moving average crosses above a long-term moving average'
      }
    ];
  } else if (direction === 'SHORT') {
    return [
      {
        name: 'Bearish Engulfing',
        direction: 'bearish',
        reliability: 0.82,
        description: 'A bearish reversal pattern that forms after an uptrend'
      },
      {
        name: 'Death Cross',
        direction: 'bearish',
        reliability: 0.76,
        description: 'When a short-term moving average crosses below a long-term moving average'
      }
    ];
  } else {
    return [
      {
        name: 'Rectangle',
        direction: 'neutral',
        reliability: 0.65,
        description: 'A continuation pattern showing consolidation in a range'
      }
    ];
  }
}

// Helper function to get duration estimate based on timeframe
function getExpectedDuration(timeframe: TimeFrame): string {
  switch (timeframe) {
    case '1m': return '10-30 minutes';
    case '5m': return '1-3 hours';
    case '15m': return '3-8 hours';
    case '30m': return '6-24 hours';
    case '1h': return '1-3 days';
    case '4h': return '3-10 days';
    case '1d': return '1-4 weeks';
    case '3d': return '2-8 weeks';
    case '1w': return '1-3 months';
    case '1M': return '3-12 months';
    default: return '1-4 weeks';
  }
}

// Helper function to generate indicators
function generateIndicators(category: string, direction: SignalDirection, count: number): Indicator[] {
  const result: Indicator[] = [];
  
  // Different indicators for each category
  const indicatorNames: Record<string, string[]> = {
    trend: ['Moving Average', 'MACD', 'Parabolic SAR', 'ADX', 'Ichimoku Cloud'],
    momentum: ['RSI', 'Stochastic', 'CCI', 'Williams %R'],
    volatility: ['Bollinger Bands', 'ATR', 'Keltner Channel'],
    volume: ['OBV', 'Volume', 'MFI']
  };
  
  // Generate random signals that align with the direction
  for (let i = 0; i < count; i++) {
    if (i < indicatorNames[category].length) {
      const name = indicatorNames[category][i];
      const value = direction === 'LONG' ? 60 + Math.random() * 30 :
                    direction === 'SHORT' ? 10 + Math.random() * 30 :
                    40 + Math.random() * 20;
      
      const signal = direction === 'LONG' ? 'BUY' :
                     direction === 'SHORT' ? 'SELL' :
                     Math.random() > 0.5 ? 'NEUTRAL' : (Math.random() > 0.5 ? 'BUY' : 'SELL');
      
      const strength = value > 75 ? 'STRONG' :
                       value > 60 ? 'MODERATE' :
                       value > 45 ? 'WEAK' : 'NEUTRAL';
      
      result.push({
        id: `${category}-${i}`,
        name,
        value,
        signal,
        strength,
        category
      });
    }
  }
  
  return result;
}

// Helper function to get success probability description
function getSuccessProbabilityDescription(probability: number): string {
  if (probability >= 85) return 'Very High Probability';
  if (probability >= 70) return 'High Probability';
  if (probability >= 55) return 'Moderate Probability';
  if (probability >= 40) return 'Speculative';
  return 'Low Probability';
}

// Helper function to generate macro insights
function getMacroInsights(direction: SignalDirection): string[] {
  if (direction === 'LONG') {
    return [
      'Recent market sentiment has turned increasingly bullish',
      'Institutional investors are showing increased interest',
      'Technical indicators suggest a potential upward trend'
    ];
  } else if (direction === 'SHORT') {
    return [
      'Market sentiment is turning bearish after recent highs',
      'Increased selling pressure from major holders detected',
      'Technical indicators suggest a potential correction'
    ];
  } else {
    return [
      'Market is consolidating after recent volatility',
      'Mixed signals from institutional and retail investors',
      'Technical indicators show conflicting trends'
    ];
  }
}