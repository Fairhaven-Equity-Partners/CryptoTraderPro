export interface AssetPrice {
  symbol: string;
  price: number;
  change24h: number;
}

export interface ChartData {
  time: number;  // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';

export type IndicatorCategory = 'MOMENTUM' | 'TREND' | 'VOLATILITY' | 'VOLUME';

export type IndicatorSignal = 'BUY' | 'SELL' | 'NEUTRAL';

export type IndicatorStrength = 'WEAK' | 'MODERATE' | 'STRONG' | 'HIGH' | 'LOW' | null;

export interface Indicator {
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
  positionSize: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}

export interface LeverageResult {
  recommendedLeverage: string;
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
  id: 'analysis' | 'alerts' | 'portfolio' | 'settings';
  label: string;
  icon: string;
}
