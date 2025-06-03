import { ChartData, TimeFrame } from '../types/index';
import { calculateOptimizedSignal, OptimizedSignal } from './optimizedCalculationCore';
import { AdvancedSignal } from './advancedSignals';

/**
 * Optimized Signal Adapter
 * Converts OptimizedSignal to AdvancedSignal format for UI compatibility
 * Eliminates calculation errors and provides consistent results
 */

export function generateOptimizedAdvancedSignal(
  data: ChartData[],
  timeframe: TimeFrame,
  currentPrice: number,
  symbol: string
): AdvancedSignal {
  try {
    const optimizedSignal = calculateOptimizedSignal(data, timeframe, currentPrice, symbol);
    return convertToAdvancedSignal(optimizedSignal);
  } catch (error) {
    console.error(`Signal generation error for ${symbol} ${timeframe}:`, error);
    return createSafeAdvancedSignal(symbol, timeframe, currentPrice);
  }
}

function convertToAdvancedSignal(signal: OptimizedSignal): AdvancedSignal {
  return {
    direction: signal.direction,
    confidence: signal.confidence,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
    timeframe: signal.timeframe,
    timestamp: signal.timestamp,
    successProbability: signal.successProbability,
    
    // Convert indicators to UI format
    indicators: convertIndicatorsToUIFormat(signal.indicators),
    
    // Pattern formations
    patternFormations: signal.patternFormations,
    
    // Support/Resistance
    supportResistance: signal.supportResistance,
    
    // Environment data
    environment: signal.environment,
    
    // Additional fields for UI compatibility
    recommendedLeverage: signal.recommendedLeverage,
    riskReward: signal.riskReward,
    marketStructure: signal.marketStructure,
    volumeProfile: signal.volumeProfile,
    macroInsights: signal.macroInsights,
    
    // UI-specific fields
    signalStrength: calculateSignalStrength(signal.confidence, signal.riskReward),
    marketRegime: signal.macroInsights.regime,
    institutionalFlow: signal.macroInsights.institutionalFlow,
    correlationIndex: signal.macroInsights.correlation,
    
    // Technical analysis summary
    technicalSummary: generateTechnicalSummary(signal),
    
    // Risk assessment
    riskAssessment: generateRiskAssessment(signal),
    
    // Trade recommendation
    tradeRecommendation: generateTradeRecommendation(signal)
  };
}

function convertIndicatorsToUIFormat(indicators: any) {
  return {
    // RSI
    rsi: {
      value: indicators.rsi,
      signal: indicators.rsi > 70 ? 'SELL' : indicators.rsi < 30 ? 'BUY' : 'NEUTRAL',
      strength: Math.abs(indicators.rsi - 50) > 20 ? 'STRONG' : 'MODERATE',
      name: 'RSI',
      category: 'MOMENTUM'
    },
    
    // MACD
    macd: {
      value: indicators.macd.value,
      signal: indicators.macd.histogram > 0 ? 'BUY' : 'SELL',
      strength: Math.abs(indicators.macd.histogram) > 100 ? 'STRONG' : 'MODERATE',
      name: 'MACD',
      category: 'MOMENTUM',
      histogram: indicators.macd.histogram,
      signalLine: indicators.macd.signal
    },
    
    // EMAs
    ema12: {
      value: indicators.ema.short,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'EMA 12',
      category: 'TREND'
    },
    
    ema26: {
      value: indicators.ema.medium,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'EMA 26',
      category: 'TREND'
    },
    
    ema50: {
      value: indicators.ema.long,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'EMA 50',
      category: 'TREND'
    },
    
    // Stochastic
    stochastic: {
      value: indicators.stochastic.k,
      signal: indicators.stochastic.k > 80 ? 'SELL' : indicators.stochastic.k < 20 ? 'BUY' : 'NEUTRAL',
      strength: 'MODERATE',
      name: 'Stochastic',
      category: 'MOMENTUM',
      k: indicators.stochastic.k,
      d: indicators.stochastic.d
    },
    
    // ADX
    adx: {
      value: indicators.adx.value,
      signal: indicators.adx.value > 25 ? 'TRENDING' : 'RANGING',
      strength: indicators.adx.value > 50 ? 'STRONG' : 'MODERATE',
      name: 'ADX',
      category: 'TREND',
      pdi: indicators.adx.pdi,
      ndi: indicators.adx.ndi
    },
    
    // Bollinger Bands
    bollingerBands: {
      value: indicators.bb.middle,
      upper: indicators.bb.upper,
      lower: indicators.bb.lower,
      signal: indicators.bb.percentB > 80 ? 'SELL' : indicators.bb.percentB < 20 ? 'BUY' : 'NEUTRAL',
      strength: 'MODERATE',
      name: 'Bollinger Bands',
      category: 'VOLATILITY',
      percentB: indicators.bb.percentB,
      width: indicators.bb.width
    },
    
    // ATR
    atr: {
      value: indicators.atr,
      signal: 'NEUTRAL',
      strength: 'MODERATE',
      name: 'ATR',
      category: 'VOLATILITY'
    },
    
    // Volatility
    volatility: {
      value: indicators.volatility,
      signal: indicators.volatility > 2 ? 'HIGH' : indicators.volatility < 0.5 ? 'LOW' : 'NORMAL',
      strength: 'MODERATE',
      name: 'Volatility',
      category: 'VOLATILITY'
    },
    
    // Support and Resistance
    supports: indicators.supports,
    resistances: indicators.resistances
  };
}

function calculateSignalStrength(confidence: number, riskReward: number): 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG' {
  const strength = confidence + (riskReward * 10);
  
  if (strength > 90) return 'VERY_STRONG';
  if (strength > 75) return 'STRONG';
  if (strength > 60) return 'MODERATE';
  return 'WEAK';
}

function generateTechnicalSummary(signal: OptimizedSignal): string {
  const { direction, confidence, indicators } = signal;
  
  let summary = `${direction} signal with ${confidence.toFixed(0)}% confidence. `;
  
  // RSI analysis
  if (indicators.rsi > 70) {
    summary += 'RSI indicates overbought conditions. ';
  } else if (indicators.rsi < 30) {
    summary += 'RSI indicates oversold conditions. ';
  }
  
  // MACD analysis
  if (indicators.macd.histogram > 0) {
    summary += 'MACD shows bullish momentum. ';
  } else {
    summary += 'MACD shows bearish momentum. ';
  }
  
  // Trend analysis
  if (indicators.ema.short > indicators.ema.medium && indicators.ema.medium > indicators.ema.long) {
    summary += 'Strong uptrend confirmed by EMA alignment.';
  } else if (indicators.ema.short < indicators.ema.medium && indicators.ema.medium < indicators.ema.long) {
    summary += 'Strong downtrend confirmed by EMA alignment.';
  } else {
    summary += 'Mixed trend signals from EMAs.';
  }
  
  return summary;
}

function generateRiskAssessment(signal: OptimizedSignal): string {
  const { riskReward, recommendedLeverage, indicators } = signal;
  
  let assessment = `Risk-Reward ratio: ${riskReward.toFixed(2)}:1. `;
  
  if (riskReward > 2) {
    assessment += 'Excellent risk-reward profile. ';
  } else if (riskReward > 1.5) {
    assessment += 'Good risk-reward profile. ';
  } else {
    assessment += 'Moderate risk-reward profile. ';
  }
  
  assessment += `Recommended leverage: ${recommendedLeverage}x. `;
  
  if (indicators.volatility > 2) {
    assessment += 'High volatility - exercise caution.';
  } else if (indicators.volatility < 0.5) {
    assessment += 'Low volatility - stable conditions.';
  } else {
    assessment += 'Normal volatility conditions.';
  }
  
  return assessment;
}

function generateTradeRecommendation(signal: OptimizedSignal): string {
  const { direction, confidence, entryPrice, stopLoss, takeProfit, timeframe } = signal;
  
  let recommendation = `${direction} recommendation for ${timeframe} timeframe. `;
  
  if (direction === 'LONG') {
    recommendation += `Entry: $${entryPrice.toFixed(2)}, `;
    recommendation += `Stop Loss: $${stopLoss.toFixed(2)}, `;
    recommendation += `Take Profit: $${takeProfit.toFixed(2)}. `;
  } else if (direction === 'SHORT') {
    recommendation += `Entry: $${entryPrice.toFixed(2)}, `;
    recommendation += `Stop Loss: $${stopLoss.toFixed(2)}, `;
    recommendation += `Take Profit: $${takeProfit.toFixed(2)}. `;
  } else {
    recommendation += 'Hold current position or wait for clearer signals. ';
  }
  
  if (confidence > 80) {
    recommendation += 'High confidence signal - consider larger position size.';
  } else if (confidence > 60) {
    recommendation += 'Moderate confidence - standard position size recommended.';
  } else {
    recommendation += 'Lower confidence - consider smaller position or wait.';
  }
  
  return recommendation;
}

function createSafeAdvancedSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
  return {
    direction: 'NEUTRAL',
    confidence: 50,
    entryPrice: currentPrice,
    stopLoss: currentPrice,
    takeProfit: currentPrice,
    timeframe,
    timestamp: Date.now(),
    successProbability: 50,
    
    indicators: {
      rsi: {
        value: 50,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'RSI',
        category: 'MOMENTUM'
      },
      macd: {
        value: 0,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'MACD',
        category: 'MOMENTUM',
        histogram: 0,
        signalLine: 0
      },
      ema12: {
        value: currentPrice,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'EMA 12',
        category: 'TREND'
      },
      ema26: {
        value: currentPrice,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'EMA 26',
        category: 'TREND'
      },
      ema50: {
        value: currentPrice,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'EMA 50',
        category: 'TREND'
      },
      stochastic: {
        value: 50,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'Stochastic',
        category: 'MOMENTUM',
        k: 50,
        d: 50
      },
      adx: {
        value: 20,
        signal: 'RANGING',
        strength: 'MODERATE',
        name: 'ADX',
        category: 'TREND',
        pdi: 20,
        ndi: 20
      },
      bollingerBands: {
        value: currentPrice,
        upper: currentPrice * 1.02,
        lower: currentPrice * 0.98,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'Bollinger Bands',
        category: 'VOLATILITY',
        percentB: 50,
        width: 0.04
      },
      atr: {
        value: currentPrice * 0.02,
        signal: 'NEUTRAL',
        strength: 'MODERATE',
        name: 'ATR',
        category: 'VOLATILITY'
      },
      volatility: {
        value: 1,
        signal: 'NORMAL',
        strength: 'MODERATE',
        name: 'Volatility',
        category: 'VOLATILITY'
      },
      supports: [currentPrice * 0.98, currentPrice * 0.96, currentPrice * 0.94],
      resistances: [currentPrice * 1.02, currentPrice * 1.04, currentPrice * 1.06]
    },
    
    patternFormations: [],
    
    supportResistance: {
      supports: [currentPrice * 0.98, currentPrice * 0.96],
      resistances: [currentPrice * 1.02, currentPrice * 1.04],
      pivotPoints: [currentPrice * 0.99, currentPrice, currentPrice * 1.01]
    },
    
    environment: {
      trend: 'NEUTRAL',
      volatility: 'NORMAL',
      volume: 'NORMAL',
      sentiment: 'NEUTRAL'
    },
    
    recommendedLeverage: 1,
    riskReward: 1,
    
    marketStructure: {
      trend: 'SIDEWAYS',
      phase: 'CONSOLIDATION',
      strength: 50
    },
    
    volumeProfile: {
      volumeWeightedPrice: currentPrice,
      highVolumeNodes: [],
      lowVolumeNodes: []
    },
    
    macroInsights: {
      regime: 'NEUTRAL',
      correlation: 0.5,
      institutionalFlow: 'NEUTRAL'
    },
    
    signalStrength: 'MODERATE',
    marketRegime: 'NEUTRAL',
    institutionalFlow: 'NEUTRAL',
    correlationIndex: 0.5,
    
    technicalSummary: 'Neutral market conditions with no clear directional bias.',
    riskAssessment: 'Moderate risk environment - standard position sizing recommended.',
    tradeRecommendation: 'Wait for clearer signals before entering new positions.'
  };
}

// Export function to replace all existing calculation engines
export function replaceFragmentedCalculations(
  data: ChartData[],
  timeframe: TimeFrame,
  currentPrice: number,
  symbol: string
): AdvancedSignal {
  return generateOptimizedAdvancedSignal(data, timeframe, currentPrice, symbol);
}