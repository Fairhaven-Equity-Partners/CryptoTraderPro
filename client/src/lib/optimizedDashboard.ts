import { TimeFrame, AdvancedSignal } from '../types';
import { unifiedCalculationSystem } from './unifiedCalculationSystem';
import { ALL_TIMEFRAMES, DISPLAY_TIMEFRAMES, createEmptySignalsObject } from './optimizedTypes';

export class OptimizedDashboard {
  private static instance: OptimizedDashboard;
  private currentSymbol = '';
  private signalCache = new Map<string, Record<TimeFrame, AdvancedSignal | null>>();
  private lastCalculationTime = 0;
  private calculationInProgress = false;

  static getInstance(): OptimizedDashboard {
    if (!OptimizedDashboard.instance) {
      OptimizedDashboard.instance = new OptimizedDashboard();
    }
    return OptimizedDashboard.instance;
  }

  async calculateSignalsForSymbol(symbol: string, currentPrice: number): Promise<Record<TimeFrame, AdvancedSignal | null>> {
    const cacheKey = `${symbol}-${Math.floor(currentPrice / 100) * 100}`;
    
    if (this.signalCache.has(cacheKey)) {
      return this.signalCache.get(cacheKey)!;
    }

    if (this.calculationInProgress) {
      return this.getEmptySignals();
    }

    this.calculationInProgress = true;

    try {
      const signals = await unifiedCalculationSystem.calculateAllTimeframes(symbol, currentPrice);
      this.signalCache.set(cacheKey, signals);
      this.cleanupCache();
      this.lastCalculationTime = Date.now();
      
      return signals;
    } finally {
      this.calculationInProgress = false;
    }
  }

  async updateSignalForTimeframe(
    symbol: string, 
    timeframe: TimeFrame, 
    currentPrice: number
  ): Promise<AdvancedSignal> {
    return await unifiedCalculationSystem.calculateSignalForTimeframe(symbol, timeframe, currentPrice);
  }

  generateTradeRecommendation(signals: Record<TimeFrame, AdvancedSignal | null>, selectedTimeframe: TimeFrame) {
    const signal = signals[selectedTimeframe];
    if (!signal || signal.direction === 'NEUTRAL') {
      return null;
    }

    const keyIndicators = this.extractKeyIndicators(signal);
    const confluence = this.calculateTimeframeConfluence(signals, signal.direction);
    
    return {
      direction: signal.direction,
      confidence: Math.round(signal.confidence * confluence),
      entry: signal.entryPrice,
      stopLoss: signal.stopLoss || signal.entryPrice * (signal.direction === 'LONG' ? 0.98 : 1.02),
      takeProfits: this.calculateTakeProfitLevels(signal),
      leverage: this.calculateRecommendedLeverage(signal),
      timeframe: selectedTimeframe,
      summary: this.generateSummary(signal, confluence),
      keyIndicators
    };
  }

  private extractKeyIndicators(signal: AdvancedSignal): string[] {
    const indicators: string[] = [];
    const { indicators: signalIndicators } = signal;

    if (!signalIndicators) return indicators;

    // RSI analysis
    const rsiValue = signalIndicators.rsi?.value;
    if (rsiValue) {
      if (rsiValue < 30) indicators.push('RSI Oversold');
      else if (rsiValue > 70) indicators.push('RSI Overbought');
      else if (rsiValue < 45) indicators.push('RSI Bullish');
      else if (rsiValue > 55) indicators.push('RSI Bearish');
    }

    // MACD momentum
    const macdHistogram = signalIndicators.macd?.histogram;
    if (macdHistogram) {
      if (macdHistogram > 0) indicators.push('MACD Bullish');
      else indicators.push('MACD Bearish');
    }

    // EMA trend
    const { short: emaShort, medium: emaMedium, long: emaLong } = signalIndicators.ema || {};
    if (emaShort && emaMedium && emaLong) {
      if (emaShort > emaMedium && emaMedium > emaLong) {
        indicators.push('EMA Uptrend');
      } else if (emaShort < emaMedium && emaMedium < emaLong) {
        indicators.push('EMA Downtrend');
      }
    }

    // ADX trend strength
    const adxValue = signalIndicators.adx?.value;
    if (adxValue && adxValue > 25) {
      indicators.push('Strong Trend');
    }

    return indicators.slice(0, 4); // Limit to 4 key indicators
  }

  private calculateTimeframeConfluence(signals: Record<TimeFrame, AdvancedSignal | null>, direction: string): number {
    const relevantTimeframes = DISPLAY_TIMEFRAMES;
    let confluence = 0;
    let validSignals = 0;

    for (const timeframe of relevantTimeframes) {
      const signal = signals[timeframe];
      if (signal && signal.direction !== 'NEUTRAL') {
        validSignals++;
        if (signal.direction === direction) {
          confluence += signal.confidence * 0.01;
        }
      }
    }

    return validSignals > 0 ? confluence / validSignals : 0.5;
  }

  private calculateTakeProfitLevels(signal: AdvancedSignal): number[] {
    const entryPrice = signal.entryPrice;
    const takeProfit = signal.takeProfit || entryPrice * 1.02;
    const range = Math.abs(takeProfit - entryPrice);

    return [
      entryPrice + (range * 0.5),  // TP1: 50% of the way
      entryPrice + (range * 0.8),  // TP2: 80% of the way
      takeProfit                   // TP3: Full target
    ];
  }

  private calculateRecommendedLeverage(signal: AdvancedSignal): number {
    const baseConfidence = signal.confidence;
    let leverage = 1;

    if (baseConfidence > 80) leverage = 3;
    else if (baseConfidence > 70) leverage = 2.5;
    else if (baseConfidence > 60) leverage = 2;
    else if (baseConfidence > 50) leverage = 1.5;

    return Math.min(leverage, 5); // Cap at 5x for safety
  }

  private generateSummary(signal: AdvancedSignal, confluence: number): string {
    const direction = signal.direction.toLowerCase();
    const confidence = Math.round(signal.confidence);
    const confluencePercent = Math.round(confluence * 100);
    
    return `${confidence}% confidence ${direction} signal with ${confluencePercent}% timeframe confluence. ` +
           `Success probability: ${signal.successProbability}%.`;
  }

  private getEmptySignals(): Record<TimeFrame, AdvancedSignal | null> {
    const empty = createEmptySignalsObject();
    return empty as Record<TimeFrame, AdvancedSignal | null>;
  }

  private cleanupCache(): void {
    if (this.signalCache.size > 50) {
      const entries = Array.from(this.signalCache.entries());
      this.signalCache.clear();
      entries.slice(-25).forEach(([key, value]) => {
        this.signalCache.set(key, value);
      });
    }
  }

  clearCache(): void {
    this.signalCache.clear();
    unifiedCalculationSystem.clearCache();
  }

  getCalculationStatus(): { lastCalculation: number; inProgress: boolean } {
    return {
      lastCalculation: this.lastCalculationTime,
      inProgress: this.calculationInProgress
    };
  }
}

export const optimizedDashboard = OptimizedDashboard.getInstance();