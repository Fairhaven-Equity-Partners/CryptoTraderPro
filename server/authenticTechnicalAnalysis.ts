/**
 * Authentic Technical Analysis Engine
 * Replaces authentic calculations with authentic market data analysis
 * Uses accumulated real price history for legitimate technical indicators
 */

import { enhancedPriceStreamer } from './enhancedPriceStreamer';

interface AuthenticIndicatorResult {
  value: number;
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
  timespan: string;
  source: 'authentic' | 'insufficient_data';
}

interface AuthenticTechnicalAnalysis {
  symbol: string;
  timestamp: number;
  dataQuality: {
    quality: string;
    pointCount: number;
    isReady: boolean;
    recommendedAnalysis: string[];
  };
  indicators: {
    rsi?: AuthenticIndicatorResult;
    macd?: AuthenticIndicatorResult;
    bollingerBands?: AuthenticIndicatorResult;
    sma?: AuthenticIndicatorResult;
    ema?: AuthenticIndicatorResult;
    stochastic?: AuthenticIndicatorResult;
    adx?: AuthenticIndicatorResult;
    volumeTrend?: AuthenticIndicatorResult;
  };
  patterns: string[];
  signals: {
    action: 'BUY' | 'SELL' | 'HOLD';
    strength: number;
    confidence: number;
    reasoning: string[];
  };
}

export class AuthenticTechnicalAnalysisEngine {
  private readonly MIN_POINTS_BASIC = 20;
  private readonly MIN_POINTS_GOOD = 50;
  private readonly MIN_POINTS_EXCELLENT = 100;

  constructor() {
    console.log('[AuthenticTA] Authentic Technical Analysis Engine initialized');
  }

  /**
   * Generate authentic technical analysis for a symbol
   */
  async generateAnalysis(symbol: string, timeframe: string = '1d'): Promise<AuthenticTechnicalAnalysis> {
    const dataQuality = enhancedPriceStreamer.getDataQuality(symbol);
    const priceHistory = enhancedPriceStreamer.getAuthenticPriceHistory(symbol);
    
    if (!priceHistory || !dataQuality.isReady) {
      return this.generateInsufficientDataResponse(symbol, dataQuality);
    }

    const authenticPrices = enhancedPriceStreamer.getAuthenticPrices(symbol, 100);
    const volumeData = priceHistory.pricePoints.map(p => p.volume24h);

    console.log(`[AuthenticTA] Analyzing ${symbol} with ${authenticPrices.length} authentic data points`);

    const indicators = await this.calculateAuthenticIndicators(
      authenticPrices, 
      volumeData, 
      dataQuality.pointCount
    );

    const patterns = this.detectAuthenticPatterns(authenticPrices);
    const signals = this.generateAuthenticSignals(indicators, patterns, dataQuality.pointCount);

    return {
      symbol,
      timestamp: Date.now(),
      dataQuality,
      indicators,
      patterns,
      signals
    };
  }

  /**
   * Calculate authentic technical indicators using real market data
   */
  private async calculateAuthenticIndicators(
    prices: number[], 
    volumes: number[], 
    dataPoints: number
  ): Promise<AuthenticTechnicalAnalysis['indicators']> {
    const indicators: AuthenticTechnicalAnalysis['indicators'] = {};

    // RSI - Relative Strength Index (requires 14+ periods)
    if (prices.length >= 14) {
      indicators.rsi = this.calculateAuthenticRSI(prices);
    }

    // Simple Moving Average (requires 20+ periods for reliability)
    if (prices.length >= 20) {
      indicators.sma = this.calculateAuthenticSMA(prices, 20);
    }

    // Exponential Moving Average (requires 12+ periods)
    if (prices.length >= 12) {
      indicators.ema = this.calculateAuthenticEMA(prices, 12);
    }

    // MACD (requires 26+ periods)
    if (prices.length >= 26) {
      indicators.macd = this.calculateAuthenticMACD(prices);
    }

    // Bollinger Bands (requires 20+ periods)
    if (prices.length >= 20) {
      indicators.bollingerBands = this.calculateAuthenticBollingerBands(prices);
    }

    // Stochastic Oscillator (requires 14+ periods)
    if (prices.length >= 14) {
      indicators.stochastic = this.calculateAuthenticStochastic(prices);
    }

    // Volume Trend (requires volume data)
    if (volumes.length >= 10) {
      indicators.volumeTrend = this.calculateAuthenticVolumeTrend(volumes);
    }

    return indicators;
  }

  /**
   * Calculate authentic RSI using real price movements
   */
  private calculateAuthenticRSI(prices: number[], period: number = 14): AuthenticIndicatorResult {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return {
      value: rsi,
      confidence: this.getConfidenceLevel(prices.length, period * 2),
      dataPoints: prices.length,
      timespan: `${period} periods`,
      source: 'authentic'
    };
  }

  /**
   * Calculate authentic Simple Moving Average
   */
  private calculateAuthenticSMA(prices: number[], period: number = 20): AuthenticIndicatorResult {
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;

    return {
      value: sma,
      confidence: this.getConfidenceLevel(prices.length, period),
      dataPoints: prices.length,
      timespan: `${period} periods`,
      source: 'authentic'
    };
  }

  /**
   * Calculate authentic Exponential Moving Average
   */
  private calculateAuthenticEMA(prices: number[], period: number = 12): AuthenticIndicatorResult {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return {
      value: ema,
      confidence: this.getConfidenceLevel(prices.length, period),
      dataPoints: prices.length,
      timespan: `${period} periods`,
      source: 'authentic'
    };
  }

  /**
   * Calculate authentic MACD using real price data
   */
  private calculateAuthenticMACD(prices: number[]): AuthenticIndicatorResult {
    const ema12 = this.calculateAuthenticEMA(prices, 12).value;
    const ema26 = this.calculateAuthenticEMA(prices, 26).value;
    const macd = ema12 - ema26;

    return {
      value: macd,
      confidence: this.getConfidenceLevel(prices.length, 26),
      dataPoints: prices.length,
      timespan: '12/26 EMA',
      source: 'authentic'
    };
  }

  /**
   * Calculate authentic Bollinger Bands
   */
  private calculateAuthenticBollingerBands(prices: number[], period: number = 20): AuthenticIndicatorResult {
    const sma = this.calculateAuthenticSMA(prices, period).value;
    const recentPrices = prices.slice(-period);
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    const upperBand = sma + (2 * stdDev);
    const lowerBand = sma - (2 * stdDev);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate position within bands (0-100%)
    const position = ((currentPrice - lowerBand) / (upperBand - lowerBand)) * 100;

    return {
      value: Math.max(0, Math.min(100, position)),
      confidence: this.getConfidenceLevel(prices.length, period),
      dataPoints: prices.length,
      timespan: `${period} periods`,
      source: 'authentic'
    };
  }

  /**
   * Calculate authentic Stochastic Oscillator
   */
  private calculateAuthenticStochastic(prices: number[], period: number = 14): AuthenticIndicatorResult {
    const recentPrices = prices.slice(-period);
    const currentPrice = prices[prices.length - 1];
    const lowestLow = Math.min(...recentPrices);
    const highestHigh = Math.max(...recentPrices);

    const stochastic = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;

    return {
      value: stochastic,
      confidence: this.getConfidenceLevel(prices.length, period),
      dataPoints: prices.length,
      timespan: `${period} periods`,
      source: 'authentic'
    };
  }

  /**
   * Calculate authentic volume trend
   */
  private calculateAuthenticVolumeTrend(volumes: number[]): AuthenticIndicatorResult {
    if (volumes.length < 2) {
      return {
        value: 50,
        confidence: 'low',
        dataPoints: volumes.length,
        timespan: 'insufficient data',
        source: 'authentic'
      };
    }

    const recentVolumes = volumes.slice(-10);
    const avgRecentVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    const volumeRatio = currentVolume / avgRecentVolume;
    const trend = Math.min(100, Math.max(0, volumeRatio * 50));

    return {
      value: trend,
      confidence: this.getConfidenceLevel(volumes.length, 5),
      dataPoints: volumes.length,
      timespan: '10 period average',
      source: 'authentic'
    };
  }

  /**
   * Detect authentic patterns in price data
   */
  private detectAuthenticPatterns(prices: number[]): string[] {
    const patterns: string[] = [];

    if (prices.length < 5) return patterns;

    const recent = prices.slice(-5);
    const trend = this.analyzeTrend(recent);

    if (trend.direction === 'up' && trend.strength > 0.7) {
      patterns.push('UPTREND');
    } else if (trend.direction === 'down' && trend.strength > 0.7) {
      patterns.push('DOWNTREND');
    } else {
      patterns.push('SIDEWAYS');
    }

    // Support/Resistance detection
    if (this.detectSupportResistance(prices)) {
      patterns.push('SUPPORT_RESISTANCE');
    }

    return patterns;
  }

  /**
   * Analyze price trend from authentic data
   */
  private analyzeTrend(prices: number[]): { direction: string; strength: number } {
    if (prices.length < 2) return { direction: 'neutral', strength: 0 };

    let upMoves = 0;
    let downMoves = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) upMoves++;
      else if (prices[i] < prices[i - 1]) downMoves++;
    }

    const totalMoves = upMoves + downMoves;
    if (totalMoves === 0) return { direction: 'neutral', strength: 0 };

    const upRatio = upMoves / totalMoves;
    const downRatio = downMoves / totalMoves;

    if (upRatio > 0.6) {
      return { direction: 'up', strength: upRatio };
    } else if (downRatio > 0.6) {
      return { direction: 'down', strength: downRatio };
    } else {
      return { direction: 'neutral', strength: 0.5 };
    }
  }

  /**
   * Detect support/resistance levels
   */
  private detectSupportResistance(prices: number[]): boolean {
    if (prices.length < 10) return false;

    const recent = prices.slice(-10);
    const currentPrice = prices[prices.length - 1];
    const tolerance = 0.02; // 2% tolerance

    // Check if current price is near recent highs or lows
    const recentHigh = Math.max(...recent);
    const recentLow = Math.min(...recent);

    const nearHigh = Math.abs(currentPrice - recentHigh) / recentHigh < tolerance;
    const nearLow = Math.abs(currentPrice - recentLow) / recentLow < tolerance;

    return nearHigh || nearLow;
  }

  /**
   * Generate authentic trading signals
   */
  private generateAuthenticSignals(
    indicators: AuthenticTechnicalAnalysis['indicators'],
    patterns: string[],
    dataPoints: number
  ): AuthenticTechnicalAnalysis['signals'] {
    const signals: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    const reasoning: string[] = [];

    // RSI signals
    if (indicators.rsi) {
      if (indicators.rsi.value < 30) {
        bullishScore += 2;
        reasoning.push(`RSI oversold at ${indicators.rsi.value.toFixed(1)}`);
      } else if (indicators.rsi.value > 70) {
        bearishScore += 2;
        reasoning.push(`RSI overbought at ${indicators.rsi.value.toFixed(1)}`);
      }
    }

    // Bollinger Bands signals
    if (indicators.bollingerBands) {
      if (indicators.bollingerBands.value < 20) {
        bullishScore += 1;
        reasoning.push('Price near lower Bollinger Band');
      } else if (indicators.bollingerBands.value > 80) {
        bearishScore += 1;
        reasoning.push('Price near upper Bollinger Band');
      }
    }

    // MACD signals
    if (indicators.macd) {
      if (indicators.macd.value > 0) {
        bullishScore += 1;
        reasoning.push('MACD positive');
      } else {
        bearishScore += 1;
        reasoning.push('MACD negative');
      }
    }

    // Pattern signals
    if (patterns.includes('UPTREND')) {
      bullishScore += 2;
      reasoning.push('Authentic uptrend detected');
    } else if (patterns.includes('DOWNTREND')) {
      bearishScore += 2;
      reasoning.push('Authentic downtrend detected');
    }

    // Volume confirmation
    if (indicators.volumeTrend && indicators.volumeTrend.value > 60) {
      reasoning.push('Volume supporting move');
    }

    const totalScore = bullishScore + bearishScore;
    const netScore = bullishScore - bearishScore;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let strength = 0;

    if (netScore > 2) {
      action = 'BUY';
      strength = Math.min(100, (netScore / 6) * 100);
    } else if (netScore < -2) {
      action = 'SELL';
      strength = Math.min(100, (Math.abs(netScore) / 6) * 100);
    } else {
      strength = 25;
    }

    // Adjust confidence based on data quality
    const confidence = this.calculateSignalConfidence(dataPoints, totalScore);

    return {
      action,
      strength,
      confidence,
      reasoning
    };
  }

  /**
   * Calculate signal confidence based on data quality
   */
  private calculateSignalConfidence(dataPoints: number, signalStrength: number): number {
    let confidence = 50; // Base confidence

    // Data quality boost
    if (dataPoints >= this.MIN_POINTS_EXCELLENT) {
      confidence += 30;
    } else if (dataPoints >= this.MIN_POINTS_GOOD) {
      confidence += 20;
    } else if (dataPoints >= this.MIN_POINTS_BASIC) {
      confidence += 10;
    }

    // Signal strength boost
    confidence += signalStrength * 5;

    return Math.min(95, Math.max(20, confidence));
  }

  /**
   * Get confidence level for indicators
   */
  private getConfidenceLevel(dataPoints: number, requiredPoints: number): 'low' | 'medium' | 'high' {
    const ratio = dataPoints / requiredPoints;
    
    if (ratio >= 3) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Generate response when insufficient data available
   */
  private generateInsufficientDataResponse(
    symbol: string, 
    dataQuality: any
  ): AuthenticTechnicalAnalysis {
    return {
      symbol,
      timestamp: Date.now(),
      dataQuality: dataQuality || {
        quality: 'insufficient',
        pointCount: 0,
        isReady: false,
        recommendedAnalysis: []
      },
      indicators: {},
      patterns: [],
      signals: {
        action: 'HOLD',
        strength: 0,
        confidence: 0,
        reasoning: ['Insufficient authentic data for reliable analysis']
      }
    };
  }

  /**
   * Get system status
   */
  getSystemStatus() {
    const systemStatus = enhancedPriceStreamer.getAuthenticSystemStatus();
    return {
      authenticAnalysisReady: systemStatus.symbolsReady > 0,
      totalSymbols: systemStatus.totalSymbols,
      readySymbols: systemStatus.symbolsReady,
      dataQuality: systemStatus.averageDataQuality,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const authenticTechnicalAnalysis = new AuthenticTechnicalAnalysisEngine();