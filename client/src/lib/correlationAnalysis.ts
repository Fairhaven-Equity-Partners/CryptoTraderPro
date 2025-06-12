/**
 * Correlation Analysis for Technical Indicators
 * Analyzes relationships between different indicators to improve signal accuracy
 */

import { Indicator } from '../types';

export interface CorrelationResult {
  strength: number; // -1 to 1
  confidence: number; // 0-100
  convergence: 'STRONG' | 'MODERATE' | 'WEAK' | 'DIVERGENT';
  description: string;
}

export interface IndicatorCorrelation {
  indicators: string[];
  correlation: number;
  significance: number;
  marketSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

/**
 * Calculate correlation coefficient between two indicator arrays
 */
function calculateCorrelation(values1: number[], values2: number[]): number {
  if (values1.length !== values2.length || values1.length < 2) return 0;
  
  const n = values1.length;
  const sum1 = values1.reduce((a, b) => a + b, 0);
  const sum2 = values2.reduce((a, b) => a + b, 0);
  const sum1Sq = values1.reduce((a, b) => a + b * b, 0);
  const sum2Sq = values2.reduce((a, b) => a + b * b, 0);
  const pSum = values1.reduce((sum, val, i) => sum + val * values2[i], 0);
  
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  
  return den === 0 ? 0 : num / den;
}

/**
 * Analyze convergence/divergence between multiple indicators
 */
export function analyzeIndicatorConvergence(indicators: Indicator[]): CorrelationResult {
  if (indicators.length < 2) {
    return {
      strength: 0,
      confidence: 0,
      convergence: 'WEAK',
      description: 'Insufficient indicators for correlation analysis'
    };
  }

  // Group indicators by signal direction
  const bullishIndicators = indicators.filter(ind => ind.signal === 'BUY');
  const bearishIndicators = indicators.filter(ind => ind.signal === 'SELL');
  const neutralIndicators = indicators.filter(ind => ind.signal === 'NEUTRAL');

  const totalIndicators = indicators.length;
  const bullishPercent = (bullishIndicators.length / totalIndicators) * 100;
  const bearishPercent = (bearishIndicators.length / totalIndicators) * 100;
  const neutralPercent = (neutralIndicators.length / totalIndicators) * 100;

  // Calculate convergence strength
  let convergenceStrength = 0;
  let convergenceType: 'STRONG' | 'MODERATE' | 'WEAK' | 'DIVERGENT' = 'WEAK';
  let description = '';

  if (bullishPercent >= 70) {
    convergenceStrength = bullishPercent / 100;
    convergenceType = bullishPercent >= 85 ? 'STRONG' : 'MODERATE';
    description = `Strong bullish convergence: ${bullishPercent.toFixed(1)}% of indicators agre`e`;
  } else if (bearishPercent >= 70) {
    convergenceStrength = -(bearishPercent / 100);
    convergenceType = bearishPercent >= 85 ? 'STRONG' : 'MODERATE';
    description = `Strong bearish convergence: ${bearishPercent.toFixed(1)}% of indicators agre`e`;
  } else if (Math.max(bullishPercent, bearishPercent, neutralPercent) < 50) {
    convergenceStrength = 0;
    convergenceType = 'DIVERGENT';
    description = `Divergent signals: No clear consensus among indicators`;
  } else {
    const dominantPercent = Math.max(bullishPercent, bearishPercent, neutralPercent);
    convergenceStrength = (dominantPercent - 50) / 100; // Scale relative to 50%
    convergenceType = 'WEAK';
    description = `Weak convergence: ${dominantPercent.toFixed(1)}% plurality agreemen`t`;
  }

  // Calculate confidence based on indicator quality and convergence
  const averageStrength = indicators.reduce((sum, ind) => {
    const strengthValue = ind.strength === 'STRONG' ? 1 : ind.strength === 'MODERATE' ? 0.7 : 0.4;
    return sum + strengthValue;
  }, 0) / indicators.length;

  const confidence = Math.min(100, Math.abs(convergenceStrength) * 100 * averageStrength * 1.2);

  return {
    strength: convergenceStrength,
    confidence: Math.round(confidence),
    convergence: convergenceType,
    description
  };
}

/**
 * Analyze specific indicator pairs for correlation patterns
 */
export function analyzeIndicatorPairs(indicators: Indicator[]): IndicatorCorrelation[] {
  const correlations: IndicatorCorrelation[] = [];
  
  // Key indicator relationships to analyze
  const importantPairs = [
    ['RSI', 'MACD'], // Momentum convergence
    ['SMA', 'EMA'], // Trend alignment
    ['Bollinger Bands', 'ATR'], // Volatility relationship
    ['Volume', 'Price'], // Volume-price relationship
    ['Support', 'Resistance'] // S/R level confirmation
  ];

  for (const [ind1Name, ind2Name] of importantPairs) {
    const ind1 = indicators.find(i => i.name.includes(ind1Name));
    const ind2 = indicators.find(i => i.name.includes(ind2Name));

    if (ind1 && ind2) {
      // Convert signals to numeric values for correlation
      const getValue = (signal: string) => signal === 'BUY' ? 1 : signal === 'SELL' ? -1 : 0;
      const val1 = getValue(ind1.signal);
      const val2 = getValue(ind2.signal);
      
      // Simple correlation based on signal agreement
      const correlation = val1 === val2 ? 1 : val1 * val2 === -1 ? -1 : 0;
      
      let marketSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      if (correlation > 0 && val1 > 0) marketSignal = 'BULLISH';
      else if (correlation > 0 && val1 < 0) marketSignal = 'BEARISH';
      
      correlations.push({
        indicators: [ind1Name, ind2Name],
        correlation,
        significance: Math.abs(correlation) * 100,
        marketSignal
      });
    }
  }

  return correlations;
}

/**
 * Calculate enhanced confidence score using correlation analysis
 */
export function calculateEnhancedConfidence(
  baseConfidence: number,
  convergence: CorrelationResult,
  correlations: IndicatorCorrelation[]
): number {
  let enhancedConfidence = baseConfidence;

  // Apply convergence bonus/penalty
  if (convergence.convergence === 'STRONG') {
    enhancedConfidence += 15;
  } else if (convergence.convergence === 'MODERATE') {
    enhancedConfidence += 8;
  } else if (convergence.convergence === 'DIVERGENT') {
    enhancedConfidence -= 10;
  }

  // Apply correlation bonuses
  const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.7);
  const correlationBonus = Math.min(10, strongCorrelations.length * 3);
  enhancedConfidence += correlationBonus;

  // Cap between 0 and 100
  return Math.max(0, Math.min(100, Math.round(enhancedConfidence)));
}

/**
 * Generate correlation insights for display
 */
export function generateCorrelationInsights(
  convergence: CorrelationResult,
  correlations: IndicatorCorrelation[]
): string[] {
  const insights: string[] = [];

  // Add convergence insight
  insights.push(convergence.description);

  // Add correlation insights
  const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.7);
  if (strongCorrelations.length > 0) {
    insights.push(`Strong correlation detected between ${strongCorrelations.length} indicator pair`s`);
  }

  const divergentPairs = correlations.filter(c => c.correlation < -0.5);
  if (divergentPairs.length > 0) {
    insights.push(`Warning: Conflicting signals detected in ${divergentPairs.length} indicator pair`s`);
  }

  // Add specific insights for key correlations
  const momentumCorr = correlations.find(c => 
    c.indicators.includes('RSI') && c.indicators.includes('MACD')
  );
  if (momentumCorr && Math.abs(momentumCorr.correlation) > 0.7) {
    insights.push(`Momentum indicators ${momentumCorr.correlation > 0 ? 'confirm' : 'contradict'} each othe`r`);
  }

  return insights;
}