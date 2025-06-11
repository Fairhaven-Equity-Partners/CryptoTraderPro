export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '3d' | '1w' | '1M';

export type IndicatorSignal = 'BUY' | 'SELL' | 'NEUTRAL';
export type IndicatorStrength = 'WEAK' | 'MEDIUM' | 'STRONG';
export type IndicatorCategory = 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'VOLUME';

export interface Indicator {
  id: string;
  name: string;
  category: IndicatorCategory;
  value: number;
  signal: IndicatorSignal;
  strength?: IndicatorStrength;
}

export interface CalculationResult {
  confidence: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  signal: number;
  indicators: Record<string, Indicator>;
}