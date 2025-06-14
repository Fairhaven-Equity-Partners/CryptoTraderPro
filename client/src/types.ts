export interface AppTab {
  id: 'analysis' | 'forex' | 'settings';
  label: string;
  icon: string;
}

export interface CryptoAsset {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export interface TradingSignal {
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number;
  price: number;
  strength: number;
  indicators: any;
  timestamp: Date;
}

export interface MonteCarloRiskAssessment {
  expectedReturn: number;
  var95: number;
  maxDrawdown: number;
  winProbability: number;
  riskScore: number;
  sharpeRatio: number;
  confidenceInterval: [number, number];
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
}

export interface SignalInput {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
}