import { ChartData, TimeFrame } from '../types/index';
import { generateAccurateSignal, AccurateSignal } from './accurateSignalEngine';
import { AdvancedSignal } from './advancedSignals';

/**
 * Unified Calculation Engine
 * Converts AccurateSignal to AdvancedSignal format while maintaining mathematical accuracy
 */

export function calculateUnifiedSignal(
  data: ChartData[],
  timeframe: TimeFrame,
  currentPrice: number,
  symbol: string
): AdvancedSignal {
  // Generate accurate mathematical signal
  const accurateSignal = generateAccurateSignal(data, timeframe, currentPrice);
  
  // Convert to AdvancedSignal format for UI compatibility
  const advancedSignal: AdvancedSignal = {
    direction: accurateSignal.direction,
    confidence: accurateSignal.confidence,
    entryPrice: accurateSignal.entryPrice,
    stopLoss: accurateSignal.stopLoss,
    takeProfit: accurateSignal.takeProfit,
    timeframe: timeframe,
    timestamp: Date.now(),
    successProbability: accurateSignal.historicalAccuracy,
    indicators: convertIndicators(accurateSignal.indicators),
    environment: generateEnvironment(accurateSignal, timeframe),
    patternFormations: generatePatterns(data, timeframe),
    supportResistance: calculateLevels(data, currentPrice),
    recommendedLeverage: calculateLeverage(accurateSignal, timeframe),
    riskReward: accurateSignal.riskReward,
    marketStructure: analyzeMarketStructure(data, accurateSignal.direction),
    volumeProfile: analyzeVolumeProfile(data),
    macroInsights: generateMacroInsights(timeframe, accurateSignal)
  };

  return advancedSignal;
}

function convertIndicators(indicators: any): any {
  return {
    rsi: {
      value: indicators.rsi,
      signal: indicators.rsi > 70 ? 'SELL' : indicators.rsi < 30 ? 'BUY' : 'NEUTRAL',
      strength: Math.abs(indicators.rsi - 50) > 20 ? 'STRONG' : 'MODERATE',
      name: 'RSI',
      category: 'MOMENTUM'
    },
    macd: {
      value: indicators.macd.value,
      signal: indicators.macd.histogram > 0 ? 'BUY' : 'SELL',
      strength: Math.abs(indicators.macd.histogram) > 0.5 ? 'STRONG' : 'MODERATE',
      name: 'MACD',
      category: 'MOMENTUM',
      histogram: indicators.macd.histogram,
      signalLine: indicators.macd.signal
    },
    bollinger: {
      value: indicators.bollinger.middle,
      upper: indicators.bollinger.upper,
      lower: indicators.bollinger.lower,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'Bollinger Bands',
      category: 'VOLATILITY'
    },
    sma20: {
      value: indicators.sma20,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'SMA 20',
      category: 'TREND'
    },
    sma50: {
      value: indicators.sma50,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'SMA 50',
      category: 'TREND'
    },
    momentum: {
      value: indicators.momentum,
      signal: indicators.momentum > 2 ? 'BUY' : indicators.momentum < -2 ? 'SELL' : 'NEUTRAL',
      strength: Math.abs(indicators.momentum) > 5 ? 'STRONG' : 'MODERATE',
      name: 'Momentum',
      category: 'MOMENTUM'
    },
    volume: {
      value: indicators.volume,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'Volume',
      category: 'VOLUME'
    }
  };
}

function generateEnvironment(signal: AccurateSignal, timeframe: TimeFrame): any {
  return {
    marketSentiment: signal.direction === 'LONG' ? 'Bullish' : signal.direction === 'SHORT' ? 'Bearish' : 'Neutral',
    volatility: calculateVolatilityLevel(signal.indicators.bollinger),
    trendStrength: calculateTrendStrength(signal.indicators),
    timeframeReliability: getTimeframeReliability(timeframe),
    marketPhase: determineMarketPhase(signal.indicators),
    riskLevel: calculateRiskLevel(signal.riskReward, signal.confidence)
  };
}

function calculateVolatilityLevel(bollinger: any): string {
  const bandWidth = (bollinger.upper - bollinger.lower) / bollinger.middle;
  if (bandWidth > 0.1) return 'High';
  if (bandWidth > 0.05) return 'Medium';
  return 'Low';
}

function calculateTrendStrength(indicators: any): string {
  const macdStrength = Math.abs(indicators.macd.histogram);
  const momentumStrength = Math.abs(indicators.momentum);
  
  if (macdStrength > 1 && momentumStrength > 3) return 'Strong';
  if (macdStrength > 0.5 || momentumStrength > 1.5) return 'Moderate';
  return 'Weak';
}

function getTimeframeReliability(timeframe: TimeFrame): string {
  const reliability = {
    '1m': 'Low',
    '5m': 'Low',
    '15m': 'Medium',
    '30m': 'Medium',
    '1h': 'High',
    '4h': 'High',
    '12h': 'High',
    '1d': 'High',
    '3d': 'Medium',
    '1w': 'Medium',
    '1M': 'Medium'
  };
  return reliability[timeframe] || 'Medium';
}

function determineMarketPhase(indicators: any): string {
  const rsi = indicators.rsi;
  const macd = indicators.macd.value;
  const momentum = indicators.momentum;
  
  if (rsi > 70 && macd > 0 && momentum > 0) return 'Overbought Bullish';
  if (rsi < 30 && macd < 0 && momentum < 0) return 'Oversold Bearish';
  if (macd > 0 && momentum > 0) return 'Bullish Trend';
  if (macd < 0 && momentum < 0) return 'Bearish Trend';
  return 'Consolidation';
}

function calculateRiskLevel(riskReward: number, confidence: number): string {
  const riskScore = (riskReward * confidence) / 100;
  if (riskScore > 2) return 'Low';
  if (riskScore > 1) return 'Medium';
  return 'High';
}

function generatePatterns(data: ChartData[], timeframe: TimeFrame): any[] {
  // Generate basic patterns based on price action
  const patterns = [];
  
  if (data.length < 20) return patterns;
  
  const recent = data.slice(-20);
  const prices = recent.map(d => d.close);
  
  // Detect simple patterns
  const isUptrend = prices[prices.length - 1] > prices[0];
  const isDowntrend = prices[prices.length - 1] < prices[0];
  
  if (isUptrend) {
    patterns.push({
      name: 'Uptrend',
      type: 'BULLISH',
      confidence: 70,
      timeframe: timeframe,
      description: 'Price showing upward momentum'
    });
  }
  
  if (isDowntrend) {
    patterns.push({
      name: 'Downtrend',
      type: 'BEARISH',
      confidence: 70,
      timeframe: timeframe,
      description: 'Price showing downward momentum'
    });
  }
  
  return patterns;
}

function calculateLevels(data: ChartData[], currentPrice: number): any[] {
  if (data.length < 50) return [];
  
  const recent = data.slice(-50);
  const highs = recent.map(d => d.high);
  const lows = recent.map(d => d.low);
  
  // Find resistance (recent highs)
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);
  
  return [
    {
      type: 'RESISTANCE',
      price: resistance,
      strength: resistance > currentPrice * 1.02 ? 'STRONG' : 'MODERATE',
      distance: ((resistance - currentPrice) / currentPrice) * 100
    },
    {
      type: 'SUPPORT',
      price: support,
      strength: support < currentPrice * 0.98 ? 'STRONG' : 'MODERATE',
      distance: ((currentPrice - support) / currentPrice) * 100
    }
  ];
}

function calculateLeverage(signal: AccurateSignal, timeframe: TimeFrame): any {
  const baseMultiplier = {
    '1m': 2,
    '5m': 3,
    '15m': 5,
    '30m': 7,
    '1h': 10,
    '4h': 15,
    '12h': 15,
    '1d': 20,
    '3d': 15,
    '1w': 10,
    '1M': 5
  };
  
  const base = baseMultiplier[timeframe] || 5;
  const confidenceAdjustment = signal.confidence / 100;
  const riskAdjustment = Math.min(signal.riskReward / 2, 1);
  
  const conservative = Math.round(base * 0.5 * confidenceAdjustment);
  const moderate = Math.round(base * 0.75 * confidenceAdjustment * riskAdjustment);
  const aggressive = Math.round(base * confidenceAdjustment * riskAdjustment);
  
  return {
    conservative: Math.max(1, conservative),
    moderate: Math.max(2, moderate),
    aggressive: Math.max(3, aggressive),
    recommendation: signal.confidence > 75 ? 'moderate' : 'conservative'
  };
}

function analyzeMarketStructure(data: ChartData[], direction: string): any {
  return {
    trend: direction === 'LONG' ? 'Bullish' : direction === 'SHORT' ? 'Bearish' : 'Sideways',
    strength: 'Medium',
    phase: 'Active'
  };
}

function analyzeVolumeProfile(data: ChartData[]): any {
  if (data.length < 20) return { trend: 'Unknown', strength: 'Low' };
  
  const recent = data.slice(-20);
  const avgVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
  const currentVolume = recent[recent.length - 1].volume;
  
  return {
    trend: currentVolume > avgVolume * 1.2 ? 'Increasing' : 'Stable',
    strength: currentVolume > avgVolume * 1.5 ? 'High' : 'Medium',
    avgVolume: avgVolume
  };
}

function generateMacroInsights(timeframe: TimeFrame, signal: AccurateSignal): string[] {
  const insights = [];
  
  if (signal.confidence > 80) {
    insights.push(`High confidence ${signal.direction} signal on ${timeframe} timefram`e`);
  }
  
  if (signal.riskReward > 2) {
    insights.push(`Excellent risk/reward ratio of ${signal.riskReward}:`1`);
  }
  
  if (signal.indicators.rsi > 70) {
    insights.push('RSI indicates overbought conditions');
  } else if (signal.indicators.rsi < 30) {
    insights.push('RSI indicates oversold conditions');
  }
  
  if (Math.abs(signal.indicators.macd.histogram) > 0.5) {
    insights.push('MACD showing strong momentum divergence');
  }
  
  return insights;
}