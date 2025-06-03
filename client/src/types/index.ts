export interface AssetPrice {
  symbol: string;
  price: number;
  lastPrice?: number;
  change24h: number;
  name?: string;
  volume24h?: number;
  marketCap?: number;
}

export interface ChartData {
  time: number;  // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h' | '1d' | '3d' | '1w' | '1M';

export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

export type IndicatorCategory = 'MOMENTUM' | 'TREND' | 'VOLATILITY' | 'VOLUME' | 'PATTERN';

export type IndicatorSignal = 'BUY' | 'SELL' | 'NEUTRAL';

export type IndicatorStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'HIGH' | 'LOW' | null;

// Pattern Formation Interface
export interface PatternFormation {
  name: string;
  reliability: number; // 0-100
  direction: string; // Allow string flexibility for display purposes
  priceTarget?: number;
  description?: string;
}

export interface Indicator {
  id?: string;
  name: string;
  category: IndicatorCategory;
  signal: IndicatorSignal;
  strength?: IndicatorStrength;
  value?: number | string;
}

export interface TimeframeSignal {
  timeframe: TimeFrame;
  signal: SignalDirection;
  strength: number; // 0-100
  trend: string;
}

export interface SignalSummaryData {
  direction: SignalDirection;
  strength: number; // 0-100
  indicators: Record<IndicatorCategory, Indicator[]>;
}

// Advanced Signal Interface for the dashboard
export interface AdvancedSignal {
  direction: SignalDirection;
  confidence: number; // 0-100
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  timeframe: TimeFrame;
  timestamp: number;  // Required for display functionality
  macroScore?: number; // 0-100
  successProbability: number; // Required for display functionality (0-100)
  successProbabilityDescription?: string; // Human-readable description of the probability
  indicators?: any; // Allow flexible indicator structure
  patternFormations?: PatternFormation[];
  supportLevels?: number[];
  resistanceLevels?: number[];
  expectedDuration?: string;
  riskRewardRatio?: number;
  optimalRiskReward?: {
    ideal: number;
    range: number[];
  };
  recommendedLeverage?: {
    conservative: number;
    moderate: number; 
    aggressive: number;
    recommendation: string;
  };
  macroInsights?: string[]; // Insights about market conditions
}

// Trade recommendation interface
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

export interface Alert {
  id: number;
  symbol: string;
  direction: SignalDirection;
  description: string;
  targetPrice: number;
  isActive: boolean;
  isTriggered: boolean;
}

export interface LeverageParams {
  entryPrice: number;
  stopLoss: number;
  accountBalance?: number;
  maxLossPercentage?: number;
  positionValue?: number;
  takeProfit?: number;
  riskPercentage?: number;
  positionSize?: number;
}

export interface LeverageResult {
  recommendedLeverage: number;
  maxLoss: string;
  potentialProfit: string;
  riskRewardRatio: string;
  liquidationPrice: string;
  takeProfitLevels?: {
    tp1: string;
    tp2: string;
    tp3: string;
  };
  recommendedPositionSize?: string;
  maxPositionSize?: string;
}

export interface AppTab {
  id: 'analysis' | 'forex' | 'settings';
  label: string;
  icon: string;
}

// Price event data structure
export interface PriceEvent {
  price: number;
  timestamp: number;
}

// Technical indicator calculation utility functions
export interface TechnicalIndicators {
  calculateMACD: (data: ChartData[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number) => any;
  calculateRSI: (data: ChartData[], period?: number) => any;
  calculateStochastics: (data: ChartData[], kPeriod?: number, dPeriod?: number, slowing?: number) => any;
  calculateBollingerBands: (data: ChartData[], period?: number, stdDev?: number) => any;
  calculateEMA: (data: ChartData[], period?: number) => any;
}

// Signal stabilization system interface - updated to match our new implementation
export interface SignalStabilizationSystem {
  stabilizeSignals: (newSignal: any, previousSignal: any) => any;
  harmonizeSignalsAcrossTimeframes: (signals: Record<string, any>) => Record<string, any>;
  getStabilizedSignal: (newSignals: Record<string, any>, previousSignals: Record<string, any>) => Record<string, any>;
}

// We removed this interface because it's now defined in windowTypes.ts
