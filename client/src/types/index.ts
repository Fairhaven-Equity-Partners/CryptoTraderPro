export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '3d' | '1w' | '1M';

export const TIMEFRAMES: readonly TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'] as const;

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated?: Date;
}

export interface Signal {
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: TimeFrame;
  timestamp: number;
}