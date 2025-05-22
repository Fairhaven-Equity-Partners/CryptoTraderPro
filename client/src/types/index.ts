// Type definitions for the application

// Available timeframes
export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '3d' | '1w' | '1M';

// Signal direction
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

// Pattern formation
export interface PatternFormation {
  name: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  reliability: number;
  description: string;
}

// Indicator definition
export interface Indicator {
  id: string;
  name: string;
  value: number;
  signal: string;
  strength: string;
  category: string;
}

// Market environment
export interface MarketEnvironment {
  marketVolatility: string;
  marketSentiment: string;
  riskLevel: string;
}

// Advanced Signal
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
  environment: MarketEnvironment;
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

// Trade Recommendation
export interface TradeRecommendation {
  direction: SignalDirection;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  leverage: number;
  riskRewardRatio: number;
  timeframe: TimeFrame;
  pattern: string;
  keyIndicators: string[];
  summary: string;
}

// Chart Data Point
export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}