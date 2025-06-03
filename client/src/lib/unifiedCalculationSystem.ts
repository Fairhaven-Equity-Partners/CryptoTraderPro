import { TimeFrame, AdvancedSignal, ChartData } from '../types';
import { calculateRSI, calculateMACD, calculateEMA, calculateStochastic, calculateBollingerBands, calculateADX, calculateATR } from './technicalIndicators';
import { TIMEFRAME_MULTIPLIERS, RISK_MULTIPLIERS, SUCCESS_PROBABILITY_ADJUSTMENTS, ALL_TIMEFRAMES } from './optimizedTypes';

export class UnifiedCalculationSystem {
  private static instance: UnifiedCalculationSystem;
  private priceData = new Map<string, Map<TimeFrame, ChartData[]>>();
  private calculationCache = new Map<string, AdvancedSignal>();
  private isCalculating = false;

  static getInstance(): UnifiedCalculationSystem {
    if (!UnifiedCalculationSystem.instance) {
      UnifiedCalculationSystem.instance = new UnifiedCalculationSystem();
    }
    return UnifiedCalculationSystem.instance;
  }

  updatePriceData(symbol: string, timeframe: TimeFrame, data: ChartData[]): void {
    if (!this.priceData.has(symbol)) {
      this.priceData.set(symbol, new Map());
    }
    this.priceData.get(symbol)!.set(timeframe, data);
  }

  async calculateSignalForTimeframe(
    symbol: string,
    timeframe: TimeFrame,
    currentPrice: number
  ): Promise<AdvancedSignal> {
    const cacheKey = `${symbol}-${timeframe}-${Math.floor(currentPrice)}`;
    
    if (this.calculationCache.has(cacheKey)) {
      return this.calculationCache.get(cacheKey)!;
    }

    if (this.isCalculating) {
      return this.createNeutralSignal(symbol, timeframe, currentPrice);
    }

    this.isCalculating = true;

    try {
      const data = this.priceData.get(symbol)?.get(timeframe);
      if (!data || data.length < 50) {
        return this.createNeutralSignal(symbol, timeframe, currentPrice);
      }

      const indicators = this.calculateTechnicalIndicators(data);
      const signal = this.generateSignal(symbol, timeframe, currentPrice, indicators);
      
      this.calculationCache.set(cacheKey, signal);
      this.cleanupCache();

      return signal;
    } finally {
      this.isCalculating = false;
    }
  }

  async calculateAllTimeframes(symbol: string, currentPrice: number): Promise<Record<TimeFrame, AdvancedSignal | null>> {
    const results: Record<TimeFrame, AdvancedSignal | null> = {} as Record<TimeFrame, AdvancedSignal | null>;
    
    for (const timeframe of ALL_TIMEFRAMES) {
      try {
        results[timeframe] = await this.calculateSignalForTimeframe(symbol, timeframe, currentPrice);
      } catch (error) {
        results[timeframe] = this.createNeutralSignal(symbol, timeframe, currentPrice);
      }
    }

    return results;
  }

  private calculateTechnicalIndicators(data: ChartData[]) {
    return {
      rsi: calculateRSI(data, 14),
      macd: calculateMACD(data, 12, 26, 9),
      ema: {
        short: calculateEMA(data, 12),
        medium: calculateEMA(data, 26),
        long: calculateEMA(data, 50)
      },
      stochastic: calculateStochastic(data, 14, 3),
      bb: calculateBollingerBands(data, 20, 2),
      adx: calculateADX(data, 14),
      atr: calculateATR(data, 14)
    };
  }

  private generateSignal(
    symbol: string,
    timeframe: TimeFrame,
    currentPrice: number,
    indicators: any
  ): AdvancedSignal {
    const direction = this.determineDirection(indicators);
    const confidence = this.calculateConfidence(indicators, timeframe);
    const { stopLoss, takeProfit } = this.calculateRiskLevels(currentPrice, indicators, timeframe);
    const successProbability = this.calculateSuccessProbability(confidence, timeframe, direction);

    return {
      direction,
      confidence,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      timeframe,
      timestamp: Date.now(),
      successProbability,
      indicators
    };
  }

  private determineDirection(indicators: any): 'LONG' | 'SHORT' | 'NEUTRAL' {
    let bullishSignals = 0;
    let bearishSignals = 0;

    // RSI analysis (oversold/overbought)
    const rsiValue = indicators.rsi?.value || 50;
    if (rsiValue < 30) bullishSignals += 2;
    else if (rsiValue > 70) bearishSignals += 2;
    else if (rsiValue < 45) bullishSignals += 1;
    else if (rsiValue > 55) bearishSignals += 1;

    // MACD momentum
    const macdHistogram = indicators.macd?.histogram || 0;
    if (macdHistogram > 0) bullishSignals += 2;
    else if (macdHistogram < 0) bearishSignals += 2;

    // EMA trend
    const emaShort = indicators.ema?.short || 0;
    const emaMedium = indicators.ema?.medium || 0;
    const emaLong = indicators.ema?.long || 0;
    
    if (emaShort > emaMedium && emaMedium > emaLong) bullishSignals += 3;
    else if (emaShort < emaMedium && emaMedium < emaLong) bearishSignals += 3;

    // Stochastic oversold/overbought
    const stochK = indicators.stochastic?.k || 50;
    if (stochK < 20) bullishSignals += 1;
    else if (stochK > 80) bearishSignals += 1;

    // ADX trend strength
    const adxValue = indicators.adx?.value || 0;
    const pdi = indicators.adx?.pdi || 0;
    const ndi = indicators.adx?.ndi || 0;
    
    if (adxValue > 25) {
      if (pdi > ndi) bullishSignals += 2;
      else bearishSignals += 2;
    }

    const signalDifference = bullishSignals - bearishSignals;
    if (signalDifference >= 2) return 'LONG';
    if (signalDifference <= -2) return 'SHORT';
    return 'NEUTRAL';
  }

  private calculateConfidence(indicators: any, timeframe: TimeFrame): number {
    let confidence = 50;

    // RSI strength
    const rsiValue = indicators.rsi?.value || 50;
    if (rsiValue < 30 || rsiValue > 70) confidence += 15;
    else if (rsiValue < 40 || rsiValue > 60) confidence += 8;

    // MACD momentum strength
    const macdHistogram = Math.abs(indicators.macd?.histogram || 0);
    if (macdHistogram > 100) confidence += 12;
    else if (macdHistogram > 50) confidence += 8;

    // ADX trend strength
    const adxValue = indicators.adx?.value || 0;
    if (adxValue > 40) confidence += 15;
    else if (adxValue > 25) confidence += 10;

    // Bollinger Bands volatility
    const bbWidth = indicators.bb?.width || 0;
    if (bbWidth < 0.02) confidence += 8; // Low volatility squeeze
    if (bbWidth > 0.1) confidence += 6; // High volatility expansion

    // Apply timeframe multiplier
    confidence *= TIMEFRAME_MULTIPLIERS[timeframe];
    
    return Math.max(30, Math.min(95, Math.round(confidence)));
  }

  private calculateRiskLevels(
    currentPrice: number,
    indicators: any,
    timeframe: TimeFrame
  ): { stopLoss: number; takeProfit: number } {
    const atr = indicators.atr?.value || currentPrice * 0.02;
    const multiplier = RISK_MULTIPLIERS[timeframe];
    const riskAmount = atr * multiplier;

    return {
      stopLoss: currentPrice - riskAmount,
      takeProfit: currentPrice + (riskAmount * 2) // 2:1 risk-reward ratio
    };
  }

  private calculateSuccessProbability(
    confidence: number,
    timeframe: TimeFrame,
    direction: 'LONG' | 'SHORT' | 'NEUTRAL'
  ): number {
    let probability = confidence * 0.7; // Base conversion
    
    // Add timeframe adjustment
    probability += SUCCESS_PROBABILITY_ADJUSTMENTS[timeframe];
    
    // Long-term bullish bias
    if (direction === 'LONG' && ['1d', '3d', '1w', '1M'].includes(timeframe)) {
      probability += 5;
    }

    return Math.max(25, Math.min(95, Math.round(probability)));
  }

  private createNeutralSignal(symbol: string, timeframe: TimeFrame, currentPrice: number): AdvancedSignal {
    return {
      direction: 'NEUTRAL',
      confidence: 50,
      entryPrice: currentPrice,
      stopLoss: currentPrice * 0.98,
      takeProfit: currentPrice * 1.04,
      timeframe,
      timestamp: Date.now(),
      successProbability: 50,
      indicators: {}
    };
  }

  private cleanupCache(): void {
    if (this.calculationCache.size > 100) {
      const entries = Array.from(this.calculationCache.entries());
      this.calculationCache.clear();
      // Keep only the most recent 50 entries
      entries.slice(-50).forEach(([key, value]) => {
        this.calculationCache.set(key, value);
      });
    }
  }

  clearCache(): void {
    this.calculationCache.clear();
  }

  getDataStatus(symbol: string): { loaded: boolean; timeframes: number } {
    const symbolData = this.priceData.get(symbol);
    return {
      loaded: !!symbolData && symbolData.size > 0,
      timeframes: symbolData?.size || 0
    };
  }
}

export const unifiedCalculationSystem = UnifiedCalculationSystem.getInstance();