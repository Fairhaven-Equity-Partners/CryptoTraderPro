/**
 * Market Regime Detection System
 * Identifies current market conditions (Bull, Bear, Sideways) to optimize signal accuracy
 */

import { ChartData, TimeFrame } from '../types';

export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'TRANSITIONAL';

export interface RegimeAnalysis {
  regime: MarketRegime;
  confidence: number; // 0-100
  duration: number; // Days in current regime
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  description: string;
  signals: {
    trendDirection: number; // -1 to 1
    volatility: number; // 0-100
    momentum: number; // -1 to 1
    volume: number; // relative volume strength
  };
}

export interface RegimeOptimization {
  confidenceAdjustment: number; // multiplier for signal confidence
  leverageAdjustment: number; // multiplier for recommended leverage
  timeframePreference: TimeFrame[]; // preferred timeframes for current regime
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Calculate moving average for trend analysis
 */
function calculateMA(data: number[], period: number): number[] {
  const ma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    ma.push(sum / period);
  }
  return ma;
}

/**
 * Calculate volatility using standard deviation
 */
function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const recentReturns = returns.slice(-period);
  const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
  const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / recentReturns.length;
  
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility percentage
}

/**
 * Detect current market regime based on price action and technical indicators
 */
export function detectMarketRegime(chartData: ChartData[], timeframe: TimeFrame): RegimeAnalysis {
  if (chartData.length < 50) {
    return {
      regime: 'TRANSITIONAL',
      confidence: 0,
      duration: 0,
      strength: 'WEAK',
      description: 'Insufficient data for regime analysis',
      signals: { trendDirection: 0, volatility: 0, momentum: 0, volume: 0 }
    };
  }

  const prices = chartData.map(d => d.close);
  const volumes = chartData.map(d => d.volume || 0);
  const recent = Math.min(50, chartData.length);
  const recentPrices = prices.slice(-recent);
  const recentVolumes = volumes.slice(-recent);

  // Calculate trend indicators
  const ma20 = calculateMA(recentPrices, 20);
  const ma50 = calculateMA(recentPrices, Math.min(50, recentPrices.length));
  const currentPrice = recentPrices[recentPrices.length - 1];
  const ma20Current = ma20[ma20.length - 1];
  const ma50Current = ma50[ma50.length - 1];

  // Trend direction analysis
  const trendDirection = (currentPrice - ma20Current) / ma20Current;
  const maTrend = ma20.length > 1 ? (ma20[ma20.length - 1] - ma20[0]) / ma20[0] : 0;

  // Volatility analysis
  const volatility = calculateVolatility(recentPrices);

  // Momentum analysis
  const momentum = recentPrices.length > 10 ? 
    (recentPrices[recentPrices.length - 1] - recentPrices[recentPrices.length - 11]) / 
    recentPrices[recentPrices.length - 11] : 0;

  // Volume analysis
  const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const recentAvgVolume = recentVolumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const volumeStrength = avgVolume > 0 ? (recentAvgVolume - avgVolume) / avgVolume : 0;

  // Regime classification logic
  let regime: MarketRegime;
  let confidence = 0;
  let strength: 'WEAK' | 'MODERATE' | 'STRONG' = 'WEAK';
  let description = '';

  // Strong bull market conditions
  if (trendDirection > 0.05 && maTrend > 0.02 && momentum > 0.03) {
    regime = 'BULL';
    confidence = Math.min(95, 70 + Math.abs(trendDirection) * 100 + Math.abs(momentum) * 50);
    strength = confidence > 80 ? 'STRONG' : confidence > 60 ? 'MODERATE' : 'WEAK';
    description = `Strong bullish trend with ${(momentum * 100).toFixed(1)}% momentum`;
  }
  // Strong bear market conditions
  else if (trendDirection < -0.05 && maTrend < -0.02 && momentum < -0.03) {
    regime = 'BEAR';
    confidence = Math.min(95, 70 + Math.abs(trendDirection) * 100 + Math.abs(momentum) * 50);
    strength = confidence > 80 ? 'STRONG' : confidence > 60 ? 'MODERATE' : 'WEAK';
    description = `Strong bearish trend with ${(Math.abs(momentum) * 100).toFixed(1)}% downward momentum`;
  }
  // Sideways/consolidation conditions
  else if (Math.abs(trendDirection) < 0.03 && Math.abs(maTrend) < 0.015 && volatility < 25) {
    regime = 'SIDEWAYS';
    confidence = Math.min(90, 60 + (25 - volatility));
    strength = volatility < 15 ? 'STRONG' : volatility < 20 ? 'MODERATE' : 'WEAK';
    description = `Sideways consolidation with ${volatility.toFixed(1)}% volatility`;
  }
  // Weak trends or transitional periods
  else if (Math.abs(trendDirection) < 0.02 || volatility > 40) {
    regime = 'TRANSITIONAL';
    confidence = Math.max(30, 50 - volatility);
    strength = 'WEAK';
    description = `Transitional market with ${volatility.toFixed(1)}% volatility`;
  }
  // Moderate bull trend
  else if (trendDirection > 0 && maTrend > 0) {
    regime = 'BULL';
    confidence = Math.min(75, 50 + Math.abs(trendDirection) * 100);
    strength = confidence > 65 ? 'MODERATE' : 'WEAK';
    description = `Moderate bullish trend developing`;
  }
  // Moderate bear trend
  else {
    regime = 'BEAR';
    confidence = Math.min(75, 50 + Math.abs(trendDirection) * 100);
    strength = confidence > 65 ? 'MODERATE' : 'WEAK';
    description = `Moderate bearish trend developing`;
  }

  // Estimate regime duration (simplified)
  let duration = 1;
  if (ma20.length > 5) {
    const trendConsistency = ma20.slice(-5).every((val, i, arr) => 
      i === 0 || (regime === 'BULL' ? val > arr[i-1] : regime === 'BEAR' ? val < arr[i-1] : true)
    );
    duration = trendConsistency ? Math.min(30, ma20.length) : 1;
  }

  return {
    regime,
    confidence: Math.round(confidence),
    duration,
    strength,
    description,
    signals: {
      trendDirection: Math.round(trendDirection * 100) / 100,
      volatility: Math.round(volatility * 10) / 10,
      momentum: Math.round(momentum * 100) / 100,
      volume: Math.round(volumeStrength * 100) / 100
    }
  };
}

/**
 * Get regime-specific optimizations for signal analysis
 */
export function getRegimeOptimizations(regime: RegimeAnalysis): RegimeOptimization {
  switch (regime.regime) {
    case 'BULL':
      return {
        confidenceAdjustment: regime.strength === 'STRONG' ? 1.15 : 1.08,
        leverageAdjustment: regime.strength === 'STRONG' ? 1.2 : 1.1,
        timeframePreference: ['1d', '4h', '1h'], // Longer timeframes work better in trends
        riskLevel: regime.strength === 'STRONG' ? 'MEDIUM' : 'LOW'
      };

    case 'BEAR':
      return {
        confidenceAdjustment: regime.strength === 'STRONG' ? 1.12 : 1.05,
        leverageAdjustment: 0.8, // Lower leverage in bear markets
        timeframePreference: ['1d', '4h', '1h'],
        riskLevel: 'HIGH'
      };

    case 'SIDEWAYS':
      return {
        confidenceAdjustment: 0.9, // Lower confidence in ranging markets
        leverageAdjustment: 0.7, // Much lower leverage
        timeframePreference: ['1h', '30m', '15m'], // Shorter timeframes for range trading
        riskLevel: 'MEDIUM'
      };

    case 'TRANSITIONAL':
    default:
      return {
        confidenceAdjustment: 0.75, // Significantly lower confidence
        leverageAdjustment: 0.5, // Very conservative leverage
        timeframePreference: ['4h', '1h'], // Medium timeframes
        riskLevel: 'HIGH'
      };
  }
}

/**
 * Apply regime-based adjustments to signal confidence
 */
export function applyRegimeAdjustments(
  baseConfidence: number,
  baseLeverage: number,
  signalDirection: 'LONG' | 'SHORT' | 'NEUTRAL',
  regime: RegimeAnalysis
): {
  adjustedConfidence: number;
  adjustedLeverage: number;
  regimeAlignment: number; // -1 to 1, how well signal aligns with regime
} {
  const optimizations = getRegimeOptimizations(regime);
  
  // Calculate regime alignment
  let regimeAlignment = 0;
  if (signalDirection === 'LONG' && regime.regime === 'BULL') {
    regimeAlignment = regime.confidence / 100;
  } else if (signalDirection === 'SHORT' && regime.regime === 'BEAR') {
    regimeAlignment = regime.confidence / 100;
  } else if (signalDirection === 'NEUTRAL' && regime.regime === 'SIDEWAYS') {
    regimeAlignment = regime.confidence / 100;
  } else if (
    (signalDirection === 'LONG' && regime.regime === 'BEAR') ||
    (signalDirection === 'SHORT' && regime.regime === 'BULL')
  ) {
    regimeAlignment = -(regime.confidence / 100);
  }

  // Apply adjustments
  let adjustedConfidence = baseConfidence * optimizations.confidenceAdjustment;
  let adjustedLeverage = baseLeverage * optimizations.leverageAdjustment;

  // Additional alignment bonus/penalty
  if (regimeAlignment > 0.5) {
    adjustedConfidence *= 1.1; // 10% bonus for strong alignment
  } else if (regimeAlignment < -0.5) {
    adjustedConfidence *= 0.8; // 20% penalty for strong misalignment
    adjustedLeverage *= 0.7; // Additional leverage reduction
  }

  return {
    adjustedConfidence: Math.max(0, Math.min(100, Math.round(adjustedConfidence))),
    adjustedLeverage: Math.max(0.1, Math.round(adjustedLeverage * 10) / 10),
    regimeAlignment: Math.round(regimeAlignment * 100) / 100
  };
}

/**
 * Generate regime-specific insights for traders
 */
export function generateRegimeInsights(regime: RegimeAnalysis): string[] {
  const insights: string[] = [];
  
  insights.push(regime.description);
  
  switch (regime.regime) {
    case 'BULL':
      insights.push('Favor long positions and trend-following strategies');
      if (regime.strength === 'STRONG') {
        insights.push('Consider higher timeframes for position entries');
        insights.push('Strong momentum supports breakout trades');
      }
      break;
      
    case 'BEAR':
      insights.push('Exercise caution with long positions');
      insights.push('Short-selling opportunities may be favorable');
      if (regime.signals.volatility > 30) {
        insights.push('High volatility increases risk - reduce position sizes');
      }
      break;
      
    case 'SIDEWAYS':
      insights.push('Range trading strategies most effective');
      insights.push('Look for support/resistance level bounces');
      insights.push('Avoid trend-following strategies');
      break;
      
    case 'TRANSITIONAL':
      insights.push('Market direction unclear - wait for confirmation');
      insights.push('Use smaller position sizes and tighter stops');
      if (regime.signals.volatility > 35) {
        insights.push('Extreme volatility - consider staying out');
      }
      break;
  }
  
  // Volume insights
  if (regime.signals.volume > 0.2) {
    insights.push('Above-average volume supports current move');
  } else if (regime.signals.volume < -0.2) {
    insights.push('Below-average volume - trend may lack conviction');
  }
  
  return insights;
}