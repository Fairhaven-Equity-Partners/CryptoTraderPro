/**
 * ENHANCED CONFLUENCE ANALYSIS ENGINE
 * Advanced multi-factor confluence scoring with market regime adaptation
 * Replaces random components with authentic market-driven analysis
 */

import { BigNumber } from 'bignumber.js';
import { MarketRegimeDetector, MarketRegime } from './marketRegimeDetector.js';
import { AdaptiveWeightManager } from './adaptiveWeightManager.js';

interface TechnicalIndicators {
  rsi: { value: number; signal: string };
  macd: { macdLine: number; signalLine: number; histogram: number; signal: string };
  bollingerBands: { upper: number; middle: number; lower: number; signal: string };
  stochastic: { k: number; d: number; signal: string };
  sma: { value: number; signal: string };
  ema: { value: number; signal: string };
  atr: { value: number };
  volume: { current: number; average: number; ratio: number };
}

interface PatternAnalysis {
  patterns: Array<{
    type: string;
    strength: number;
    signal: string;
    confidence: number;
  }>;
  dominantPattern: string;
  overallBias: string;
}

interface ConfluenceResult {
  score: number;
  breakdown: {
    indicatorAgreement: number;
    patternStrength: number;
    volumeConfirmation: number;
    marketRegimeAlignment: number;
    historicalAccuracy: number;
  };
  reasoning: string[];
  confidence: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  strength: number;
}

export class ConfluenceAnalysisEngine {
  private regimeDetector: MarketRegimeDetector;
  private weightManager: AdaptiveWeightManager;
  private historicalAccuracyCache: Map<string, number> = new Map();

  constructor() {
    this.regimeDetector = new MarketRegimeDetector();
    this.weightManager = new AdaptiveWeightManager();
  }

  /**
   * Calculate advanced confluence score with market regime adaptation
   */
  public calculateAdvancedConfluence(
    indicators: TechnicalIndicators,
    patterns: PatternAnalysis,
    priceData: any[],
    symbol: string,
    timeframe: string
  ): ConfluenceResult {
    // Detect current market regime
    const regimeAnalysis = this.regimeDetector.detectRegime(priceData, timeframe);
    
    // Get adaptive weights for current market conditions
    const adaptiveWeights = this.weightManager.getCurrentWeights();
    const regimeMultipliers = this.regimeDetector.getRegimeMultipliers(regimeAnalysis.regime);
    
    // Calculate individual confluence components
    const indicatorAgreement = this.calculateIndicatorAgreement(indicators, adaptiveWeights, regimeMultipliers);
    const patternStrength = this.calculatePatternStrength(patterns, indicators);
    const volumeConfirmation = this.calculateVolumeConfirmation(indicators.volume, indicatorAgreement.direction);
    const marketRegimeAlignment = this.calculateRegimeAlignment(regimeAnalysis, indicatorAgreement.direction);
    const historicalAccuracy = this.getHistoricalAccuracy(symbol, timeframe);
    
    // Calculate weighted confluence score
    const confluenceScore = this.calculateWeightedConfluence({
      indicatorAgreement: indicatorAgreement.score,
      patternStrength,
      volumeConfirmation,
      marketRegimeAlignment,
      historicalAccuracy
    });
    
    // Determine overall direction and strength
    const { direction, strength } = this.determineDirectionAndStrength(
      indicatorAgreement,
      patterns,
      confluenceScore
    );
    
    // Generate reasoning
    const reasoning = this.generateConfluenceReasoning(
      indicatorAgreement,
      patterns,
      regimeAnalysis,
      confluenceScore
    );
    
    // Calculate final confidence
    const confidence = this.calculateFinalConfidence(confluenceScore, regimeAnalysis.confidence);

    return {
      score: confluenceScore,
      breakdown: {
        indicatorAgreement: indicatorAgreement.score,
        patternStrength,
        volumeConfirmation,
        marketRegimeAlignment,
        historicalAccuracy
      },
      reasoning,
      confidence,
      direction,
      strength
    };
  }

  /**
   * Calculate indicator agreement with adaptive weights
   */
  private calculateIndicatorAgreement(
    indicators: TechnicalIndicators,
    weights: any,
    regimeMultipliers: Record<string, number>
  ): { score: number; direction: 'LONG' | 'SHORT' | 'NEUTRAL'; contributions: Record<string, number> } {
    const indicatorScores: Record<string, { score: number; direction: string }> = {};
    
    // RSI Analysis
    const rsiScore = this.analyzeRSI(indicators.rsi);
    indicatorScores.RSI = rsiScore;
    
    // MACD Analysis
    const macdScore = this.analyzeMacd(indicators.macd);
    indicatorScores.MACD = macdScore;
    
    // Bollinger Bands Analysis
    const bbScore = this.analyzeBollingerBands(indicators.bollingerBands);
    indicatorScores.BOLLINGER_BANDS = bbScore;
    
    // Stochastic Analysis
    const stochScore = this.analyzeStochastic(indicators.stochastic);
    indicatorScores.STOCHASTIC = stochScore;
    
    // Moving Average Analysis
    const smaScore = this.analyzeSMA(indicators.sma);
    indicatorScores.SMA = smaScore;
    
    const emaScore = this.analyzeEMA(indicators.ema);
    indicatorScores.EMA_CONVERGENCE = emaScore;
    
    // Calculate weighted agreement
    let bullishWeight = 0;
    let bearishWeight = 0;
    let totalWeight = 0;
    const contributions: Record<string, number> = {};
    
    Object.entries(indicatorScores).forEach(([indicator, analysis]) => {
      const baseWeight = weights[indicator] || 0.1;
      const regimeAdjustment = regimeMultipliers[indicator] || 1.0;
      const finalWeight = baseWeight * regimeAdjustment;
      
      contributions[indicator] = finalWeight * Math.abs(analysis.score);
      
      if (analysis.direction === 'BULLISH') {
        bullishWeight += finalWeight * analysis.score;
      } else if (analysis.direction === 'BEARISH') {
        bearishWeight += finalWeight * Math.abs(analysis.score);
      }
      
      totalWeight += finalWeight;
    });
    
    const netScore = (bullishWeight - bearishWeight) / totalWeight;
    const agreementStrength = Math.abs(netScore);
    
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL';
    if (netScore > 0.15) {
      direction = 'LONG';
    } else if (netScore < -0.15) {
      direction = 'SHORT';
    } else {
      direction = 'NEUTRAL';
    }
    
    return {
      score: agreementStrength,
      direction,
      contributions
    };
  }

  /**
   * Individual indicator analysis methods
   */
  private analyzeRSI(rsi: { value: number; signal: string }): { score: number; direction: string } {
    const value = rsi.value;
    
    if (value <= 30) {
      return { score: Math.min(0.9, (30 - value) / 30), direction: 'BULLISH' };
    } else if (value >= 70) {
      return { score: Math.min(0.9, (value - 70) / 30), direction: 'BEARISH' };
    } else if (value < 45) {
      return { score: (45 - value) / 15 * 0.3, direction: 'BULLISH' };
    } else if (value > 55) {
      return { score: (value - 55) / 15 * 0.3, direction: 'BEARISH' };
    }
    
    return { score: 0.1, direction: 'NEUTRAL' };
  }

  private analyzeMacd(macd: { macdLine: number; signalLine: number; histogram: number; signal: string }): { score: number; direction: string } {
    const { macdLine, signalLine, histogram } = macd;
    
    // MACD line above/below signal line
    const crossover = macdLine - signalLine;
    const histogramTrend = histogram;
    
    let score = 0;
    let direction = 'NEUTRAL';
    
    if (crossover > 0 && histogramTrend > 0) {
      score = Math.min(0.9, Math.abs(crossover) * 10 + Math.abs(histogramTrend) * 5);
      direction = 'BULLISH';
    } else if (crossover < 0 && histogramTrend < 0) {
      score = Math.min(0.9, Math.abs(crossover) * 10 + Math.abs(histogramTrend) * 5);
      direction = 'BEARISH';
    } else {
      score = Math.abs(crossover) * 5;
      direction = crossover > 0 ? 'BULLISH' : 'BEARISH';
    }
    
    return { score, direction };
  }

  private analyzeBollingerBands(bb: { upper: number; middle: number; lower: number; signal: string }): { score: number; direction: string } {
    // This would need current price - using signal as proxy
    const signal = bb.signal;
    
    if (signal.includes('BREAKOUT_UP')) {
      return { score: 0.8, direction: 'BULLISH' };
    } else if (signal.includes('BREAKOUT_DOWN')) {
      return { score: 0.8, direction: 'BEARISH' };
    } else if (signal.includes('OVERSOLD')) {
      return { score: 0.6, direction: 'BULLISH' };
    } else if (signal.includes('OVERBOUGHT')) {
      return { score: 0.6, direction: 'BEARISH' };
    }
    
    return { score: 0.2, direction: 'NEUTRAL' };
  }

  private analyzeStochastic(stoch: { k: number; d: number; signal: string }): { score: number; direction: string } {
    const { k, d } = stoch;
    
    if (k <= 20 && d <= 20 && k > d) {
      return { score: 0.7, direction: 'BULLISH' };
    } else if (k >= 80 && d >= 80 && k < d) {
      return { score: 0.7, direction: 'BEARISH' };
    } else if (k < 30) {
      return { score: 0.4, direction: 'BULLISH' };
    } else if (k > 70) {
      return { score: 0.4, direction: 'BEARISH' };
    }
    
    return { score: 0.1, direction: 'NEUTRAL' };
  }

  private analyzeSMA(sma: { value: number; signal: string }): { score: number; direction: string } {
    const signal = sma.signal;
    
    if (signal === 'BULLISH') {
      return { score: 0.6, direction: 'BULLISH' };
    } else if (signal === 'BEARISH') {
      return { score: 0.6, direction: 'BEARISH' };
    }
    
    return { score: 0.2, direction: 'NEUTRAL' };
  }

  private analyzeEMA(ema: { value: number; signal: string }): { score: number; direction: string } {
    const signal = ema.signal;
    
    if (signal === 'BULLISH') {
      return { score: 0.7, direction: 'BULLISH' };
    } else if (signal === 'BEARISH') {
      return { score: 0.7, direction: 'BEARISH' };
    }
    
    return { score: 0.2, direction: 'NEUTRAL' };
  }

  /**
   * Calculate pattern strength contribution
   */
  private calculatePatternStrength(patterns: PatternAnalysis, indicators: TechnicalIndicators): number {
    if (!patterns.patterns || patterns.patterns.length === 0) {
      return 0.1;
    }

    // Weight patterns by type and alignment with indicators
    let totalStrength = 0;
    let patternCount = 0;

    patterns.patterns.forEach(pattern => {
      const patternWeight = this.getPatternWeight(pattern.type);
      const strengthComponent = (pattern.strength / 100) * patternWeight;
      
      totalStrength += strengthComponent;
      patternCount++;
    });

    return Math.min(0.9, totalStrength / Math.max(1, patternCount));
  }

  /**
   * Calculate volume confirmation
   */
  private calculateVolumeConfirmation(volume: { current: number; average: number; ratio: number }, direction: string): number {
    const volumeRatio = volume.ratio;
    
    if (direction === 'NEUTRAL') {
      return 0.5;
    }
    
    // Strong volume confirmation for directional moves
    if (volumeRatio > 1.5) {
      return 0.9;
    } else if (volumeRatio > 1.2) {
      return 0.7;
    } else if (volumeRatio > 1.0) {
      return 0.6;
    } else {
      return 0.3; // Weak volume for directional move is concerning
    }
  }

  /**
   * Calculate market regime alignment
   */
  private calculateRegimeAlignment(regimeAnalysis: any, direction: string): number {
    const { regime, confidence } = regimeAnalysis;
    
    if (direction === 'NEUTRAL') {
      return regime === MarketRegime.SIDEWAYS ? 0.8 : 0.5;
    }
    
    let alignment = 0.5;
    
    if (direction === 'LONG' && regime === MarketRegime.BULL_TREND) {
      alignment = 0.9;
    } else if (direction === 'SHORT' && regime === MarketRegime.BEAR_TREND) {
      alignment = 0.9;
    } else if (regime === MarketRegime.HIGH_VOLATILITY) {
      alignment = 0.4; // Reduced confidence in volatile markets
    } else if (regime === MarketRegime.LOW_VOLATILITY) {
      alignment = 0.7; // Moderate confidence in stable markets
    }
    
    return alignment * confidence;
  }

  /**
   * Get historical accuracy for symbol/timeframe combination
   */
  private getHistoricalAccuracy(symbol: string, timeframe: string): number {
    const key = `${symbol}_${timeframe}`;
    return this.historicalAccuracyCache.get(key) || 0.65; // Default baseline accuracy
  }

  /**
   * Calculate weighted confluence score
   */
  private calculateWeightedConfluence(components: {
    indicatorAgreement: number;
    patternStrength: number;
    volumeConfirmation: number;
    marketRegimeAlignment: number;
    historicalAccuracy: number;
  }): number {
    // Research-based confluence weights
    const weights = {
      indicatorAgreement: 0.35,     // Primary component
      patternStrength: 0.25,        // Pattern confirmation
      volumeConfirmation: 0.20,     // Volume validation
      marketRegimeAlignment: 0.12,  // Market context
      historicalAccuracy: 0.08      // Historical performance
    };

    const score = (
      components.indicatorAgreement * weights.indicatorAgreement +
      components.patternStrength * weights.patternStrength +
      components.volumeConfirmation * weights.volumeConfirmation +
      components.marketRegimeAlignment * weights.marketRegimeAlignment +
      components.historicalAccuracy * weights.historicalAccuracy
    );

    return Math.min(0.95, Math.max(0.05, score));
  }

  /**
   * Determine overall direction and strength
   */
  private determineDirectionAndStrength(
    indicatorAgreement: any,
    patterns: PatternAnalysis,
    confluenceScore: number
  ): { direction: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number } {
    let direction = indicatorAgreement.direction;
    
    // Pattern override for strong reversal patterns
    if (patterns.overallBias === 'BULLISH' && confluenceScore > 0.7) {
      direction = 'LONG';
    } else if (patterns.overallBias === 'BEARISH' && confluenceScore > 0.7) {
      direction = 'SHORT';
    }
    
    const strength = confluenceScore * 100;
    
    return { direction, strength };
  }

  /**
   * Generate confluence reasoning
   */
  private generateConfluenceReasoning(
    indicatorAgreement: any,
    patterns: PatternAnalysis,
    regimeAnalysis: any,
    confluenceScore: number
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Indicator consensus: ${(indicatorAgreement.score * 100).toFixed(1)}% agreement`);
    
    if (patterns.patterns.length > 0) {
      reasoning.push(`Pattern analysis: ${patterns.patterns.length} patterns detected`);
    }
    
    reasoning.push(`Market regime: ${regimeAnalysis.regime} (${(regimeAnalysis.confidence * 100).toFixed(1)}% confidence)`);
    
    if (confluenceScore > 0.8) {
      reasoning.push('Strong confluence across multiple factors');
    } else if (confluenceScore > 0.6) {
      reasoning.push('Moderate confluence supporting signal');
    } else {
      reasoning.push('Weak confluence - proceed with caution');
    }
    
    return reasoning;
  }

  /**
   * Calculate final confidence
   */
  private calculateFinalConfidence(confluenceScore: number, regimeConfidence: number): number {
    return Math.min(95, (confluenceScore * 0.8 + regimeConfidence * 0.2) * 100);
  }

  /**
   * Get pattern weight based on type
   */
  private getPatternWeight(patternType: string): number {
    const weights: Record<string, number> = {
      'trend_continuation': 0.28,
      'engulfing_pattern': 0.22,
      'bollinger_breakout': 0.24,
      'support_resistance_break': 0.26,
      'flag_pennant': 0.20,
      'doji_reversal': 0.18,
      'hammer_hanging_man': 0.16
    };
    
    return weights[patternType] || 0.15;
  }
}